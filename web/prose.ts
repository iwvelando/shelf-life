// The views from the rail, carried over from the terminal version.
export const views = [
  "The gallery is identical to the last and to the next: six walls, four of them shelves, a low rail, a doorway to more of the same. The light has no source you can find.",
  "You lean over the rail. The shaft falls away, gallery after gallery, until the far side is a haze and the bottom is a rumor. Looking up is no different.",
  "Spines without titles, in their millions, on this floor alone. You could read every book within reach and not have begun. You have read every book within reach.",
  "Someone has scratched a tally into the stone of the rail. It runs off the edge of the slab and, presumably, around the world, and means nothing.",
];

// How a fall unfolds, with when each line appears (milliseconds).
export const fall: [number, string][] = [
  [0, "You climb the rail and let go."],
  [
    1400,
    "The galleries strobe past: shelf, rail, doorway, shelf. Faster, then so fast they smear into a single grey wall of books.",
  ],
  [
    3200,
    "An hour. A day. You stop screaming, because there is no profit in it.",
  ],
  [
    4800,
    "Two days. The wind is a wall against your face. You begin, helplessly, to read the spines.",
  ],
  [
    6400,
    "On the third day you strike a floor you did not know was there, and burst, and are gathered up, and are whole,",
  ],
  [7600, "and are standing at a rail exactly like the one you jumped from."],
];
export const fallMillis = 8400;
