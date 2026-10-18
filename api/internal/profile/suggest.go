package profile

import "math"

// SuggestInput is what the goal suggestion needs.
type SuggestInput struct {
	Sex           string // male, female or other
	Age           int
	HeightCM      float64
	WeightKG      float64
	ActivityLevel string // empty means "light"
}

var activityFactor = map[string]float64{
	"sedentary":   1.2,
	"light":       1.375,
	"moderate":    1.55,
	"active":      1.725,
	"very_active": 1.9,
}

var activityWorkouts = map[string]int{
	"sedentary":   2,
	"light":       3,
	"moderate":    4,
	"active":      5,
	"very_active": 6,
}

const (
	minCalories = 1200
	minWaterML  = 1500
	maxWaterML  = 4000
)

// Suggest computes default daily goals.
//
//   - Calories: maintenance, from the Mifflin-St Jeor equation times an
//     activity factor. There is no weight-loss or weight-gain target yet.
//     For "other" the sex constant is the midpoint of the male and female values.
//   - Protein: 1.6 g per kg of body weight.
//   - Fat: 25% of calories. Carbs: the remaining calories.
//   - Water: about 35 ml per kg, rounded to 50 ml and kept between 1.5 and 4 litres.
//   - Workouts per week: derived from the activity level.
//
// These are rough starting points, not medical advice; the user can override them.
func Suggest(in SuggestInput) GoalValues {
	level := in.ActivityLevel
	if _, ok := activityFactor[level]; !ok {
		level = "light"
	}

	bmr := 10*in.WeightKG + 6.25*in.HeightCM - 5*float64(in.Age)
	switch in.Sex {
	case "male":
		bmr += 5
	case "female":
		bmr -= 161
	default:
		bmr -= 78
	}

	calories := roundTo(bmr*activityFactor[level], 10)
	if calories < minCalories {
		calories = minCalories
	}

	protein := int(math.Round(1.6 * in.WeightKG))
	fat := int(math.Round(0.25 * float64(calories) / 9))
	carbs := int(math.Round(float64(calories-protein*4-fat*9) / 4))
	if carbs < 0 {
		carbs = 0
	}

	water := roundTo(35*in.WeightKG, 50)
	if water < minWaterML {
		water = minWaterML
	}
	if water > maxWaterML {
		water = maxWaterML
	}

	return GoalValues{
		CaloriesKcal:    calories,
		ProteinG:        &protein,
		CarbsG:          &carbs,
		FatG:            &fat,
		WaterML:         water,
		WorkoutsPerWeek: activityWorkouts[level],
	}
}

func roundTo(x float64, step int) int {
	return int(math.Round(x/float64(step))) * step
}
