/**
 * ClocheCrest — a hand-drawn line-art food cloche (the "campana" / dome from the
 * La Glorieta logo), rendered as an animated SVG crest. This is the graphic-only
 * hero motif (no photography). Strokes draw in on load; steam rises gently above.
 *
 * Decorative — always aria-hidden. Motion respects prefers-reduced-motion via the
 * global reset in globals.css (draw/steam collapse to a static, fully-drawn state).
 */
export function ClocheCrest({
  className = "",
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  // Each drawable path uses pathLength=1 so a single stroke-dashoffset 1→0 draws it.
  const draw = (delay: number) =>
    animate
      ? ({
          pathLength: 1,
          strokeDasharray: 1,
          className: "animate-draw",
          style: { ["--draw-len" as string]: 1, animationDelay: `${delay}ms` },
        } as const)
      : ({} as const);

  return (
    <svg
      viewBox="0 0 200 176"
      fill="none"
      aria-hidden="true"
      className={className}
      role="presentation"
    >
      {/* Steam — three wisps rising above the dome */}
      <g
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="text-accent-300"
        opacity="0.9"
      >
        <path
          d="M84 46 C 78 38, 90 32, 84 24 C 80 18, 88 14, 84 8"
          className={animate ? "animate-steam" : ""}
          style={animate ? { animationDelay: "1500ms" } : undefined}
        />
        <path
          d="M100 44 C 94 36, 106 30, 100 22 C 96 16, 104 12, 100 6"
          className={animate ? "animate-steam" : ""}
          style={animate ? { animationDelay: "1900ms" } : undefined}
        />
        <path
          d="M116 46 C 110 38, 122 32, 116 24 C 112 18, 120 14, 116 8"
          className={animate ? "animate-steam" : ""}
          style={animate ? { animationDelay: "2300ms" } : undefined}
        />
      </g>

      {/* The crest — cloche + platter + cutlery, in dusty rose */}
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-400"
      >
        {/* Finial knob + stem on top of the dome */}
        <circle cx="100" cy="52" r="5.5" strokeWidth="3" {...draw(1150)} />
        <path d="M100 57 V 66" strokeWidth="3" {...draw(1150)} />

        {/* Outer dome */}
        <path
          d="M40 118 A 60 58 0 0 1 160 118"
          strokeWidth="3.4"
          {...draw(150)}
        />
        {/* Inner concentric dome line (the logo's double arc) */}
        <path
          d="M56 118 A 44 42 0 0 1 144 118"
          strokeWidth="2.2"
          className="text-accent-300"
          {...draw(500)}
        />

        {/* Platter base — a long rounded bar the dome sits on */}
        <path d="M30 118 H 170" strokeWidth="3.4" {...draw(850)} />
        <path
          d="M44 126 H 156"
          strokeWidth="2.2"
          className="text-accent-300"
          {...draw(950)}
        />

        {/* Crossed cutlery below the platter (heritage nod to the logo) */}
        <g strokeWidth="2.4" className="text-accent-300" opacity="0.92">
          {/* Fork (left, crossing right) */}
          <path d="M74 150 L 96 168" {...draw(1250)} />
          <path d="M70 146 v 7 M74 145 v 8 M78 146 v 7" {...draw(1350)} />
          {/* Knife (right, crossing left) */}
          <path d="M126 150 L 104 168" {...draw(1300)} />
          <path d="M130 145 c 5 2 5 8 0 10" {...draw(1400)} />
        </g>
      </g>
    </svg>
  );
}
