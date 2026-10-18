# Data sources and attribution

## Exercise catalog: wger

The exercise catalog is imported from the [wger](https://wger.de) open exercise
database with `go run ./cmd/import-wger`.

- wger publishes its exercise content under Creative Commons licenses; the license
  of each exercise (for example "CC-BY-SA 4") and its authors are stored with the
  exercise and returned in the `attribution` field of the API.
- Creative Commons Attribution-ShareAlike licenses require crediting the authors and
  sharing adapted material under the same license. Read the license text and wger's
  own terms before publishing, and credit wger and its contributors in the app
  (for example on a credits screen) and in the repository README.
- Exercises that arrive without license information are skipped by the importer.
- Exercise images are not copied: the API returns the URL on wger's media server.
- The importer is polite by design (identifying User-Agent, one request at a time,
  a pause between pages, retries with backoff). Run it once and keep the data in
  your own database rather than calling wger from the app.

## MET values

MET values used for calorie estimates are rough defaults assigned by the importer
(`internal/exercise/met.go`). They are not taken from wger and have not been
verified against the Compendium of Physical Activities. Adjust them as needed.
