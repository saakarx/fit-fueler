package workout

import "math"

const (
	// minutesPerSet is the assumed time per set, including rest, used when the
	// client does not report a duration. It is an assumption, not a measurement.
	minutesPerSet = 2.5

	// defaultWeightKG is used for calorie estimates when the user has no
	// weight on record.
	defaultWeightKG = 70.0
)

// EstimateDurationMin estimates how long an entry took from its number of sets.
func EstimateDurationMin(sets int) float64 {
	return round1(float64(sets) * minutesPerSet)
}

// EstimateCalories estimates energy burned: MET x body weight (kg) x hours.
func EstimateCalories(met, weightKG, durationMin float64) float64 {
	return round1(met * weightKG * durationMin / 60)
}

func computeTotals(entries []Entry) Totals {
	t := Totals{Entries: len(entries)}
	for _, e := range entries {
		t.Sets += e.Sets
		if e.DurationMin != nil {
			t.DurationMin += *e.DurationMin
		}
		if e.CaloriesBurned != nil {
			t.CaloriesBurned += *e.CaloriesBurned
		}
		if e.WeightKG != nil {
			t.VolumeKG += float64(e.Sets*e.Reps) * *e.WeightKG
		}
	}
	t.DurationMin = round1(t.DurationMin)
	t.CaloriesBurned = round1(t.CaloriesBurned)
	t.VolumeKG = round1(t.VolumeKG)
	return t
}

func round1(x float64) float64 { return math.Round(x*10) / 10 }
