package exercise

import "testing"

func TestEstimateMET(t *testing.T) {
	cases := []struct {
		category, name string
		want           float64
	}{
		{"Abs", "Crunches", 4.0}, // "crunch" must not match "run"
		{"Cardio", "Running", 9.8},
		{"Cardio", "Treadmill Running (outdoor)", 9.8},
		{"Cardio", "Rowing Machine", 7.0},
		{"Back", "Bent Over Row", 4.0}, // a lift, not rowing cardio
		{"Legs", "Walking Lunges", 4.0},
		{"Cardio", "Walking", 3.5},
		{"Cardio", "Jump Rope", 11.0},
		{"Cardio", "Stair Climber", 6.0}, // unknown cardio falls back to the default
		{"Legs", "Hamstring Stretch", 2.3},
		{"Other", "Yoga Flow", 2.5},
		{"Chest", "Bench Press", 4.0},
	}
	for _, tc := range cases {
		if got := EstimateMET(tc.category, tc.name); got != tc.want {
			t.Errorf("EstimateMET(%q, %q) = %v, want %v", tc.category, tc.name, got, tc.want)
		}
	}
}
