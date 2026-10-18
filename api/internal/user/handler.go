package user

import (
	"errors"

	"github.com/gofiber/fiber/v3"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
)

// Handler serves the /me endpoints.
type Handler struct{ svc *Service }

// NewHandler creates the handler.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Register adds the routes. protect wraps a handler so it requires a valid access token.
func (h *Handler) Register(r fiber.Router, protect func(fiber.Handler) fiber.Handler) {
	r.Get("/me", protect(h.GetMe))
	r.Delete("/me", protect(h.DeleteMe))
}

// GetMe godoc
//
//	@Summary		Get the current user
//	@Description	Returns the account of the authenticated user.
//	@Tags			me
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	Response
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Router			/me [get]
func (h *Handler) GetMe(c fiber.Ctx) error {
	id, ok := httpx.UserID(c)
	if !ok {
		return httpx.Unauthorized("unauthorized", "Authentication required")
	}

	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	u, err := h.svc.Get(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return httpx.Unauthorized("unauthorized", "This account no longer exists")
	}
	if err != nil {
		return httpx.ErrInternal.WithCause(err)
	}
	return c.JSON(h.svc.Response(u))
}

// DeleteMe godoc
//
//	@Summary		Delete the current account
//	@Description	Soft-deletes the account, scrubs personal fields (email, name, provider IDs, profile details) and revokes all sessions. Remaining logs stay anonymous. Full purge is handled outside the API on request.
//	@Tags			me
//	@Security		BearerAuth
//	@Success		204
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Router			/me [delete]
func (h *Handler) DeleteMe(c fiber.Ctx) error {
	id, ok := httpx.UserID(c)
	if !ok {
		return httpx.Unauthorized("unauthorized", "Authentication required")
	}

	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	if err := h.svc.Delete(ctx, id); err != nil {
		if errors.Is(err, ErrNotFound) {
			return httpx.Unauthorized("unauthorized", "This account no longer exists")
		}
		return httpx.ErrInternal.WithCause(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}
