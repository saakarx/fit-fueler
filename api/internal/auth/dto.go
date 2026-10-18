package auth

import "github.com/saakarx/fit-fueler/api/internal/user"

// GoogleSignInRequest is the body of POST /auth/google.
type GoogleSignInRequest struct {
	IDToken    string `json:"id_token" validate:"required"`
	Timezone   string `json:"timezone" validate:"omitempty,max=64" example:"Asia/Kolkata"`
	DeviceInfo string `json:"device_info" validate:"omitempty,max=200" example:"Pixel 8, Android 15"`
}

// DevLoginRequest is the body of POST /auth/dev-login (development only).
type DevLoginRequest struct {
	Email      string `json:"email" validate:"required,email" example:"dev@example.com"`
	Name       string `json:"name" validate:"omitempty,max=100" example:"Dev User"`
	Timezone   string `json:"timezone" validate:"omitempty,max=64" example:"Asia/Kolkata"`
	DeviceInfo string `json:"device_info" validate:"omitempty,max=200"`
}

// RefreshRequest is the body of POST /auth/refresh and POST /auth/logout.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// TokenResponse carries a fresh token pair.
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type" example:"Bearer"`
	ExpiresIn    int64  `json:"expires_in" example:"900"`
}

// AuthResponse is returned by the sign-in endpoints.
type AuthResponse struct {
	TokenResponse
	IsNewUser bool          `json:"is_new_user"`
	User      user.Response `json:"user"`
}

func tokenResponse(p TokenPair) TokenResponse {
	return TokenResponse{
		AccessToken:  p.AccessToken,
		RefreshToken: p.RefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    p.ExpiresIn,
	}
}
