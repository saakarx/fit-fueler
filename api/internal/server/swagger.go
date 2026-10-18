package server

import (
	"os"

	"github.com/gofiber/fiber/v3"

	"github.com/saakarx/fit-fueler/api/internal/httpx"
)

// swaggerSpecPath is the file written by `swag init --outputTypes json`.
// It is read from disk (relative to the working directory, i.e. api/), so the
// API compiles and runs even before the docs have been generated.
const swaggerSpecPath = "docs/swagger.json"

const swaggerPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Fit Fueler API</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "/swagger/doc.json",
      dom_id: "#swagger-ui",
      persistAuthorization: true
    });
  </script>
</body>
</html>`

func registerSwagger(app *fiber.App) {
	app.Get("/swagger", func(c fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendString(swaggerPage)
	})

	app.Get("/swagger/doc.json", func(c fiber.Ctx) error {
		spec, err := os.ReadFile(swaggerSpecPath)
		if err != nil {
			return httpx.NotFound("docs_not_generated",
				"Swagger spec not found. Run: swag init -g cmd/api/main.go -o docs --parseInternal --outputTypes json")
		}
		c.Set("Content-Type", "application/json")
		return c.Send(spec)
	})
}
