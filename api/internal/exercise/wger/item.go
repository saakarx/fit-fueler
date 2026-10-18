// Package wger fetches exercises from the wger REST API and maps them to the
// catalog's import format.
//
// The JSON types follow the exerciseinfo response used by the original app
// (see its types.type.ts). Unknown fields are ignored, and fields that may be
// null are pointers, so small upstream changes do not break the import.
package wger

// Page is one page of the paginated exerciseinfo endpoint.
type Page struct {
	Count   int     `json:"count"`
	Next    *string `json:"next"`
	Results []Item  `json:"results"`
}

// Item is one exercise as returned by wger.
type Item struct {
	ID               int           `json:"id"`
	UUID             string        `json:"uuid"`
	Category         Category      `json:"category"`
	Muscles          []Muscle      `json:"muscles"`
	MusclesSecondary []Muscle      `json:"muscles_secondary"`
	Equipment        []Equipment   `json:"equipment"`
	License          *License      `json:"license"`
	LicenseAuthor    *string       `json:"license_author"`
	Images           []Image       `json:"images"`
	Translations     []Translation `json:"translations"`
}

// Category is an exercise category such as "Chest" or "Cardio".
type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Muscle is a muscle; NameEN is the common English name and may be empty.
type Muscle struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	NameEN string `json:"name_en"`
}

// Equipment is a piece of equipment.
type Equipment struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// License describes the content license of an exercise.
type License struct {
	ShortName string `json:"short_name"`
	FullName  string `json:"full_name"`
	URL       string `json:"url"`
}

// Image is an exercise picture.
type Image struct {
	Image         string  `json:"image"`
	IsMain        bool    `json:"is_main"`
	LicenseAuthor *string `json:"license_author"`
}

// Translation is the exercise text in one language (language 2 is English).
type Translation struct {
	Name          string  `json:"name"`
	Language      int     `json:"language"`
	LicenseAuthor *string `json:"license_author"`
}
