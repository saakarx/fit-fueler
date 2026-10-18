package user

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/saakarx/fit-fueler/api/internal/platform"
)

// Repository reads and writes user rows. email is cast to text on the way in
// and out so the driver never has to deal with the citext type.
type Repository struct{ db platform.DBTX }

// NewRepository binds a repository to a pool or transaction.
func NewRepository(db platform.DBTX) *Repository { return &Repository{db: db} }

// WithTx returns a repository bound to the given transaction.
func (r *Repository) WithTx(tx pgx.Tx) *Repository { return &Repository{db: tx} }

// Create inserts a user and fills in CreatedAt.
func (r *Repository) Create(ctx context.Context, u *User) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO users (id, email, display_name)
		 VALUES ($1, $2::text, $3)
		 RETURNING created_at`,
		u.ID, u.Email, u.DisplayName,
	).Scan(&u.CreatedAt)
}

// CreateProfile inserts the empty profile row every user has.
func (r *Repository) CreateProfile(ctx context.Context, userID uuid.UUID, timezone string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO profiles (user_id, timezone) VALUES ($1, $2)`,
		userID, timezone,
	)
	return err
}

// GetByID returns an active user, or ErrNotFound.
func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return scanUser(r.db.QueryRow(ctx,
		`SELECT id, email::text, display_name, created_at
		 FROM users
		 WHERE id = $1 AND NOT is_deleted`,
		id,
	))
}

// GetActiveByEmail returns the active user with this email, or ErrNotFound.
func (r *Repository) GetActiveByEmail(ctx context.Context, email string) (*User, error) {
	return scanUser(r.db.QueryRow(ctx,
		`SELECT id, email::text, display_name, created_at
		 FROM users
		 WHERE email = ($1::text)::citext AND NOT is_deleted`,
		email,
	))
}

// DeleteAccount soft-deletes the account and scrubs everything that identifies
// the person, in the caller's transaction. Rows are never removed. Logs that
// remain (workouts, meals, water) are no longer tied to a name or email.
func (r *Repository) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE users
		 SET is_deleted = true, deleted_at = now(), email = NULL, display_name = NULL
		 WHERE id = $1 AND NOT is_deleted`,
		id,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}

	// The provider subject is replaced, so signing in again with the same
	// Google account creates a brand-new user instead of reviving this one.
	if _, err := r.db.Exec(ctx,
		`UPDATE auth_identities
		 SET is_deleted = true, deleted_at = now(), email = NULL,
		     provider_user_id = 'deleted:' || id::text
		 WHERE user_id = $1 AND NOT is_deleted`,
		id,
	); err != nil {
		return err
	}

	if _, err := r.db.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now()
		 WHERE user_id = $1 AND revoked_at IS NULL`,
		id,
	); err != nil {
		return err
	}

	_, err = r.db.Exec(ctx,
		`UPDATE profiles
		 SET sex = NULL, birth_date = NULL, height_cm = NULL, activity_level = NULL
		 WHERE user_id = $1`,
		id,
	)
	return err
}

func scanUser(row pgx.Row) (*User, error) {
	var u User
	if err := row.Scan(&u.ID, &u.Email, &u.DisplayName, &u.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}
