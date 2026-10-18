package auth

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v3"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
)

// Authenticated wraps a handler so it only runs for requests with a valid
// access token. The user ID is then available through httpx.UserID.
//
// It wraps the handler instead of calling c.Next(), so a route cannot end up
// with the middleware accidentally ordered after the handler.
func Authenticated(tm *TokenManager, next fiber.Handler) fiber.Handler {
	const prefix = "Bearer "

	return func(c fiber.Ctx) error {
		header := c.Get("Authorization")
		if len(header) <= len(prefix) || !strings.EqualFold(header[:len(prefix)], prefix) {
			return ErrMissingToken
		}

		userID, err := tm.ParseAccessToken(strings.TrimSpace(header[len(prefix):]))
		if err != nil {
			if errors.Is(err, errTokenExpired) {
				return ErrAccessTokenExpired
			}
			return ErrInvalidAccessToken
		}

		httpx.SetUserID(c, userID)
		return next(c)
	}
}

// Protect returns a function that applies Authenticated with this TokenManager.
func Protect(tm *TokenManager) func(fiber.Handler) fiber.Handler {
	return func(next fiber.Handler) fiber.Handler { return Authenticated(tm, next) }
}
