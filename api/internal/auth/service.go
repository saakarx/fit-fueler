package auth

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/saakarx/fit-fueler/api/internal/platform"
	"github.com/saakarx/fit-fueler/api/internal/user"
)

// TokenPair is what a client receives after signing in or refreshing.
type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64 // access token lifetime in seconds
}

// SignInResult is the outcome of a successful sign-in.
type SignInResult struct {
	Tokens    TokenPair
	User      *user.User
	IsNewUser bool
}

// Service implements sign-in, token refresh and logout.
type Service struct {
	pool   *pgxpool.Pool
	users  *user.Repository
	repo   *Repository
	tokens *TokenManager
	google Verifier
	log    *slog.Logger
	now    func() time.Time
}

// NewService creates the auth service.
func NewService(pool *pgxpool.Pool, users *user.Repository, repo *Repository, tokens *TokenManager, google Verifier, log *slog.Logger) *Service {
	return &Service{
		pool:   pool,
		users:  users,
		repo:   repo,
		tokens: tokens,
		google: google,
		log:    log,
		now:    time.Now,
	}
}

// SignInWithGoogle verifies a Google ID token, then signs the user in,
// creating the account on first use.
func (s *Service) SignInWithGoogle(ctx context.Context, idToken, timezone, deviceInfo string) (*SignInResult, error) {
	ident, err := s.google.Verify(ctx, idToken)
	if err != nil {
		return nil, err
	}
	return s.SignInWithIdentity(ctx, ident, timezone, deviceInfo)
}

// SignInWithIdentity signs in an already-verified provider identity. It is
// shared by the real providers and the development login.
func (s *Service) SignInWithIdentity(ctx context.Context, ident *ProviderIdentity, timezone, deviceInfo string) (*SignInResult, error) {
	tz, err := resolveTimezone(timezone)
	if err != nil {
		return nil, err
	}
	var device *string
	if d := strings.TrimSpace(deviceInfo); d != "" {
		device = &d
	}

	// Two simultaneous first sign-ins for one account race on the unique
	// identity index. The loser retries once and then finds the winner's rows.
	for attempt := 0; ; attempt++ {
		res, err := s.signIn(ctx, ident, tz, device)
		if err != nil && attempt == 0 && platform.IsUniqueViolation(err, "") {
			continue
		}
		return res, err
	}
}

func (s *Service) signIn(ctx context.Context, ident *ProviderIdentity, tz string, device *string) (*SignInResult, error) {
	var result *SignInResult

	err := platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo, users := s.repo.WithTx(tx), s.users.WithTx(tx)

		var (
			u     *user.User
			isNew bool
		)

		userID, err := repo.FindActiveIdentity(ctx, ident.Provider, ident.Subject)
		switch {
		case err == nil:
			u, err = users.GetByID(ctx, userID)
			if err != nil {
				return err
			}
		case errors.Is(err, errNotFound):
			u, isNew, err = s.createOrLink(ctx, users, repo, ident, tz)
			if err != nil {
				return err
			}
		default:
			return err
		}

		pair, err := s.newTokenPair(ctx, repo, u.ID, platform.NewID(), device)
		if err != nil {
			return err
		}
		result = &SignInResult{Tokens: *pair, User: u, IsNewUser: isNew}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// createOrLink attaches the identity to an existing account with the same
// verified email, or creates a new account (user, profile and identity).
func (s *Service) createOrLink(ctx context.Context, users *user.Repository, repo *Repository, ident *ProviderIdentity, tz string) (*user.User, bool, error) {
	var email *string
	if ident.Email != "" && ident.EmailVerified {
		e := strings.ToLower(ident.Email)
		email = &e
	}

	// Only a provider-verified email may link to an existing account.
	if email != nil {
		existing, err := users.GetActiveByEmail(ctx, *email)
		switch {
		case err == nil:
			if err := repo.CreateIdentity(ctx, existing.ID, ident.Provider, ident.Subject, email); err != nil {
				return nil, false, err
			}
			return existing, false, nil
		case !errors.Is(err, user.ErrNotFound):
			return nil, false, err
		}
	}

	u := &user.User{ID: platform.NewID(), Email: email}
	if name := strings.TrimSpace(ident.Name); name != "" {
		u.DisplayName = &name
	}
	if err := users.Create(ctx, u); err != nil {
		return nil, false, err
	}
	if err := users.CreateProfile(ctx, u.ID, tz); err != nil {
		return nil, false, err
	}
	if err := repo.CreateIdentity(ctx, u.ID, ident.Provider, ident.Subject, email); err != nil {
		return nil, false, err
	}
	return u, true, nil
}

// Refresh exchanges a refresh token for a new token pair. The old token is
// revoked (rotation). Presenting an already-used token revokes the whole
// session, since it suggests the token was stolen.
func (s *Service) Refresh(ctx context.Context, rawToken string) (*TokenPair, error) {
	if rawToken == "" {
		return nil, ErrInvalidRefreshToken
	}
	hash := HashRefreshToken(rawToken)

	var (
		pair   *TokenPair
		reused bool
		owner  uuid.UUID
	)
	err := platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		rt, err := repo.GetRefreshTokenForUpdate(ctx, hash)
		if errors.Is(err, errNotFound) {
			return ErrInvalidRefreshToken
		}
		if err != nil {
			return err
		}

		if rt.RevokedAt != nil {
			// Returning nil commits the family revocation.
			reused, owner = true, rt.UserID
			return repo.RevokeFamily(ctx, rt.FamilyID)
		}
		if !rt.ExpiresAt.After(s.now()) {
			return ErrInvalidRefreshToken
		}

		if _, err := s.users.WithTx(tx).GetByID(ctx, rt.UserID); err != nil {
			if errors.Is(err, user.ErrNotFound) {
				return ErrInvalidRefreshToken
			}
			return err
		}

		if err := repo.RevokeRefreshToken(ctx, rt.ID); err != nil {
			return err
		}
		pair, err = s.newTokenPair(ctx, repo, rt.UserID, rt.FamilyID, rt.DeviceInfo)
		return err
	})
	if err != nil {
		return nil, err
	}
	if reused {
		s.log.Warn("refresh token reuse detected, session revoked", "user_id", owner.String())
		return nil, ErrRefreshTokenReused
	}
	return pair, nil
}

// Logout revokes the session that the refresh token belongs to. It is
// idempotent and never reveals whether the token existed.
func (s *Service) Logout(ctx context.Context, rawToken string) error {
	if rawToken == "" {
		return nil
	}
	return s.repo.RevokeFamilyByTokenHash(ctx, HashRefreshToken(rawToken))
}

func (s *Service) newTokenPair(ctx context.Context, repo *Repository, userID, familyID uuid.UUID, device *string) (*TokenPair, error) {
	now := s.now()

	access, err := s.tokens.NewAccessToken(userID, now)
	if err != nil {
		return nil, err
	}
	raw, hash, err := NewRefreshToken()
	if err != nil {
		return nil, err
	}
	err = repo.CreateRefreshToken(ctx, &RefreshToken{
		ID:         platform.NewID(),
		UserID:     userID,
		FamilyID:   familyID,
		TokenHash:  hash,
		DeviceInfo: device,
		ExpiresAt:  now.Add(s.tokens.RefreshTTL()),
	})
	if err != nil {
		return nil, err
	}
	return &TokenPair{
		AccessToken:  access,
		RefreshToken: raw,
		ExpiresIn:    int64(s.tokens.AccessTTL().Seconds()),
	}, nil
}

// resolveTimezone validates an IANA timezone name, defaulting to UTC.
func resolveTimezone(tz string) (string, error) {
	tz = strings.TrimSpace(tz)
	if tz == "" {
		return "UTC", nil
	}
	if tz == "Local" {
		return "", ErrInvalidTimezone
	}
	if _, err := time.LoadLocation(tz); err != nil {
		return "", ErrInvalidTimezone
	}
	return tz, nil
}
