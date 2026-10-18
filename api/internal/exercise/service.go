package exercise

import (
	"context"
	"regexp"
	"strings"

	"github.com/google/uuid"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
	"github.com/saakarx/fit-fueler/api/internal/platform"
)

const (
	wgerURL         = "https://wger.de"
	defaultLanguage = "en"
)

var languagePattern = regexp.MustCompile(`^[a-z]{2,3}(-[a-z0-9]{2,8})*$`)

// Service implements the exercise use cases.
type Service struct{ repo *Repository }

// NewService creates the service.
func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// Search returns one page of exercises matching the filters.
func (s *Service) Search(ctx context.Context, userID uuid.UUID, p SearchParams) (*SearchResponse, error) {
	p.UserID = userID

	rows, err := s.repo.Search(ctx, p)
	if err != nil {
		return nil, err
	}
	hasMore := len(rows) > p.Limit
	if hasMore {
		rows = rows[:p.Limit]
	}

	items := make([]ExerciseResponse, 0, len(rows))
	for i := range rows {
		items = append(items, toResponse(&rows[i]))
	}
	return &SearchResponse{Items: items, Limit: p.Limit, Offset: p.Offset, HasMore: hasMore}, nil
}

// Get returns one exercise the user can see.
func (s *Service) Get(ctx context.Context, userID, id uuid.UUID) (*ExerciseResponse, error) {
	e, err := s.repo.Get(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	resp := toResponse(e)
	return &resp, nil
}

// Categories lists categories with counts.
func (s *Service) Categories(ctx context.Context, userID uuid.UUID) (*CategoriesResponse, error) {
	cats, err := s.repo.Categories(ctx, userID)
	if err != nil {
		return nil, err
	}
	items := make([]CategoryResponse, 0, len(cats))
	for _, c := range cats {
		items = append(items, CategoryResponse{Name: c.Name, Count: c.Count})
	}
	return &CategoriesResponse{Items: items}, nil
}

// Create adds a custom exercise for the user.
func (s *Service) Create(ctx context.Context, userID uuid.UUID, req *CreateExerciseRequest) (*ExerciseResponse, error) {
	name := strings.TrimSpace(req.Name)
	if len(name) < 2 {
		return nil, httpx.ErrValidation.WithDetails([]httpx.FieldError{{Field: "name", Rule: "min"}})
	}

	lang, err := normalizeLanguage(req.Language)
	if err != nil {
		return nil, err
	}

	met := EstimateMET(req.Category, name)
	if req.MetValue != nil {
		met = *req.MetValue
	}

	e, err := s.repo.InsertCustom(ctx, userID, &Exercise{
		Name:      name,
		Language:  lang,
		Category:  req.Category,
		Muscles:   normalizeList(req.Muscles),
		Equipment: normalizeList(req.Equipment),
		MetValue:  met,
	})
	if platform.IsUniqueViolation(err, "exercises_custom_name_uidx") {
		return nil, ErrExists
	}
	if err != nil {
		return nil, err
	}
	resp := toResponse(e)
	return &resp, nil
}

// Update changes the user's own custom exercise. Catalog exercises are read-only.
// Changing the category does not re-estimate the MET value; send met_value to change it.
func (s *Service) Update(ctx context.Context, userID, id uuid.UUID, req *UpdateExerciseRequest) (*ExerciseResponse, error) {
	existing, err := s.repo.Get(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	if !existing.IsCustom() {
		return nil, ErrReadOnly
	}

	upd := CustomUpdate{Category: req.Category, MetValue: req.MetValue}
	if req.Language != nil {
		lang, err := normalizeLanguage(req.Language)
		if err != nil {
			return nil, err
		}
		upd.Language = &lang
	}
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if len(name) < 2 {
			return nil, httpx.ErrValidation.WithDetails([]httpx.FieldError{{Field: "name", Rule: "min"}})
		}
		upd.Name = &name
	}
	if req.Muscles != nil {
		upd.Muscles = nonNil(normalizeList(*req.Muscles))
	}
	if req.Equipment != nil {
		upd.Equipment = nonNil(normalizeList(*req.Equipment))
	}

	e, err := s.repo.UpdateCustom(ctx, userID, id, upd)
	if platform.IsUniqueViolation(err, "exercises_custom_name_uidx") {
		return nil, ErrExists
	}
	if err != nil {
		return nil, err
	}
	resp := toResponse(e)
	return &resp, nil
}

// Delete soft-deletes the user's own custom exercise. Past workout entries keep
// their own copy of the exercise name, so history is unaffected.
func (s *Service) Delete(ctx context.Context, userID, id uuid.UUID) error {
	existing, err := s.repo.Get(ctx, userID, id)
	if err != nil {
		return err
	}
	if !existing.IsCustom() {
		return ErrReadOnly
	}
	return s.repo.SoftDeleteCustom(ctx, userID, id)
}

func toResponse(e *Exercise) ExerciseResponse {
	resp := ExerciseResponse{
		ID:        e.ID.String(),
		Name:      e.Name,
		Language:  e.Language,
		Category:  e.Category,
		Muscles:   nonNil(e.Muscles),
		Equipment: nonNil(e.Equipment),
		MetValue:  e.MetValue,
		ImageURL:  e.ImageURL,
		IsCustom:  e.IsCustom(),
	}
	if e.Source == SourceWger {
		a := &Attribution{Source: SourceWger, URL: wgerURL}
		if e.LicenseName != nil {
			a.License = *e.LicenseName
		}
		if e.LicenseAuthor != nil {
			a.Author = *e.LicenseAuthor
		}
		resp.Attribution = a
	}
	return resp
}

// normalizeLanguage lowercases and validates a language code, defaulting to "en".
func normalizeLanguage(in *string) (string, error) {
	if in == nil {
		return defaultLanguage, nil
	}
	lang := strings.ToLower(strings.TrimSpace(*in))
	if !languagePattern.MatchString(lang) {
		return "", httpx.ErrValidation.WithDetails([]httpx.FieldError{{Field: "language", Rule: "language_code"}})
	}
	return lang, nil
}

// normalizeList trims entries, drops empty ones and removes case-insensitive duplicates.
func normalizeList(in []string) []string {
	seen := make(map[string]bool, len(in))
	out := make([]string, 0, len(in))
	for _, v := range in {
		v = strings.TrimSpace(v)
		key := strings.ToLower(v)
		if v == "" || seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, v)
	}
	return out
}

func nonNil(in []string) []string {
	if in == nil {
		return []string{}
	}
	return in
}
