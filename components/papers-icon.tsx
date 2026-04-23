import { useId } from "react";

const CORNER_RADIUS = 200 * 0.2237;

export function PapersIcon({ size = 160 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ display: "block" }}
      aria-label="Papers"
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a241c" />
          <stop offset="1" stopColor="#1a1611" />
        </linearGradient>
        <linearGradient id={`p1-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4e4bf" />
          <stop offset="1" stopColor="#e0c98b" />
        </linearGradient>
        <linearGradient id={`p2-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8a957" />
          <stop offset="1" stopColor="#b07e2a" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect
            x="0"
            y="0"
            width="200"
            height="200"
            rx={CORNER_RADIUS}
            ry={CORNER_RADIUS}
          />
        </clipPath>
      </defs>

      <rect
        x="0"
        y="0"
        width="200"
        height="200"
        rx={CORNER_RADIUS}
        ry={CORNER_RADIUS}
        fill={`url(#bg-${uid})`}
      />

      <g clipPath={`url(#clip-${uid})`}>
        <g transform="translate(72 40) rotate(7)">
          <rect
            width="96"
            height="124"
            rx="10"
            fill={`url(#p1-${uid})`}
            opacity="0.95"
          />
        </g>

        <g transform="translate(50 44)">
          <path
            d="M 10 0 H 90 A 10 10 0 0 1 100 10 V 120 L 50 92 L 0 120 V 10 A 10 10 0 0 1 10 0 Z"
            fill={`url(#p2-${uid})`}
          />
          <g
            opacity="0.32"
            stroke="#4a330f"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <line x1="20" y1="30" x2="80" y2="30" />
            <line x1="20" y1="46" x2="80" y2="46" />
            <line x1="20" y1="62" x2="64" y2="62" />
          </g>
          <path
            d="M 10 0 H 90 A 10 10 0 0 1 100 10 V 14 H 0 V 10 A 10 10 0 0 1 10 0 Z"
            fill="rgba(255,255,255,.22)"
          />
        </g>
      </g>

      <rect
        x="0.5"
        y="0.5"
        width="199"
        height="199"
        rx={CORNER_RADIUS - 0.5}
        ry={CORNER_RADIUS - 0.5}
        fill="none"
        stroke="rgba(255,255,255,.06)"
      />
    </svg>
  );
}
