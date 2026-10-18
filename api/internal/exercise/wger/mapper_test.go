package wger

import (
	"encoding/json"
	"errors"
	"reflect"
	"testing"
)

// A trimmed sample shaped like the exerciseinfo response in the old app's types.
const sampleJSON = `{
  "count": 2,
  "next": "http://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=50&offset=50&status=2",
  "previous": null,
  "results": [
    {
      "id": 73,
      "uuid": "b0f6f7c6-1111-4a2a-8f2e-000000000001",
      "category": {"id": 11, "name": "Chest"},
      "muscles": [
        {"id": 4, "name": "Pectoralis major", "name_en": "Chest", "is_front": true},
        {"id": 5, "name": "Triceps brachii", "name_en": "", "is_front": false}
      ],
      "muscles_secondary": [{"id": 2, "name": "Anterior deltoid", "name_en": "Shoulders"}],
      "equipment": [{"id": 1, "name": "Barbell"}, {"id": 8, "name": "Bench"}, {"id": 9, "name": "barbell"}],
      "license": {"id": 2, "full_name": "Creative Commons Attribution Share Alike 4", "short_name": "CC-BY-SA 4", "url": "https://creativecommons.org/licenses/by-sa/4.0/deed.en"},
      "license_author": "Jane Doe",
      "images": [
        {"image": "https://wger.de/media/exercise-images/73/side.png", "is_main": false, "license_author": "Sam"},
        {"image": "/media/exercise-images/73/main.png", "is_main": true, "license_author": "John Roe"}
      ],
      "translations": [
        {"id": 1, "name": "Bankdrücken", "language": 1, "license_author": "Hans"},
        {"id": 2, "name": "  Bench Press ", "language": 2, "license_author": "Jane Doe"}
      ],
      "videos": []
    },
    {
      "id": 74,
      "uuid": "b0f6f7c6-1111-4a2a-8f2e-000000000002",
      "category": {"id": 15, "name": "Abs"},
      "muscles": [],
      "equipment": [],
      "license": {"short_name": "CC-BY-SA 4"},
      "license_author": null,
      "images": [],
      "translations": [{"name": "Crunches", "language": 2, "license_author": null}]
    }
  ]
}`

func decodeSample(t *testing.T) Page {
	t.Helper()
	var pg Page
	if err := json.Unmarshal([]byte(sampleJSON), &pg); err != nil {
		t.Fatalf("sample does not decode: %v", err)
	}
	return pg
}

func TestToImportedFullExercise(t *testing.T) {
	pg := decodeSample(t)
	got, err := pg.Results[0].ToImported()
	if err != nil {
		t.Fatalf("ToImported: %v", err)
	}

	if got.SourceID != "b0f6f7c6-1111-4a2a-8f2e-000000000001" || got.Source != "wger" {
		t.Errorf("identity wrong: %+v", got)
	}
	if got.Name != "Bench Press" {
		t.Errorf("name = %q, want the trimmed English name", got.Name)
	}
	if got.Language != "en" {
		t.Errorf("language = %q, want en", got.Language)
	}
	if got.Category != "Chest" {
		t.Errorf("category = %q", got.Category)
	}
	if want := []string{"Chest", "Triceps brachii"}; !reflect.DeepEqual(got.Muscles, want) {
		t.Errorf("muscles = %v, want %v (English name preferred, fallback to Latin, secondary ignored)", got.Muscles, want)
	}
	if want := []string{"Barbell", "Bench"}; !reflect.DeepEqual(got.Equipment, want) {
		t.Errorf("equipment = %v, want %v (case-insensitive duplicates removed)", got.Equipment, want)
	}
	if got.ImageURL == nil || *got.ImageURL != "https://wger.de/media/exercise-images/73/main.png" {
		t.Errorf("image should be the main one with an absolute URL, got %v", got.ImageURL)
	}
	if got.LicenseName == nil || *got.LicenseName != "CC-BY-SA 4" {
		t.Errorf("license = %v", got.LicenseName)
	}
	if got.LicenseAuthor == nil || *got.LicenseAuthor != "Jane Doe; John Roe" {
		t.Errorf("authors = %v, want text, exercise and image authors without duplicates", got.LicenseAuthor)
	}
	if got.MetValue != 4.0 {
		t.Errorf("met = %v, want the strength default", got.MetValue)
	}
}

func TestToImportedSparseExercise(t *testing.T) {
	pg := decodeSample(t)
	got, err := pg.Results[1].ToImported()
	if err != nil {
		t.Fatalf("ToImported: %v", err)
	}
	if got.Muscles == nil || got.Equipment == nil {
		t.Error("slices must be non-nil (NOT NULL columns)")
	}
	if got.ImageURL != nil || got.LicenseAuthor != nil {
		t.Errorf("missing image and author should stay nil, got %v / %v", got.ImageURL, got.LicenseAuthor)
	}
	if got.MetValue != 4.0 { // "crunches" must not be mistaken for running
		t.Errorf("met = %v", got.MetValue)
	}
}

func TestToImportedSkipsUnusableExercises(t *testing.T) {
	base := func() Item {
		return Item{
			UUID:         "u-1",
			License:      &License{ShortName: "CC-BY-SA 4"},
			Translations: []Translation{{Name: "Squat", Language: englishLanguageID}},
		}
	}

	noUUID := base()
	noUUID.UUID = " "
	if _, err := noUUID.ToImported(); !errors.Is(err, ErrNoUUID) {
		t.Errorf("got %v, want ErrNoUUID", err)
	}

	noEnglish := base()
	noEnglish.Translations = []Translation{{Name: "Kniebeuge", Language: 1}}
	if _, err := noEnglish.ToImported(); !errors.Is(err, ErrNoEnglish) {
		t.Errorf("got %v, want ErrNoEnglish", err)
	}

	noLicense := base()
	noLicense.License = nil
	if _, err := noLicense.ToImported(); !errors.Is(err, ErrNoLicense) {
		t.Errorf("got %v, want ErrNoLicense", err)
	}

	noCategory := base()
	got, err := noCategory.ToImported()
	if err != nil || got.Category != "Other" {
		t.Errorf("missing category should become Other, got %v / %v", got, err)
	}
}

func TestPaginationLinkIsUpgradedToHTTPS(t *testing.T) {
	pg := decodeSample(t)
	if pg.Next == nil {
		t.Fatal("sample has a next link")
	}
	if got := secure(*pg.Next); got[:8] != "https://" {
		t.Errorf("secure(%q) = %q", *pg.Next, got)
	}
	if got := secure("https://wger.de/x"); got != "https://wger.de/x" {
		t.Errorf("https links must be left alone, got %q", got)
	}
}
