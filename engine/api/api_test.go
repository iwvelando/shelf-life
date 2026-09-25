package api

import (
	"encoding/json"
	"math/rand/v2"
	"strings"
	"testing"
)

func call(t *testing.T, req string) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal([]byte(Handle(req, rand.NewChaCha8([32]byte{1}))), &out); err != nil {
		t.Fatalf("response is not JSON: %v", err)
	}
	return out
}

func TestConstants(t *testing.T) {
	out := call(t, `{"action":"constants"}`)
	if out["bookDigits"].(float64) != 1_834_098 {
		t.Fatalf("constants = %v", out)
	}
}

func TestRandomPageThenTheSamePageByAddress(t *testing.T) {
	first := call(t, `{"action":"page"}`)
	loc, _ := json.Marshal(first["location"])
	again := call(t, `{"action":"page","location":`+string(loc)+`}`)
	if len(first["lines"].([]any)) != 40 {
		t.Fatalf("page = %v", first)
	}
	if first["lines"].([]any)[0] != again["lines"].([]any)[0] {
		t.Fatal("the same address gave a different page")
	}
	hex := first["location"].(map[string]any)["hexagon"].(string)
	if len(hex) < 4000 {
		t.Fatalf("hexagon has only %d digits", len(hex))
	}
}

func TestLocate(t *testing.T) {
	out := call(t, `{"action":"locate","text":"Wyatt","mode":"blank"}`)
	if out["spelling"].(map[string]any)["text"] != "uuiatt" {
		t.Fatalf("locate = %v", out)
	}
	if !strings.HasPrefix(out["lines"].([]any)[0].(string), "uuiatt ") {
		t.Fatalf("first line = %v", out["lines"].([]any)[0])
	}
}

func TestReckonSearchFallTime(t *testing.T) {
	if r := call(t, `{"action":"reckon","effort":{"searchersLog":9,"rateLog":9,"yearsLog":2}}`); r["digitsRemoved"].(float64) != 18 {
		t.Errorf("reckon = %v", r)
	}
	if r := call(t, `{"action":"search","examined":10000}`); r["examinedText"] != "10,000" {
		t.Errorf("search = %v", r)
	}
	if r := call(t, `{"action":"fall","deaths":1}`); r["galleriesText"] != "4,752,000" {
		t.Errorf("fall = %v", r)
	}
	if r := call(t, `{"action":"time","seconds":60}`); r["secondsText"] != "60" {
		t.Errorf("time = %v", r)
	}
}

func TestErrorsAreReported(t *testing.T) {
	for _, req := range []string{
		`{`,
		`{"action":"dance"}`,
		`{"action":"locate","text":"","mode":"noise"}`,
		`{"action":"page","location":{"hexagon":"-4","wall":0,"shelf":0,"volume":0,"page":0}}`,
		`{"action":"page","location":{"hexagon":"1","wall":9,"shelf":0,"volume":0,"page":0}}`,
		`{"action":"reckon","effort":{"searchersLog":-1,"rateLog":0,"yearsLog":0}}`,
		`{"action":"search","examined":0}`,
		`{"action":"fall","deaths":0}`,
		`{"action":"time","seconds":-5}`,
		`{"action":"locate","mode":"noise","text":"` + strings.Repeat("a", MaxRequestBytes) + `"}`,
	} {
		out := call(t, req)
		if msg, ok := out["error"].(string); !ok || msg == "" {
			t.Errorf("%.60s… gave %v, want an error", req, out)
		}
	}
}
