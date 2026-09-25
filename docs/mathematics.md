# The mathematics

Everything here is computed in Go (`engine/`). Numbers too large for a float64 are carried as base-10 logarithms: a value _x_ stands for 10^_x_, adding logs multiplies, and subtracting divides (`engine/scale`).

## The size of the Library

A book is 410 pages of 40 lines of 80 characters, 1,312,000 characters in all, drawn from 29 symbols: the 26 letters `a`–`z`, the space, the comma, and the period. Borges gave his Library 25 symbols, 22 of them letters, and never said which letters. The site keeps his three marks but uses the whole alphabet, so that anything a visitor writes in English is already on the shelves as written. So there are

29^1,312,000 = 10^(1,312,000 · log₁₀ 29) ≈ 10^1,918,666.17 books,

a number with **1,918,667 digits**.

## Galleries

Following Borges, four of each hexagon's six walls hold shelves: 5 shelves a wall, 32 volumes a shelf. That makes 640 books, or 262,400 pages, a hexagon, and about 10^1,918,663.37 hexagons.

**Packed into a cube** (an assumption the site states as one), the Library is ∛(hexagons) ≈ 10^639,554.46 galleries on a side. At an assumed **3 metres a gallery**, against an observable universe **8.8 × 10^26 m** across, the side is about 10^639,528 universe-widths.

## Pages and locations

The site shelves _pages_, not whole books. There are N = 29^3200 ≈ 10^4,679.67 distinct pages. (In the full Library each page recurs in an astronomical number of books; here each page has one place.)

A location (hexagon _h_, wall _w_, shelf _s_, volume _v_, page _p_, all zero-based) folds into one slot number:

slot = (((( _h_ · 4 + _w_ ) · 5 + _s_ ) · 32 + _v_ ) · 410 + _p_

Slots run from 0 to N − 1, so the largest hexagon number is ⌊(N − 1) / 262,400⌋, which has **4,675 digits**. N is not a multiple of 262,400, so that last hexagon is only partly shelved; `PageAt` refuses locations past the end.

A slot becomes a page's 3,200 base-29 digits (digit _d_ is symbol `Alphabet[d]`, most significant first) through an invertible scramble:

1. _x_ = (*a*₁ · slot + *b*₁) mod N
2. reverse the 3,200 base-29 digits of _x_, giving _y_
3. page = (*a*₂ · _y_ + *b*₂) mod N

29 is prime, so a multiplier is invertible modulo N = 29^3200 exactly when it isn't a multiple of 29; *a*₁ and *a*₂ are chosen that way, and each step is undone with the modular inverse. A single affine map would tie a page's opening characters to the slot's low digits, so neighbouring pages would open alike. The reversal between two affine maps makes every character depend on every digit of the slot. The constants come from SHA-256 in counter mode over fixed labels (`shelf-life/multiplier/1`, …), so they are patternless and reproducible. **Changing any of this relayouts the Library** (see AGENTS.md); `TestTheFirstPageNeverMoves` pins it.

The Find room builds a page around a visitor's text (at a random spot among noise, alone on one line, or at the top of a blank page), then runs the scramble backwards to find its location. A text that fits on a line is never split across two. The hexagon number of a page is 4,675 digits long, which is longer than the page itself. That is no accident: a location can't carry less information than the page it points to.

### Spelling

Text is lower-cased. Every letter is in the alphabet; digits are not, so they become words (`2`→`two`, with a space between neighbouring digits: `1848`→`one eight four eight`). `!` and `?` become periods, `;` and `:` commas, and whitespace a space. Anything else is dropped. Every change is reported.

## Effort

A party of 10^_S_ searchers, each checking 10^_R_ books a second, needs 10^(1,918,666.17 − _S_ − _R_) seconds to read every book. The effort removes _S_ + _R_ digits from a 1,918,667-digit wait. Every atom in the universe (10^80) checking a book every Planck time (≈10^43.27 a second) removes about 123. The site's bar magnifies the end of the wait until that sliver is visible.

In 10^_Y_ years the party checks 10^(_S_ + _R_ + _Y_ + 7.499) books (a Julian year is 31,557,600 s). The share of the Library that represents, in percent, is written as a decimal point followed by its run of zeros before the first significant digit.

## Falling and time

A fall lasts **three days** at an assumed **terminal velocity of 55 m/s**: 14,256 km, or 4,752,000 three-metre galleries, per fall. The depth reached is shown as a share of the cube's height.

Subjective time accrues at half a minute a page read or turned, five seconds a book on a searched shelf, and three days a fall, against an age of the universe of 13.8 billion years.
