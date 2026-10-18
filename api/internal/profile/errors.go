// Package profile owns the body-and-targets domain: the user's profile
// (sex, birth date, height, units, timezone), their goals, and weight history.
// These live together because they depend on each other: suggested goals are
// computed from the profile and the latest weight.
package profile

import (
	"net/http"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
)

// Public errors. Clients branch on the code, so keep the codes stable.
var (
	ErrAccountGone       = httpx.Unauthorized("unauthorized", "This account no longer exists")
	ErrGoalsNotSet       = httpx.NotFound("goals_not_set", "Goals are not set yet. Complete your profile or set goals manually")
	ErrProfileIncomplete = httpx.NewError(http.StatusUnprocessableEntity, "profile_incomplete", "Sex, birth date, height and a weight entry are needed to suggest goals")
	ErrWeightNotFound    = httpx.NotFound("weight_entry_not_found", "Weight entry not found")
	ErrInvalidID         = httpx.BadRequest("invalid_id", "The ID in the URL is not valid")
	ErrInvalidTimezone   = httpx.BadRequest("invalid_timezone", "The timezone must be a valid IANA name such as Asia/Kolkata")
	ErrInvalidBirthDate  = httpx.BadRequest("invalid_birth_date", "The birth date must be in the past and imply an age between 13 and 120")
	ErrInvalidDate       = httpx.BadRequest("invalid_date", "Dates must be formatted YYYY-MM-DD and fall in a sensible range")
)
