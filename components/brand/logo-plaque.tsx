import Image from "next/image";

/**
 * LogoPlaque — a restaurant-sign plaque holding a logo, framed on a warm cream
 * chip. Reads as hanging signage on the dark brand panels.
 */
export function LogoPlaque({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "144px",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** CSS width the plaque renders at, so Next serves a crisp source. */
  sizes?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg bg-canvas p-1.5 shadow-elevated ring-1 ring-black/5 ${className}`}
    >
      <Image src={src} alt={alt} fill sizes={sizes} className="object-contain p-1" priority={priority} />
    </div>
  );
}
