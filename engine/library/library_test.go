package library

import (
	"math/big"
	"math/rand/v2"
	"strings"
	"testing"
)

// seeded returns a deterministic randomness source for reproducible tests.
func seeded(n uint64) *rand.ChaCha8 {
	var seed [32]byte
	seed[0] = byte(n)
	seed[1] = byte(n >> 8)
	return rand.NewChaCha8(seed)
}

func TestAlphabetHas25DistinctSymbols(t *testing.T) {
	if len(Alphabet) != 25 {
		t.Fatalf("Alphabet has %d symbols, want 25", len(Alphabet))
	}
	seen := map[byte]bool{}
	for i := 0; i < len(Alphabet); i++ {
		if seen[Alphabet[i]] {
			t.Fatalf("duplicate symbol %q", Alphabet[i])
		}
		seen[Alphabet[i]] = true
	}
}

func TestGeometry(t *testing.T) {
	if PageChars != 80*40 {
		t.Fatalf("PageChars = %d, want 3200", PageChars)
	}
	if BooksPerHexagon != 4*5*32 {
		t.Fatalf("BooksPerHexagon = %d, want 640", BooksPerHexagon)
	}
}

func TestSpell(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"hello, world.", "hello, uuorld."},
		{"Isaac Velando", "isaac velando"},
		{"Zoe!", "soe."},
		{"x-ray", "csrai"},
		{"agent 7", "agent seven"},
		{"line\tone\ntwo", "line one tuuo"},
		{"café", "caf"},
	}
	for _, c := range cases {
		if got := Spell(c.in).Text; got != c.want {
			t.Errorf("Spell(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestSpellReportsChanges(t *testing.T) {
	s := Spell("Wyatt é")
	if len(s.Changes) == 0 {
		t.Fatal("Spell should report substitutions")
	}
	var saw []string
	for _, c := range s.Changes {
		saw = append(saw, c.From+">"+c.To)
	}
	joined := strings.Join(saw, " ")
	for _, want := range []string{"w>uu", "y>i", "é>"} {
		if !strings.Contains(joined, want) {
			t.Errorf("changes %q missing %q", joined, want)
		}
	}
	// Each distinct change is reported once, and case changes are not reported.
	if strings.Count(joined, "w>uu") != 1 {
		t.Errorf("changes %q repeat w>uu", joined)
	}
}

func TestPageShapeAndAlphabet(t *testing.T) {
	lines, err := PageAt(RandomLocation(seeded(1)))
	if err != nil {
		t.Fatal(err)
	}
	if len(lines) != LinesPerPage {
		t.Fatalf("page has %d lines, want %d", len(lines), LinesPerPage)
	}
	for i, line := range lines {
		if len(line) != LineLength {
			t.Fatalf("line %d has %d chars, want %d", i, len(line), LineLength)
		}
		for j := 0; j < len(line); j++ {
			if strings.IndexByte(Alphabet, line[j]) < 0 {
				t.Fatalf("line %d has out-of-alphabet %q", i, line[j])
			}
		}
	}
}

func TestLocationRoundTrip(t *testing.T) {
	r := seeded(2)
	for i := 0; i < 50; i++ {
		loc := RandomLocation(r)
		lines, err := PageAt(loc)
		if err != nil {
			t.Fatal(err)
		}
		back, err := LocationOf(strings.Join(lines, ""))
		if err != nil {
			t.Fatal(err)
		}
		if !back.Equal(loc) {
			t.Fatalf("round trip moved %v to %v", loc, back)
		}
	}
}

func TestPageRoundTrip(t *testing.T) {
	r := seeded(3)
	for i := 0; i < 50; i++ {
		var b strings.Builder
		for j := 0; j < PageChars; j++ {
			b.WriteByte(Alphabet[r.Uint64()%25])
		}
		page := b.String()
		loc, err := LocationOf(page)
		if err != nil {
			t.Fatal(err)
		}
		lines, err := PageAt(loc)
		if err != nil {
			t.Fatal(err)
		}
		if strings.Join(lines, "") != page {
			t.Fatalf("page %d did not survive LocationOf then PageAt", i)
		}
	}
}

func TestRandomLocationRanges(t *testing.T) {
	r := seeded(4)
	for i := 0; i < 200; i++ {
		loc := RandomLocation(r)
		if loc.Wall < 0 || loc.Wall >= Walls || loc.Shelf < 0 || loc.Shelf >= Shelves ||
			loc.Volume < 0 || loc.Volume >= Volumes || loc.Page < 0 || loc.Page >= Pages {
			t.Fatalf("location out of range: %+v", loc)
		}
		if loc.Hexagon.Sign() < 0 || loc.Hexagon.Cmp(MaxHexagon()) > 0 {
			t.Fatalf("hexagon out of range")
		}
	}
}

func TestHexagonNumbersAreAsLongAsAPage(t *testing.T) {
	// 25^3200 pages / 262,400 pages per hexagon: the largest hexagon number has
	// 4,468 decimal digits, longer than the 3,200 characters of the page itself.
	if got := len(MaxHexagon().String()); got != 4468 {
		t.Fatalf("max hexagon has %d digits, want 4468", got)
	}
	if HexagonDigits != 4468 {
		t.Fatalf("HexagonDigits = %d, want 4468", HexagonDigits)
	}
}

func TestAdjacentPagesAreUnrelated(t *testing.T) {
	loc := RandomLocation(seeded(5))
	loc.Page = 100
	a, _ := PageAt(loc)
	loc.Page = 101
	b, _ := PageAt(loc)
	same := 0
	pa, pb := strings.Join(a, ""), strings.Join(b, "")
	for i := 0; i < PageChars; i++ {
		if pa[i] == pb[i] {
			same++
		}
	}
	// Unrelated pages agree at about 1 position in 25 (128 of 3,200).
	if same > 250 {
		t.Fatalf("adjacent pages share %d of %d positions", same, PageChars)
	}
}

func TestNearbyPagesDifferFromTheFirstCharacter(t *testing.T) {
	// Low-order structure must not leak into the start of the page.
	loc := RandomLocation(seeded(6))
	firsts := map[string]bool{}
	for p := 0; p < 20; p++ {
		loc.Page = p
		lines, _ := PageAt(loc)
		firsts[lines[0][:8]] = true
	}
	if len(firsts) < 20 {
		t.Fatalf("only %d distinct openings across 20 pages", len(firsts))
	}
}

func TestPageAtRejectsImpossibleLocations(t *testing.T) {
	good := RandomLocation(seeded(7))
	bad := []func(*Location){
		func(l *Location) { l.Wall = Walls },
		func(l *Location) { l.Shelf = -1 },
		func(l *Location) { l.Volume = Volumes },
		func(l *Location) { l.Page = Pages },
		func(l *Location) { l.Hexagon = big.NewInt(-1) },
		func(l *Location) { l.Hexagon = new(big.Int).Add(MaxHexagon(), big.NewInt(1)) },
		func(l *Location) { l.Hexagon = nil },
	}
	for i, mutate := range bad {
		loc := good.Clone()
		mutate(&loc)
		if _, err := PageAt(loc); err == nil {
			t.Errorf("case %d: PageAt accepted %+v", i, loc)
		}
	}
}

func TestLastHexagonIsOnlyPartlyShelved(t *testing.T) {
	// 25^3200 is not a multiple of 262,400, so the final hexagon's later pages
	// do not exist.
	loc := Location{Hexagon: MaxHexagon(), Wall: Walls - 1, Shelf: Shelves - 1, Volume: Volumes - 1, Page: Pages - 1}
	if _, err := PageAt(loc); err == nil {
		t.Fatal("the very last slot of the last hexagon should be beyond the Library")
	}
	loc = Location{Hexagon: MaxHexagon()}
	if _, err := PageAt(loc); err != nil {
		t.Fatalf("the first slot of the last hexagon exists: %v", err)
	}
}

func TestLocationOfRejectsBadPages(t *testing.T) {
	if _, err := LocationOf("too short"); err == nil {
		t.Error("accepted a short page")
	}
	if _, err := LocationOf(strings.Repeat("w", PageChars)); err == nil {
		t.Error("accepted out-of-alphabet characters")
	}
}

func TestLocateAmidNoise(t *testing.T) {
	found, err := Locate("Isaac Velando", Noise, seeded(8))
	if err != nil {
		t.Fatal(err)
	}
	page := strings.Join(found.Lines, "")
	if page[found.Offset:found.Offset+found.Length] != "isaac velando" {
		t.Fatalf("text not at offset %d", found.Offset)
	}
	checkLocated(t, found)
}

func TestShortTextAmidNoiseStaysOnOneLine(t *testing.T) {
	r := seeded(13)
	for i := 0; i < 200; i++ {
		found, err := Locate("a line of text", Noise, r)
		if err != nil {
			t.Fatal(err)
		}
		if found.Offset/LineLength != (found.Offset+found.Length-1)/LineLength {
			t.Fatalf("text at offset %d wraps onto the next line", found.Offset)
		}
	}
}

func TestLocateOnABlankPage(t *testing.T) {
	found, err := Locate("a life", Blank, seeded(9))
	if err != nil {
		t.Fatal(err)
	}
	page := strings.Join(found.Lines, "")
	if page != "a life"+strings.Repeat(" ", PageChars-6) || found.Offset != 0 {
		t.Fatalf("blank page wrong: %q…", page[:20])
	}
	checkLocated(t, found)
}

func TestLocateOnOneLine(t *testing.T) {
	found, err := Locate("the name of the place is", Line, seeded(10))
	if err != nil {
		t.Fatal(err)
	}
	row := found.Offset / LineLength
	if found.Offset%LineLength != 0 {
		t.Fatalf("line text should start a line, offset %d", found.Offset)
	}
	want := "the name of the place is" + strings.Repeat(" ", LineLength-24)
	if found.Lines[row] != want {
		t.Fatalf("row %d = %q", row, found.Lines[row])
	}
	checkLocated(t, found)
	if _, err := Locate(strings.Repeat("a", LineLength+1), Line, seeded(10)); err == nil {
		t.Error("Line mode accepted text longer than a line")
	}
}

func TestLocateRejects(t *testing.T) {
	if _, err := Locate("", Noise, seeded(11)); err == nil {
		t.Error("accepted empty text")
	}
	if _, err := Locate("!!!", Noise, seeded(11)); err != nil {
		// Punctuation spells as periods, so this is a real page.
		t.Errorf("rejected spellable punctuation: %v", err)
	}
	if _, err := Locate("ééé", Noise, seeded(11)); err == nil {
		t.Error("accepted text that spells to nothing")
	}
	if _, err := Locate(strings.Repeat("a", PageChars+1), Noise, seeded(11)); err == nil {
		t.Error("accepted text longer than a page")
	}
	if _, err := Locate("a", Mode("sideways"), seeded(11)); err == nil {
		t.Error("accepted an unknown mode")
	}
}

func TestLocateSpellsBeforePlacing(t *testing.T) {
	found, err := Locate("Wyatt", Blank, seeded(12))
	if err != nil {
		t.Fatal(err)
	}
	if found.Spelling.Text != "uuiatt" || found.Length != 6 {
		t.Fatalf("spelled %q (len %d)", found.Spelling.Text, found.Length)
	}
}

func TestParseHexagon(t *testing.T) {
	h, err := ParseHexagon("123")
	if err != nil || h.Int64() != 123 {
		t.Fatalf("ParseHexagon(123) = %v, %v", h, err)
	}
	for _, bad := range []string{"", "-1", "12a", "1e5", strings.Repeat("9", 5000)} {
		if _, err := ParseHexagon(bad); err == nil {
			t.Errorf("ParseHexagon(%q) accepted", bad)
		}
	}
}

// Pins the Library's layout. If this changes, every page has moved: a visitor's
// bookmarked address would open onto a different page.
func TestTheFirstPageNeverMoves(t *testing.T) {
	lines, err := PageAt(Location{Hexagon: big.NewInt(0)})
	if err != nil {
		t.Fatal(err)
	}
	if lines[0] != firstLineOfTheLibrary {
		t.Fatalf("first line is now %q", lines[0])
	}
}

func checkLocated(t *testing.T, found Found) {
	t.Helper()
	lines, err := PageAt(found.Location)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Join(lines, "\n") != strings.Join(found.Lines, "\n") {
		t.Fatal("the page at the returned location is not the page shown")
	}
}
