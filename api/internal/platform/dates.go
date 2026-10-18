package platform

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// DateLayout is the API's calendar-date format.
const DateLayout = "2006-01-02"

// EarliestDate is the oldest local date accepted for backdated entries.
var EarliestDate = time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)

// ErrNoProfile means the user has no profile row, or the account is deleted.
var ErrNoProfile = errors.New("profile not found")

// ParseDate parses a YYYY-MM-DD calendar date as midnight UTC.
func ParseDate(s string) (time.Time, error) { return time.ParseInLocation(DateLayout, s, time.UTC) }

// FormatDate formats a calendar date as YYYY-MM-DD.
func FormatDate(t time.Time) string { return t.Format(DateLayout) }

// CivilDate returns the calendar date of t (in t's own location) as midnight UTC.
// Calendar dates are carried around as midnight-UTC time values.
func CivilDate(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

// LoadLocation resolves an IANA timezone, falling back to UTC for unknown names.
func LoadLocation(tz string) *time.Location {
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.UTC
	}
	return loc
}

// LocalToday returns the current calendar date in the given timezone.
func LocalToday(now time.Time, tz string) time.Time {
	return CivilDate(now.In(LoadLocation(tz)))
}

// PlausibleDate reports whether a client-supplied date is acceptable: not before
// 2000 and at most one day ahead of the user's today (the slack covers clients
// whose timezone is ahead of the stored one).
func PlausibleDate(d, today time.Time) bool {
	return !d.Before(EarliestDate) && !d.After(today.AddDate(0, 0, 1))
}

// GetTimezone returns the user's timezone. With lock set, the profile row is
// locked until the transaction ends, which serializes per-user writes that must
// not race (for example, creating the day's workout session).
func GetTimezone(ctx context.Context, db DBTX, userID uuid.UUID, lock bool) (string, error) {
	query := `SELECT p.timezone
	          FROM profiles p
	          JOIN users u ON u.id = p.user_id
	          WHERE p.user_id = $1 AND NOT u.is_deleted`
	if lock {
		query += " FOR UPDATE OF p"
	}

	var tz string
	err := db.QueryRow(ctx, query, userID).Scan(&tz)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNoProfile
	}
	return tz, err
}
