package auth

import (
	"strings"

	"github.com/gofiber/fiber/v3"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
	"github.com/saakarx/fit-fueler/api/internal/user"
)

// Handler serves the /auth endpoints.
type Handler struct {
	svc             *Service
	users           *user.Service
	devLoginEnabled bool
	appleEnabled    bool
}

// NewHandler creates the handler.
func NewHandler(svc *Service, users *user.Service, devLoginEnabled, appleEnabled bool) *Handler {
	return &Handler{svc: svc, users: users, devLoginEnabled: devLoginEnabled, appleEnabled: appleEnabled}
}

// Register adds the routes under the given router (expected to be /auth).
func (h *Handler) Register(r fiber.Router) {
	r.Post("/google", h.GoogleSignIn)
	r.Post("/apple", h.AppleSignIn)
	r.Post("/refresh", h.Refresh)
	r.Post("/logout", h.Logout)
	if h.devLoginEnabled {
		r.Post("/dev-login", h.DevLogin)
	}
}

// GoogleSignIn godoc
//
//	@Summary		Sign in with Google
//	@Description	Verifies a Google ID token and returns an access/refresh token pair. The account is created on first sign-in (is_new_user = true).
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		GoogleSignInRequest	true	"Google ID token and device details"
//	@Success		200		{object}	AuthResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Failure		429		{object}	httpx.ErrorResponse
//	@Router			/auth/google [post]
func (h *Handler) GoogleSignIn(c fiber.Ctx) error {
	var req GoogleSignInRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}

	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	res, err := h.svc.SignInWithGoogle(ctx, req.IDToken, req.Timezone, req.DeviceInfo)
	if err != nil {
		return err
	}
	return c.JSON(h.authResponse(res))
}

// AppleSignIn godoc
//
//	@Summary		Sign in with Apple (not available yet)
//	@Description	Reserved for Sign in with Apple. Currently always returns 501.
//	@Tags			auth
//	@Produce		json
//	@Failure		501	{object}	httpx.ErrorResponse
//	@Router			/auth/apple [post]
func (h *Handler) AppleSignIn(c fiber.Ctx) error {
	if !h.appleEnabled {
		return ErrAppleNotEnabled
	}
	return ErrAppleNotImplemented
}

// Refresh godoc
//
//	@Summary		Refresh the access token
//	@Description	Exchanges a refresh token for a new access/refresh pair. The old refresh token stops working. Reusing an old token revokes the whole session.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		RefreshRequest	true	"Refresh token"
//	@Success		200		{object}	TokenResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Failure		429		{object}	httpx.ErrorResponse
//	@Router			/auth/refresh [post]
func (h *Handler) Refresh(c fiber.Ctx) error {
	var req RefreshRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}

	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	pair, err := h.svc.Refresh(ctx, req.RefreshToken)
	if err != nil {
		return err
	}
	return c.JSON(tokenResponse(*pair))
}

// Logout godoc
//
//	@Summary		Sign out
//	@Description	Revokes the session that the refresh token belongs to. Always returns 204.
//	@Tags			auth
//	@Accept			json
//	@Param			body	body	RefreshRequest	true	"Refresh token"
//	@Success		204
//	@Failure		400	{object}	httpx.ErrorResponse
//	@Router			/auth/logout [post]
func (h *Handler) Logout(c fiber.Ctx) error {
	var req RefreshRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}

	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	if err := h.svc.Logout(ctx, req.RefreshToken); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// DevLogin godoc
//
//	@Summary		Development login
//	@Description	Signs in (or creates) a user by email without any provider. Only registered when DEV_LOGIN_ENABLED=true, which is refused in production.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		DevLoginRequest	true	"Dev user"
//	@Success		200		{object}	AuthResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Router			/auth/dev-login [post]
func (h *Handler) DevLogin(c fiber.Ctx) error {
	var req DevLoginRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	ident := &ProviderIdentity{
		Provider:      providerGoogle,
		Subject:       "dev:" + email,
		Email:         email,
		EmailVerified: true,
		Name:          req.Name,
	}

	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	res, err := h.svc.SignInWithIdentity(ctx, ident, req.Timezone, req.DeviceInfo)
	if err != nil {
		return err
	}
	return c.JSON(h.authResponse(res))
}

func (h *Handler) authResponse(res *SignInResult) AuthResponse {
	return AuthResponse{
		TokenResponse: tokenResponse(res.Tokens),
		IsNewUser:     res.IsNewUser,
		User:          h.users.Response(res.User),
	}
}
