package profile

// UpdateProfileRequest is the body of PATCH /me/profile. Every field is
// optional; omitted (or null) fields stay unchanged. A weight_kg is recorded
// as a new weight entry dated today in the user's timezone.
type UpdateProfileRequest struct {
	Name                 *string  `json:"name" validate:"omitempty,max=100" example:"Saakar"`
	Sex                  *string  `json:"sex" validate:"omitempty,oneof=male female other" example:"male"`
	BirthDate            *string  `json:"birth_date" validate:"omitempty,datetime=2006-01-02" example:"2002-04-25"`
	HeightCM             *float64 `json:"height_cm" validate:"omitempty,gte=50,lte=272" example:"175"`
	WeightKG             *float64 `json:"weight_kg" validate:"omitempty,gte=20,lte=500" example:"68.5"`
	ActivityLevel        *string  `json:"activity_level" validate:"omitempty,oneof=sedentary light moderate active very_active" example:"moderate"`
	Timezone             *string  `json:"timezone" validate:"omitempty,max=64" example:"Asia/Kolkata"`
	Units                *Units   `json:"units"`
	NotificationsEnabled *bool    `json:"notifications_enabled"`
}

// ProfileResponse is the profile as returned to the app.
type ProfileResponse struct {
	Name                 *string  `json:"name" example:"Saakar"`
	Sex                  *string  `json:"sex" example:"male"`
	BirthDate            *string  `json:"birth_date" example:"2002-04-25"`
	Age                  *int     `json:"age" example:"24"`
	HeightCM             *float64 `json:"height_cm" example:"175"`
	WeightKG             *float64 `json:"weight_kg" example:"68.5"`
	ActivityLevel        *string  `json:"activity_level" example:"moderate"`
	Timezone             string   `json:"timezone" example:"Asia/Kolkata"`
	Units                Units    `json:"units"`
	NotificationsEnabled bool     `json:"notifications_enabled"`
	// ProfileCompleted is true once sex, birth date, height and a weight entry exist.
	ProfileCompleted bool `json:"profile_completed"`
}

// SetGoalsRequest is the body of PUT /me/goals. Macros are optional.
type SetGoalsRequest struct {
	CaloriesKcal    int  `json:"calories_kcal" validate:"required,gte=800,lte=10000" example:"2400"`
	ProteinG        *int `json:"protein_g" validate:"omitempty,gte=0,lte=1000" example:"130"`
	CarbsG          *int `json:"carbs_g" validate:"omitempty,gte=0,lte=2000" example:"300"`
	FatG            *int `json:"fat_g" validate:"omitempty,gte=0,lte=1000" example:"70"`
	WaterML         int  `json:"water_ml" validate:"required,gte=500,lte=10000" example:"2800"`
	WorkoutsPerWeek *int `json:"workouts_per_week" validate:"required,gte=0,lte=14" example:"4"`
}

// GoalsResponse is the set of goals that applies today.
type GoalsResponse struct {
	CaloriesKcal    *int   `json:"calories_kcal" example:"2400"`
	ProteinG        *int   `json:"protein_g" example:"130"`
	CarbsG          *int   `json:"carbs_g" example:"300"`
	FatG            *int   `json:"fat_g" example:"70"`
	WaterML         *int   `json:"water_ml" example:"2800"`
	WorkoutsPerWeek *int   `json:"workouts_per_week" example:"4"`
	Source          string `json:"source" enums:"suggested,user" example:"suggested"`
	EffectiveFrom   string `json:"effective_from" example:"2026-10-19"`
}

// AddWeightRequest is the body of POST /weight-entries. When local_date is
// omitted it is derived from logged_at (or now) in the user's timezone.
type AddWeightRequest struct {
	WeightKG  float64 `json:"weight_kg" validate:"required,gte=20,lte=500" example:"68.5"`
	LocalDate *string `json:"local_date" validate:"omitempty,datetime=2006-01-02" example:"2026-10-19"`
	LoggedAt  *string `json:"logged_at" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00" example:"2026-10-19T07:30:00+05:30"`
}

// WeightEntryResponse is one weight measurement.
type WeightEntryResponse struct {
	ID        string  `json:"id" example:"0199c2a4-7b1e-7c3a-9d5e-2f6a8b4c1d90"`
	WeightKG  float64 `json:"weight_kg" example:"68.5"`
	LocalDate string  `json:"local_date" example:"2026-10-19"`
	LoggedAt  string  `json:"logged_at" example:"2026-10-19T02:00:00Z"`
}

// WeightListResponse lists weight entries, newest first.
type WeightListResponse struct {
	Items []WeightEntryResponse `json:"items"`
}
