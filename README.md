# Fit Fueler

A mobile app for tracking daily workouts, meals, and water intake, with weekly analytics.

> **Status:** work in progress. The mobile app is being migrated from Firebase to a custom Go API.

<!-- Add screenshots to docs/ and link them here
![Home](docs/screenshots/home.png) -->

## Features

- Log workouts (exercises, sets, reps, weight, duration)
- Log meals with calories and macros, backed by a searchable food catalog
- Track daily water intake against a goal
- Daily summary versus goals
- Weekly analytics (current week vs. last week)
- Sign in with Google, and Sign in with Apple on iOS

## Tech stack

| Area     | Technology                                                  |
| -------- | ----------------------------------------------------------- |
| Mobile   | Expo (React Native), TypeScript, Expo Router, HeroUI Native |
| State    | TanStack Query, Jotai                                       |
| API      | Go, Fiber                                                   |
| Database | PostgreSQL                                                  |
| Auth     | Google and Apple sign-in, API-issued JWT + refresh tokens   |
| API docs | Swagger / OpenAPI                                           |

## Repository layout

```
fit-fueler/
├── api/        # Go backend (Fiber, PostgreSQL, migrations)
├── mobile/     # Expo app
└── docs/       # Architecture notes, ER diagram, screenshots
```

## Architecture

- The mobile app talks to the API over REST. The API verifies the Google/Apple ID token once, then issues its own short-lived access token and a rotating refresh token.
- Every log (workout, meal, water) stores both a UTC timestamp and the user's **local date**, so daily and weekly analytics group correctly regardless of timezone.
- Foods are served **cache-first**: the API searches its own `foods` table, and calls an external provider (such as USDA FoodData Central or Open Food Facts) only when local results are thin. Logged meals keep a snapshot of the nutrition values, so history never changes retroactively.
- Analytics are aggregated on the server and returned per day for a date range.

## Getting started

### Prerequisites

- Node.js 20+ and npm
- Go 1.22+ (use the version in `api/go.mod`)
- PostgreSQL 15+ running locally
- [golang-migrate](https://github.com/golang-migrate/migrate) CLI
- Android Studio (for the Android SDK and emulator only)

### 1. Database

Start a PostgreSQL instance and create a database:

```sql
CREATE DATABASE fitfueler;
```

### 2. API

```bash
cd api
cp .env.example .env     # then edit DATABASE_URL to match your Postgres instance
```

Run the migrations from the repo root:

```bash
migrate -path api/migrations -database "$DATABASE_URL" up
```

Start the server:

```bash
cd api
go run ./cmd/api
```

### 3. Mobile app

```bash
cd mobile
npm install
npx expo start
```

The app uses native modules, so run it as a development build rather than Expo Go:

```bash
npx expo run:android
```

On the Android emulator, `localhost` refers to the emulator itself. Use `http://10.0.2.2:<port>` to reach an API running on your computer.

## API documentation

Swagger docs are generated from the handlers and served by the API once it is running. See `api/docs/`.

## Roadmap

- [x] Expo SDK upgrade and HeroUI Native setup
- [x] Initial database schema and migration
- [ ] Auth endpoints (Google / Apple)
- [ ] Profile and goals
- [ ] Workout, meal, and water logging
- [ ] Food search with provider fallback
- [ ] Analytics endpoints
- [ ] Replace Firebase in the mobile app with the API

## License

TBD
