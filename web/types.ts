// Mirrors engine/api, engine/library, and engine/stay. Keep the two in step.

export type Location = {
  hexagon: string; // decimal, thousands of digits
  wall: number; // all zero-based
  shelf: number;
  volume: number;
  page: number;
};

export type Page = { location: Location; lines: string[] };

export type Spelling = {
  text: string;
  changes: { from: string; to: string }[] | null;
};

export type Found = Page & {
  offset: number;
  length: number;
  spelling: Spelling;
};

export type Mode = "noise" | "blank" | "line";

export type Effort = {
  searchersLog: number;
  rateLog: number;
  yearsLog: number;
};

export type EffortReport = {
  secondsLog: number;
  secondsText: string;
  yearsText: string;
  universeAgesText: string;
  digitsRemoved: number;
  examinedLog: number;
  examinedText: string;
  fractionZeros: number;
  fractionText: string;
  finished: boolean;
};

export type SearchReport = {
  examinedText: string;
  fractionZeros: number;
  fractionText: string;
};

export type FallReport = {
  kilometresText: string;
  galleriesText: string;
  fractionZeros: number;
  fractionText: string;
};

export type TimeReport = {
  secondsText: string;
  universeZeros: number;
  universeFractionText: string;
};

export type Constants = {
  booksLog: number;
  booksText: string;
  bookDigits: number;
  hexagonsLog: number;
  hexagonsText: string;
  cubeSideHexagonsLog: number;
  cubeSideHexagonsText: string;
  cubeSideUniversesLog: number;
  cubeSideUniversesText: string;
  hexagonDigits: number;
  pageChars: number;
};

export type Request =
  | { action: "constants" }
  | { action: "page"; location?: Location }
  | { action: "locate"; text: string; mode: Mode }
  | { action: "reckon"; effort: Effort }
  | { action: "search"; examined: number }
  | { action: "fall"; deaths: number }
  | { action: "time"; seconds: number };
