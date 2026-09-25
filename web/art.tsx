import { useEffect, useRef } from "react";

// Drawings for the rooms. Colours come from CSS classes so both themes apply.

// Each gallery down the shaft appears this much smaller than the one above it.
const RECEDE = 0.8;

// A stable pseudo-random value in [0, 1) for index i, so drawings don't shimmer.
const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const hexagon = (r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k;
    return `${(r * Math.cos(a)).toFixed(3)},${(r * Math.sin(a)).toFixed(3)}`;
  }).join(" ");

// One gallery seen from above, at unit size: its rail, and the tops of the
// books shelved around it.
function Gallery({ seed }: { seed: number }) {
  const ticks: string[] = [];
  for (let edge = 0; edge < 6; edge++) {
    const a0 = (Math.PI / 3) * edge;
    const a1 = (Math.PI / 3) * (edge + 1);
    for (let j = 1; j < 14; j++) {
      const t = j / 14;
      const x = Math.cos(a0) * (1 - t) + Math.cos(a1) * t;
      const y = Math.sin(a0) * (1 - t) + Math.sin(a1) * t;
      const depth =
        1 - (1 - RECEDE) * (0.35 + 0.5 * jitter(seed * 97 + edge * 14 + j));
      ticks.push(
        `M${x.toFixed(3)},${y.toFixed(3)}L${(x * depth).toFixed(3)},${(y * depth).toFixed(3)}`,
      );
    }
  }
  return (
    <>
      <polygon className="gallery-floor" points={hexagon(1)} />
      <path
        className="gallery-books"
        d={ticks.join("")}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        className="gallery-rail"
        points={hexagon(1)}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

const RINGS = 18;

const ringStyle = (radius: number) => ({
  transform: `scale(${radius})`,
  opacity: Math.min(1, 0.15 + radius / 60),
});

// Looking straight down the shaft: galleries receding without end.
export function Shaft({ id }: { id?: string }) {
  return (
    <svg
      id={id}
      className="shaft"
      viewBox="-100 -100 200 200"
      role="img"
      aria-label="Looking down the shaft: hexagonal galleries receding without end"
    >
      <g className="shaft-breathe">
        {Array.from({ length: RINGS }, (_, k) => (
          <g key={k} style={ringStyle(98 * RECEDE ** k)}>
            <Gallery seed={k} />
          </g>
        ))}
        <polygon
          className="shaft-void"
          points={hexagon(98 * RECEDE ** RINGS)}
        />
      </g>
    </svg>
  );
}

// The same shaft, falling: galleries rush outward past the viewer, faster and
// faster, for as long as `falling` is true.
export function Tunnel({ falling }: { falling: boolean }) {
  const rings = useRef<(SVGGElement | null)[]>([]);
  useEffect(() => {
    if (!falling) return;
    let frame = 0;
    let phase = 0;
    let last = performance.now();
    const start = last;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      // Accelerate for the first seconds, then hold at a blur.
      const speed = Math.min(9, 0.4 + t * t * 1.2);
      phase = (phase + speed * ((now - last) / 1000)) % 1;
      last = now;
      rings.current.forEach((g, k) => {
        if (!g) return;
        const r = 98 * RECEDE ** (k - phase);
        const s = ringStyle(r);
        g.style.transform = s.transform;
        g.style.opacity = String(s.opacity);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [falling]);
  return (
    <svg
      className={`shaft tunnel${falling ? " is-falling" : ""}`}
      viewBox="-100 -100 200 200"
      role="img"
      aria-label={
        falling ? "Falling down the shaft" : "The shaft, from the rail"
      }
    >
      {Array.from({ length: RINGS + 1 }, (_, k) => (
        <g
          key={k}
          ref={(el) => {
            rings.current[k] = el;
          }}
          style={ringStyle(98 * RECEDE ** k)}
        >
          <Gallery seed={k} />
        </g>
      ))}
      <polygon
        className="shaft-void"
        points={hexagon(98 * RECEDE ** (RINGS + 1))}
      />
    </svg>
  );
}

// A shelf of 32 volumes; the pulled one stands proud of the rest.
export function Shelf({ pulled }: { pulled?: number }) {
  return (
    <svg
      className="shelf"
      viewBox="0 0 656 150"
      role="img"
      aria-label={
        pulled === undefined
          ? "A shelf of 32 volumes"
          : `A shelf of 32 volumes, with volume ${pulled + 1} pulled out`
      }
    >
      {Array.from({ length: 32 }, (_, i) => {
        const h = 92 + Math.round(jitter(i) * 30);
        const y = 130 - h;
        return (
          <g
            key={i}
            className={`spine spine-${Math.floor(jitter(i + 50) * 3)}${i === pulled ? " is-pulled" : ""}`}
          >
            <rect x={8 + i * 20} y={y} width={18} height={h} rx={1.5} />
            <rect
              className="spine-band"
              x={10 + i * 20}
              y={y + 10}
              width={14}
              height={2}
            />
            <rect
              className="spine-band"
              x={10 + i * 20}
              y={130 - 16}
              width={14}
              height={2}
            />
          </g>
        );
      })}
      <rect className="shelf-plank" x={0} y={130} width={656} height={9} />
    </svg>
  );
}

// Your share of the Library, as a bar, under three ever-stronger lenses. It is
// empty at every magnification.
export function NeverBar({ lenses }: { lenses: string[] }) {
  const cx = [100, 300, 500];
  return (
    <svg
      className="never-bar"
      viewBox="0 0 600 180"
      role="img"
      aria-label="A bar for the share of the Library you have seen: empty, and still empty under every magnification"
    >
      <rect
        className="bar-track"
        x={10}
        y={14}
        width={580}
        height={16}
        rx={2}
      />
      <path
        className="lens-line"
        d={`M10,30 L${cx[0] - 46},108 M10,30 L${cx[0] + 46},108`}
      />
      {cx.map((x, i) => (
        <g key={i}>
          {i > 0 && (
            <path
              className="lens-line"
              d={`M${cx[i - 1] + 48},118 L${x - 48},118`}
            />
          )}
          <circle className="lens" cx={x} cy={118} r={48} />
          <rect
            className="bar-track"
            x={x - 42}
            y={110}
            width={84}
            height={16}
          />
          <path className="lens-tick" d={`M${x - 42},104 V132`} />
          <title>{`Magnified ${lenses[i]}: still empty`}</title>
        </g>
      ))}
    </svg>
  );
}

// The wait to read every book, as a bar of its digits, and the end of that bar
// magnified so the digits an effort removes can be seen at all.
export function ExponentBar({
  total,
  removed,
}: {
  total: number;
  removed: number;
}) {
  let zoom = 1000;
  while (zoom > 1 && removed > total / zoom) zoom /= 10;
  const window = total / zoom;
  const cut = Math.min(1, Math.max(0, removed / window)) * 580;
  const left = 590 - 580 / zoom;
  return (
    <svg
      id="exponent-bar"
      className="exponent-bar"
      viewBox="0 0 600 150"
      role="img"
      aria-label={`The wait, as a bar of ${Math.round(total).toLocaleString("en-US")} digits. The effort removes ${Math.round(removed).toLocaleString("en-US")} of them, visible only magnified ${zoom.toLocaleString("en-US")} times.`}
      data-zoom={zoom}
    >
      <rect className="wait" x={10} y={12} width={580} height={20} />
      <rect
        className="removed"
        x={590 - (580 * removed) / total}
        y={12}
        width={(580 * removed) / total}
        height={20}
      />
      <path className="lens-line" d={`M${left},32 L10,100 M590,32 L590,100`} />
      <rect className="wait" x={10} y={100} width={580 - cut} height={30} />
      <rect className="removed" x={590 - cut} y={100} width={cut} height={30} />
      <rect className="lens-frame" x={10} y={100} width={580} height={30} />
    </svg>
  );
}

// Deaths, scratched into the rail in fives.
export function Tally({ count, max = 100 }: { count: number; max?: number }) {
  const shown = Math.min(count, max);
  const groups = Math.ceil(shown / 5);
  return (
    <div
      className="tally"
      aria-label={`${count} ${count === 1 ? "death" : "deaths"}`}
      role="img"
    >
      {Array.from({ length: groups }, (_, g) => {
        const n = Math.min(5, shown - g * 5);
        return (
          <svg key={g} viewBox="0 0 36 40" className="tally-group">
            {Array.from({ length: Math.min(4, n) }, (_, j) => (
              <path
                key={j}
                className="tally-mark"
                d={`M${6 + j * 7 + jitter(g * 5 + j) * 1.5},6 L${5 + j * 7},34`}
              />
            ))}
            {n === 5 && <path className="tally-mark" d="M1,30 L34,9" />}
          </svg>
        );
      })}
      {count > max && (
        <span className="tally-more">
          and {(count - max).toLocaleString("en-US")} more
        </span>
      )}
    </div>
  );
}

// Room glyphs for the navigation.
const glyphs: Record<string, string> = {
  look: "M12 3 L19.8 7.5 V16.5 L12 21 L4.2 16.5 V7.5 Z M12 8.5 L15 10.25 V13.75 L12 15.5 L9 13.75 V10.25 Z",
  read: "M3 5.5 C6 4.5 9 4.5 12 6.5 C15 4.5 18 4.5 21 5.5 V19 C18 18 15 18 12 20 C9 18 6 18 3 19 Z M12 6.5 V20",
  search: "M10.5 4 A6.5 6.5 0 1 1 10.49 4 Z M15.2 15.2 L20.5 20.5",
  find: "M7 3 H17 V21 L12 16.5 L7 21 Z",
  reckon: "M4 20 H20 M6 20 V11 M10 20 V7 M14 20 V13 M18 20 V4",
  fall: "M12 3 V18 M6.5 12.5 L12 18 L17.5 12.5 M5 21 H19",
};

export function Glyph({ name }: { name: keyof typeof glyphs | string }) {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d={glyphs[name]} />
    </svg>
  );
}
