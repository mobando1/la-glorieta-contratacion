/**
 * BrandBackdrop — the shared atmospheric layer used across the public surfaces.
 * Graphic-only (no photos): a drenched petrol field, slow-drifting warm light,
 * and a fine letterpress grain. Purely decorative; render inside a
 * `relative overflow-hidden` parent.
 *
 * variant="dark"  → deep petrol hero panel (login brand side, landing hero, CTA)
 * variant="light" → warm-paper page with a whisper of ambient tint
 */
export function BrandBackdrop({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  if (variant === "light") {
    return (
      <div
        aria-hidden="true"
        className={`grain grain-soft pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        style={{ background: "var(--color-canvas)" }}
      >
        <div
          className="animate-ambient absolute -left-[15%] -top-[20%] h-[70%] w-[70%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--color-primary-300) 22%, transparent), transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="animate-ambient-2 absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--color-accent-300) 20%, transparent), transparent 70%)",
            filter: "blur(44px)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`grain pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        background:
          "radial-gradient(120% 120% at 30% 0%, var(--color-primary-800) 0%, var(--color-primary-900) 42%, var(--color-primary-950) 100%)",
      }}
    >
      {/* Warm teal light — top, drifting */}
      <div
        className="animate-ambient absolute -left-[10%] -top-[25%] h-[80%] w-[80%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-primary-400) 60%, transparent), transparent 68%)",
          filter: "blur(30px)",
        }}
      />
      {/* Dusty-rose glow — bottom right, drifting on a second cadence */}
      <div
        className="animate-ambient-2 absolute -bottom-[30%] -right-[15%] h-[75%] w-[75%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-accent-500) 42%, transparent), transparent 66%)",
          filter: "blur(36px)",
        }}
      />
      {/* Soft candle highlight — center, slow float */}
      <div
        className="animate-float absolute left-1/2 top-1/3 h-[45%] w-[55%] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-primary-300) 30%, transparent), transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      {/* Edge vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 115% at 50% 42%, transparent 55%, oklch(0.16 0.03 227 / 0.55) 100%)",
        }}
      />
    </div>
  );
}
