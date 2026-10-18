// Package httpx holds HTTP plumbing shared by all features: the error format,
// request binding and validation, middleware, and request-scoped helpers.
package httpx

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v3"
)

// FieldError describes one invalid request field.
type FieldError struct {
	Field string `json:"field" example:"timezone"`
	Rule  string `json:"rule" example:"max"`
}

// ErrorBody is the payload inside every error response.
type ErrorBody struct {
	Code      string       `json:"code" example:"invalid_token"`
	Message   string       `json:"message" example:"The sign-in token could not be verified"`
	RequestID string       `json:"request_id,omitempty"`
	Details   []FieldError `json:"details,omitempty"`
}

// ErrorResponse is the single error shape returned by the whole API.
type ErrorResponse struct {
	Error ErrorBody `json:"error"`
}

// AppError is an error that knows its HTTP status and public error code.
// Treat the package-level values as read-only; use WithCause or WithDetails
// to derive a copy.
type AppError struct {
	Status  int
	Code    string
	Message string
	Details []FieldError
	cause   error
}

func (e *AppError) Error() string {
	if e.cause != nil {
		return e.Code + ": " + e.cause.Error()
	}
	return e.Code + ": " + e.Message
}

func (e *AppError) Unwrap() error { return e.cause }

// WithCause returns a copy that records the underlying error for logging.
// The cause is never sent to the client.
func (e *AppError) WithCause(err error) *AppError {
	cp := *e
	cp.cause = err
	return &cp
}

// WithDetails returns a copy carrying field-level details.
func (e *AppError) WithDetails(details []FieldError) *AppError {
	cp := *e
	cp.Details = details
	return &cp
}

// NewError creates an AppError.
func NewError(status int, code, message string) *AppError {
	return &AppError{Status: status, Code: code, Message: message}
}

func BadRequest(code, message string) *AppError {
	return NewError(http.StatusBadRequest, code, message)
}
func Unauthorized(code, message string) *AppError {
	return NewError(http.StatusUnauthorized, code, message)
}
func Forbidden(code, message string) *AppError { return NewError(http.StatusForbidden, code, message) }
func NotFound(code, message string) *AppError  { return NewError(http.StatusNotFound, code, message) }
func Conflict(code, message string) *AppError  { return NewError(http.StatusConflict, code, message) }

// Common errors shared across features.
var (
	ErrInternal    = NewError(http.StatusInternalServerError, "internal_error", "Something went wrong. Please try again later")
	ErrBodyMissing = BadRequest("invalid_body", "A JSON request body is required")
	ErrInvalidJSON = BadRequest("invalid_json", "The request body is not valid JSON")
	ErrValidation  = BadRequest("validation_failed", "One or more fields are invalid")
	ErrRateLimited = NewError(http.StatusTooManyRequests, "rate_limited", "Too many requests. Please try again later")
)

// NewErrorHandler returns the Fiber error handler that renders every error,
// including Fiber's own (404, 405, ...) and panics, in the ErrorResponse shape.
func NewErrorHandler(log *slog.Logger) func(fiber.Ctx, error) error {
	return func(c fiber.Ctx, err error) error {
		var appErr *AppError
		var fiberErr *fiber.Error

		switch {
		case errors.As(err, &appErr):
		case errors.As(err, &fiberErr):
			appErr = fromFiberError(fiberErr)
		default:
			appErr = ErrInternal.WithCause(err)
		}

		reqID := RequestID(c)
		if appErr.Status >= http.StatusInternalServerError {
			log.Error("request failed",
				"request_id", reqID,
				"method", c.Method(),
				"path", c.Path(),
				"error", err,
			)
		}

		return c.Status(appErr.Status).JSON(ErrorResponse{Error: ErrorBody{
			Code:      appErr.Code,
			Message:   appErr.Message,
			RequestID: reqID,
			Details:   appErr.Details,
		}})
	}
}

func fromFiberError(fe *fiber.Error) *AppError {
	if fe.Code >= http.StatusInternalServerError {
		return ErrInternal.WithCause(fe)
	}
	code := strings.ToLower(strings.ReplaceAll(http.StatusText(fe.Code), " ", "_"))
	if code == "" {
		code = "error"
	}
	return &AppError{Status: fe.Code, Code: code, Message: fe.Message}
}
