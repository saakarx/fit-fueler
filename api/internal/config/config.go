// Package config loads runtime settings from environment variables.
package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all runtime settings.
type Config struct {
	Env  string // "development" or "production"
	Port string

	DatabaseURL string

	JWTSecret       string
	JWTIssuer       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration

	GoogleClientIDs []string
	AppleEnabled    bool
	DevLoginEnabled bool

	SwaggerEnabled bool
	AvatarBaseURL  string

	AuthRateLimitMax    int
	AuthRateLimitWindow time.Duration
}

// IsProduction reports whether the app runs with APP_ENV=production.
func (c *Config) IsProduction() bool { return c.Env == "production" }

// Load reads and validates the configuration. All problems are reported together.
func Load() (*Config, error) {
	var errs []error

	env := getString("APP_ENV", "development")
	if env != "development" && env != "production" {
		errs = append(errs, fmt.Errorf("APP_ENV must be \"development\" or \"production\", got %q", env))
	}
	prod := env == "production"

	cfg := &Config{
		Env:                 env,
		Port:                getString("PORT", "8080"),
		DatabaseURL:         strings.TrimSpace(os.Getenv("DATABASE_URL")),
		JWTSecret:           os.Getenv("JWT_SECRET"),
		JWTIssuer:           getString("JWT_ISSUER", "fit-fueler-api"),
		AccessTokenTTL:      getDuration("ACCESS_TOKEN_TTL", 15*time.Minute, &errs),
		RefreshTokenTTL:     getDuration("REFRESH_TOKEN_TTL", 30*24*time.Hour, &errs),
		GoogleClientIDs:     splitList(os.Getenv("GOOGLE_CLIENT_IDS")),
		AppleEnabled:        getBool("APPLE_SIGN_IN_ENABLED", false, &errs),
		DevLoginEnabled:     getBool("DEV_LOGIN_ENABLED", !prod, &errs),
		SwaggerEnabled:      getBool("SWAGGER_ENABLED", !prod, &errs),
		AvatarBaseURL:       getString("AVATAR_BASE_URL", "https://api.dicebear.com/10.x/adventurer/svg"),
		AuthRateLimitMax:    getInt("AUTH_RATE_LIMIT_MAX", 20, &errs),
		AuthRateLimitWindow: getDuration("AUTH_RATE_LIMIT_WINDOW", time.Minute, &errs),
	}

	if cfg.DatabaseURL == "" {
		errs = append(errs, errors.New("DATABASE_URL is required"))
	}
	if len(cfg.JWTSecret) < 32 {
		errs = append(errs, errors.New("JWT_SECRET is required and must be at least 32 characters"))
	}
	if cfg.AccessTokenTTL <= 0 || cfg.RefreshTokenTTL <= 0 {
		errs = append(errs, errors.New("token TTLs must be positive"))
	}
	if cfg.AuthRateLimitMax <= 0 || cfg.AuthRateLimitWindow <= 0 {
		errs = append(errs, errors.New("auth rate limit settings must be positive"))
	}
	if prod {
		if cfg.DevLoginEnabled {
			errs = append(errs, errors.New("DEV_LOGIN_ENABLED must be false in production"))
		}
		if len(cfg.GoogleClientIDs) == 0 {
			errs = append(errs, errors.New("GOOGLE_CLIENT_IDS is required in production"))
		}
	}

	if err := errors.Join(errs...); err != nil {
		return nil, err
	}
	return cfg, nil
}

func getString(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func getBool(key string, def bool, errs *[]error) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		*errs = append(*errs, fmt.Errorf("%s must be true or false, got %q", key, v))
		return def
	}
	return b
}

func getInt(key string, def int, errs *[]error) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		*errs = append(*errs, fmt.Errorf("%s must be an integer, got %q", key, v))
		return def
	}
	return n
}

func getDuration(key string, def time.Duration, errs *[]error) time.Duration {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		*errs = append(*errs, fmt.Errorf("%s must be a duration like 15m or 720h, got %q", key, v))
		return def
	}
	return d
}

func splitList(s string) []string {
	var out []string
	for _, part := range strings.Split(s, ",") {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}
