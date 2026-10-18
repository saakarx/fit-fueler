package workout

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/saakarx/fit-fueler/api/internal/exercise"
	"github.com/saakarx/fit-fueler/api/internal/platform"
)

const (
	maxWorkoutRows      = 200
	maxWorkoutRangeDays = 366
)

// Service implements the workout use cases.
type Service struct {
	pool      *pgxpool.Pool
	repo      *Repository
	exercises *exercise.Repository
	now       func() time.Time
}

// NewService creates the service.
func NewService(pool *pgxpool.Pool, repo *Repository, exercises *exercise.Repository) *Service {
	return &Service{pool: pool, repo: repo, exercises: exercises, now: time.Now}
}

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

// CreateEntry logs an exercise. The boolean reports whether a new entry was
// created; it is false when an Idempotency-Key replay returned the existing one.
func (s *Service) CreateEntry(ctx context.Context, userID uuid.UUID, req *CreateEntryRequest, key *uuid.UUID) (*EntryResponse, bool, error) {
	// Two requests with the same key can race on the unique index. The loser
	// retries once and then finds the winner's entry.
	for attempt := 0; ; attempt++ {
		resp, created, err := s.createEntry(ctx, userID, req, key)
		if err != nil && attempt == 0 && key != nil && platform.IsUniqueViolation(err, "workout_entries_request_uidx") {
			continue
		}
		return resp, created, err
	}
}

func (s *Service) createEntry(ctx context.Context, userID uuid.UUID, req *CreateEntryRequest, key *uuid.UUID) (*EntryResponse, bool, error) {
	var (
		resp    *EntryResponse
		created bool
	)

	err := platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		// Locking the profile row serializes this user's writes, so two
		// simultaneous first entries of a day cannot create two workouts.
		tz, err := platform.GetTimezone(ctx, tx, userID, true)
		if err != nil {
			return mapProfileErr(err)
		}

		if key != nil {
			existing, deleted, err := repo.GetEntryByRequestID(ctx, userID, *key)
			switch {
			case err == nil:
				if deleted {
					return ErrIdempotencyConflict
				}
				resp = entryResponse(existing)
				return nil
			case !errors.Is(err, ErrEntryNotFound):
				return err
			}
		}

		exerciseID, err := uuid.Parse(req.ExerciseID)
		if err != nil {
			return exercise.ErrNotFound
		}
		ex, err := s.exercises.WithTx(tx).Get(ctx, userID, exerciseID)
		if err != nil {
			return err
		}

		now := s.now()
		workout, err := s.resolveWorkout(ctx, repo, userID, req, tz, now)
		if err != nil {
			return err
		}
		position, err := repo.NextPosition(ctx, workout.ID)
		if err != nil {
			return err
		}

		entry := &Entry{
			ID:           platform.NewID(),
			WorkoutID:    workout.ID,
			ExerciseID:   ex.ID,
			ExerciseName: ex.Name,
			Position:     position,
			Sets:         req.Sets,
			Reps:         req.Reps,
			WeightKG:     req.WeightKG,
			DistanceM:    req.DistanceM,
		}

		if req.DurationMin != nil {
			entry.DurationMin = req.DurationMin
		} else {
			d := EstimateDurationMin(req.Sets)
			entry.DurationMin, entry.DurationEstimated = &d, true
		}

		if req.CaloriesBurned != nil {
			entry.CaloriesBurned = req.CaloriesBurned
		} else {
			weight, err := s.bodyWeight(ctx, repo, userID)
			if err != nil {
				return err
			}
			c := EstimateCalories(ex.MetValue, weight, *entry.DurationMin)
			entry.CaloriesBurned, entry.CaloriesEstimated = &c, true
		}

		if err := repo.InsertEntry(ctx, userID, entry, key); err != nil {
			return err
		}
		resp, created = entryResponse(entry), true
		return nil
	})
	if err != nil {
		return nil, false, err
	}
	return resp, created, nil
}

// resolveWorkout finds the workout an entry belongs to, creating the day's
// workout when there is none.
func (s *Service) resolveWorkout(ctx context.Context, repo *Repository, userID uuid.UUID, req *CreateEntryRequest, tz string, now time.Time) (*Workout, error) {
	if req.WorkoutID != nil {
		id, err := uuid.Parse(*req.WorkoutID)
		if err != nil {
			return nil, ErrWorkoutNotFound
		}
		return repo.GetWorkout(ctx, userID, id)
	}

	today := platform.LocalToday(now, tz)
	date := today
	if req.LocalDate != nil {
		d, err := platform.ParseDate(*req.LocalDate)
		if err != nil || !platform.PlausibleDate(d, today) {
			return nil, ErrInvalidDate
		}
		date = d
	}

	w, err := repo.LatestWorkoutForDate(ctx, userID, date)
	if err == nil {
		return w, nil
	}
	if !errors.Is(err, ErrWorkoutNotFound) {
		return nil, err
	}

	w = &Workout{ID: platform.NewID(), LocalDate: date, StartedAt: now.UTC()}
	if err := repo.InsertWorkout(ctx, userID, w); err != nil {
		return nil, err
	}
	return w, nil
}

// UpdateEntry edits an entry and keeps estimated values consistent.
func (s *Service) UpdateEntry(ctx context.Context, userID, id uuid.UUID, req *UpdateEntryRequest) (*EntryResponse, error) {
	var out *EntryResponse

	err := platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		e, met, err := repo.GetEntryForUpdate(ctx, userID, id)
		if err != nil {
			return err
		}

		setsChanged := req.Sets != nil && *req.Sets != e.Sets
		if req.Sets != nil {
			e.Sets = *req.Sets
		}
		if req.Reps != nil {
			e.Reps = *req.Reps
		}
		if req.WeightKG != nil {
			e.WeightKG = req.WeightKG
		}
		if req.DistanceM != nil {
			e.DistanceM = req.DistanceM
		}

		durationChanged := false
		switch {
		case req.DurationMin != nil:
			e.DurationMin, e.DurationEstimated = req.DurationMin, false
			durationChanged = true
		case setsChanged && e.DurationEstimated:
			d := EstimateDurationMin(e.Sets)
			e.DurationMin = &d
			durationChanged = true
		}

		switch {
		case req.CaloriesBurned != nil:
			e.CaloriesBurned, e.CaloriesEstimated = req.CaloriesBurned, false
		case durationChanged && e.CaloriesEstimated && e.DurationMin != nil:
			weight, err := s.bodyWeight(ctx, repo, userID)
			if err != nil {
				return err
			}
			c := EstimateCalories(met, weight, *e.DurationMin)
			e.CaloriesBurned = &c
		}

		if err := repo.UpdateEntry(ctx, e); err != nil {
			return err
		}
		out = entryResponse(e)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

// DeleteEntry soft-deletes an entry. A workout left with no entries is
// soft-deleted too, so empty sessions never pile up.
func (s *Service) DeleteEntry(ctx context.Context, userID, id uuid.UUID) error {
	return platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		repo := s.repo.WithTx(tx)

		workoutID, err := repo.SoftDeleteEntry(ctx, userID, id)
		if err != nil {
			return err
		}
		remaining, err := repo.CountActiveEntries(ctx, workoutID)
		if err != nil {
			return err
		}
		if remaining == 0 {
			return repo.SoftDeleteWorkout(ctx, userID, workoutID)
		}
		return nil
	})
}

// bodyWeight returns the weight used for calorie estimates: the user's latest
// weight entry, or a default when there is none.
func (s *Service) bodyWeight(ctx context.Context, repo *Repository, userID uuid.UUID) (float64, error) {
	w, err := repo.CurrentWeightKG(ctx, userID)
	if err != nil {
		return 0, err
	}
	if w == nil {
		return defaultWeightKG, nil
	}
	return *w, nil
}

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------

// GetWorkout returns one workout with its entries.
func (s *Service) GetWorkout(ctx context.Context, userID, id uuid.UUID) (*WorkoutResponse, error) {
	w, err := s.repo.GetWorkout(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	entries, err := s.repo.ListEntriesForWorkout(ctx, w.ID)
	if err != nil {
		return nil, err
	}
	return workoutResponse(w, entries), nil
}

// ListWorkouts returns workouts between two local dates (YYYY-MM-DD), newest
// first. Both default to today in the user's timezone.
func (s *Service) ListWorkouts(ctx context.Context, userID uuid.UUID, fromStr, toStr string) (*WorkoutListResponse, error) {
	tz, err := platform.GetTimezone(ctx, s.pool, userID, false)
	if err != nil {
		return nil, mapProfileErr(err)
	}
	today := platform.LocalToday(s.now(), tz)

	to := today
	if toStr != "" {
		if to, err = platform.ParseDate(toStr); err != nil {
			return nil, ErrInvalidDate
		}
	}
	from := to
	if fromStr != "" {
		if from, err = platform.ParseDate(fromStr); err != nil {
			return nil, ErrInvalidDate
		}
	}
	if from.After(to) || to.Sub(from) > (maxWorkoutRangeDays-1)*24*time.Hour {
		return nil, ErrInvalidDate
	}

	workouts, err := s.repo.ListWorkouts(ctx, userID, from, to, maxWorkoutRows)
	if err != nil {
		return nil, err
	}
	entries, err := s.repo.ListEntriesInRange(ctx, userID, from, to)
	if err != nil {
		return nil, err
	}

	byWorkout := make(map[uuid.UUID][]Entry, len(workouts))
	for _, e := range entries {
		byWorkout[e.WorkoutID] = append(byWorkout[e.WorkoutID], e)
	}

	items := make([]WorkoutResponse, 0, len(workouts))
	for i := range workouts {
		items = append(items, *workoutResponse(&workouts[i], byWorkout[workouts[i].ID]))
	}
	return &WorkoutListResponse{Items: items}, nil
}

// UpdateWorkout changes a workout's name and notes.
func (s *Service) UpdateWorkout(ctx context.Context, userID, id uuid.UUID, req *UpdateWorkoutRequest) (*WorkoutResponse, error) {
	w, err := s.repo.UpdateWorkout(ctx, userID, id,
		req.Name != nil, blankToNil(req.Name),
		req.Notes != nil, blankToNil(req.Notes))
	if err != nil {
		return nil, err
	}
	entries, err := s.repo.ListEntriesForWorkout(ctx, w.ID)
	if err != nil {
		return nil, err
	}
	return workoutResponse(w, entries), nil
}

// DeleteWorkout soft-deletes a workout and all of its entries.
func (s *Service) DeleteWorkout(ctx context.Context, userID, id uuid.UUID) error {
	return platform.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.repo.WithTx(tx).SoftDeleteWorkout(ctx, userID, id)
	})
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

func mapProfileErr(err error) error {
	if errors.Is(err, platform.ErrNoProfile) {
		return ErrAccountGone
	}
	return err
}

func blankToNil(s *string) *string {
	if s == nil {
		return nil
	}
	v := strings.TrimSpace(*s)
	if v == "" {
		return nil
	}
	return &v
}

func entryResponse(e *Entry) *EntryResponse {
	return &EntryResponse{
		ID:                e.ID.String(),
		WorkoutID:         e.WorkoutID.String(),
		ExerciseID:        e.ExerciseID.String(),
		ExerciseName:      e.ExerciseName,
		Position:          e.Position,
		Sets:              e.Sets,
		Reps:              e.Reps,
		WeightKG:          e.WeightKG,
		DurationMin:       e.DurationMin,
		DurationEstimated: e.DurationEstimated,
		DistanceM:         e.DistanceM,
		CaloriesBurned:    e.CaloriesBurned,
		CaloriesEstimated: e.CaloriesEstimated,
		CreatedAt:         e.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func workoutResponse(w *Workout, entries []Entry) *WorkoutResponse {
	items := make([]EntryResponse, 0, len(entries))
	for i := range entries {
		items = append(items, *entryResponse(&entries[i]))
	}
	t := computeTotals(entries)
	return &WorkoutResponse{
		ID:        w.ID.String(),
		LocalDate: platform.FormatDate(w.LocalDate),
		Name:      w.Name,
		Notes:     w.Notes,
		StartedAt: w.StartedAt.UTC().Format(time.RFC3339),
		Entries:   items,
		Totals: TotalsResponse{
			Entries:        t.Entries,
			Sets:           t.Sets,
			DurationMin:    t.DurationMin,
			CaloriesBurned: t.CaloriesBurned,
			VolumeKG:       t.VolumeKG,
		},
	}
}
