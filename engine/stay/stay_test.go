package stay

import (
	"math"
	"strings"
	"testing"

	"shelflife/engine/scale"
)

func near(t *testing.T, name string, got, want, tol float64) {
	t.Helper()
	if math.Abs(got-want) > tol {
		t.Errorf("%s = %.4f, want %.4f ± %g", name, got, want, tol)
	}
}

func TestTheLibrary(t *testing.T) {
	c := Library()
	near(t, "BooksLog", c.BooksLog, 1_312_000*math.Log10(29), 1e-6)
	if c.BookDigits != 1_918_667 {
		t.Errorf("BookDigits = %d, want 1,918,667", c.BookDigits)
	}
	if !strings.Contains(c.BooksText, "× 10^1,918,666") {
		t.Errorf("BooksText = %q", c.BooksText)
	}
	near(t, "HexagonsLog", c.HexagonsLog, c.BooksLog-math.Log10(640), 1e-9)
	// Packed into a cube, the side is the cube root of the hexagon count.
	near(t, "CubeSideHexagonsLog", c.CubeSideHexagonsLog, c.HexagonsLog/3, 1e-9)
	if !strings.Contains(c.CubeSideHexagonsText, "10^639,554") {
		t.Errorf("CubeSideHexagonsText = %q", c.CubeSideHexagonsText)
	}
	// Three metres a gallery, against an 8.8e26 m observable universe.
	near(t, "CubeSideUniversesLog", c.CubeSideUniversesLog, c.CubeSideHexagonsLog+math.Log10(3)-math.Log10(8.8e26), 1e-9)
	if c.HexagonDigits != 4675 || c.PageChars != 3200 {
		t.Errorf("address figures = %d digits, %d chars", c.HexagonDigits, c.PageChars)
	}
}

func TestReckonMatchesTheTerminalScenarios(t *testing.T) {
	total := Library().BooksLog
	cases := []struct {
		searchers, rate float64
	}{
		{0, 0}, {0, 1}, {11.07, 0}, {9, 9}, {scale.AtomsInUniverseLog, 12}, {scale.AtomsInUniverseLog, 43.27},
	}
	for _, c := range cases {
		r, err := Reckon(Effort{SearchersLog: c.searchers, RateLog: c.rate, YearsLog: 10})
		if err != nil {
			t.Fatal(err)
		}
		sec := total - c.searchers - c.rate
		near(t, "SecondsLog", r.SecondsLog, sec, 1e-9)
		if r.SecondsText != scale.FormatScientific(sec) {
			t.Errorf("SecondsText = %q", r.SecondsText)
		}
		if r.UniverseAgesText != scale.FormatScientific(scale.YearsToUniverseAgesLog(scale.SecondsToYearsLog(sec))) {
			t.Errorf("UniverseAgesText = %q", r.UniverseAgesText)
		}
		near(t, "DigitsRemoved", r.DigitsRemoved, c.searchers+c.rate, 1e-9)
	}
}

func TestEverythingBarelyMovesTheExponent(t *testing.T) {
	// Every atom checking a book every Planck instant still leaves a
	// 1.9-million-digit wait.
	r, _ := Reckon(Effort{SearchersLog: 80, RateLog: 43.27, YearsLog: 100})
	if !strings.Contains(r.SecondsText, "10^1,918,5") {
		t.Fatalf("SecondsText = %q", r.SecondsText)
	}
	if r.DigitsRemoved/float64(Library().BookDigits) > 1e-4 {
		t.Fatalf("removed %.0f digits: more than a hair of the exponent", r.DigitsRemoved)
	}
	if r.Finished {
		t.Fatal("nothing finishes the Library")
	}
}

func TestReckonWhatAnEffortSees(t *testing.T) {
	// Every atom, a trillion books a second, since the Big Bang.
	years := scale.UniverseAgeYearsLog
	r, _ := Reckon(Effort{SearchersLog: 80, RateLog: 12, YearsLog: years})
	examined := 80 + 12 + years + scale.SecondsPerYearLog
	near(t, "ExaminedLog", r.ExaminedLog, examined, 1e-9)
	wantZeros := scale.ZerosBeforeSignificant(examined - Library().BooksLog + 2)
	if r.FractionZeros != wantZeros {
		t.Errorf("FractionZeros = %d, want %d", r.FractionZeros, wantZeros)
	}
	if !strings.Contains(r.FractionText, "zeros") {
		t.Errorf("FractionText = %q", r.FractionText)
	}
}

func TestReckonCanFinishOnlyAbsurdly(t *testing.T) {
	r, err := Reckon(Effort{SearchersLog: 1_000_000, RateLog: 1_000_000, YearsLog: 0})
	if err != nil {
		t.Fatal(err)
	}
	if !r.Finished || r.SecondsText != "less than 1" {
		t.Fatalf("an absurd effort should finish: %+v", r)
	}
}

func TestReckonRejectsNonsense(t *testing.T) {
	for _, e := range []Effort{
		{SearchersLog: math.NaN()},
		{RateLog: math.Inf(1)},
		{SearchersLog: -1},
		{YearsLog: 1e8},
	} {
		if _, err := Reckon(e); err == nil {
			t.Errorf("Reckon(%+v) accepted", e)
		}
	}
}

func TestSearch(t *testing.T) {
	r, err := Search(10_000)
	if err != nil {
		t.Fatal(err)
	}
	if r.ExaminedText != "10,000" {
		t.Errorf("ExaminedText = %q", r.ExaminedText)
	}
	// 10^4 of 10^1,918,666.17 books, in percent: 10^-1,918,660.17.
	if r.FractionZeros != 1_918_660 {
		t.Errorf("FractionZeros = %d", r.FractionZeros)
	}
	if r.FractionText != "0.000000000000…(1,918,660 zeros)…1" {
		t.Errorf("FractionText = %q", r.FractionText)
	}
	if _, err := Search(0); err == nil {
		t.Error("Search(0) accepted")
	}
	if _, err := Search(math.NaN()); err == nil {
		t.Error("Search(NaN) accepted")
	}
}

func TestFall(t *testing.T) {
	r, err := Fall(1)
	if err != nil {
		t.Fatal(err)
	}
	// Three days at a 55 m/s terminal velocity, three metres a gallery.
	if r.KilometresText != "14,256" || r.GalleriesText != "4,752,000" {
		t.Errorf("one fall = %s km, %s galleries", r.KilometresText, r.GalleriesText)
	}
	two, _ := Fall(2)
	if two.GalleriesText != "9,504,000" {
		t.Errorf("two falls = %s galleries", two.GalleriesText)
	}
	want := scale.ZerosBeforeSignificant(math.Log10(4_752_000) - Library().CubeSideHexagonsLog + 2)
	if r.FractionZeros != want {
		t.Errorf("FractionZeros = %d, want %d", r.FractionZeros, want)
	}
	if _, err := Fall(0); err == nil {
		t.Error("Fall(0) accepted")
	}
}

func TestTime(t *testing.T) {
	r, err := Time(86_400)
	if err != nil {
		t.Fatal(err)
	}
	if r.SecondsText != "86,400" {
		t.Errorf("SecondsText = %q", r.SecondsText)
	}
	want := scale.ZerosBeforeSignificant(math.Log10(86_400) - scale.UniverseAgeSecondsLog)
	if r.UniverseZeros != want {
		t.Errorf("UniverseZeros = %d, want %d", r.UniverseZeros, want)
	}
	if !strings.HasPrefix(r.UniverseFractionText, "0.") {
		t.Errorf("UniverseFractionText = %q", r.UniverseFractionText)
	}
	if _, err := Time(-1); err == nil {
		t.Error("Time(-1) accepted")
	}
}

func TestFractionText(t *testing.T) {
	if got := FractionText(2); got != "0.00…1" {
		t.Errorf("FractionText(2) = %q", got)
	}
	if got := FractionText(1_000_000); got != "0.000000000000…(1,000,000 zeros)…1" {
		t.Errorf("FractionText(1e6) = %q", got)
	}
}
