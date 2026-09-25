// Package stay reckons the figures each room of the website shows: the size of
// the Library, what an effort against it achieves, how far a fall goes, and how
// long a stay has lasted. Everything that could overflow is kept as a base-10
// logarithm (package scale); results carry both the logs, for drawing, and
// display text.
package stay

import (
	"errors"
	"fmt"
	"math"
	"strings"

	"shelflife/engine/library"
	"shelflife/engine/scale"
)

// Stated assumptions, documented in docs/mathematics.md.
const (
	// GalleryMetres is the height (and, for the cube, the width) of one gallery.
	GalleryMetres = 3.0
	// ObservableUniverseMetres is the diameter of the observable universe.
	ObservableUniverseMetres = 8.8e26
	// TerminalVelocity is a falling body's speed in air, in metres per second.
	TerminalVelocity = 55.0
	// FallSeconds is how long each fall lasts: three days.
	FallSeconds = 3 * 86_400.0

	// maxLog bounds any exponent a visitor supplies.
	maxLog = 10_000_000.0
)

// Constants describes the whole Library.
type Constants struct {
	BooksLog             float64 `json:"booksLog"`
	BooksText            string  `json:"booksText"`
	BookDigits           int     `json:"bookDigits"`
	HexagonsLog          float64 `json:"hexagonsLog"`
	HexagonsText         string  `json:"hexagonsText"`
	CubeSideHexagonsLog  float64 `json:"cubeSideHexagonsLog"`
	CubeSideHexagonsText string  `json:"cubeSideHexagonsText"`
	CubeSideUniversesLog float64 `json:"cubeSideUniversesLog"`
	CubeSideUniverseText string  `json:"cubeSideUniversesText"`
	HexagonDigits        int     `json:"hexagonDigits"`
	PageChars            int     `json:"pageChars"`
}

// Library returns the Library's dimensions.
func Library() Constants {
	books := scale.Log10Books(len(library.Alphabet),
		scale.CharsPerBook(library.LineLength, library.LinesPerPage, library.Pages))
	hex := books - math.Log10(library.BooksPerHexagon)
	side := hex / 3
	universes := side + math.Log10(GalleryMetres) - math.Log10(ObservableUniverseMetres)
	return Constants{
		BooksLog:             books,
		BooksText:            scale.FormatScientific(books),
		BookDigits:           int(math.Floor(books)) + 1,
		HexagonsLog:          hex,
		HexagonsText:         scale.FormatScientific(hex),
		CubeSideHexagonsLog:  side,
		CubeSideHexagonsText: scale.FormatScientific(side),
		CubeSideUniversesLog: universes,
		CubeSideUniverseText: scale.FormatScientific(universes),
		HexagonDigits:        library.HexagonDigits,
		PageChars:            library.PageChars,
	}
}

// Effort is a search party, as logs: how many searchers, how many books each
// checks per second, and for how many years.
type Effort struct {
	SearchersLog float64 `json:"searchersLog"`
	RateLog      float64 `json:"rateLog"`
	YearsLog     float64 `json:"yearsLog"`
}

// EffortReport is what an effort achieves against the Library.
type EffortReport struct {
	SecondsLog       float64 `json:"secondsLog"`
	SecondsText      string  `json:"secondsText"`
	YearsText        string  `json:"yearsText"`
	UniverseAgesText string  `json:"universeAgesText"`
	// DigitsRemoved is how much the effort shortens the time to finish, in digits.
	DigitsRemoved float64 `json:"digitsRemoved"`
	ExaminedLog   float64 `json:"examinedLog"`
	ExaminedText  string  `json:"examinedText"`
	FractionZeros int     `json:"fractionZeros"`
	FractionText  string  `json:"fractionText"`
	Finished      bool    `json:"finished"`
}

func checkLog(name string, v, min float64) error {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return fmt.Errorf("%s must be a number", name)
	}
	if v < min || v > maxLog {
		return fmt.Errorf("%s must be between %g and %s", name, min, scale.Commas(int64(maxLog)))
	}
	return nil
}

// Reckon works out how long an effort takes to read every book, and how much
// of the Library it sees in its allotted years.
func Reckon(e Effort) (EffortReport, error) {
	if err := errors.Join(
		checkLog("searchers", e.SearchersLog, 0),
		checkLog("books per second", e.RateLog, -20),
		checkLog("years", e.YearsLog, -20),
	); err != nil {
		return EffortReport{}, err
	}
	total := Library().BooksLog
	sec := scale.SearchSecondsLog(total, e.SearchersLog, e.RateLog)
	yr := scale.SecondsToYearsLog(sec)
	examined := e.SearchersLog + e.RateLog + e.YearsLog + scale.SecondsPerYearLog
	r := EffortReport{
		SecondsLog:       sec,
		SecondsText:      scale.FormatScientific(sec),
		YearsText:        scale.FormatScientific(yr),
		UniverseAgesText: scale.FormatScientific(scale.YearsToUniverseAgesLog(yr)),
		DigitsRemoved:    e.SearchersLog + e.RateLog,
		ExaminedLog:      examined,
		ExaminedText:     scale.FormatScientific(examined),
		Finished:         examined >= total,
	}
	if r.Finished {
		r.FractionText = "all of it"
	} else {
		r.FractionZeros = scale.ZerosBeforeSignificant(scale.ExaminedFractionLog(examined, total) + 2)
		r.FractionText = FractionText(r.FractionZeros)
	}
	return r, nil
}

// SearchReport is how much of the Library a personal tally amounts to.
type SearchReport struct {
	ExaminedText  string `json:"examinedText"`
	FractionZeros int    `json:"fractionZeros"`
	FractionText  string `json:"fractionText"` // in percent
}

// Search reports the percentage of the Library that examined books represent.
func Search(examined float64) (SearchReport, error) {
	if math.IsNaN(examined) || math.IsInf(examined, 0) || examined < 1 {
		return SearchReport{}, errors.New("examined must be at least one book")
	}
	fracPct := scale.ExaminedFractionLog(math.Log10(examined), Library().BooksLog) + 2
	zeros := scale.ZerosBeforeSignificant(fracPct)
	return SearchReport{
		ExaminedText:  scale.FormatScientific(math.Log10(examined)),
		FractionZeros: zeros,
		FractionText:  FractionText(zeros),
	}, nil
}

// FallReport is how far all of a visitor's falls have carried them.
type FallReport struct {
	KilometresText string `json:"kilometresText"`
	GalleriesText  string `json:"galleriesText"`
	FractionZeros  int    `json:"fractionZeros"`
	FractionText   string `json:"fractionText"` // percent of the cube's height
}

// Fall reports the total depth of a number of falls, against the height of the
// Library packed into a cube.
func Fall(deaths int) (FallReport, error) {
	if deaths < 1 {
		return FallReport{}, errors.New("a fall needs at least one death")
	}
	metres := float64(deaths) * TerminalVelocity * FallSeconds
	galleries := metres / GalleryMetres
	zeros := scale.ZerosBeforeSignificant(math.Log10(galleries) - Library().CubeSideHexagonsLog + 2)
	return FallReport{
		KilometresText: scale.FormatScientific(math.Log10(metres / 1000)),
		GalleriesText:  scale.FormatScientific(math.Log10(galleries)),
		FractionZeros:  zeros,
		FractionText:   FractionText(zeros),
	}, nil
}

// TimeReport sets a stay's length against the age of the universe.
type TimeReport struct {
	SecondsText          string `json:"secondsText"`
	UniverseZeros        int    `json:"universeZeros"`
	UniverseFractionText string `json:"universeFractionText"`
}

// Time reports seconds spent as a fraction of one age of the universe.
func Time(seconds float64) (TimeReport, error) {
	if math.IsNaN(seconds) || math.IsInf(seconds, 0) || seconds < 0 {
		return TimeReport{}, errors.New("seconds must be zero or more")
	}
	secLog := math.Log10(math.Max(seconds, 1))
	zeros := scale.ZerosBeforeSignificant(scale.ExaminedFractionLog(secLog, scale.UniverseAgeSecondsLog))
	return TimeReport{
		SecondsText:          scale.FormatScientific(secLog),
		UniverseZeros:        zeros,
		UniverseFractionText: FractionText(zeros),
	}, nil
}

// FractionText renders a fraction by its run of leading zeros, abbreviating
// runs too long to print.
func FractionText(zeros int) string {
	if zeros <= 24 {
		return "0." + strings.Repeat("0", zeros) + "…1"
	}
	return "0.000000000000…(" + scale.Commas(int64(zeros)) + " zeros)…1"
}
