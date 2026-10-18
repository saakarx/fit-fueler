package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"reflect"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
)

const requestTimeout = 10 * time.Second

var validate = newValidator()

func newValidator() *validator.Validate {
	v := validator.New(validator.WithRequiredStructEnabled())
	// Report errors using JSON field names, which is what API clients know.
	v.RegisterTagNameFunc(func(f reflect.StructField) string {
		name := strings.SplitN(f.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
	return v
}

// BindJSON decodes the request body into dst and validates it using the
// `validate` struct tags. The returned error is already an *AppError.
func BindJSON(c fiber.Ctx, dst any) error {
	body := c.Body()
	if len(body) == 0 {
		return ErrBodyMissing
	}
	if err := json.Unmarshal(body, dst); err != nil {
		return ErrInvalidJSON
	}
	if err := validate.Struct(dst); err != nil {
		var verrs validator.ValidationErrors
		if errors.As(err, &verrs) {
			details := make([]FieldError, 0, len(verrs))
			for _, fe := range verrs {
				details = append(details, FieldError{Field: fe.Field(), Rule: fe.Tag()})
			}
			return ErrValidation.WithDetails(details)
		}
		return ErrInternal.WithCause(err)
	}
	return nil
}

// RequestContext returns a context for database and network calls made while
// handling the request. Call the returned cancel function when done.
func RequestContext(c fiber.Ctx) (context.Context, context.CancelFunc) {
	return context.WithTimeout(c.Context(), requestTimeout)
}
