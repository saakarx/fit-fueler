package profile

import (
	"errors"
	"testing"
	"time"
)

func strPtr(s string) *string     { return &s }
func floatPtr(f float64) *float64 { return &f }
func newTestService() *Service {
	fixed := time.Date(2026, time.October, 18, 12, 0, 0, 0, time.UTC)
	return &Service{now: func() time.Time { return fixed }}
}

func TestParseUpdateAcceptsValidInput(t *testing.T) {
	upd, err := newTestService().parseUpdate(&UpdateProfileRequest{
		Name:      strPtr("  Saakar  "),
		BirthDate: strPtr("2002-04-25"),
		Timezone:  strPtr("Asia/Kolkata"),
		Units:     &Units{Weight: "kg", Height: "ft_in", Distance: "km", Energy: "kcal", Water: "ml"},
		WeightKG:  floatPtr(68.5),
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if upd.name == nil || *upd.name != "Saakar" {
		t.Errorf("name should be trimmed, got %v", upd.name)
	}
	if upd.birthDate == nil || formatDate(*upd.birthDate) != "2002-04-25" {
		t.Errorf("birth date not parsed: %v", upd.birthDate)
	}
	if len(upd.units) == 0 {
		t.Error("units should be marshalled to JSON")
	}
	if upd.weightKG == nil || *upd.weightKG != 68.5 {
		t.Errorf("weight should pass through, got %v", upd.weightKG)
	}
}

func TestParseUpdateRejectsBadInput(t *testing.T) {
	cases := map[string]struct {
		req  UpdateProfileRequest
		want error
	}{
		"future birth date": {UpdateProfileRequest{BirthDate: strPtr("2027-01-01")}, ErrInvalidBirthDate},
		"too young":         {UpdateProfileRequest{BirthDate: strPtr("2018-01-01")}, ErrInvalidBirthDate},
		"too old":           {UpdateProfileRequest{BirthDate: strPtr("1890-01-01")}, ErrInvalidBirthDate},
		"unparseable date":  {UpdateProfileRequest{BirthDate: strPtr("25/04/2002")}, ErrInvalidDate},
		"unknown timezone":  {UpdateProfileRequest{Timezone: strPtr("Mars/Base")}, ErrInvalidTimezone},
		"blank name":        {UpdateProfileRequest{Name: strPtr("   ")}, nil},
	}
	for name, tc := range cases {
		_, err := newTestService().parseUpdate(&tc.req)
		if err == nil {
			t.Errorf("%s: expected an error", name)
			continue
		}
		if tc.want != nil && !errors.Is(err, tc.want) {
			t.Errorf("%s: got %v, want %v", name, err, tc.want)
		}
	}
}

func TestProfileComplete(t *testing.T) {
	sex, bd, h, w := "male", time.Now(), 175.0, 70.0
	full := &Profile{Sex: &sex, BirthDate: &bd, HeightCM: &h, WeightKG: &w}
	if !full.Complete() {
		t.Error("profile with sex, birth date, height and weight should be complete")
	}
	noWeight := &Profile{Sex: &sex, BirthDate: &bd, HeightCM: &h}
	if noWeight.Complete() {
		t.Error("profile without a weight entry must not be complete")
	}
}
