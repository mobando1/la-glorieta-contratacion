import Link from "next/link";
import Image from "next/image";
import { BrandBackdrop } from "@/components/brand/brand-backdrop";
import { ClocheCrest } from "@/components/brand/cloche-crest";
import { LogoPlaque } from "@/components/brand/logo-plaque";

type Benefit = {
  title: string;
  highlight: string;
  description: string;
  icon: React.ReactNode;
};

const BENEFITS: Benefit[] = [
  {
    title: "Bono de mercado",
    highlight: "$50.000/mes",
    description: "En Punto & Coma, para apoyar la canasta familiar.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    ),
  },
  {
    title: "Bonos por rendimiento",
    highlight: "Hasta $150.000/mes",
    description: "Adicionales según tu desempeño, sumados a tu salario base.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    ),
  },
  {
    title: "Propinas",
    highlight: "Ingreso extra",
    description: "Las propinas de los clientes, como ingreso adicional.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    ),
  },
  {
    title: "Alimentación",
    highlight: "Incluida",
    description: "Tu alimentación, dentro de cada turno de trabajo.",
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5h15M6 16.5a6 6 0 0112 0M12 8.25V7.5" />
        <circle cx="12" cy="6.9" r="0.9" />
      </>
    ),
  },
  {
    title: "Gimnasio",
    highlight: "Gratis",
    description: "Membresía gratuita al gimnasio para tu bienestar.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M6 8.5v7M4 10v3.5M18 8.5v7M20 10v3.5" />
    ),
  },
  {
    title: "Crecimiento",
    highlight: "Ascensos",
    description: "Ascensos y mejoras según tu compromiso con el equipo.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    ),
  },
];

export default function HomePage() {
  return (
    <main className="bg-canvas">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-5 py-14 text-cream sm:py-20">
        <BrandBackdrop variant="dark" />

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
          {/* Signage */}
          <div
            className="animate-fade-in mb-8 flex items-center gap-4 sm:mb-10"
            style={{ animationDelay: "120ms" }}
          >
            <LogoPlaque src="/logos/la-glorieta.jpg" alt="La Glorieta Restaurante — desde 1960" className="h-16 w-28 sm:h-20 sm:w-36" priority />
            <span className="font-serif text-xl italic text-cream-soft sm:text-2xl" aria-hidden="true">y</span>
            <LogoPlaque src="/logos/salome.png" alt="Salomé — momentos · restó · café" className="h-16 w-28 sm:h-20 sm:w-36" priority />
          </div>

          <p className="eyebrow animate-rise-in text-accent-300" style={{ animationDelay: "360ms" }}>
            Estamos contratando · Guaduas
          </p>
          <h1
            className="animate-rise-in mt-4 text-balance font-serif text-[2.1rem] font-semibold leading-[1.08] text-cream sm:text-5xl lg:text-[3.4rem]"
            style={{ animationDelay: "480ms" }}
          >
            Hay un lugar para ti en nuestra mesa.
          </h1>
          <p
            className="animate-rise-in mt-5 max-w-md text-pretty text-[15px] leading-relaxed text-cream-soft sm:text-lg"
            style={{ animationDelay: "620ms" }}
          >
            No somos un trabajo más. Somos un equipo que{" "}
            <span className="font-medium text-cream">valora y recompensa</span> a su gente de
            verdad.
          </p>

          <div
            className="animate-rise-in mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
            style={{ animationDelay: "780ms" }}
          >
            <Link
              href="/aplicar"
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-cream px-8 py-4 text-base font-semibold text-primary-900 shadow-elevated transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] sm:w-auto"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-primary-900/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
              Comenzar mi aplicación
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#beneficios"
              className="link-underline inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-cream-soft transition-colors hover:text-cream"
            >
              Ver beneficios
              <svg className="h-4 w-4 animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS — "the menu" ===== */}
      <section id="beneficios" className="relative overflow-hidden scroll-mt-8 px-5 py-16 sm:py-24">
        <BrandBackdrop variant="light" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-10 text-center sm:mb-14">
            <h2 className="text-balance font-serif text-3xl font-semibold text-ink sm:text-[2.4rem]">
              Lo que ponemos sobre la mesa
            </h2>
            <p className="mx-auto mt-3 max-w-md text-pretty text-[15px] text-ink-soft">
              Beneficios reales, además de tu salario base y un buen ambiente de trabajo.
            </p>
          </div>

          {/* Menu panel — single column, like a restaurant menu */}
          <div className="mx-auto max-w-xl overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line">
            <ul className="divide-y divide-line">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-start gap-4 p-5 sm:gap-5 sm:px-7 sm:py-5">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                    <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      {b.icon}
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
                      <h3 className="font-serif text-lg font-semibold text-ink">{b.title}</h3>
                      <span aria-hidden="true" className="hidden h-px min-w-6 flex-1 self-center border-b border-dotted border-line-strong sm:block" />
                      <span className="whitespace-nowrap font-sans text-sm font-bold text-accent-700">{b.highlight}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{b.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="mx-auto mt-6 max-w-lg text-center text-sm leading-relaxed text-ink-mute">
            Además: <span className="font-medium text-ink-soft">estabilidad laboral</span>, buen
            ambiente y la oportunidad real de crecer con nosotros.
          </p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative flex flex-col items-center overflow-hidden px-5 py-20 text-center text-cream sm:py-28">
        <BrandBackdrop variant="dark" />
        <div className="relative z-10 flex w-full max-w-md flex-col items-center">
          <ClocheCrest className="mb-6 h-20 w-20 text-accent-400" animate={false} />
          <h2 className="text-balance font-serif text-3xl font-semibold text-cream sm:text-[2.4rem]">
            ¿Te sientas con nosotros?
          </h2>
          <p className="mt-4 max-w-sm text-pretty text-[15px] leading-relaxed text-cream-soft">
            Cuéntanos sobre tu experiencia y tu disponibilidad. Toma unos 15 minutos y lo puedes
            retomar cuando quieras.
          </p>

          <Link
            href="/aplicar"
            className="group relative mt-9 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-cream px-8 text-base font-bold text-primary-900 shadow-elevated transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] sm:w-auto sm:px-12"
          >
            <span
              aria-hidden="true"
              className="animate-sheen pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary-900/10 to-transparent"
            />
            Comenzar proceso de selección
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          <p className="mt-6 text-xs text-cream-soft/70">
            ¿Tienes dudas? Escríbenos a{" "}
            <a href="mailto:laglorietarest@gmail.com" className="link-underline text-cream-soft">
              laglorietarest@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-canvas-deep px-5 py-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <p className="font-serif text-sm italic text-ink-mute">
            La Glorieta · Salomé — Guaduas, Cundinamarca
          </p>
          <div className="flex items-center gap-2 opacity-70">
            <Image src="/logos/im3.png" alt="" width={20} height={20} className="opacity-70" />
            <p className="text-[11px] tracking-wide text-ink-mute">
              Desarrollado por <span className="font-semibold text-ink-soft">IM3 Systems</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
