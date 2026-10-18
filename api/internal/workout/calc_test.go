package workout

import "testing"

func TestEstimateDurationMin(t *testing.T) {
	if got := EstimateDurationMin(4); got != 10 {
		t.Errorf("4 sets = %v min, want 10", got)
	}
	if got := EstimateDurationMin(3); got != 7.5 {
		t.Errorf("3 sets = %v min, want 7.5", got)
	}
}

func TestEstimateCalories(t *testing.T) {
	// 4 MET x 80 kg x 10/60 h = 53.33...
	if got := EstimateCalories(4, 80, 10); got != 53.3 {
		t.Errorf("calories = %v, want 53.3", got)
	}
	if got := EstimateCalories(9.8, 70, 30); got != 343 {
		t.Errorf("running 30 min = %v, want 343", got)
	}
}

func TestComputeTotals(t *testing.T) {
	w60, d10, d20, c50, c120 := 60.0, 10.0, 20.5, 50.0, 120.25
	entries := []Entry{
		{Sets: 3, Reps: 10, WeightKG: &w60, DurationMin: &d10, CaloriesBurned: &c50},
		{Sets: 2, Reps: 15, DurationMin: &d20, CaloriesBurned: &c120}, // bodyweight: no volume
		{Sets: 1, Reps: 1}, // no duration or calories yet
	}
	got := computeTotals(entries)

	if got.Entries != 3 || got.Sets != 6 {
		t.Errorf("counts wrong: %+v", got)
	}
	if got.DurationMin != 30.5 {
		t.Errorf("duration = %v, want 30.5", got.DurationMin)
	}
	if got.CaloriesBurned != 170.3 { // 170.25 rounded to one decimal
		t.Errorf("calories = %v, want 170.3", got.CaloriesBurned)
	}
	if got.VolumeKG != 1800 {
		t.Errorf("volume = %v, want 1800 (3 x 10 x 60)", got.VolumeKG)
	}
}

func TestComputeTotalsEmpty(t *testing.T) {
	if got := computeTotals(nil); got != (Totals{}) {
		t.Errorf("empty totals should be zero, got %+v", got)
	}
}
