package profile

import (
	"time"

	"github.com/google/uuid"
)

// Allowed profile values (the database enforces the same sets).
const (
	sourceSuggested = "suggested"
	sourceUser      = "user"

	minAge = 13
	maxAge = 120

	dateLayout = "2006-01-02"
)

// Units are the user's display preferences. Everything is stored in metric;
// the app converts for display.
type Units struct {
	Weight   string `json:"weight" validate:"required,oneof=kg lb" example:"kg"`
	Height   string `json:"height" validate:"required,oneof=cm ft_in" example:"cm"`
	Distance string `json:"distance" validate:"required,oneof=km mi" example:"km"`
	Energy   string `json:"energy" validate:"required,oneof=kcal kj" example:"kcal"`
	Water    string `json:"water" validate:"required,oneof=ml fl_oz" example:"ml"`
}

// DefaultUnits matches the column default in the database.
func DefaultUnits() Units {
	return Units{Weight: "kg", Height: "cm", Distance: "km", Energy: "kcal", Water: "ml"}
}

// withDefaults fills any missing field, so older rows never produce empty values.
func (u Units) withDefaults() Units {
	d := DefaultUnits()
	if u.Weight == "" {
		u.Weight = d.Weight
	}
	if u.Height == "" {
		u.Height = d.Height
	}
	if u.Distance == "" {
		u.Distance = d.Distance
	}
	if u.Energy == "" {
		u.Energy = d.Energy
	}
	if u.Water == "" {
		u.Water = d.Water
	}
	return u
}

// Profile is the user's profile plus their name and current weight.
type Profile struct {
	DisplayName          *string
	Sex                  *string
	BirthDate            *time.Time
	HeightCM             *float64
	ActivityLevel        *string
	Timezone             string
	Units                Units
	NotificationsEnabled bool
	WeightKG             *float64 // latest weight entry, if any
}

// Complete reports whether there is enough data to suggest goals.
// Activity level is optional; suggestions assume "light" when it is missing.
func (p *Profile) Complete() bool {
	return p.Sex != nil && p.BirthDate != nil && p.HeightCM != nil && p.WeightKG != nil
}

// Goals is a stored goal set. Only calories, water and workouts are required
// by the API; the macros may be absent.
type Goals struct {
	CaloriesKcal    *int
	ProteinG        *int
	CarbsG          *int
	FatG            *int
	WaterML         *int
	WorkoutsPerWeek *int
	Source          string
	EffectiveFrom   time.Time
}

// GoalValues is a goal set to be written.
type GoalValues struct {
	CaloriesKcal    int
	ProteinG        *int
	CarbsG          *int
	FatG            *int
	WaterML         int
	WorkoutsPerWeek int
}

// WeightEntry is one weight measurement.
type WeightEntry struct {
	ID        uuid.UUID
	WeightKG  float64
	LoggedAt  time.Time
	LocalDate time.Time // midnight UTC, representing the user's calendar date
}

func parseDate(s string) (time.Time, error) { return time.ParseInLocation(dateLayout, s, time.UTC) }

func formatDate(t time.Time) string { return t.Format(dateLayout) }

// civilDate returns the calendar date of t (in t's own location) as midnight UTC.
func civilDate(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

// loadLocation resolves a stored timezone, falling back to UTC defensively.
func loadLocation(tz string) *time.Location {
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.UTC
	}
	return loc
}

// localToday returns the user's current calendar date.
func localToday(now time.Time, tz string) time.Time {
	return civilDate(now.In(loadLocation(tz)))
}

func validTimezone(tz string) bool {
	if tz == "" || tz == "Local" {
		return false
	}
	_, err := time.LoadLocation(tz)
	return err == nil
}

// ageOn returns the age in whole years on the given date.
func ageOn(birth, today time.Time) int {
	age := today.Year() - birth.Year()
	if today.Month() < birth.Month() || (today.Month() == birth.Month() && today.Day() < birth.Day()) {
		age--
	}
	return age
}
