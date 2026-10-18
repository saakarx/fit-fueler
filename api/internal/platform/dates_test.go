package platform

import (
	"testing"
	"time"
	_ "time/tzdata"
)

func TestLocalToday(t *testing.T) {
	now := time.Date(2026, time.October, 18, 20, 0, 0, 0, time.UTC)
	if got := FormatDate(LocalToday(now, "Asia/Kolkata")); got != "2026-10-19" {
		t.Errorf("Asia/Kolkata = %s, want 2026-10-19", got)
	}
	if got := FormatDate(LocalToday(now, "America/Los_Angeles")); got != "2026-10-18" {
		t.Errorf("America/Los_Angeles = %s, want 2026-10-18", got)
	}
	if got := FormatDate(LocalToday(now, "Not/AZone")); got != "2026-10-18" {
		t.Errorf("unknown timezone should fall back to UTC, got %s", got)
	}
}

func TestParseDateRoundTrip(t *testing.T) {
	d, err := ParseDate("2026-02-28")
	if err != nil || FormatDate(d) != "2026-02-28" {
		t.Fatalf("round trip failed: %v, %v", d, err)
	}
	for _, bad := range []string{"28/02/2026", "2026-13-01", "2026-02-30", ""} {
		if _, err := ParseDate(bad); err == nil {
			t.Errorf("ParseDate(%q) should fail", bad)
		}
	}
}

func TestPlausibleDate(t *testing.T) {
	today := time.Date(2026, time.October, 18, 0, 0, 0, 0, time.UTC)
	cases := []struct {
		date string
		want bool
	}{
		{"2026-10-18", true},
		{"2026-10-19", true}, // one day of slack
		{"2026-10-20", false},
		{"2000-01-01", true},
		{"1999-12-31", false},
	}
	for _, tc := range cases {
		d, _ := ParseDate(tc.date)
		if got := PlausibleDate(d, today); got != tc.want {
			t.Errorf("PlausibleDate(%s) = %v, want %v", tc.date, got, tc.want)
		}
	}
}
