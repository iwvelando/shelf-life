package library

import (
	"strings"
	"unicode"
)

// Spelling is a text as the Library can write it, and what had to change.
type Spelling struct {
	Text    string   `json:"text"`
	Changes []Change `json:"changes"`
}

// Change records one substitution; To is empty when a character was dropped.
type Change struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// The alphabet has no digits and only three marks. These stand in for the rest.
var respell = map[rune]string{
	'0': "zero", '1': "one", '2': "two", '3': "three", '4': "four",
	'5': "five", '6': "six", '7': "seven", '8': "eight", '9': "nine",
	'!': ".", '?': ".", ';': ",", ':': ",",
}

// Spell writes text in the Library's alphabet: lower case, with digits written
// as words and some marks replaced. Whitespace becomes a space; anything else
// unspellable is dropped. Each distinct change is reported once, in order.
func Spell(text string) Spelling {
	var b strings.Builder
	var changes []Change
	seen := map[rune]bool{}
	note := func(r rune, to string) {
		if !seen[r] {
			seen[r] = true
			changes = append(changes, Change{From: string(r), To: to})
		}
	}
	prevDigit := false
	for _, r := range text {
		r = unicode.ToLower(r)
		digit := r >= '0' && r <= '9'
		switch {
		case strings.ContainsRune(Alphabet, r):
			b.WriteRune(r)
		case unicode.IsSpace(r):
			b.WriteByte(' ')
		case respell[r] != "":
			if digit && prevDigit {
				b.WriteByte(' ')
			}
			b.WriteString(respell[r])
			note(r, respell[r])
		default:
			note(r, "")
		}
		prevDigit = digit
	}
	return Spelling{Text: b.String(), Changes: changes}
}
