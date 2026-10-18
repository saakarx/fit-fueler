// Package user owns the user account: reading it, the /me endpoints, and
// account deletion.
package user

import (
	"errors"
	"net/url"
	"time"

	"github.com/google/uuid"
)

// ErrNotFound is returned when no active user matches.
var ErrNotFound = errors.New("user not found")

// User is an account. Email and DisplayName are nil for accounts that were
// deleted (their personal fields are scrubbed) or never provided them.
type User struct {
	ID          uuid.UUID
	Email       *string
	DisplayName *string
	CreatedAt   time.Time
}

// Response is the public representation of a user.
type Response struct {
	ID          string    `json:"id" example:"0199c2a4-7b1e-7c3a-9d5e-2f6a8b4c1d90"`
	Email       *string   `json:"email" example:"saakar@example.com"`
	DisplayName *string   `json:"display_name" example:"Saakar"`
	AvatarURL   string    `json:"avatar_url" example:"https://api.dicebear.com/10.x/adventurer/svg?seed=0199c2a4-7b1e-7c3a-9d5e-2f6a8b4c1d90"`
	CreatedAt   time.Time `json:"created_at"`
}

// AvatarBuilder derives avatar URLs from the user ID, so no avatar is stored.
type AvatarBuilder struct{ base string }

// NewAvatarBuilder creates a builder for the given DiceBear style URL.
func NewAvatarBuilder(base string) *AvatarBuilder { return &AvatarBuilder{base: base} }

// URL returns the avatar URL for a user, using the user ID as the seed.
func (a *AvatarBuilder) URL(userID uuid.UUID) string {
	u, err := url.Parse(a.base)
	if err != nil || a.base == "" {
		return ""
	}
	q := u.Query()
	q.Set("seed", userID.String())
	u.RawQuery = q.Encode()
	return u.String()
}
