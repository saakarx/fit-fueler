// Package auth handles sign-in with external providers, access tokens and
// rotating refresh tokens.
package auth

import (
	"errors"
	"net/http"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
)

// Public errors. Clients branch on the code, so keep the codes stable.
var (
	ErrMissingToken         = httpx.Unauthorized("unauthorized", "Missing or malformed Authorization header")
	ErrInvalidAccessToken   = httpx.Unauthorized("invalid_token", "The access token is invalid")
	ErrAccessTokenExpired   = httpx.Unauthorized("token_expired", "The access token has expired. Refresh it and retry")
	ErrInvalidIdentityToken = httpx.Unauthorized("invalid_token", "The sign-in token could not be verified")
	ErrInvalidRefreshToken  = httpx.Unauthorized("invalid_refresh_token", "The refresh token is invalid or expired. Sign in again")
	ErrRefreshTokenReused   = httpx.Unauthorized("refresh_token_reused", "This refresh token was already used. Sign in again")

	ErrGoogleNotConfigured = httpx.NewError(http.StatusServiceUnavailable, "google_not_configured", "Google sign-in is not configured on the server")
	ErrAppleNotEnabled     = httpx.NewError(http.StatusNotImplemented, "apple_not_enabled", "Sign in with Apple is not enabled")
	ErrAppleNotImplemented = httpx.NewError(http.StatusNotImplemented, "apple_not_implemented", "Sign in with Apple is not implemented yet")
	ErrInvalidTimezone     = httpx.BadRequest("invalid_timezone", "The timezone must be a valid IANA name such as Asia/Kolkata")
)

// Internal sentinels, never sent to clients.
var (
	errNotFound     = errors.New("not found")
	errTokenExpired = errors.New("token expired")
)
