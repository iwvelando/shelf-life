// Package library lays out the Library of Babel, after Borges and after the hell
// of Steven L. Peck's *A Short Stay in Hell*: every possible page of 40 lines of
// 80 characters, drawn from 25 symbols, shelved in hexagonal galleries.
//
// Nothing is stored. A page's location and its text are two spellings of the
// same number: Location folds (hexagon, wall, shelf, volume, page) into one
// integer, and an invertible scramble modulo 25^3200 turns that integer into the
// page's 3,200 base-25 digits. So every page has exactly one location, every
// location in range has exactly one page, and either can be computed from the
// other. That is also the cruelty of it: the hexagon number needed to find a page
// is longer than the page.
//
// This models a library of pages. In the full Library each page recurs in an
// astronomical number of books; here a page is found in one place.
package library

import (
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"strings"
	"sync"
)

// Alphabet is Borges' set of 25 orthographic symbols: 22 letters, the space, the
// comma, and the period. Every page is written in these and only these.
const Alphabet = "abcdefghijklmnopqrstuv ,."

// Page and gallery geometry. Four of each hexagon's six walls hold shelves.
const (
	LineLength   = 80
	LinesPerPage = 40
	Pages        = 410
	Walls        = 4
	Shelves      = 5
	Volumes      = 32

	PageChars       = LineLength * LinesPerPage
	BooksPerHexagon = Walls * Shelves * Volumes
	PagesPerHexagon = BooksPerHexagon * Pages

	// HexagonDigits is the length of the largest hexagon number, in decimal.
	HexagonDigits = 4468
)

// Location is where a page is shelved. All fields are zero-based.
type Location struct {
	Hexagon *big.Int
	Wall    int
	Shelf   int
	Volume  int
	Page    int
}

// Equal reports whether two locations name the same page.
func (l Location) Equal(o Location) bool {
	return l.Hexagon != nil && o.Hexagon != nil && l.Hexagon.Cmp(o.Hexagon) == 0 &&
		l.Wall == o.Wall && l.Shelf == o.Shelf && l.Volume == o.Volume && l.Page == o.Page
}

// Clone returns a copy that shares no memory with l.
func (l Location) Clone() Location {
	c := l
	if l.Hexagon != nil {
		c.Hexagon = new(big.Int).Set(l.Hexagon)
	}
	return c
}

type locationJSON struct {
	Hexagon string `json:"hexagon"`
	Wall    int    `json:"wall"`
	Shelf   int    `json:"shelf"`
	Volume  int    `json:"volume"`
	Page    int    `json:"page"`
}

// MarshalJSON writes the hexagon as a decimal string: it has thousands of digits.
func (l Location) MarshalJSON() ([]byte, error) {
	h := ""
	if l.Hexagon != nil {
		h = l.Hexagon.String()
	}
	return json.Marshal(locationJSON{h, l.Wall, l.Shelf, l.Volume, l.Page})
}

// UnmarshalJSON reads a location written by MarshalJSON.
func (l *Location) UnmarshalJSON(b []byte) error {
	var v locationJSON
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}
	h, err := ParseHexagon(v.Hexagon)
	if err != nil {
		return err
	}
	*l = Location{h, v.Wall, v.Shelf, v.Volume, v.Page}
	return nil
}

// ParseHexagon reads a hexagon number: decimal digits only, within the Library.
func ParseHexagon(s string) (*big.Int, error) {
	if s == "" || len(s) > HexagonDigits+64 {
		return nil, errors.New("a hexagon number is between 1 and 4,468 digits")
	}
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return nil, errors.New("a hexagon number is written in digits only")
		}
	}
	h, _ := new(big.Int).SetString(s, 10)
	if h.Cmp(MaxHexagon()) > 0 {
		return nil, errors.New("there is no hexagon that far out")
	}
	return h, nil
}

// ---- the scramble -----------------------------------------------------------

type layout struct {
	n        *big.Int // 25^3200: the number of distinct pages
	maxHex   *big.Int
	a1, b1   *big.Int
	a2, b2   *big.Int
	a1i, a2i *big.Int // modular inverses of a1, a2
}

var (
	layoutOnce sync.Once
	lib        layout
)

func get() *layout {
	layoutOnce.Do(func() {
		n := new(big.Int).Exp(big.NewInt(25), big.NewInt(PageChars), nil)
		lib = layout{n: n}
		lib.maxHex = new(big.Int).Div(new(big.Int).Sub(n, big.NewInt(1)), big.NewInt(PagesPerHexagon))
		lib.a1, lib.a1i = unit(n, "multiplier/1")
		lib.a2, lib.a2i = unit(n, "multiplier/2")
		lib.b1 = constant(n, "offset/1")
		lib.b2 = constant(n, "offset/2")
	})
	return &lib
}

// constant derives a fixed, patternless residue modulo n from a label. Changing
// a label moves every page in the Library.
func constant(n *big.Int, label string) *big.Int {
	var buf []byte
	for i := 0; len(buf)*8 < n.BitLen()+64; i++ {
		sum := sha256.Sum256([]byte(fmt.Sprintf("shelf-life/%s/%d", label, i)))
		buf = append(buf, sum[:]...)
	}
	return new(big.Int).Mod(new(big.Int).SetBytes(buf), n)
}

// unit derives a constant that is invertible modulo n = 25^k (not a multiple of 5).
func unit(n *big.Int, label string) (*big.Int, *big.Int) {
	a := constant(n, label)
	for new(big.Int).Mod(a, big.NewInt(5)).Sign() == 0 {
		a.Add(a, big.NewInt(1))
	}
	return a, new(big.Int).ModInverse(a, n)
}

// MaxHexagon is the number of the last hexagon (zero-based).
func MaxHexagon() *big.Int { return new(big.Int).Set(get().maxHex) }

// digits25 renders x as exactly PageChars base-25 digits, most significant first.
func digits25(x *big.Int) []byte {
	s := x.Text(25)
	out := make([]byte, PageChars)
	pad := PageChars - len(s)
	for i := range out {
		if i < pad {
			out[i] = 0
		} else {
			out[i] = digitValue(s[i-pad])
		}
	}
	return out
}

func digitValue(c byte) byte {
	if c <= '9' {
		return c - '0'
	}
	return c - 'a' + 10
}

const digitChars = "0123456789abcdefghijklmno"

func fromDigits25(d []byte) *big.Int {
	s := make([]byte, len(d))
	for i, v := range d {
		s[i] = digitChars[v]
	}
	x, _ := new(big.Int).SetString(string(s), 25)
	return x
}

func reverse(d []byte) {
	for i, j := 0, len(d)-1; i < j; i, j = i+1, j-1 {
		d[i], d[j] = d[j], d[i]
	}
}

// affine returns (a*x + b) mod n.
func affine(a, x, b, n *big.Int) *big.Int {
	y := new(big.Int).Mul(a, x)
	y.Add(y, b)
	return y.Mod(y, n)
}

// unaffine inverts affine given a's inverse: (x - b) * ai mod n.
func unaffine(ai, x, b, n *big.Int) *big.Int {
	y := new(big.Int).Sub(x, b)
	y.Mul(y, ai)
	return y.Mod(y, n)
}

// scramble maps a slot number to page digits. Both ends of the page depend on
// every digit of the slot: an affine map, a digit reversal, and another affine map.
func scramble(slot *big.Int) []byte {
	l := get()
	d := digits25(affine(l.a1, slot, l.b1, l.n))
	reverse(d)
	return digits25(affine(l.a2, fromDigits25(d), l.b2, l.n))
}

func unscramble(page []byte) *big.Int {
	l := get()
	d := digits25(unaffine(l.a2i, fromDigits25(page), l.b2, l.n))
	reverse(d)
	return unaffine(l.a1i, fromDigits25(d), l.b1, l.n)
}

// ---- locations and pages ----------------------------------------------------

func (l Location) validate() error {
	switch {
	case l.Hexagon == nil || l.Hexagon.Sign() < 0:
		return errors.New("a hexagon number is zero or more")
	case l.Wall < 0 || l.Wall >= Walls:
		return fmt.Errorf("wall must be 1–%d", Walls)
	case l.Shelf < 0 || l.Shelf >= Shelves:
		return fmt.Errorf("shelf must be 1–%d", Shelves)
	case l.Volume < 0 || l.Volume >= Volumes:
		return fmt.Errorf("volume must be 1–%d", Volumes)
	case l.Page < 0 || l.Page >= Pages:
		return fmt.Errorf("page must be 1–%d", Pages)
	}
	return nil
}

func (l Location) slot() *big.Int {
	s := new(big.Int).Mul(l.Hexagon, big.NewInt(Walls))
	s.Add(s, big.NewInt(int64(l.Wall)))
	s.Mul(s, big.NewInt(Shelves))
	s.Add(s, big.NewInt(int64(l.Shelf)))
	s.Mul(s, big.NewInt(Volumes))
	s.Add(s, big.NewInt(int64(l.Volume)))
	s.Mul(s, big.NewInt(Pages))
	return s.Add(s, big.NewInt(int64(l.Page)))
}

func locationOfSlot(slot *big.Int) Location {
	s := new(big.Int).Set(slot)
	next := func(n int64) int {
		m := new(big.Int)
		s.DivMod(s, big.NewInt(n), m)
		return int(m.Int64())
	}
	page := next(Pages)
	vol := next(Volumes)
	shelf := next(Shelves)
	wall := next(Walls)
	return Location{Hexagon: s, Wall: wall, Shelf: shelf, Volume: vol, Page: page}
}

// PageAt returns the 40 lines of the page shelved at loc.
func PageAt(loc Location) ([]string, error) {
	if err := loc.validate(); err != nil {
		return nil, err
	}
	slot := loc.slot()
	if slot.Cmp(get().n) >= 0 {
		return nil, errors.New("that shelf lies past the end of the Library")
	}
	return lines(scramble(slot)), nil
}

// LocationOf returns where a page of exactly 3,200 alphabet characters is shelved.
func LocationOf(page string) (Location, error) {
	if len(page) != PageChars {
		return Location{}, fmt.Errorf("a page is %d characters, not %d", PageChars, len(page))
	}
	d := make([]byte, PageChars)
	for i := 0; i < PageChars; i++ {
		k := strings.IndexByte(Alphabet, page[i])
		if k < 0 {
			return Location{}, fmt.Errorf("%q is not in the Library's alphabet", page[i])
		}
		d[i] = byte(k)
	}
	return locationOfSlot(unscramble(d)), nil
}

func lines(d []byte) []string {
	out := make([]string, LinesPerPage)
	buf := make([]byte, LineLength)
	for i := range out {
		for j := range buf {
			buf[j] = Alphabet[d[i*LineLength+j]]
		}
		out[i] = string(buf)
	}
	return out
}

// ---- randomness -------------------------------------------------------------

// randBelow draws a uniform integer in [0, n) from r by rejection sampling.
func randBelow(r io.Reader, n *big.Int) *big.Int {
	bits := n.BitLen()
	buf := make([]byte, (bits+7)/8)
	mask := byte(0xff >> (len(buf)*8 - bits))
	for {
		if _, err := io.ReadFull(r, buf); err != nil {
			panic("library: randomness source failed: " + err.Error())
		}
		buf[0] &= mask
		x := new(big.Int).SetBytes(buf)
		if x.Cmp(n) < 0 {
			return x
		}
	}
}

func randInt(r io.Reader, n int) int { return int(randBelow(r, big.NewInt(int64(n))).Int64()) }

// RandomLocation picks a page uniformly from the whole Library.
func RandomLocation(r io.Reader) Location {
	return locationOfSlot(randBelow(r, get().n))
}

func noise(r io.Reader, n int) []byte {
	out := make([]byte, 0, n)
	buf := make([]byte, n)
	for len(out) < n {
		if _, err := io.ReadFull(r, buf); err != nil {
			panic("library: randomness source failed: " + err.Error())
		}
		for _, b := range buf {
			if b < 250 && len(out) < n {
				out = append(out, Alphabet[b%25])
			}
		}
	}
	return out
}

// ---- finding a text ---------------------------------------------------------

// Mode says how a text sits on the page built around it.
type Mode string

const (
	Noise Mode = "noise" // somewhere on a page of otherwise random characters
	Blank Mode = "blank" // at the top of an otherwise empty page
	Line  Mode = "line"  // alone on one line of an otherwise random page
)

// Found is a page containing a text, and where that page is shelved.
type Found struct {
	Location Location `json:"location"`
	Lines    []string `json:"lines"`
	Offset   int      `json:"offset"` // index of the text in the joined page
	Length   int      `json:"length"`
	Spelling Spelling `json:"spelling"`
}

// Locate spells text in the Library's alphabet, builds a page holding it, and
// finds where that page is shelved. r supplies the surrounding noise.
func Locate(text string, mode Mode, r io.Reader) (Found, error) {
	sp := Spell(text)
	t := sp.Text
	switch {
	case strings.TrimSpace(text) == "":
		return Found{}, errors.New("write something to look for")
	case t == "":
		return Found{}, errors.New("none of that can be spelled in the Library's alphabet")
	case len(t) > PageChars:
		return Found{}, fmt.Errorf("that is longer than a page (%d characters)", PageChars)
	}
	var page []byte
	offset := 0
	switch mode {
	case Noise:
		page = noise(r, PageChars)
		if len(t) <= LineLength {
			// A text that fits on a line is not split across two.
			offset = randInt(r, LinesPerPage)*LineLength + randInt(r, LineLength-len(t)+1)
		} else {
			offset = randInt(r, PageChars-len(t)+1)
		}
	case Blank:
		page = []byte(strings.Repeat(" ", PageChars))
	case Line:
		if len(t) > LineLength {
			return Found{}, fmt.Errorf("a line holds %d characters", LineLength)
		}
		page = noise(r, PageChars)
		offset = randInt(r, LinesPerPage) * LineLength
		copy(page[offset:offset+LineLength], strings.Repeat(" ", LineLength))
	default:
		return Found{}, fmt.Errorf("unknown mode %q", mode)
	}
	copy(page[offset:], t)
	loc, err := LocationOf(string(page))
	if err != nil {
		return Found{}, err
	}
	return Found{Location: loc, Lines: lines(indices(page)), Offset: offset, Length: len(t), Spelling: sp}, nil
}

func indices(page []byte) []byte {
	d := make([]byte, len(page))
	for i, c := range page {
		d[i] = byte(strings.IndexByte(Alphabet, c))
	}
	return d
}
