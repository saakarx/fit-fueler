// Package server builds the Fiber application: middleware, wiring of all
// features, and routes.
package server

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	recovermw "github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/saakarx/fit-fueler/api/internal/auth"
	"github.com/saakarx/fit-fueler/api/internal/config"
	"github.com/saakarx/fit-fueler/api/internal/exercise"
	"github.com/saakarx/fit-fueler/api/internal/httpx"
	"github.com/saakarx/fit-fueler/api/internal/profile"
	"github.com/saakarx/fit-fueler/api/internal/user"
	"github.com/saakarx/fit-fueler/api/internal/workout"
)

// Deps are the dependencies the server is built from.
type Deps struct {
	Config *config.Config
	Log    *slog.Logger
	Pool   *pgxpool.Pool
	Google auth.Verifier
}

// New builds the application with all middleware and routes registered.
func New(d Deps) *fiber.App {
	cfg := d.Config

	app := fiber.New(fiber.Config{
		AppName:      "fit-fueler-api",
		ErrorHandler: httpx.NewErrorHandler(d.Log),
		BodyLimit:    1 << 20, // 1 MiB
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	})

	// Order matters: the logger sits outside recover so a panic is turned into
	// an error first and then logged with its final 500 status.
	app.Use(httpx.AssignRequestID())
	app.Use(httpx.RequestLogger(d.Log))
	app.Use(recovermw.New())

	// Wiring.
	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.JWTIssuer, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)

	userRepo := user.NewRepository(d.Pool)
	userSvc := user.NewService(d.Pool, userRepo, user.NewAvatarBuilder(cfg.AvatarBaseURL))
	userHandler := user.NewHandler(userSvc)

	authRepo := auth.NewRepository(d.Pool)
	authSvc := auth.NewService(d.Pool, userRepo, authRepo, tokens, d.Google, d.Log)
	authHandler := auth.NewHandler(authSvc, userSvc, cfg.DevLoginEnabled, cfg.AppleEnabled)
	profileSvc := profile.NewService(d.Pool, profile.NewRepository(d.Pool))
	profileHandler := profile.NewHandler(profileSvc)
	exerciseHandler := exercise.NewHandler(exercise.NewService(exercise.NewRepository(d.Pool)))
	workoutHandler := workout.NewHandler(workout.NewService(d.Pool,
		workout.NewRepository(d.Pool), exercise.NewRepository(d.Pool)))

	// Operational endpoints (outside the versioned API).
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	app.Get("/health/ready", func(c fiber.Ctx) error {
		ctx, cancel := httpx.RequestContext(c)
		defer cancel()
		if err := d.Pool.Ping(ctx); err != nil {
			return httpx.NewError(fiber.StatusServiceUnavailable, "db_unavailable", "The database is not reachable").WithCause(err)
		}
		return c.JSON(fiber.Map{"status": "ready"})
	})

	if cfg.SwaggerEnabled {
		registerSwagger(app)
	}

	// Sign-in and token endpoints are rate limited per IP.
	app.Use("/api/v1/auth", limiter.New(limiter.Config{
		Max:        cfg.AuthRateLimitMax,
		Expiration: cfg.AuthRateLimitWindow,
		LimitReached: func(c fiber.Ctx) error {
			return httpx.ErrRateLimited
		},
	}))

	v1 := app.Group("/api/v1")
	authHandler.Register(v1.Group("/auth"))
	userHandler.Register(v1, auth.Protect(tokens))
	profileHandler.Register(v1, auth.Protect(tokens))
	exerciseHandler.Register(v1, auth.Protect(tokens))
	workoutHandler.Register(v1, auth.Protect(tokens))

	return app
}
