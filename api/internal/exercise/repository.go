package exercise

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/saakarx/fit-fueler/api/internal/platform"
)

// Repository reads and writes exercise rows.
type Repository struct{ db platform.DBTX }

// NewRepository binds a repository to a pool or transaction.
func NewRepository(db platform.DBTX) *Repository { return &Repository{db: db} }

// WithTx returns a repository bound to the given transaction.
func (r *Repository) WithTx(tx pgx.Tx) *Repository { return &Repository{db: tx} }

const columns = `id, source, name, category, muscles, equipment, met_value, image_url, license_name, license_author, language`

// visibleTo limits rows to the shared catalog plus the user's own custom exercises.
const visibleTo = `NOT is_deleted AND (created_by_user_id IS NULL OR created_by_user_id = $1)`

func scanTargets(e *Exercise) []any {
	return []any{&e.ID, &e.Source, &e.Name, &e.Category, &e.Muscles, &e.Equipment, &e.MetValue, &e.ImageURL, &e.LicenseName, &e.LicenseAuthor, &e.Language}
}

func scanOne(row pgx.Row) (*Exercise, error) {
	var e Exercise
	if err := row.Scan(scanTargets(&e)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &e, nil
}

// Get returns an exercise the user can see (catalog, or their own custom one).
func (r *Repository) Get(ctx context.Context, userID, id uuid.UUID) (*Exercise, error) {
	return scanOne(r.db.QueryRow(ctx,
		`SELECT `+columns+` FROM exercises WHERE id = $2 AND `+visibleTo,
		userID, id,
	))
}

// Search returns up to Limit+1 exercises (the extra row tells the caller
// whether another page exists). Results are ordered by relevance: exact name,
// then prefix matches, then shorter names, then alphabetically.
func (r *Repository) Search(ctx context.Context, p SearchParams) ([]Exercise, error) {
	args := []any{p.UserID}
	add := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	where := []string{visibleTo}
	order := "name ASC, id ASC"

	if q := strings.TrimSpace(p.Query); q != "" {
		esc := escapeLike(q)
		contains := add("%" + esc + "%")
		prefix := add(esc + "%")
		exact := add(strings.ToLower(q))
		where = append(where, "name ILIKE "+contains)
		order = fmt.Sprintf("(lower(name) = %s) DESC, (name ILIKE %s) DESC, length(name) ASC, name ASC, id ASC", exact, prefix)
	}
	if p.Category != "" {
		where = append(where, "lower(category) = lower("+add(p.Category)+")")
	}
	if p.Muscle != "" {
		where = append(where, "EXISTS (SELECT 1 FROM unnest(muscles) AS m WHERE lower(m) = lower("+add(p.Muscle)+"))")
	}
	if p.Equipment != "" {
		where = append(where, "EXISTS (SELECT 1 FROM unnest(equipment) AS q WHERE lower(q) = lower("+add(p.Equipment)+"))")
	}
	if p.Language != "" {
		where = append(where, "language = "+add(strings.ToLower(p.Language)))
	}
	switch p.Scope {
	case "custom":
		where = append(where, "source = 'custom'")
	case "catalog":
		where = append(where, "source <> 'custom'")
	}

	limit := add(p.Limit + 1)
	offset := add(p.Offset)
	query := `SELECT ` + columns + ` FROM exercises WHERE ` + strings.Join(where, " AND ") +
		` ORDER BY ` + order + ` LIMIT ` + limit + ` OFFSET ` + offset

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Exercise, 0, p.Limit+1)
	for rows.Next() {
		var e Exercise
		if err := rows.Scan(scanTargets(&e)...); err != nil {
			return nil, err
		}
		items = append(items, e)
	}
	return items, rows.Err()
}

// Categories lists the categories visible to the user, with counts.
func (r *Repository) Categories(ctx context.Context, userID uuid.UUID) ([]CategoryCount, error) {
	rows, err := r.db.Query(ctx,
		`SELECT category, count(*) FROM exercises WHERE `+visibleTo+` GROUP BY category ORDER BY category`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []CategoryCount
	for rows.Next() {
		var c CategoryCount
		var n int64
		if err := rows.Scan(&c.Name, &n); err != nil {
			return nil, err
		}
		c.Count = int(n)
		out = append(out, c)
	}
	return out, rows.Err()
}

// InsertCustom creates a user's custom exercise. A duplicate name for the same
// user violates exercises_custom_name_uidx; the caller maps that to ErrExists.
func (r *Repository) InsertCustom(ctx context.Context, userID uuid.UUID, e *Exercise) (*Exercise, error) {
	return scanOne(r.db.QueryRow(ctx,
		`INSERT INTO exercises (id, source, name, category, muscles, equipment, met_value, language, created_by_user_id)
		 VALUES ($1, 'custom', $2, $3, $4, $5, $6, $7, $8)
		 RETURNING `+columns,
		platform.NewID(), e.Name, e.Category, e.Muscles, e.Equipment, e.MetValue, e.Language, userID,
	))
}

// CustomUpdate is a partial update of a custom exercise. Nil fields stay unchanged.
type CustomUpdate struct {
	Name      *string
	Category  *string
	Muscles   []string // nil = unchanged, empty non-nil = clear
	Equipment []string
	MetValue  *float64
	Language  *string
}

// UpdateCustom applies the update to the user's own custom exercise.
func (r *Repository) UpdateCustom(ctx context.Context, userID, id uuid.UUID, u CustomUpdate) (*Exercise, error) {
	return scanOne(r.db.QueryRow(ctx,
		`UPDATE exercises SET
		   name      = COALESCE($3, name),
		   category  = COALESCE($4, category),
		   muscles   = COALESCE($5, muscles),
		   equipment = COALESCE($6, equipment),
		   met_value = COALESCE($7, met_value),
		   language  = COALESCE($8, language)
		 WHERE id = $1 AND created_by_user_id = $2 AND source = 'custom' AND NOT is_deleted
		 RETURNING `+columns,
		id, userID, u.Name, u.Category, u.Muscles, u.Equipment, u.MetValue, u.Language,
	))
}

// SoftDeleteCustom marks the user's own custom exercise as deleted.
func (r *Repository) SoftDeleteCustom(ctx context.Context, userID, id uuid.UUID) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE exercises SET is_deleted = true, deleted_at = now()
		 WHERE id = $1 AND created_by_user_id = $2 AND source = 'custom' AND NOT is_deleted`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// UpsertImported inserts a catalog exercise or refreshes an existing one, keyed
// by (source, source_id). Refreshing leaves met_value and the deleted flag
// alone, so manual tuning and removals survive re-imports. It reports whether
// a new row was created.
func (r *Repository) UpsertImported(ctx context.Context, e *ImportedExercise) (inserted bool, err error) {
	err = r.db.QueryRow(ctx,
		`INSERT INTO exercises
		   (id, source, source_id, name, category, muscles, equipment, met_value, image_url, license_name, license_author, language)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		 ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL DO UPDATE SET
		   name           = EXCLUDED.name,
		   category       = EXCLUDED.category,
		   muscles        = EXCLUDED.muscles,
		   equipment      = EXCLUDED.equipment,
		   image_url      = EXCLUDED.image_url,
		   license_name   = EXCLUDED.license_name,
		   license_author = EXCLUDED.license_author,
		   language       = EXCLUDED.language
		 RETURNING (xmax = 0)`,
		platform.NewID(), e.Source, e.SourceID, e.Name, e.Category, e.Muscles, e.Equipment, e.MetValue,
		e.ImageURL, e.LicenseName, e.LicenseAuthor, e.Language,
	).Scan(&inserted)
	return inserted, err
}

// escapeLike escapes the characters that are special in LIKE patterns, so
// user input is matched literally.
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}
