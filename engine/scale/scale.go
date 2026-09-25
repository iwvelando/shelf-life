// Package scale performs the arithmetic of the incomprehensible.
//
// The Library of Babel — the hell of Steven L. Peck's *A Short Stay in Hell* —
// holds every possible book. That count (~10^1,918,666) cannot be stored in any
// float64 or int128 the machine has. So nearly everything here is reasoned about
// in base-10 logarithms: a "Log" value x stands in for the number 10^x. Addition
// of logs is multiplication of the numbers; subtraction is division. The whole
// point of the experience lives in this trick — you can multiply your effort by
// a billion (add 9 to a log) and watch a 1.9-million-digit exponent shrug it off.
package scale

import "math"

// Library dimensions, following Borges as Peck does, 80 characters to a line,
// 40 lines to a page, 410 pages, but with an alphabet of all 26 letters, the
// space, the comma, and the period.
const (
	Charset      = 29
	LineLength   = 80
	LinesPerPage = 40
	Pages        = 410
)

// Cosmic yardsticks, as base-10 logarithms.
var (
	// SecondsPerYearLog is log10 of a Julian year in seconds (31,557,600).
	SecondsPerYearLog = math.Log10(365.25 * 24 * 60 * 60)
	// UniverseAgeYearsLog is log10 of the age of the universe in years (~13.8e9).
	UniverseAgeYearsLog = math.Log10(13.8e9)
	// UniverseAgeSecondsLog is log10 of the age of the universe in seconds.
	UniverseAgeSecondsLog = math.Log10(13.8e9) + SecondsPerYearLog
)

// AtomsInUniverseLog is log10 of the estimated number of atoms in the
// observable universe (~10^80). Used as a "what if every atom searched" knob.
const AtomsInUniverseLog = 80.0

// CharsPerBook returns the number of character positions in a single book.
func CharsPerBook(lineLen, linesPerPage, pages int) int {
	return lineLen * linesPerPage * pages
}

// Log10Books returns log10 of the number of distinct books: charset^charsPerBook.
func Log10Books(charset, charsPerBook int) float64 {
	return float64(charsPerBook) * math.Log10(float64(charset))
}

// SearchSecondsLog returns log10 of the seconds needed to examine every book,
// given log10 of the number of searchers and log10 of the books each checks
// per second. seconds = total / (searchers * rate).
func SearchSecondsLog(totalBooksLog, searchersLog, ratePerSecLog float64) float64 {
	return totalBooksLog - searchersLog - ratePerSecLog
}

// SecondsToYearsLog converts a log10-seconds value to log10-years.
func SecondsToYearsLog(secLog float64) float64 { return secLog - SecondsPerYearLog }

// YearsToUniverseAgesLog expresses a log10-years value in current ages of the
// universe (log10).
func YearsToUniverseAgesLog(yrLog float64) float64 { return yrLog - UniverseAgeYearsLog }

// ExaminedFractionLog returns log10 of (examined / total): how much of the
// Library you have seen. It is always staggeringly negative.
func ExaminedFractionLog(examinedLog, totalLog float64) float64 {
	return examinedLog - totalLog
}

// ZerosBeforeSignificant returns how many zeros follow the decimal point before
// the first non-zero digit of a number whose log10 is given (expects log10 < 0).
// e.g. 0.01 (log10 = -2) has one such zero.
func ZerosBeforeSignificant(log10 float64) int {
	z := int(math.Ceil(-log10)) - 1
	if z < 0 {
		return 0
	}
	return z
}

// FormatScientific renders a log10 value as a human-readable magnitude.
// Below 10^15 it prints the actual integer with thousands separators; above
// that it prints "m × 10^E" with a grouped exponent.
func FormatScientific(log10 float64) string {
	if log10 < 0 {
		return "less than 1"
	}
	if log10 < 15 {
		return Commas(int64(math.Round(math.Pow(10, log10))))
	}
	exp := math.Floor(log10)
	mant := math.Pow(10, log10-exp)
	return formatMantissa(mant) + " × 10^" + Commas(int64(exp))
}

func formatMantissa(m float64) string {
	// Two decimals, e.g. "1.96"; trim to avoid "10.00" rounding artifacts.
	if m >= 10 {
		m /= 10
	}
	return trimFloat(m)
}

func trimFloat(m float64) string {
	// Render with two decimal places.
	whole := int64(m)
	frac := int64(math.Round((m - float64(whole)) * 100))
	if frac == 100 {
		whole++
		frac = 0
	}
	out := itoa(whole) + "."
	if frac < 10 {
		out += "0"
	}
	return out + itoa(frac)
}

// Commas formats an integer with thousands separators.
func Commas(n int64) string {
	neg := n < 0
	if neg {
		n = -n
	}
	s := itoa(n)
	var out []byte
	for i, c := range []byte(s) {
		if i > 0 && (len(s)-i)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, c)
	}
	if neg {
		return "-" + string(out)
	}
	return string(out)
}

func itoa(n int64) string {
	if n == 0 {
		return "0"
	}
	var b []byte
	for n > 0 {
		b = append([]byte{byte('0' + n%10)}, b...)
		n /= 10
	}
	return string(b)
}
