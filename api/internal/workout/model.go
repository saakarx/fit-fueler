package workout

import (
	"time"

	"github.com/google/uuid"
)

// Workout is a session for one local date.
type Workout struct {
	ID        uuid.UUID
	LocalDate time.Time // midnight UTC, representing the user's calendar date
	Name      *string
	Notes     *string
	StartedAt time.Time
}

// Entry is one exercise performed in a workout. ExerciseName is a snapshot, so
// history survives later changes to the catalog.
type Entry struct {
	ID                uuid.UUID
	WorkoutID         uuid.UUID
	ExerciseID        uuid.UUID
	ExerciseName      string
	Position          int
	Sets              int
	Reps              int
	WeightKG          *float64
	DurationMin       *float64
	DurationEstimated bool
	DistanceM         *float64
	CaloriesBurned    *float64
	CaloriesEstimated bool
	CreatedAt         time.Time
}

// Totals summarizes a workout's entries.
type Totals struct {
	Entries        int
	Sets           int
	DurationMin    float64
	CaloriesBurned float64
	VolumeKG       float64 // sum of sets x reps x weight, for entries that have a weight
}
