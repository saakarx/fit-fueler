package exercise

import (
	"reflect"
	"testing"
)

func TestEscapeLike(t *testing.T) {
	cases := map[string]string{
		"press":      "press",
		"50%":        `50\%`,
		"a_b":        `a\_b`,
		`back\squat`: `back\\squat`,
	}
	for in, want := range cases {
		if got := escapeLike(in); got != want {
			t.Errorf("escapeLike(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestNormalizeList(t *testing.T) {
	got := normalizeList([]string{" Biceps ", "biceps", "", "Triceps", "  "})
	want := []string{"Biceps", "Triceps"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("normalizeList = %v, want %v", got, want)
	}
	if got := normalizeList(nil); got == nil || len(got) != 0 {
		t.Errorf("normalizeList(nil) should be an empty non-nil slice, got %#v", got)
	}
}

func TestIntParam(t *testing.T) {
	if n, err := intParam("", 20, 1, 50); err != nil || n != 20 {
		t.Errorf("default: got %d, %v", n, err)
	}
	if n, err := intParam("30", 20, 1, 50); err != nil || n != 30 {
		t.Errorf("valid: got %d, %v", n, err)
	}
	for _, bad := range []string{"0", "51", "abc", "-1", "1.5"} {
		if _, err := intParam(bad, 20, 1, 50); err == nil {
			t.Errorf("intParam(%q) should fail", bad)
		}
	}
}

func TestToResponseAttribution(t *testing.T) {
	license, author := "CC-BY-SA 4", "Jane"
	wger := toResponse(&Exercise{Source: SourceWger, LicenseName: &license, LicenseAuthor: &author})
	if wger.Attribution == nil || wger.Attribution.License != license || wger.Attribution.Author != author {
		t.Errorf("wger exercise should carry attribution, got %+v", wger.Attribution)
	}
	if wger.IsCustom || wger.Muscles == nil || wger.Equipment == nil {
		t.Errorf("unexpected response: %+v", wger)
	}

	custom := toResponse(&Exercise{Source: SourceCustom})
	if custom.Attribution != nil || !custom.IsCustom {
		t.Errorf("custom exercise must not carry attribution, got %+v", custom)
	}
}

func TestNormalizeLanguage(t *testing.T) {
	en, pt, bad := "  EN ", "pt-BR", "english!"
	if got, err := normalizeLanguage(nil); err != nil || got != "en" {
		t.Errorf("nil should default to en, got %q, %v", got, err)
	}
	if got, err := normalizeLanguage(&en); err != nil || got != "en" {
		t.Errorf("got %q, %v", got, err)
	}
	if got, err := normalizeLanguage(&pt); err != nil || got != "pt-br" {
		t.Errorf("got %q, %v", got, err)
	}
	if _, err := normalizeLanguage(&bad); err == nil {
		t.Error("an invalid language code must be rejected")
	}
}
