package profile

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
	"github.com/saakarx/fit-fueler/api/internal/platform"
)

const (
	defaultWeightWindowDays = 90
	maxWeightWindowDays     = 731
	maxWeightRows           = 500
)

// earliestDate is the oldest local date accepted for backdated entries.
var earliestDate = time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)

// Service implements the profile, goals and weight use cases.
type Service struct {
	pool *pgxpool.Pool
	repo *Repository
	now  func() time.Time
}

// NewService creates the service.
func NewService(pool *pgxpool.Pool, repo *Repository) *Service {
	return &Service{pool: pool, repo: repo, now: time.Now}
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

// GetProfile returns the user's profile.
func (s *Service) GetProfile(ctx context.Context, userID uuid.UUID) (*ProfileResponse, error) {
	p, err := s.repo.GetProfile(ctx, userID, false)
	if err != nil {
		return nil, err
	}
	return s.view(p), nil
}

// UpdateProfile applies a partial update. If the profile ends up complete and
// the user has no goals of their own, suggested goals are (re)computed.
func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, req *UpdateProfileRequest) (*ProfileResponse, error) {
	upd, err := s.parseUpdate(req)
	if err != nil {
		return nil, err
	}

	var view *ProfileResponse
	err = platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		// Lock the row (also proves the account still exists).
		if _, err := repo.GetProfile(ctx, userID, true); err != nil {
			return err
		}
		if err := repo.UpdateProfile(ctx, userID, upd); err != nil {
			return err
		}
		if upd.name != nil {
			if err := repo.UpdateDisplayName(ctx, userID, *upd.name); err != nil {
				return err
			}
		}

		if upd.weightKG != nil {
			// Reload so "today" uses the timezone as it is after this update.
			p, err := repo.GetProfile(ctx, userID, false)
			if err != nil {
				return err
			}
			now := s.now()
			err = repo.InsertWeight(ctx, userID, &WeightEntry{
				ID:        platform.NewID(),
				WeightKG:  *upd.weightKG,
				LoggedAt:  now,
				LocalDate: localToday(now, p.Timezone),
			})
			if err != nil {
				return err
			}
		}

		p, err := repo.GetProfile(ctx, userID, false)
		if err != nil {
			return err
		}
		if err := s.refreshSuggestedGoals(ctx, repo, userID, p); err != nil {
			return err
		}
		view = s.view(p)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return view, nil
}

// parseUpdate validates and normalizes the request.
func (s *Service) parseUpdate(req *UpdateProfileRequest) (*profileUpdate, error) {
	upd := &profileUpdate{
		sex:           req.Sex,
		activityLevel: req.ActivityLevel,
		heightCM:      req.HeightCM,
		weightKG:      req.WeightKG,
		notifications: req.NotificationsEnabled,
	}

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return nil, httpx.ErrValidation.WithDetails([]httpx.FieldError{{Field: "name", Rule: "required"}})
		}
		upd.name = &name
	}

	if req.Timezone != nil {
		tz := strings.TrimSpace(*req.Timezone)
		if !validTimezone(tz) {
			return nil, ErrInvalidTimezone
		}
		upd.timezone = &tz
	}

	if req.BirthDate != nil {
		birth, err := parseDate(*req.BirthDate)
		if err != nil {
			return nil, ErrInvalidDate
		}
		today := civilDate(s.now().UTC())
		if birth.After(today) {
			return nil, ErrInvalidBirthDate
		}
		if age := ageOn(birth, today); age < minAge || age > maxAge {
			return nil, ErrInvalidBirthDate
		}
		upd.birthDate = &birth
	}

	if req.Units != nil {
		raw, err := json.Marshal(req.Units)
		if err != nil {
			return nil, httpx.ErrInternal.WithCause(err)
		}
		upd.units = raw
	}
	return upd, nil
}

// view converts a profile to its API representation.
func (s *Service) view(p *Profile) *ProfileResponse {
	resp := &ProfileResponse{
		Name:                 p.DisplayName,
		Sex:                  p.Sex,
		HeightCM:             p.HeightCM,
		WeightKG:             p.WeightKG,
		ActivityLevel:        p.ActivityLevel,
		Timezone:             p.Timezone,
		Units:                p.Units,
		NotificationsEnabled: p.NotificationsEnabled,
		ProfileCompleted:     p.Complete(),
	}
	if p.BirthDate != nil {
		bd := formatDate(*p.BirthDate)
		age := ageOn(*p.BirthDate, localToday(s.now(), p.Timezone))
		resp.BirthDate = &bd
		resp.Age = &age
	}
	return resp
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

// GetGoals returns the goals that apply today.
func (s *Service) GetGoals(ctx context.Context, userID uuid.UUID) (*GoalsResponse, error) {
	p, err := s.repo.GetProfile(ctx, userID, false)
	if err != nil {
		return nil, err
	}
	g, err := s.repo.GetEffectiveGoals(ctx, userID, localToday(s.now(), p.Timezone))
	if err != nil {
		return nil, err
	}
	return goalsResponse(g), nil
}

// SetGoals stores goals chosen by the user. They take effect today, so earlier
// days keep the goals that applied then. Once the user has set goals, profile
// changes no longer overwrite them with suggestions.
func (s *Service) SetGoals(ctx context.Context, userID uuid.UUID, req *SetGoalsRequest) (*GoalsResponse, error) {
	return s.writeGoals(ctx, userID, sourceUser, func(*Profile) (GoalValues, error) {
		return GoalValues{
			CaloriesKcal:    req.CaloriesKcal,
			ProteinG:        req.ProteinG,
			CarbsG:          req.CarbsG,
			FatG:            req.FatG,
			WaterML:         req.WaterML,
			WorkoutsPerWeek: *req.WorkoutsPerWeek,
		}, nil
	})
}

// ResetGoals replaces the current goals with suggestions computed from the profile.
func (s *Service) ResetGoals(ctx context.Context, userID uuid.UUID) (*GoalsResponse, error) {
	return s.writeGoals(ctx, userID, sourceSuggested, func(p *Profile) (GoalValues, error) {
		if !p.Complete() {
			return GoalValues{}, ErrProfileIncomplete
		}
		return s.suggestFor(p), nil
	})
}

func (s *Service) writeGoals(ctx context.Context, userID uuid.UUID, source string, values func(*Profile) (GoalValues, error)) (*GoalsResponse, error) {
	var out *GoalsResponse
	err := platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		p, err := repo.GetProfile(ctx, userID, true)
		if err != nil {
			return err
		}
		gv, err := values(p)
		if err != nil {
			return err
		}

		today := localToday(s.now(), p.Timezone)
		// force: an explicit reset must also replace goals the user set earlier today.
		if err := repo.UpsertGoals(ctx, userID, gv, source, today, true); err != nil {
			return err
		}
		g, err := repo.GetEffectiveGoals(ctx, userID, today)
		if err != nil {
			return err
		}
		out = goalsResponse(g)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

// refreshSuggestedGoals recomputes suggested goals after the profile or weight
// changed, unless the profile is incomplete or the user set their own goals.
func (s *Service) refreshSuggestedGoals(ctx context.Context, repo *Repository, userID uuid.UUID, p *Profile) error {
	if !p.Complete() {
		return nil
	}
	today := localToday(s.now(), p.Timezone)

	latest, err := repo.GetEffectiveGoals(ctx, userID, today)
	switch {
	case err == nil:
		if latest.Source == sourceUser {
			return nil
		}
	case !errors.Is(err, ErrGoalsNotSet):
		return err
	}
	return repo.UpsertGoals(ctx, userID, s.suggestFor(p), sourceSuggested, today, false)
}

func (s *Service) suggestFor(p *Profile) GoalValues {
	level := ""
	if p.ActivityLevel != nil {
		level = *p.ActivityLevel
	}
	return Suggest(SuggestInput{
		Sex:           *p.Sex,
		Age:           ageOn(*p.BirthDate, localToday(s.now(), p.Timezone)),
		HeightCM:      *p.HeightCM,
		WeightKG:      *p.WeightKG,
		ActivityLevel: level,
	})
}

func goalsResponse(g *Goals) *GoalsResponse {
	return &GoalsResponse{
		CaloriesKcal:    g.CaloriesKcal,
		ProteinG:        g.ProteinG,
		CarbsG:          g.CarbsG,
		FatG:            g.FatG,
		WaterML:         g.WaterML,
		WorkoutsPerWeek: g.WorkoutsPerWeek,
		Source:          g.Source,
		EffectiveFrom:   formatDate(g.EffectiveFrom),
	}
}

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

// AddWeight records a weight entry and refreshes suggested goals, since they
// depend on the current weight.
func (s *Service) AddWeight(ctx context.Context, userID uuid.UUID, req *AddWeightRequest) (*WeightEntryResponse, error) {
	var out *WeightEntryResponse
	err := platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		p, err := repo.GetProfile(ctx, userID, true)
		if err != nil {
			return err
		}

		now := s.now()
		loggedAt := now
		if req.LoggedAt != nil {
			t, err := time.Parse(time.RFC3339, *req.LoggedAt)
			if err != nil {
				return ErrInvalidDate
			}
			loggedAt = t
		}

		localDate := civilDate(loggedAt.In(loadLocation(p.Timezone)))
		if req.LocalDate != nil {
			d, err := parseDate(*req.LocalDate)
			if err != nil {
				return ErrInvalidDate
			}
			localDate = d
		}

		// One day of slack covers clients whose timezone is ahead of the stored one.
		today := localToday(now, p.Timezone)
		if localDate.After(today.AddDate(0, 0, 1)) || localDate.Before(earliestDate) {
			return ErrInvalidDate
		}

		entry := &WeightEntry{
			ID:        platform.NewID(),
			WeightKG:  req.WeightKG,
			LoggedAt:  loggedAt.UTC(),
			LocalDate: localDate,
		}
		if err := repo.InsertWeight(ctx, userID, entry); err != nil {
			return err
		}

		p, err = repo.GetProfile(ctx, userID, false)
		if err != nil {
			return err
		}
		if err := s.refreshSuggestedGoals(ctx, repo, userID, p); err != nil {
			return err
		}
		out = weightResponse(entry)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

// ListWeight returns weight entries between two local dates (YYYY-MM-DD).
// Empty values default to the last 90 days ending today.
func (s *Service) ListWeight(ctx context.Context, userID uuid.UUID, fromStr, toStr string) (*WeightListResponse, error) {
	p, err := s.repo.GetProfile(ctx, userID, false)
	if err != nil {
		return nil, err
	}
	today := localToday(s.now(), p.Timezone)

	to := today
	if toStr != "" {
		if to, err = parseDate(toStr); err != nil {
			return nil, ErrInvalidDate
		}
	}
	from := to.AddDate(0, 0, -defaultWeightWindowDays)
	if fromStr != "" {
		if from, err = parseDate(fromStr); err != nil {
			return nil, ErrInvalidDate
		}
	}
	if from.After(to) || to.Sub(from) > maxWeightWindowDays*24*time.Hour {
		return nil, ErrInvalidDate
	}

	entries, err := s.repo.ListWeight(ctx, userID, from, to, maxWeightRows)
	if err != nil {
		return nil, err
	}
	items := make([]WeightEntryResponse, 0, len(entries))
	for i := range entries {
		items = append(items, *weightResponse(&entries[i]))
	}
	return &WeightListResponse{Items: items}, nil
}

// DeleteWeight soft-deletes a weight entry and refreshes suggested goals.
func (s *Service) DeleteWeight(ctx context.Context, userID, id uuid.UUID) error {
	return platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		if _, err := repo.GetProfile(ctx, userID, true); err != nil {
			return err
		}
		if err := repo.SoftDeleteWeight(ctx, userID, id); err != nil {
			return err
		}
		p, err := repo.GetProfile(ctx, userID, false)
		if err != nil {
			return err
		}
		return s.refreshSuggestedGoals(ctx, repo, userID, p)
	})
}

func weightResponse(w *WeightEntry) *WeightEntryResponse {
	return &WeightEntryResponse{
		ID:        w.ID.String(),
		WeightKG:  w.WeightKG,
		LocalDate: formatDate(w.LocalDate),
		LoggedAt:  w.LoggedAt.UTC().Format(time.RFC3339),
	}
}
