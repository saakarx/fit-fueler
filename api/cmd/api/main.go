// Command api runs the Fit Fueler HTTP API.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata" // embed the IANA timezone database (needed on Windows and minimal containers)

	"github.com/joho/godotenv"

	"github.com/saakarx/fit-fueler/api/internal/auth"
	"github.com/saakarx/fit-fueler/api/internal/config"
	"github.com/saakarx/fit-fueler/api/internal/platform"
	"github.com/saakarx/fit-fueler/api/internal/server"
)

// @title			Fit Fueler API
// @version		0.1
// @description	Backend for the Fit Fueler mobile app: workouts, meals, water and analytics.
// @BasePath		/api/v1
//
// @securityDefinitions.apikey	BearerAuth
// @in							header
// @name						Authorization
// @description				Type "Bearer" followed by a space and the access token.
func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	_ = godotenv.Load() // .env is optional; real environment variables take precedence

	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("invalid configuration:\n%w", err)
	}

	log := platform.NewLogger(cfg.Env)
	slog.SetDefault(log)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := platform.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	google, err := auth.NewGoogleVerifier(ctx, cfg.GoogleClientIDs)
	if err != nil {
		return err
	}

	app := server.New(server.Deps{Config: cfg, Log: log, Pool: pool, Google: google})

	log.Info("starting api", "env", cfg.Env, "port", cfg.Port,
		"dev_login", cfg.DevLoginEnabled, "swagger", cfg.SwaggerEnabled)

	errCh := make(chan error, 1)
	go func() { errCh <- app.Listen(":" + cfg.Port) }()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		log.Info("shutting down")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return app.ShutdownWithContext(shutdownCtx)
}
