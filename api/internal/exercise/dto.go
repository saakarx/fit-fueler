package exercise

// CreateExerciseRequest is the body of POST /exercises.
type CreateExerciseRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100" example:"Cable Face Pull"`
	// Language is the language of the name as a code like "en" (default "en").
	Language  *string  `json:"language" validate:"omitempty,min=2,max=12" example:"en"`
	Category  string   `json:"category" validate:"required,oneof=Abs Arms Back Calves Cardio Chest Legs Shoulders Other" example:"Shoulders"`
	Muscles   []string `json:"muscles" validate:"omitempty,max=10,dive,min=1,max=40" example:"Rear deltoids"`
	Equipment []string `json:"equipment" validate:"omitempty,max=10,dive,min=1,max=40" example:"Cable"`
	// MetValue is optional. When omitted it is estimated from the category and name.
	MetValue *float64 `json:"met_value" validate:"omitempty,gte=1,lte=20" example:"4"`
}

// UpdateExerciseRequest is the body of PATCH /exercises/{id}. Omitted fields
// stay unchanged; an empty muscles or equipment list clears it.
type UpdateExerciseRequest struct {
	Name      *string   `json:"name" validate:"omitempty,min=2,max=100"`
	Language  *string   `json:"language" validate:"omitempty,min=2,max=12"`
	Category  *string   `json:"category" validate:"omitempty,oneof=Abs Arms Back Calves Cardio Chest Legs Shoulders Other"`
	Muscles   *[]string `json:"muscles" validate:"omitempty,max=10,dive,min=1,max=40"`
	Equipment *[]string `json:"equipment" validate:"omitempty,max=10,dive,min=1,max=40"`
	MetValue  *float64  `json:"met_value" validate:"omitempty,gte=1,lte=20"`
}

// Attribution credits the source of catalog data. Show it in the app (for
// example on an exercise detail screen or a credits page).
type Attribution struct {
	Source  string `json:"source" example:"wger"`
	URL     string `json:"url" example:"https://wger.de"`
	License string `json:"license,omitempty" example:"CC-BY-SA 4"`
	Author  string `json:"author,omitempty" example:"Jane Doe; John Roe"`
}

// ExerciseResponse is one exercise.
type ExerciseResponse struct {
	ID        string   `json:"id" example:"0199c2a4-7b1e-7c3a-9d5e-2f6a8b4c1d90"`
	Name      string   `json:"name" example:"Bench Press"`
	Language  string   `json:"language" example:"en"`
	Category  string   `json:"category" example:"Chest"`
	Muscles   []string `json:"muscles"`
	Equipment []string `json:"equipment"`
	MetValue  float64  `json:"met_value" example:"4"`
	ImageURL  *string  `json:"image_url"`
	IsCustom  bool     `json:"is_custom"`
	// Attribution is present for catalog exercises only.
	Attribution *Attribution `json:"attribution,omitempty"`
}

// SearchResponse is one page of search results.
type SearchResponse struct {
	Items   []ExerciseResponse `json:"items"`
	Limit   int                `json:"limit" example:"20"`
	Offset  int                `json:"offset" example:"0"`
	HasMore bool               `json:"has_more"`
}

// CategoryResponse is a category and how many exercises it holds.
type CategoryResponse struct {
	Name  string `json:"name" example:"Chest"`
	Count int    `json:"count" example:"42"`
}

// CategoriesResponse lists categories.
type CategoriesResponse struct {
	Items []CategoryResponse `json:"items"`
}
