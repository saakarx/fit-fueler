package profile

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
)

// Handler serves the profile, goals and weight endpoints.
type Handler struct{ svc *Service }

// NewHandler creates the handler.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Register adds the routes. protect wraps a handler so it requires a valid access token.
func (h *Handler) Register(r fiber.Router, protect func(fiber.Handler) fiber.Handler) {
	r.Get("/me/profile", protect(h.GetProfile))
	r.Patch("/me/profile", protect(h.UpdateProfile))

	r.Get("/me/goals", protect(h.GetGoals))
	r.Put("/me/goals", protect(h.SetGoals))
	r.Post("/me/goals/reset", protect(h.ResetGoals))

	r.Get("/weight-entries", protect(h.ListWeight))
	r.Post("/weight-entries", protect(h.AddWeight))
	r.Delete("/weight-entries/:id", protect(h.DeleteWeight))
}

func currentUser(c fiber.Ctx) (uuid.UUID, error) {
	id, ok := httpx.UserID(c)
	if !ok {
		return uuid.Nil, httpx.Unauthorized("unauthorized", "Authentication required")
	}
	return id, nil
}

// GetProfile godoc
//
//	@Summary		Get the profile
//	@Description	Returns the profile with the current weight (latest entry), age, units, timezone and whether the profile is complete.
//	@Tags			profile
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	ProfileResponse
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Router			/me/profile [get]
func (h *Handler) GetProfile(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.GetProfile(ctx, userID)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// UpdateProfile godoc
//
//	@Summary		Update the profile
//	@Description	Partial update: omitted fields stay unchanged. weight_kg adds a weight entry dated today. When the profile is complete and the user has not set their own goals, suggested goals are recalculated.
//	@Tags			profile
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		UpdateProfileRequest	true	"Fields to change"
//	@Success		200		{object}	ProfileResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Router			/me/profile [patch]
func (h *Handler) UpdateProfile(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	var req UpdateProfileRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.UpdateProfile(ctx, userID, &req)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// GetGoals godoc
//
//	@Summary		Get today's goals
//	@Description	Returns the goals that apply today. 404 goals_not_set until the profile is complete or goals are set manually.
//	@Tags			goals
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	GoalsResponse
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Failure		404	{object}	httpx.ErrorResponse
//	@Router			/me/goals [get]
func (h *Handler) GetGoals(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.GetGoals(ctx, userID)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// SetGoals godoc
//
//	@Summary		Set goals
//	@Description	Stores goals chosen by the user, effective from today. Earlier days keep the goals that applied then. Profile changes no longer overwrite them.
//	@Tags			goals
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		SetGoalsRequest	true	"Goals"
//	@Success		200		{object}	GoalsResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Router			/me/goals [put]
func (h *Handler) SetGoals(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	var req SetGoalsRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.SetGoals(ctx, userID, &req)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// ResetGoals godoc
//
//	@Summary		Reset goals to suggested defaults
//	@Description	Replaces today's goals with defaults computed from the profile and latest weight. Needs a complete profile (422 profile_incomplete otherwise).
//	@Tags			goals
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	GoalsResponse
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Failure		422	{object}	httpx.ErrorResponse
//	@Router			/me/goals/reset [post]
func (h *Handler) ResetGoals(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.ResetGoals(ctx, userID)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// ListWeight godoc
//
//	@Summary		List weight entries
//	@Description	Entries between two local dates, newest first. Defaults to the last 90 days. At most 500 entries and a 2-year range.
//	@Tags			weight
//	@Produce		json
//	@Security		BearerAuth
//	@Param			from	query		string	false	"Start date, YYYY-MM-DD"
//	@Param			to		query		string	false	"End date, YYYY-MM-DD (default: today)"
//	@Success		200		{object}	WeightListResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Router			/weight-entries [get]
func (h *Handler) ListWeight(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.ListWeight(ctx, userID, c.Query("from"), c.Query("to"))
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// AddWeight godoc
//
//	@Summary		Add a weight entry
//	@Description	Records a weight. The date defaults to today in the user's timezone; pass local_date to backfill. Suggested goals are recalculated.
//	@Tags			weight
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		AddWeightRequest	true	"Weight"
//	@Success		201		{object}	WeightEntryResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Router			/weight-entries [post]
func (h *Handler) AddWeight(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	var req AddWeightRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.AddWeight(ctx, userID, &req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(resp)
}

// DeleteWeight godoc
//
//	@Summary		Delete a weight entry
//	@Description	Soft-deletes an entry and recalculates suggested goals.
//	@Tags			weight
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Weight entry ID"
//	@Success		204
//	@Failure		400	{object}	httpx.ErrorResponse
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Failure		404	{object}	httpx.ErrorResponse
//	@Router			/weight-entries/{id} [delete]
func (h *Handler) DeleteWeight(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrInvalidID
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	if err := h.svc.DeleteWeight(ctx, userID, id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
