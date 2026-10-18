package user

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/saakarx/fit-fueler/api/internal/platform"
)

// Service implements the user use cases.
type Service struct {
	pool    *pgxpool.Pool
	repo    *Repository
	avatars *AvatarBuilder
}

// NewService creates the user service.
func NewService(pool *pgxpool.Pool, repo *Repository, avatars *AvatarBuilder) *Service {
	return &Service{pool: pool, repo: repo, avatars: avatars}
}

// Get returns an active user.
func (s *Service) Get(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repo.GetByID(ctx, id)
}

// Delete soft-deletes the account and scrubs personal data atomically.
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.repo.WithTx(tx).DeleteAccount(ctx, id)
	})
}

// Response converts a user to its public representation.
func (s *Service) Response(u *User) Response {
	return Response{
		ID:          u.ID.String(),
		Email:       u.Email,
		DisplayName: u.DisplayName,
		AvatarURL:   s.avatars.URL(u.ID),
		CreatedAt:   u.CreatedAt,
	}
}
