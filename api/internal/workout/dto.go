package workout

// CreateEntryRequest is the body of POST /workout-entries.
//
// Without workout_id, the entry joins the user's latest workout on local_date
// (default: today in the user's timezone), creating that workout if needed.
// Omitted duration_min and calories_burned are estimated by the server.
type CreateEntryRequest struct {
	ExerciseID     string   `json:"exercise_id" validate:"required,uuid" example:"0199c2a4-7b1e-7c3a-9d5e-2f6a8b4c1d90"`
	WorkoutID      *string  `json:"workout_id" validate:"omitempty,uuid"`
	LocalDate      *string  `json:"local_date" validate:"omitempty,datetime=2006-01-02" example:"2026-10-19"`
	Sets           int      `json:"sets" validate:"required,gte=1,lte=50" example:"3"`
	Reps           int      `json:"reps" validate:"required,gte=1,lte=1000" example:"10"`
	WeightKG       *float64 `json:"weight_kg" validate:"omitempty,gte=0,lte=1000" example:"40"`
	DurationMin    *float64 `json:"duration_min" validate:"omitempty,gt=0,lte=1440" example:"12"`
	DistanceM      *float64 `json:"distance_m" validate:"omitempty,gte=0,lte=1000000" example:"5000"`
	CaloriesBurned *float64 `json:"calories_burned" validate:"omitempty,gte=0,lte=20000" example:"90"`
}

// UpdateEntryRequest is the body of PATCH /workout-entries/{id}. Omitted fields
// stay unchanged. Changing sets re-estimates an estimated duration, and a
// changed duration re-estimates estimated calories; values you send are kept as given.
type UpdateEntryRequest struct {
	Sets           *int     `json:"sets" validate:"omitempty,gte=1,lte=50"`
	Reps           *int     `json:"reps" validate:"omitempty,gte=1,lte=1000"`
	WeightKG       *float64 `json:"weight_kg" validate:"omitempty,gte=0,lte=1000"`
	DurationMin    *float64 `json:"duration_min" validate:"omitempty,gt=0,lte=1440"`
	DistanceM      *float64 `json:"distance_m" validate:"omitempty,gte=0,lte=1000000"`
	CaloriesBurned *float64 `json:"calories_burned" validate:"omitempty,gte=0,lte=20000"`
}

// UpdateWorkoutRequest is the body of PATCH /workouts/{id}. Omitted fields stay
// unchanged; an empty string clears the field.
type UpdateWorkoutRequest struct {
	Name  *string `json:"name" validate:"omitempty,max=100" example:"Push day"`
	Notes *string `json:"notes" validate:"omitempty,max=2000"`
}

// EntryResponse is one exercise performed in a workout.
type EntryResponse struct {
	ID           string `json:"id" example:"0199c2a4-7b1e-7c3a-9d5e-2f6a8b4c1d90"`
	WorkoutID    string `json:"workout_id"`
	ExerciseID   string `json:"exercise_id"`
	ExerciseName string `json:"exercise_name" example:"Bench Press"`
	Position     int    `json:"position" example:"0"`
	Sets         int    `json:"sets" example:"3"`
	Reps         int    `json:"reps" example:"10"`
	// WeightKG is absent for bodyweight exercises.
	WeightKG    *float64 `json:"weight_kg"`
	DurationMin *float64 `json:"duration_min" example:"7.5"`
	// DurationEstimated is true when the server estimated the duration from the number of sets.
	DurationEstimated bool     `json:"duration_estimated"`
	DistanceM         *float64 `json:"distance_m"`
	CaloriesBurned    *float64 `json:"calories_burned" example:"53.3"`
	// CaloriesEstimated is true when the server calculated the calories (MET x weight x time).
	CaloriesEstimated bool   `json:"calories_estimated"`
	CreatedAt         string `json:"created_at" example:"2026-10-19T07:30:00Z"`
}

// TotalsResponse summarizes a workout.
type TotalsResponse struct {
	Entries        int     `json:"entries" example:"4"`
	Sets           int     `json:"sets" example:"12"`
	DurationMin    float64 `json:"duration_min" example:"30"`
	CaloriesBurned float64 `json:"calories_burned" example:"210.5"`
	VolumeKG       float64 `json:"volume_kg" example:"3600"`
}

// WorkoutResponse is a workout session with its entries.
type WorkoutResponse struct {
	ID        string          `json:"id"`
	LocalDate string          `json:"local_date" example:"2026-10-19"`
	Name      *string         `json:"name"`
	Notes     *string         `json:"notes"`
	StartedAt string          `json:"started_at" example:"2026-10-19T07:30:00Z"`
	Entries   []EntryResponse `json:"entries"`
	Totals    TotalsResponse  `json:"totals"`
}

// WorkoutListResponse lists workouts, newest first.
type WorkoutListResponse struct {
	Items []WorkoutResponse `json:"items"`
}
