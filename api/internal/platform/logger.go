// Package platform holds shared infrastructure: logging and database access.
package platform

import (
	"log/slog"
	"os"
)

// NewLogger returns a JSON logger in production and a readable text logger otherwise.
func NewLogger(env string) *slog.Logger {
	if env == "production" {
		return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	}
	return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
}
