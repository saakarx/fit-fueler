package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/saakarx/fit-fueler/api/internal/platform"
)

// RefreshToken is a stored refresh token. Only the hash of the token is kept.
type RefreshToken struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	FamilyID   uuid.UUID
	TokenHash  string
	DeviceInfo *string
	ExpiresAt  time.Time
	RevokedAt  *time.Time
}

// Repository reads and writes identities and refresh tokens.
type Repository struct{ db platform.DBTX }

// NewRepository binds a repository to a pool or transaction.
func NewRepository(db platform.DBTX) *Repository { return &Repository{db: db} }

// WithTx returns a repository bound to the given transaction.
func (r *Repository) WithTx(tx pgx.Tx) *Repository { return &Repository{db: tx} }

// FindActiveIdentity returns the user that owns a provider identity, or errNotFound.
func (r *Repository) FindActiveIdentity(ctx context.Context, provider, subject string) (uuid.UUID, error) {
	var userID uuid.UUID
	err := r.db.QueryRow(ctx,
		`SELECT user_id FROM auth_identities
		 WHERE provider = $1 AND provider_user_id = $2 AND NOT is_deleted`,
		provider, subject,
	).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, errNotFound
	}
	return userID, err
}

// CreateIdentity links a provider identity to a user.
func (r *Repository) CreateIdentity(ctx context.Context, userID uuid.UUID, provider, subject string, email *string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO auth_identities (id, user_id, provider, provider_user_id, email)
		 VALUES ($1, $2, $3, $4, $5::text)`,
		platform.NewID(), userID, provider, subject, email,
	)
	return err
}

// CreateRefreshToken stores a new refresh token.
func (r *Repository) CreateRefreshToken(ctx context.Context, t *RefreshToken) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, device_info, expires_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		t.ID, t.UserID, t.FamilyID, t.TokenHash, t.DeviceInfo, t.ExpiresAt,
	)
	return err
}

// GetRefreshTokenForUpdate loads a token by hash and locks the row until the
// transaction ends, so two concurrent refreshes cannot both succeed.
func (r *Repository) GetRefreshTokenForUpdate(ctx context.Context, hash string) (*RefreshToken, error) {
	var t RefreshToken
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, family_id, token_hash, device_info, expires_at, revoked_at
		 FROM refresh_tokens
		 WHERE token_hash = $1
		 FOR UPDATE`,
		hash,
	).Scan(&t.ID, &t.UserID, &t.FamilyID, &t.TokenHash, &t.DeviceInfo, &t.ExpiresAt, &t.RevokedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// RevokeRefreshToken marks one token as used.
func (r *Repository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
		id,
	)
	return err
}

// RevokeFamily revokes every token of a login session.
func (r *Repository) RevokeFamily(ctx context.Context, familyID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL`,
		familyID,
	)
	return err
}

// RevokeFamilyByTokenHash revokes the whole session that a token belongs to.
// Unknown tokens are ignored.
func (r *Repository) RevokeFamilyByTokenHash(ctx context.Context, hash string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now()
		 WHERE revoked_at IS NULL
		   AND family_id IN (SELECT family_id FROM refresh_tokens WHERE token_hash = $1)`,
		hash,
	)
	return err
}
