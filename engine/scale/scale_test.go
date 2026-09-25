package scale

import (
	"math"
	"strings"
	"testing"
)

func TestCharsPerBook(t *testing.T) {
	// Borges' (and Peck's) book: 80 chars/line, 40 lines/page, 410 pages.
	got := CharsPerBook(80, 40, 410)
	want := 80 * 40 * 410 // 1,312,000
	if got != want {
		t.Fatalf("CharsPerBook = %d, want %d", got, want)
	}
}

func TestLog10Books(t *testing.T) {
	// 25 symbols, 1,312,000 positions => 25^1,312,000.
	got := Log10Books(25, 1_312_000)
	want := 1_312_000 * math.Log10(25) // ~1,834,097.29
	if math.Abs(got-want) > 1e-6 {
		t.Fatalf("Log10Books = %.6f, want %.6f", got, want)
	}
	if got < 1_834_000 || got > 1_835_000 {
		t.Fatalf("Log10Books magnitude off: %.2f", got)
	}
}

func TestSearchSecondsLog(t *testing.T) {
	// One searcher checking one book per second: seconds == total books.
	if got := SearchSecondsLog(1_834_097.29, 0, 0); math.Abs(got-1_834_097.29) > 1e-6 {
		t.Fatalf("SearchSecondsLog(total,0,0) = %.4f, want total", got)
	}
	// A billion searchers (1e9) each checking a billion books/sec (1e9)
	// removes only 18 from the exponent: the bar does not move.
	got := SearchSecondsLog(1_834_097.29, 9, 9)
	if math.Abs(got-(1_834_097.29-18)) > 1e-6 {
		t.Fatalf("SearchSecondsLog with 1e9x1e9 = %.4f, want total-18", got)
	}
}

func TestTimeConversions(t *testing.T) {
	// Seconds -> years subtracts log10(seconds per year) ~ 7.499.
	yrs := SecondsToYearsLog(7.49903546) // ~1 year in seconds
	if math.Abs(yrs) > 1e-3 {
		t.Fatalf("SecondsToYearsLog(1 year) = %.4f, want ~0", yrs)
	}
	// Years -> universe ages subtracts log10(age of universe in years) ~ 10.14.
	ages := YearsToUniverseAgesLog(UniverseAgeYearsLog)
	if math.Abs(ages) > 1e-6 {
		t.Fatalf("YearsToUniverseAgesLog(age) = %.6f, want 0", ages)
	}
}

func TestExaminedFractionLog(t *testing.T) {
	// Having checked 10^5 of 10^1,834,097 leaves the fraction astronomically tiny.
	frac := ExaminedFractionLog(5, 1_834_097.29)
	if math.Abs(frac-(5-1_834_097.29)) > 1e-6 {
		t.Fatalf("ExaminedFractionLog = %.4f", frac)
	}
}

func TestZerosBeforeSignificant(t *testing.T) {
	cases := []struct {
		log10 float64
		want  int
	}{
		{-1, 0}, // 0.1
		{-2, 1}, // 0.01
		{-3, 2}, // 0.001
		{-1834000, 1833999},
	}
	for _, c := range cases {
		if got := ZerosBeforeSignificant(c.log10); got != c.want {
			t.Errorf("ZerosBeforeSignificant(%v) = %d, want %d", c.log10, got, c.want)
		}
	}
}

func TestFormatScientific(t *testing.T) {
	s := FormatScientific(1_834_097.29)
	if !strings.Contains(s, "10^1,834,097") {
		t.Fatalf("FormatScientific should show grouped exponent, got %q", s)
	}
	// Small magnitudes render as a plain grouped integer, not 10^x.
	if got := FormatScientific(3); got != "1,000" {
		t.Fatalf("FormatScientific(3) = %q, want \"1,000\"", got)
	}
}

func TestCommas(t *testing.T) {
	cases := map[int64]string{0: "0", 12: "12", 1000: "1,000", 1234567: "1,234,567", -1834097: "-1,834,097"}
	for in, want := range cases {
		if got := Commas(in); got != want {
			t.Errorf("Commas(%d) = %q, want %q", in, got, want)
		}
	}
}
