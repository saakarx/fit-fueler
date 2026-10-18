// Package exercise owns the exercise catalog: searching it, user-created
// custom exercises, and the MET estimates used for calorie calculations.
// The catalog itself is filled by the wger importer (cmd/import-wger).
package exercise

import "github.com/saakarx/fit-fueler/api/internal/httpx"

// Public errors. Clients branch on the code, so keep the codes stable.
var (
	ErrNotFound     = httpx.NotFound("exercise_not_found", "Exercise not found")
	ErrReadOnly     = httpx.Forbidden("exercise_read_only", "Catalog exercises cannot be changed")
	ErrExists       = httpx.Conflict("exercise_exists", "You already have an exercise with this name")
	ErrInvalidID    = httpx.BadRequest("invalid_id", "The ID in the URL is not valid")
	ErrInvalidQuery = httpx.BadRequest("invalid_query", "One or more query parameters are invalid")
)
