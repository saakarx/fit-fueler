package httpx

import (
	"context"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ctxKey int

const (
	requestIDKey ctxKey = iota + 1
	userIDKey
)

// AssignRequestID gives every request a fresh ID, exposed as the X-Request-ID
// response header and included in logs and error responses.
func AssignRequestID() fiber.Handler {
	return func(c fiber.Ctx) error {
		id := uuid.NewString()
		c.Locals(requestIDKey, id)
		c.Set("X-Request-ID", id)
		return c.Next()
	}
}

// RequestID returns the ID assigned to the current request.
func RequestID(c fiber.Ctx) string {
	id, _ := c.Locals(requestIDKey).(string)
	return id
}

// SetUserID stores the authenticated user's ID for the current request.
func SetUserID(c fiber.Ctx, id uuid.UUID) { c.Locals(userIDKey, id) }

// UserID returns the authenticated user's ID, if the request is authenticated.
func UserID(c fiber.Ctx) (uuid.UUID, bool) {
	id, ok := c.Locals(userIDKey).(uuid.UUID)
	return id, ok
}

// RequestLogger logs one line per request. It renders errors itself (the same
// way Fiber's own logger does) so the logged status is the final one.
func RequestLogger(log *slog.Logger) fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()

		if chainErr := c.Next(); chainErr != nil {
			if err := c.App().ErrorHandler(c, chainErr); err != nil {
				_ = c.SendStatus(fiber.StatusInternalServerError)
			}
		}

		status := c.Response().StatusCode()
		attrs := []any{
			"request_id", RequestID(c),
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"latency_ms", time.Since(start).Milliseconds(),
			"ip", c.IP(),
		}
		if uid, ok := UserID(c); ok {
			attrs = append(attrs, "user_id", uid.String())
		}

		level := slog.LevelInfo
		switch {
		case status >= 500:
			level = slog.LevelError
		case status >= 400:
			level = slog.LevelWarn
		}
		log.Log(context.Background(), level, "http request", attrs...)
		return nil
	}
}
