// Package workout owns workout logging. A workout is a session for one local
// date; entries are the exercises performed in it (sets x reps at an optional
// weight, plus duration, distance and calories). Duration and calories are
// estimated on the server when the client does not provide them.
package workout

import "github.com/saakarx/fit-fueler/api/internal/httpx"

// Public errors. Clients branch on the code, so keep the codes stable.
var (
	ErrWorkoutNotFound       = httpx.NotFound("workout_not_found", "Workout not found")
	ErrEntryNotFound         = httpx.NotFound("workout_entry_not_found", "Workout entry not found")
	ErrAccountGone           = httpx.Unauthorized("unauthorized", "This account no longer exists")
	ErrInvalidID             = httpx.BadRequest("invalid_id", "The ID in the URL is not valid")
	ErrInvalidDate           = httpx.BadRequest("invalid_date", "Dates must be formatted YYYY-MM-DD and fall in a sensible range")
	ErrInvalidIdempotencyKey = httpx.BadRequest("invalid_idempotency_key", "The Idempotency-Key header must be a UUID")
	ErrIdempotencyConflict   = httpx.Conflict("idempotency_key_used", "This Idempotency-Key was used for an entry that has since been deleted. Use a new key")
)
