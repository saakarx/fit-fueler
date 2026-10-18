package auth

import (
	"context"
	"fmt"
	"strings"

	"google.golang.org/api/idtoken"
)

// ProviderIdentity is a verified identity from an external sign-in provider.
type ProviderIdentity struct {
	Provider      string // "google" or "apple"
	Subject       string // the provider's stable user ID ("sub")
	Email         string
	EmailVerified bool
	Name          string
}

// Verifier checks a provider's ID token and extracts the identity.
// Adding Apple later means adding another implementation of this interface.
type Verifier interface {
	Verify(ctx context.Context, idToken string) (*ProviderIdentity, error)
}

const (
	providerGoogle = "google"
	providerApple  = "apple"
)

var googleIssuers = map[string]bool{
	"https://accounts.google.com": true,
	"accounts.google.com":         true,
}

// GoogleVerifier validates Google ID tokens against the configured OAuth client IDs.
type GoogleVerifier struct {
	validator *idtoken.Validator
	audiences []string
}

// NewGoogleVerifier creates a verifier. audiences are the accepted OAuth client
// IDs; the ID token's "aud" claim must match one of them.
func NewGoogleVerifier(ctx context.Context, audiences []string) (*GoogleVerifier, error) {
	v, err := idtoken.NewValidator(ctx)
	if err != nil {
		return nil, fmt.Errorf("create google token validator: %w", err)
	}
	return &GoogleVerifier{validator: v, audiences: audiences}, nil
}

// Verify validates the token's signature, expiry, audience and issuer.
func (g *GoogleVerifier) Verify(ctx context.Context, token string) (*ProviderIdentity, error) {
	if len(g.audiences) == 0 {
		return nil, ErrGoogleNotConfigured
	}

	var lastErr error
	for _, aud := range g.audiences {
		payload, err := g.validator.Validate(ctx, token, aud)
		if err != nil {
			lastErr = err
			continue
		}
		if !googleIssuers[payload.Issuer] || payload.Subject == "" {
			lastErr = fmt.Errorf("unexpected issuer %q or empty subject", payload.Issuer)
			continue
		}
		return &ProviderIdentity{
			Provider:      providerGoogle,
			Subject:       payload.Subject,
			Email:         strings.ToLower(claimString(payload.Claims, "email")),
			EmailVerified: claimBool(payload.Claims["email_verified"]),
			Name:          claimString(payload.Claims, "name"),
		}, nil
	}
	return nil, ErrInvalidIdentityToken.WithCause(lastErr)
}

func claimString(claims map[string]any, key string) string {
	s, _ := claims[key].(string)
	return s
}

// Google sends email_verified as a JSON boolean, but some tokens carry the string "true".
func claimBool(v any) bool {
	switch t := v.(type) {
	case bool:
		return t
	case string:
		return t == "true"
	}
	return false
}
