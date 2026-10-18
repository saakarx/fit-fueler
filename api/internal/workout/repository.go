package workout

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/saakarx/fit-fueler/api/internal/platform"
)

// Repository reads and writes workouts and their entries. Every query filters
// on NOT is_deleted, since nothing is ever hard-deleted.
type Repository struct{ db platform.DBTX }

// NewRepository binds a repository to a pool or transaction.
func NewRepository(db platform.DBTX) *Repository { return &Repository{db: db} }

// WithTx returns a repository bound to the given transaction.
func (r *Repository) WithTx(tx pgx.Tx) *Repository { return &Repository{db: tx} }

const workoutColumns = `id, local_date, name, notes, started_at`

var entryColumns = entryCols("")

func entryCols(prefix string) string {
	cols := []string{
		"id", "workout_id", "exercise_id", "exercise_name", "position", "sets", "reps",
		"weight_kg", "duration_min", "duration_estimated", "distance_m",
		"calories_burned", "calories_estimated", "created_at",
	}
	for i := range cols {
		cols[i] = prefix + cols[i]
	}
	return strings.Join(cols, ", ")
}

func entryTargets(e *Entry) []any {
	return []any{
		&e.ID, &e.WorkoutID, &e.ExerciseID, &e.ExerciseName, &e.Position, &e.Sets, &e.Reps,
		&e.WeightKG, &e.DurationMin, &e.DurationEstimated, &e.DistanceM,
		&e.CaloriesBurned, &e.CaloriesEstimated, &e.CreatedAt,
	}
}

func scanWorkout(row pgx.Row) (*Workout, error) {
	var w Workout
	if err := row.Scan(&w.ID, &w.LocalDate, &w.Name, &w.Notes, &w.StartedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkoutNotFound
		}
		return nil, err
	}
	return &w, nil
}

// GetWorkout returns one of the user's active workouts.
func (r *Repository) GetWorkout(ctx context.Context, userID, id uuid.UUID) (*Workout, error) {
	return scanWorkout(r.db.QueryRow(ctx,
		`SELECT `+workoutColumns+` FROM workouts WHERE id = $1 AND user_id = $2 AND NOT is_deleted`,
		id, userID,
	))
}

// LatestWorkoutForDate returns the user's most recently started workout on a
// local date, or ErrWorkoutNotFound.
func (r *Repository) LatestWorkoutForDate(ctx context.Context, userID uuid.UUID, date time.Time) (*Workout, error) {
	return scanWorkout(r.db.QueryRow(ctx,
		`SELECT `+workoutColumns+` FROM workouts
		 WHERE user_id = $1 AND local_date = $2 AND NOT is_deleted
		 ORDER BY started_at DESC
		 LIMIT 1`,
		userID, date,
	))
}

// InsertWorkout creates a workout session.
func (r *Repository) InsertWorkout(ctx context.Context, userID uuid.UUID, w *Workout) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO workouts (id, user_id, local_date, started_at) VALUES ($1, $2, $3, $4)`,
		w.ID, userID, w.LocalDate, w.StartedAt,
	)
	return err
}

// ListWorkouts returns the user's workouts between two local dates (inclusive), newest first.
func (r *Repository) ListWorkouts(ctx context.Context, userID uuid.UUID, from, to time.Time, limit int) ([]Workout, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+workoutColumns+` FROM workouts
		 WHERE user_id = $1 AND NOT is_deleted AND local_date BETWEEN $2 AND $3
		 ORDER BY local_date DESC, started_at DESC
		 LIMIT $4`,
		userID, from, to, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Workout, 0)
	for rows.Next() {
		var w Workout
		if err := rows.Scan(&w.ID, &w.LocalDate, &w.Name, &w.Notes, &w.StartedAt); err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, rows.Err()
}

// UpdateWorkout changes the name and/or notes. A flag selects whether a field
// is written; a written nil value clears it.
func (r *Repository) UpdateWorkout(ctx context.Context, userID, id uuid.UUID, setName bool, name *string, setNotes bool, notes *string) (*Workout, error) {
	return scanWorkout(r.db.QueryRow(ctx,
		`UPDATE workouts SET
		   name  = CASE WHEN $3::boolean THEN $4::text ELSE name END,
		   notes = CASE WHEN $5::boolean THEN $6::text ELSE notes END
		 WHERE id = $1 AND user_id = $2 AND NOT is_deleted
		 RETURNING `+workoutColumns,
		id, userID, setName, name, setNotes, notes,
	))
}

// SoftDeleteWorkout marks a workout and all of its entries as deleted.
func (r *Repository) SoftDeleteWorkout(ctx context.Context, userID, id uuid.UUID) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE workouts SET is_deleted = true, deleted_at = now()
		 WHERE id = $1 AND user_id = $2 AND NOT is_deleted`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrWorkoutNotFound
	}
	_, err = r.db.Exec(ctx,
		`UPDATE workout_entries SET is_deleted = true, deleted_at = now()
		 WHERE workout_id = $1 AND NOT is_deleted`,
		id,
	)
	return err
}

// NextPosition returns the position for a new entry at the end of a workout.
func (r *Repository) NextPosition(ctx context.Context, workoutID uuid.UUID) (int, error) {
	var next int
	err := r.db.QueryRow(ctx,
		`SELECT COALESCE(MAX(position), -1) + 1 FROM workout_entries WHERE workout_id = $1`,
		workoutID,
	).Scan(&next)
	return next, err
}

// InsertEntry stores an entry and fills in CreatedAt. requestID is the client's
// idempotency key, if any.
func (r *Repository) InsertEntry(ctx context.Context, userID uuid.UUID, e *Entry, requestID *uuid.UUID) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO workout_entries
		   (id, workout_id, user_id, exercise_id, exercise_name, position, sets, reps, weight_kg,
		    duration_min, duration_estimated, distance_m, calories_burned, calories_estimated, client_request_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		 RETURNING created_at`,
		e.ID, e.WorkoutID, userID, e.ExerciseID, e.ExerciseName, e.Position, e.Sets, e.Reps, e.WeightKG,
		e.DurationMin, e.DurationEstimated, e.DistanceM, e.CaloriesBurned, e.CaloriesEstimated, requestID,
	).Scan(&e.CreatedAt)
}

// GetEntryByRequestID finds the entry created with an idempotency key. It also
// reports whether that entry has been deleted. It returns ErrEntryNotFound if
// the key was never used.
func (r *Repository) GetEntryByRequestID(ctx context.Context, userID, key uuid.UUID) (*Entry, bool, error) {
	var (
		e       Entry
		deleted bool
	)
	targets := append(entryTargets(&e), &deleted)
	err := r.db.QueryRow(ctx,
		`SELECT `+entryColumns+`, is_deleted FROM workout_entries
		 WHERE user_id = $1 AND client_request_id = $2`,
		userID, key,
	).Scan(targets...)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, false, ErrEntryNotFound
	}
	if err != nil {
		return nil, false, err
	}
	return &e, deleted, nil
}

// GetEntryForUpdate loads one of the user's active entries together with its
// exercise's MET value, and locks the entry until the transaction ends.
func (r *Repository) GetEntryForUpdate(ctx context.Context, userID, id uuid.UUID) (*Entry, float64, error) {
	var (
		e   Entry
		met float64
	)
	targets := append(entryTargets(&e), &met)
	err := r.db.QueryRow(ctx,
		`SELECT `+entryCols("e.")+`, x.met_value
		 FROM workout_entries e
		 JOIN exercises x ON x.id = e.exercise_id
		 WHERE e.id = $1 AND e.user_id = $2 AND NOT e.is_deleted
		 FOR UPDATE OF e`,
		id, userID,
	).Scan(targets...)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, 0, ErrEntryNotFound
	}
	if err != nil {
		return nil, 0, err
	}
	return &e, met, nil
}

// UpdateEntry writes the editable fields of an entry.
func (r *Repository) UpdateEntry(ctx context.Context, e *Entry) error {
	_, err := r.db.Exec(ctx,
		`UPDATE workout_entries SET
		   sets = $2, reps = $3, weight_kg = $4,
		   duration_min = $5, duration_estimated = $6,
		   distance_m = $7, calories_burned = $8, calories_estimated = $9
		 WHERE id = $1`,
		e.ID, e.Sets, e.Reps, e.WeightKG, e.DurationMin, e.DurationEstimated,
		e.DistanceM, e.CaloriesBurned, e.CaloriesEstimated,
	)
	return err
}

// SoftDeleteEntry marks one of the user's entries as deleted and returns the
// workout it belonged to.
func (r *Repository) SoftDeleteEntry(ctx context.Context, userID, id uuid.UUID) (uuid.UUID, error) {
	var workoutID uuid.UUID
	err := r.db.QueryRow(ctx,
		`UPDATE workout_entries SET is_deleted = true, deleted_at = now()
		 WHERE id = $1 AND user_id = $2 AND NOT is_deleted
		 RETURNING workout_id`,
		id, userID,
	).Scan(&workoutID)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, ErrEntryNotFound
	}
	return workoutID, err
}

// CountActiveEntries returns how many entries of a workout are not deleted.
func (r *Repository) CountActiveEntries(ctx context.Context, workoutID uuid.UUID) (int, error) {
	var n int64
	err := r.db.QueryRow(ctx,
		`SELECT count(*) FROM workout_entries WHERE workout_id = $1 AND NOT is_deleted`,
		workoutID,
	).Scan(&n)
	return int(n), err
}

// ListEntriesForWorkout returns a workout's active entries in order.
func (r *Repository) ListEntriesForWorkout(ctx context.Context, workoutID uuid.UUID) ([]Entry, error) {
	return r.queryEntries(ctx,
		`SELECT `+entryColumns+` FROM workout_entries
		 WHERE workout_id = $1 AND NOT is_deleted
		 ORDER BY position, created_at`,
		workoutID,
	)
}

// ListEntriesInRange returns the active entries of the user's active workouts
// between two local dates, grouped by workout and in order.
func (r *Repository) ListEntriesInRange(ctx context.Context, userID uuid.UUID, from, to time.Time) ([]Entry, error) {
	return r.queryEntries(ctx,
		`SELECT `+entryCols("e.")+`
		 FROM workout_entries e
		 JOIN workouts w ON w.id = e.workout_id
		 WHERE w.user_id = $1 AND NOT w.is_deleted AND NOT e.is_deleted
		   AND w.local_date BETWEEN $2 AND $3
		 ORDER BY e.workout_id, e.position, e.created_at`,
		userID, from, to,
	)
}

func (r *Repository) queryEntries(ctx context.Context, query string, args ...any) ([]Entry, error) {
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Entry, 0)
	for rows.Next() {
		var e Entry
		if err := rows.Scan(entryTargets(&e)...); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

// CurrentWeightKG returns the user's latest weight, or nil if they have none.
func (r *Repository) CurrentWeightKG(ctx context.Context, userID uuid.UUID) (*float64, error) {
	var w *float64
	err := r.db.QueryRow(ctx,
		`SELECT weight_kg FROM weight_entries
		 WHERE user_id = $1 AND NOT is_deleted
		 ORDER BY local_date DESC, logged_at DESC
		 LIMIT 1`,
		userID,
	).Scan(&w)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return w, err
}
