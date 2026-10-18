// Command import-wger loads the wger exercise catalog into the database.
//
// It is safe to run repeatedly: exercises are matched on wger's UUID, so a
// re-run refreshes names, muscles, equipment, images and attribution without
// creating duplicates, and keeps any MET values you tuned by hand.
//
// Usage (from the api/ directory):
//
//	go run ./cmd/import-wger -dry-run -max 20   # look at the data, write nothing
//	go run ./cmd/import-wger                    # import everything
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"sort"
	"syscall"

	"github.com/joho/godotenv"

	"github.com/saakarx/fit-fueler/api/internal/exercise"
	"github.com/saakarx/fit-fueler/api/internal/exercise/wger"
	"github.com/saakarx/fit-fueler/api/internal/platform"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	dryRun := flag.Bool("dry-run", false, "fetch and map exercises but write nothing to the database")
	limit := flag.Int("max", 0, "stop after this many exercises (0 = all)")
	pageSize := flag.Int("page-size", 50, "exercises per request")
	baseURL := flag.String("base-url", wger.DefaultBaseURL, "wger API root")
	flag.Parse()

	_ = godotenv.Load()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	var repo *exercise.Repository
	if !*dryRun {
		dbURL := os.Getenv("DATABASE_URL")
		if dbURL == "" {
			return errors.New("DATABASE_URL is not set (use -dry-run to skip the database)")
		}
		pool, err := platform.NewPool(ctx, dbURL)
		if err != nil {
			return err
		}
		defer pool.Close()
		repo = exercise.NewRepository(pool)
	}

	var (
		seen, created, updated int
		skipped                = map[string]int{}
	)

	fmt.Printf("importing from %s (dry-run: %v)\n", *baseURL, *dryRun)
	err := wger.NewClient(*baseURL).FetchAll(ctx, *pageSize, func(item wger.Item) error {
		seen++

		imp, err := item.ToImported()
		if err != nil {
			skipped[err.Error()]++
			return nil
		}

		if *dryRun {
			if seen <= 15 {
				fmt.Printf("  %-40s %-10s MET %.1f  muscles=%v  equipment=%v\n",
					imp.Name, imp.Category, imp.MetValue, imp.Muscles, imp.Equipment)
			}
		} else {
			inserted, err := repo.UpsertImported(ctx, imp)
			if err != nil {
				return fmt.Errorf("save %q: %w", imp.Name, err)
			}
			if inserted {
				created++
			} else {
				updated++
			}
		}

		if seen%100 == 0 {
			fmt.Printf("  ... %d exercises processed\n", seen)
		}
		if *limit > 0 && seen >= *limit {
			return wger.ErrStop
		}
		return nil
	})
	if err != nil {
		return err
	}

	fmt.Printf("\ndone: %d seen, %d created, %d updated\n", seen, created, updated)
	if len(skipped) > 0 {
		reasons := make([]string, 0, len(skipped))
		for reason := range skipped {
			reasons = append(reasons, reason)
		}
		sort.Strings(reasons)
		fmt.Println("skipped:")
		for _, reason := range reasons {
			fmt.Printf("  %-28s %d\n", reason, skipped[reason])
		}
	}
	if *dryRun {
		fmt.Println("dry run: nothing was written")
	}
	return nil
}
