package profile

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/saakarx/fit-fueler/api/internal/platform"
)

// profileUpdate is a validated partial update. A nil field means "leave as is".
type profileUpdate struct {
	name          *string
	sex           *string
	birthDate     *time.Time
	heightCM      *float64
	activityLevel *string
	timezone      *string
	units         []byte // JSON, nil means unchanged
	notifications *bool
	weightKG      *float64 // recorded as a new weight entry, not stored on the profile
}

// Repository reads and writes profile, goal and weight rows.
type Repository struct{ db platform.DBTX }

// NewRepository binds a repository to a pool or transaction.
func NewRepository(db platform.DBTX) *Repository { return &Repository{db: db} }

// WithTx returns a repository bound to the given transaction.
func (r *Repository) WithTx(tx pgx.Tx) *Repository { return &Repository{db: tx} }

const profileSelect = `
SELECT u.display_name, p.sex, p.birth_date, p.height_cm, p.activity_level, p.timezone,
       p.units, p.notifications_enabled,
       (SELECT w.weight_kg FROM weight_entries w
         WHERE w.user_id = p.user_id AND NOT w.is_deleted
         ORDER BY w.local_date DESC, w.logged_at DESC
         LIMIT 1)
FROM profiles p
JOIN users u ON u.id = p.user_id
WHERE p.user_id = $1 AND NOT u.is_deleted`

// GetProfile loads the profile with the user's name and latest weight. With
// lock set, the profile row is locked until the transaction ends, so
// concurrent updates for one user are applied one after the other.
func (r *Repository) GetProfile(ctx context.Context, userID uuid.UUID, lock bool) (*Profile, error) {
	query := profileSelect
	if lock {
		query += " FOR UPDATE OF p"
	}

	var (
		p        Profile
		rawUnits []byte
	)
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.DisplayName, &p.Sex, &p.BirthDate, &p.HeightCM, &p.ActivityLevel, &p.Timezone,
		&rawUnits, &p.NotificationsEnabled, &p.WeightKG,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrAccountGone
	}
	if err != nil {
		return nil, err
	}

	if len(rawUnits) > 0 {
		_ = json.Unmarshal(rawUnits, &p.Units) // an unreadable value falls back to defaults below
	}
	p.Units = p.Units.withDefaults()
	return &p, nil
}

// UpdateProfile applies the non-nil fields of u to the profile row.
func (r *Repository) UpdateProfile(ctx context.Context, userID uuid.UUID, u *profileUpdate) error {
	_, err := r.db.Exec(ctx,
		`UPDATE profiles SET
		   sex                   = COALESCE($2, sex),
		   birth_date            = COALESCE($3, birth_date),
		   height_cm             = COALESCE($4, height_cm),
		   activity_level        = COALESCE($5, activity_level),
		   timezone              = COALESCE($6, timezone),
		   units                 = COALESCE($7::jsonb, units),
		   notifications_enabled = COALESCE($8, notifications_enabled)
		 WHERE user_id = $1`,
		userID, u.sex, u.birthDate, u.heightCM, u.activityLevel, u.timezone, u.units, u.notifications,
	)
	return err
}

// UpdateDisplayName changes the user's display name.
func (r *Repository) UpdateDisplayName(ctx context.Context, userID uuid.UUID, name string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE users SET display_name = $2 WHERE id = $1 AND NOT is_deleted`,
		userID, name,
	)
	return err
}

// GetEffectiveGoals returns the goals that apply on the given date: the latest
// version whose effective_from is on or before it. It returns ErrGoalsNotSet if none.
func (r *Repository) GetEffectiveGoals(ctx context.Context, userID uuid.UUID, date time.Time) (*Goals, error) {
	var g Goals
	err := r.db.QueryRow(ctx,
		`SELECT calories_kcal, protein_g, carbs_g, fat_g, water_ml, workouts_per_week, source, effective_from
		 FROM goals
		 WHERE user_id = $1 AND effective_from <= $2
		 ORDER BY effective_from DESC
		 LIMIT 1`,
		userID, date,
	).Scan(&g.CaloriesKcal, &g.ProteinG, &g.CarbsG, &g.FatG, &g.WaterML, &g.WorkoutsPerWeek, &g.Source, &g.EffectiveFrom)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrGoalsNotSet
	}
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// UpsertGoals writes the goal set that takes effect on effectiveFrom. If a row
// for that day already exists, it is replaced only when it is a suggested one,
// when the new goals come from the user, or when force is set. This keeps an
// automatic recalculation from overwriting goals the user chose today.
func (r *Repository) UpsertGoals(ctx context.Context, userID uuid.UUID, g GoalValues, source string, effectiveFrom time.Time, force bool) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO goals
		   (id, user_id, calories_kcal, protein_g, carbs_g, fat_g, water_ml, workouts_per_week, source, effective_from)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 ON CONFLICT (user_id, effective_from) DO UPDATE SET
		   calories_kcal     = EXCLUDED.calories_kcal,
		   protein_g         = EXCLUDED.protein_g,
		   carbs_g           = EXCLUDED.carbs_g,
		   fat_g             = EXCLUDED.fat_g,
		   water_ml          = EXCLUDED.water_ml,
		   workouts_per_week = EXCLUDED.workouts_per_week,
		   source            = EXCLUDED.source
		 WHERE $11::boolean OR goals.source = 'suggested' OR EXCLUDED.source = 'user'`,
		platform.NewID(), userID, g.CaloriesKcal, g.ProteinG, g.CarbsG, g.FatG, g.WaterML, g.WorkoutsPerWeek,
		source, effectiveFrom, force,
	)
	return err
}

// InsertWeight stores a weight entry.
func (r *Repository) InsertWeight(ctx context.Context, userID uuid.UUID, w *WeightEntry) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO weight_entries (id, user_id, weight_kg, logged_at, local_date)
		 VALUES ($1, $2, $3, $4, $5)`,
		w.ID, userID, w.WeightKG, w.LoggedAt, w.LocalDate,
	)
	return err
}

// ListWeight returns the user's weight entries between two local dates
// (inclusive), newest first.
func (r *Repository) ListWeight(ctx context.Context, userID uuid.UUID, from, to time.Time, limit int) ([]WeightEntry, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, weight_kg, logged_at, local_date
		 FROM weight_entries
		 WHERE user_id = $1 AND NOT is_deleted AND local_date BETWEEN $2 AND $3
		 ORDER BY local_date DESC, logged_at DESC
		 LIMIT $4`,
		userID, from, to, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	entries := make([]WeightEntry, 0)
	for rows.Next() {
		var w WeightEntry
		if err := rows.Scan(&w.ID, &w.WeightKG, &w.LoggedAt, &w.LocalDate); err != nil {
			return nil, err
		}
		entries = append(entries, w)
	}
	return entries, rows.Err()
}

// SoftDeleteWeight marks an entry as deleted. It returns ErrWeightNotFound if
// the entry does not exist, belongs to someone else, or is already deleted.
func (r *Repository) SoftDeleteWeight(ctx context.Context, userID, id uuid.UUID) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE weight_entries
		 SET is_deleted = true, deleted_at = now()
		 WHERE id = $1 AND user_id = $2 AND NOT is_deleted`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrWeightNotFound
	}
	return nil
}
