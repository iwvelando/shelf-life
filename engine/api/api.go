// Package api is the one JSON request/response surface the website calls through
// WebAssembly. It has no browser dependency, so it is tested natively; cmd/wasm
// only moves strings across the boundary. Keep web/types.ts in step with it.
package api

import (
	"encoding/json"
	"fmt"
	"io"

	"shelflife/engine/library"
	"shelflife/engine/stay"
)

// MaxRequestBytes bounds a request. A page is 3,200 characters; a visitor's text
// can be longer before spelling, but not by this much.
const MaxRequestBytes = 64 * 1024

// Request is every action's input; each action reads only its own fields.
type Request struct {
	Action   string            `json:"action"`
	Location *library.Location `json:"location,omitempty"`
	Text     string            `json:"text,omitempty"`
	Mode     library.Mode      `json:"mode,omitempty"`
	Effort   stay.Effort       `json:"effort"`
	Examined float64           `json:"examined,omitempty"`
	Deaths   int               `json:"deaths,omitempty"`
	Seconds  float64           `json:"seconds,omitempty"`
}

// Page is a page and where it is shelved.
type Page struct {
	Location library.Location `json:"location"`
	Lines    []string         `json:"lines"`
}

// Handle answers one JSON request with one JSON result, or {"error": "..."}.
// r supplies randomness for random pages and the noise around located text.
func Handle(req string, r io.Reader) string {
	out, err := handle(req, r)
	if err != nil {
		b, _ := json.Marshal(map[string]string{"error": err.Error()})
		return string(b)
	}
	b, err := json.Marshal(out)
	if err != nil {
		return `{"error":"the result could not be written"}`
	}
	return string(b)
}

func handle(raw string, r io.Reader) (any, error) {
	if len(raw) > MaxRequestBytes {
		return nil, fmt.Errorf("that is far more than a page")
	}
	var q Request
	if err := json.Unmarshal([]byte(raw), &q); err != nil {
		return nil, fmt.Errorf("unreadable request: %w", err)
	}
	switch q.Action {
	case "constants":
		return stay.Library(), nil
	case "page":
		loc := library.RandomLocation(r)
		if q.Location != nil {
			loc = *q.Location
		}
		lines, err := library.PageAt(loc)
		return Page{loc, lines}, err
	case "locate":
		return library.Locate(q.Text, q.Mode, r)
	case "reckon":
		return stay.Reckon(q.Effort)
	case "search":
		return stay.Search(q.Examined)
	case "fall":
		return stay.Fall(q.Deaths)
	case "time":
		return stay.Time(q.Seconds)
	}
	return nil, fmt.Errorf("unknown action %q", q.Action)
}
