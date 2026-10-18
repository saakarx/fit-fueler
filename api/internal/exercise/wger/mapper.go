package wger

import (
	"errors"
	"strings"

	"github.com/saakarx/fit-fueler/api/internal/exercise"
)

const (
	englishLanguageID = 2
	languageCode      = "en" // what englishLanguageID is stored as in the catalog
	mediaBase         = "https://wger.de"
)

// Reasons an exercise is skipped. The importer counts them in its summary.
var (
	ErrNoUUID    = errors.New("no uuid")
	ErrNoEnglish = errors.New("no English name")
	ErrNoLicense = errors.New("no license information")
)

// ToImported converts a wger exercise to the catalog's import format.
//
//   - Exercises without an English name, or without license information, are
//     skipped (the license is needed for attribution).
//   - The upstream identifier is wger's UUID, because wger can renumber its
//     integer IDs.
//   - Only primary muscles are kept.
//   - License author collects every credited author (name, exercise and main
//     image) into one string, since the catalog stores a single author field.
func (it Item) ToImported() (*exercise.ImportedExercise, error) {
	if strings.TrimSpace(it.UUID) == "" {
		return nil, ErrNoUUID
	}

	var translation *Translation
	for i := range it.Translations {
		t := &it.Translations[i]
		if t.Language == englishLanguageID && strings.TrimSpace(t.Name) != "" {
			translation = t
			break
		}
	}
	if translation == nil {
		return nil, ErrNoEnglish
	}

	if it.License == nil || strings.TrimSpace(it.License.ShortName) == "" {
		return nil, ErrNoLicense
	}
	license := strings.TrimSpace(it.License.ShortName)

	name := strings.TrimSpace(translation.Name)
	category := strings.TrimSpace(it.Category.Name)
	if category == "" {
		category = "Other"
	}

	image := mainImage(it.Images)
	var imageURL *string
	var imageAuthor *string
	if image != nil {
		u := absoluteMediaURL(image.Image)
		imageURL = &u
		imageAuthor = image.LicenseAuthor
	}

	imp := &exercise.ImportedExercise{
		Source:      exercise.SourceWger,
		SourceID:    strings.TrimSpace(it.UUID),
		Name:        name,
		Language:    languageCode,
		Category:    category,
		Muscles:     muscleNames(it.Muscles),
		Equipment:   equipmentNames(it.Equipment),
		MetValue:    exercise.EstimateMET(category, name),
		ImageURL:    imageURL,
		LicenseName: &license,
	}
	if authors := joinAuthors(translation.LicenseAuthor, it.LicenseAuthor, imageAuthor); authors != "" {
		imp.LicenseAuthor = &authors
	}
	return imp, nil
}

func mainImage(images []Image) *Image {
	var first *Image
	for i := range images {
		img := &images[i]
		if strings.TrimSpace(img.Image) == "" {
			continue
		}
		if img.IsMain {
			return img
		}
		if first == nil {
			first = img
		}
	}
	return first
}

func absoluteMediaURL(u string) string {
	u = strings.TrimSpace(u)
	if strings.HasPrefix(u, "/") {
		return mediaBase + u
	}
	return u
}

func muscleNames(muscles []Muscle) []string {
	names := make([]string, 0, len(muscles))
	for _, m := range muscles {
		n := strings.TrimSpace(m.NameEN)
		if n == "" {
			n = strings.TrimSpace(m.Name)
		}
		names = append(names, n)
	}
	return dedupe(names)
}

func equipmentNames(items []Equipment) []string {
	names := make([]string, 0, len(items))
	for _, e := range items {
		names = append(names, strings.TrimSpace(e.Name))
	}
	return dedupe(names)
}

// dedupe drops empty and case-insensitively repeated entries, keeping order.
// It always returns a non-nil slice (the database column is NOT NULL).
func dedupe(in []string) []string {
	seen := make(map[string]bool, len(in))
	out := make([]string, 0, len(in))
	for _, v := range in {
		key := strings.ToLower(v)
		if v == "" || seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, v)
	}
	return out
}

func joinAuthors(authors ...*string) string {
	var list []string
	for _, a := range authors {
		if a != nil {
			list = append(list, strings.TrimSpace(*a))
		}
	}
	return strings.Join(dedupe(list), "; ")
}
