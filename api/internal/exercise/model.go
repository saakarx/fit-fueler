package exercise

import "github.com/google/uuid"

// Exercise sources.
const (
	SourceWger   = "wger"
	SourceCustom = "custom"
)

// Categories lists what users may pick for a custom exercise. They are wger's
// category names plus "Other". Imported exercises keep whatever wger provides.
var Categories = []string{"Abs", "Arms", "Back", "Calves", "Cardio", "Chest", "Legs", "Shoulders", "Other"}

// Exercise is a catalog or custom exercise.
type Exercise struct {
	ID            uuid.UUID
	Source        string
	Name          string
	Language      string // lowercase language code of the name, e.g. "en"
	Category      string
	Muscles       []string
	Equipment     []string
	MetValue      float64
	ImageURL      *string
	LicenseName   *string
	LicenseAuthor *string
}

// IsCustom reports whether the exercise was created by a user.
func (e *Exercise) IsCustom() bool { return e.Source == SourceCustom }

// ImportedExercise is a catalog exercise to insert or refresh.
type ImportedExercise struct {
	Source        string
	SourceID      string // stable upstream identifier (wger's UUID, not its numeric ID)
	Name          string
	Language      string // lowercase language code of the name, e.g. "en"
	Category      string
	Muscles       []string
	Equipment     []string
	MetValue      float64
	ImageURL      *string
	LicenseName   *string
	LicenseAuthor *string
}

// SearchParams filters the catalog. UserID scopes custom exercises to their owner.
type SearchParams struct {
	UserID    uuid.UUID
	Query     string
	Category  string
	Muscle    string
	Equipment string
	Scope     string // "all", "catalog" or "custom"
	Language  string // language code; empty means any
	Limit     int
	Offset    int
}

// CategoryCount is a category with the number of exercises in it.
type CategoryCount struct {
	Name  string
	Count int
}
