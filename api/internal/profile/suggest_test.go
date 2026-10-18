package profile

import (
	"testing"
	"time"
	_ "time/tzdata"
)

func TestSuggestModerateMale(t *testing.T) {
	got := Suggest(SuggestInput{Sex: "male", Age: 30, HeightCM: 180, WeightKG: 80, ActivityLevel: "moderate"})

	// BMR = 800 + 1125 - 150 + 5 = 1780; x1.55 = 2759 -> 2760
	if got.CaloriesKcal != 2760 {
		t.Errorf("calories = %d, want 2760", got.CaloriesKcal)
	}
	if got.ProteinG == nil || *got.ProteinG != 128 {
		t.Errorf("protein = %v, want 128", got.ProteinG)
	}
	if got.FatG == nil || *got.FatG != 77 {
		t.Errorf("fat = %v, want 77", got.FatG)
	}
	if got.CarbsG == nil || *got.CarbsG != 389 {
		t.Errorf("carbs = %v, want 389", got.CarbsG)
	}
	if got.WaterML != 2800 {
		t.Errorf("water = %d, want 2800", got.WaterML)
	}
	if got.WorkoutsPerWeek != 4 {
		t.Errorf("workouts = %d, want 4", got.WorkoutsPerWeek)
	}
}

func TestSuggestDefaultsToLightActivity(t *testing.T) {
	a := Suggest(SuggestInput{Sex: "female", Age: 25, HeightCM: 165, WeightKG: 60})
	b := Suggest(SuggestInput{Sex: "female", Age: 25, HeightCM: 165, WeightKG: 60, ActivityLevel: "light"})
	if a.CaloriesKcal != b.CaloriesKcal || a.WorkoutsPerWeek != 3 {
		t.Errorf("empty activity level should behave like light, got %+v vs %+v", a, b)
	}
}

func TestSuggestAppliesFloorsAndCaps(t *testing.T) {
	small := Suggest(SuggestInput{Sex: "female", Age: 70, HeightCM: 140, WeightKG: 30, ActivityLevel: "sedentary"})
	if small.CaloriesKcal != minCalories {
		t.Errorf("calories = %d, want floor %d", small.CaloriesKcal, minCalories)
	}
	if small.WaterML != minWaterML {
		t.Errorf("water = %d, want floor %d", small.WaterML, minWaterML)
	}
	if small.CarbsG == nil || *small.CarbsG < 0 {
		t.Errorf("carbs must never be negative, got %v", small.CarbsG)
	}

	big := Suggest(SuggestInput{Sex: "male", Age: 25, HeightCM: 200, WeightKG: 200, ActivityLevel: "very_active"})
	if big.WaterML != maxWaterML {
		t.Errorf("water = %d, want cap %d", big.WaterML, maxWaterML)
	}
}

func TestAgeOn(t *testing.T) {
	birth := time.Date(2000, time.March, 15, 0, 0, 0, 0, time.UTC)
	cases := []struct {
		today time.Time
		want  int
	}{
		{time.Date(2026, time.March, 14, 0, 0, 0, 0, time.UTC), 25},
		{time.Date(2026, time.March, 15, 0, 0, 0, 0, time.UTC), 26},
		{time.Date(2026, time.December, 31, 0, 0, 0, 0, time.UTC), 26},
	}
	for _, tc := range cases {
		if got := ageOn(birth, tc.today); got != tc.want {
			t.Errorf("ageOn(%s) = %d, want %d", tc.today.Format(dateLayout), got, tc.want)
		}
	}
}

func TestLocalTodayUsesUserTimezone(t *testing.T) {
	// 20:00 UTC on 18 Oct is already 01:30 on 19 Oct in India.
	now := time.Date(2026, time.October, 18, 20, 0, 0, 0, time.UTC)
	if got := formatDate(localToday(now, "Asia/Kolkata")); got != "2026-10-19" {
		t.Errorf("Asia/Kolkata today = %s, want 2026-10-19", got)
	}
	if got := formatDate(localToday(now, "UTC")); got != "2026-10-18" {
		t.Errorf("UTC today = %s, want 2026-10-18", got)
	}
}

func TestValidTimezone(t *testing.T) {
	for tz, want := range map[string]bool{
		"Asia/Kolkata": true,
		"UTC":          true,
		"":             false,
		"Local":        false,
		"Mars/Base":    false,
	} {
		if got := validTimezone(tz); got != want {
			t.Errorf("validTimezone(%q) = %v, want %v", tz, got, want)
		}
	}
}
