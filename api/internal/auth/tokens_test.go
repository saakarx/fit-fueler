package auth

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

func newTestManager() *TokenManager {
	return NewTokenManager(strings.Repeat("s", 32), "test-issuer", time.Minute, time.Hour)
}

func TestAccessTokenRoundTrip(t *testing.T) {
	tm := newTestManager()
	id := uuid.New()

	token, err := tm.NewAccessToken(id, time.Now())
	if err != nil {
		t.Fatalf("NewAccessToken: %v", err)
	}
	got, err := tm.ParseAccessToken(token)
	if err != nil {
		t.Fatalf("ParseAccessToken: %v", err)
	}
	if got != id {
		t.Fatalf("got user %s, want %s", got, id)
	}
}

func TestAccessTokenExpired(t *testing.T) {
	tm := newTestManager()

	token, err := tm.NewAccessToken(uuid.New(), time.Now().Add(-time.Hour))
	if err != nil {
		t.Fatalf("NewAccessToken: %v", err)
	}
	if _, err := tm.ParseAccessToken(token); !errors.Is(err, errTokenExpired) {
		t.Fatalf("got %v, want errTokenExpired", err)
	}
}

func TestAccessTokenRejectsOtherSecretAndIssuer(t *testing.T) {
	tm := newTestManager()
	token, err := tm.NewAccessToken(uuid.New(), time.Now())
	if err != nil {
		t.Fatalf("NewAccessToken: %v", err)
	}

	otherSecret := NewTokenManager(strings.Repeat("x", 32), "test-issuer", time.Minute, time.Hour)
	if _, err := otherSecret.ParseAccessToken(token); err == nil {
		t.Fatal("token signed with another secret was accepted")
	}

	otherIssuer := NewTokenManager(strings.Repeat("s", 32), "someone-else", time.Minute, time.Hour)
	if _, err := otherIssuer.ParseAccessToken(token); err == nil {
		t.Fatal("token from another issuer was accepted")
	}
}

func TestAccessTokenRejectsGarbage(t *testing.T) {
	if _, err := newTestManager().ParseAccessToken("not-a-jwt"); err == nil {
		t.Fatal("garbage token was accepted")
	}
}

func TestRefreshTokenHashing(t *testing.T) {
	raw, hash, err := NewRefreshToken()
	if err != nil {
		t.Fatalf("NewRefreshToken: %v", err)
	}
	if raw == "" || hash == "" || raw == hash {
		t.Fatalf("unexpected token/hash pair: %q / %q", raw, hash)
	}
	if HashRefreshToken(raw) != hash {
		t.Fatal("hash is not reproducible from the raw token")
	}

	raw2, _, _ := NewRefreshToken()
	if raw == raw2 {
		t.Fatal("two refresh tokens were identical")
	}
}

func TestResolveTimezone(t *testing.T) {
	cases := []struct {
		in      string
		want    string
		wantErr bool
	}{
		{"", "UTC", false},
		{"Asia/Kolkata", "Asia/Kolkata", false},
		{"Local", "", true},
		{"Not/AZone", "", true},
	}
	for _, tc := range cases {
		got, err := resolveTimezone(tc.in)
		if (err != nil) != tc.wantErr || got != tc.want {
			t.Errorf("resolveTimezone(%q) = %q, %v; want %q, error=%v", tc.in, got, err, tc.want, tc.wantErr)
		}
	}
}
