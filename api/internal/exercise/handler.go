package exercise

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
)

const (
	defaultLimit = 20
	maxLimit     = 50
	maxOffset    = 10000
	maxQueryLen  = 100
)

// Handler serves the /exercises endpoints.
type Handler struct{ svc *Service }

// NewHandler creates the handler.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Register adds the routes. protect wraps a handler so it requires a valid access token.
// /exercises/categories is registered before /exercises/:id so it is not read as an ID.
func (h *Handler) Register(r fiber.Router, protect func(fiber.Handler) fiber.Handler) {
	r.Get("/exercises", protect(h.Search))
	r.Get("/exercises/categories", protect(h.Categories))
	r.Get("/exercises/:id", protect(h.Get))
	r.Post("/exercises", protect(h.Create))
	r.Patch("/exercises/:id", protect(h.Update))
	r.Delete("/exercises/:id", protect(h.Delete))
}

func currentUser(c fiber.Ctx) (uuid.UUID, error) {
	id, ok := httpx.UserID(c)
	if !ok {
		return uuid.Nil, httpx.Unauthorized("unauthorized", "Authentication required")
	}
	return id, nil
}

func pathID(c fiber.Ctx) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, ErrInvalidID
	}
	return id, nil
}

// Search godoc
//
//	@Summary		Search exercises
//	@Description	Searches the shared catalog and the user's own custom exercises. Results are ordered by relevance (exact name, prefix, shorter names). has_more tells the app whether to load another page.
//	@Tags			exercises
//	@Produce		json
//	@Security		BearerAuth
//	@Param			q			query		string	false	"Search text (max 100 characters)"
//	@Param			category	query		string	false	"Exact category, e.g. Chest"
//	@Param			muscle		query		string	false	"Exact muscle name"
//	@Param			equipment	query		string	false	"Exact equipment name"
//	@Param			scope		query		string	false	"all (default), catalog or custom"
//	@Param			language	query		string	false	"Language code of the name, e.g. en (default: any)"
//	@Param			limit		query		int		false	"Page size, 1-50 (default 20)"
//	@Param			offset		query		int		false	"Items to skip (default 0)"
//	@Success		200			{object}	SearchResponse
//	@Failure		400			{object}	httpx.ErrorResponse
//	@Failure		401			{object}	httpx.ErrorResponse
//	@Router			/exercises [get]
func (h *Handler) Search(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	params, err := parseSearch(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.Search(ctx, userID, params)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// Categories godoc
//
//	@Summary		List exercise categories
//	@Description	Categories visible to the user, with the number of exercises in each.
//	@Tags			exercises
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	CategoriesResponse
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Router			/exercises/categories [get]
func (h *Handler) Categories(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.Categories(ctx, userID)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// Get godoc
//
//	@Summary		Get an exercise
//	@Tags			exercises
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Exercise ID"
//	@Success		200	{object}	ExerciseResponse
//	@Failure		400	{object}	httpx.ErrorResponse
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Failure		404	{object}	httpx.ErrorResponse
//	@Router			/exercises/{id} [get]
func (h *Handler) Get(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	id, err := pathID(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.Get(ctx, userID, id)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// Create godoc
//
//	@Summary		Create a custom exercise
//	@Description	Adds an exercise only the current user can see. met_value is estimated from the category and name when omitted. Names are unique per user (409 exercise_exists).
//	@Tags			exercises
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		CreateExerciseRequest	true	"Exercise"
//	@Success		201		{object}	ExerciseResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Failure		409		{object}	httpx.ErrorResponse
//	@Router			/exercises [post]
func (h *Handler) Create(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	var req CreateExerciseRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.Create(ctx, userID, &req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(resp)
}

// Update godoc
//
//	@Summary		Update a custom exercise
//	@Description	Partial update of the user's own custom exercise. Catalog exercises are read-only (403 exercise_read_only).
//	@Tags			exercises
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string					true	"Exercise ID"
//	@Param			body	body		UpdateExerciseRequest	true	"Fields to change"
//	@Success		200		{object}	ExerciseResponse
//	@Failure		400		{object}	httpx.ErrorResponse
//	@Failure		401		{object}	httpx.ErrorResponse
//	@Failure		403		{object}	httpx.ErrorResponse
//	@Failure		404		{object}	httpx.ErrorResponse
//	@Failure		409		{object}	httpx.ErrorResponse
//	@Router			/exercises/{id} [patch]
func (h *Handler) Update(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	id, err := pathID(c)
	if err != nil {
		return err
	}
	var req UpdateExerciseRequest
	if err := httpx.BindJSON(c, &req); err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	resp, err := h.svc.Update(ctx, userID, id, &req)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// Delete godoc
//
//	@Summary		Delete a custom exercise
//	@Description	Soft-deletes the user's own custom exercise. Logged workouts keep their own copy of the exercise name.
//	@Tags			exercises
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Exercise ID"
//	@Success		204
//	@Failure		400	{object}	httpx.ErrorResponse
//	@Failure		401	{object}	httpx.ErrorResponse
//	@Failure		403	{object}	httpx.ErrorResponse
//	@Failure		404	{object}	httpx.ErrorResponse
//	@Router			/exercises/{id} [delete]
func (h *Handler) Delete(c fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return err
	}
	id, err := pathID(c)
	if err != nil {
		return err
	}
	ctx, cancel := httpx.RequestContext(c)
	defer cancel()

	if err := h.svc.Delete(ctx, userID, id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// parseSearch reads and validates the search query parameters.
func parseSearch(c fiber.Ctx) (SearchParams, error) {
	p := SearchParams{
		Query:     strings.TrimSpace(c.Query("q")),
		Category:  strings.TrimSpace(c.Query("category")),
		Muscle:    strings.TrimSpace(c.Query("muscle")),
		Equipment: strings.TrimSpace(c.Query("equipment")),
		Scope:     strings.TrimSpace(c.Query("scope")),
		Language:  strings.ToLower(strings.TrimSpace(c.Query("language"))),
	}
	if len(p.Query) > maxQueryLen || len(p.Language) > 12 {
		return p, ErrInvalidQuery
	}
	switch p.Scope {
	case "":
		p.Scope = "all"
	case "all", "catalog", "custom":
	default:
		return p, ErrInvalidQuery
	}

	var err error
	if p.Limit, err = intParam(c.Query("limit"), defaultLimit, 1, maxLimit); err != nil {
		return p, err
	}
	if p.Offset, err = intParam(c.Query("offset"), 0, 0, maxOffset); err != nil {
		return p, err
	}
	return p, nil
}

func intParam(raw string, def, lo, hi int) (int, error) {
	if raw == "" {
		return def, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < lo || n > hi {
		return 0, ErrInvalidQuery
	}
	return n, nil
}
