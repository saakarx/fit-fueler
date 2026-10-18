package wger

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// DefaultBaseURL is wger's public API root.
const DefaultBaseURL = "https://wger.de/api/v2"

const (
	userAgent    = "fit-fueler-importer/1.0 (+https://github.com/saakarx/fit-fueler)"
	maxPages     = 500
	maxAttempts  = 4
	maxBodyBytes = 32 << 20
)

// ErrStop can be returned from the FetchAll callback to end the import early without an error.
var ErrStop = errors.New("stop importing")

// Client fetches exercises from wger, politely: one request at a time with a
// pause between pages, retries with backoff, and an identifying User-Agent.
type Client struct {
	http    *http.Client
	baseURL string
	delay   time.Duration
}

// NewClient creates a client. baseURL may be empty to use DefaultBaseURL.
func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	return &Client{
		http:    &http.Client{Timeout: 30 * time.Second},
		baseURL: strings.TrimRight(baseURL, "/"),
		delay:   500 * time.Millisecond,
	}
}

// FetchAll walks every page of accepted (status=2) English exercises and
// calls fn for each one. Return ErrStop from fn to end early.
func (c *Client) FetchAll(ctx context.Context, pageSize int, fn func(Item) error) error {
	next := fmt.Sprintf("%s/exerciseinfo/?format=json&language=%d&status=2&limit=%d&offset=0",
		c.baseURL, englishLanguageID, pageSize)

	for page := 1; next != ""; page++ {
		if page > maxPages {
			return fmt.Errorf("stopped after %d pages; something is wrong with pagination", maxPages)
		}

		var pg Page
		if err := c.getJSON(ctx, next, &pg); err != nil {
			return err
		}
		for _, item := range pg.Results {
			if err := fn(item); err != nil {
				if errors.Is(err, ErrStop) {
					return nil
				}
				return err
			}
		}

		next = ""
		if pg.Next != nil {
			next = secure(*pg.Next)
		}
		if next != "" {
			if err := sleep(ctx, c.delay); err != nil {
				return err
			}
		}
	}
	return nil
}

func (c *Client) getJSON(ctx context.Context, url string, dst any) error {
	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		retry, err := c.tryOnce(ctx, url, dst)
		if err == nil {
			return nil
		}
		lastErr = err
		if !retry || attempt == maxAttempts {
			break
		}
		if err := sleep(ctx, time.Duration(attempt*attempt)*time.Second); err != nil {
			return err
		}
	}
	return fmt.Errorf("fetch %s: %w", url, lastErr)
}

// tryOnce performs a single request. The boolean reports whether a retry makes sense.
func (c *Client) tryOnce(ctx context.Context, url string, dst any) (retry bool, err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return ctx.Err() == nil, err // network errors are retried unless we were cancelled
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500 {
		_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 1<<20))
		return true, fmt.Errorf("unexpected status %s", resp.Status)
	}
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("unexpected status %s", resp.Status)
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxBodyBytes)).Decode(dst); err != nil {
		return false, fmt.Errorf("decode response: %w", err)
	}
	return false, nil
}

// secure upgrades http:// pagination links to https://.
func secure(u string) string {
	if strings.HasPrefix(u, "http://") {
		return "https://" + strings.TrimPrefix(u, "http://")
	}
	return u
}

func sleep(ctx context.Context, d time.Duration) error {
	select {
	case <-time.After(d):
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
