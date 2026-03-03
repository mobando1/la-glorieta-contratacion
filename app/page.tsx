import Link from "next/link";
import Image from "next/image";

const BENEFITS = [
  {
    icon: "🛒",
    title: "Bono de mercado",
    highlight: "$50.000/mes",
    description: "En Punto & Coma para apoyar la canasta familiar",
  },
  {
    icon: "🏆",
    title: "Bonos por rendimiento",
    highlight: "Hasta $200.000/mes",
    description: "Adicionales según tu desempeño, aumentando tu salario base",
  },
  {
    icon: "💰",
    title: "Propinas",
    highlight: "Ingreso extra",
    description: "Propinas de los clientes como ingreso adicional",
  },
  {
    icon: "🍽️",
    title: "Alimentación",
    highlight: "Incluida",
    description: "Alimentación dentro de tu turno de trabajo",
  },
  {
    icon: "💪",
    title: "Gimnasio",
    highlight: "Gratis",
    description: "Membresía gratuita al gimnasio para tu bienestar",
  },
  {
    icon: "📈",
    title: "Crecimiento",
    highlight: "Ascensos",
    description: "Posibilidad de ascensos y mejoras según tu compromiso",
  },
];

export default function HomePage() {
  return (
    <main className="scroll-smooth">
      {/* ===== HERO SECTION ===== */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-10 sm:min-h-screen sm:py-4">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,114,122,0.1),transparent_50%)]" />

        <div className="relative z-10 w-full max-w-lg text-center">
          {/* Logos */}
          <div className="mb-5 animate-fade-in sm:mb-8">
            <div className="mx-auto mb-4 flex flex-col items-center justify-center gap-3 sm:mb-6 sm:flex-row sm:gap-6">
              <div className="relative h-20 w-36 overflow-hidden rounded-2xl bg-white/95 p-2 shadow-elevated backdrop-blur-sm sm:h-28 sm:w-52 sm:p-3">
                <Image
                  src="/logos/la-glorieta.jpg"
                  alt="La Glorieta Restaurante"
                  fill
                  className="object-contain p-1 sm:p-2"
                  priority
                />
              </div>
              <div className="relative h-20 w-28 overflow-hidden rounded-2xl bg-white/95 p-2 shadow-elevated backdrop-blur-sm sm:h-28 sm:w-44 sm:p-3">
                <Image
                  src="/logos/salome.png"
                  alt="Salomé Momentos Restó & Café"
                  fill
                  className="object-contain p-1 sm:p-2"
                  priority
                />
              </div>
            </div>

            <h1 className="mb-1 text-2xl font-bold tracking-tight text-white sm:mb-2 sm:text-4xl">
              ¡Trabaja con nosotros!
            </h1>
            <p className="text-base text-primary-200 sm:text-lg">
              Guaduas, Cundinamarca
            </p>
          </div>

          {/* Invite to scroll */}
          <div className="animate-slide-up">
            <div className="rounded-card bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20 sm:p-8">
              <p className="mb-1 text-sm leading-relaxed text-primary-100 sm:mb-2 sm:text-lg">
                No somos un trabajo más. Somos un equipo que
                <strong className="text-white"> valora y recompensa </strong>
                a su gente de verdad.
              </p>
              <p className="text-xs text-primary-300/80 sm:text-sm">
                Descubre lo que te espera...
              </p>
            </div>

            <a
              href="#beneficios"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-white/20 sm:mt-6 sm:px-6 sm:py-3"
            >
              Mira nuestros beneficios
              <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS SECTION ===== */}
      <section id="beneficios" className="relative bg-[#faf8f5] px-4 py-10 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center sm:mb-14">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent-500 sm:mb-2 sm:text-sm">
              Beneficios
            </p>
            <h2 className="text-xl font-bold text-primary-900 sm:text-3xl">
              Lo que ofrecemos a nuestro equipo
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {BENEFITS.map((benefit, i) => (
              <div
                key={benefit.title}
                className="group rounded-card border border-primary-100 bg-white p-3.5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-benefit sm:p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-2 flex items-start gap-2.5 sm:mb-3 sm:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-lg sm:h-10 sm:w-10 sm:text-xl">
                    {benefit.icon}
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold text-primary-900 sm:text-sm">
                      {benefit.title}
                    </h3>
                    <p className="text-base font-bold text-accent-500 sm:text-lg">
                      {benefit.highlight}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Extra note */}
          <div className="mt-5 rounded-card border border-primary-200 bg-primary-50 p-3 text-center sm:mt-8 sm:p-4">
            <p className="text-xs font-medium text-primary-800 sm:text-sm">
              Además: estabilidad laboral, buen ambiente de trabajo y la oportunidad de crecer profesionalmente con nosotros.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative overflow-hidden px-4 py-10 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.15),transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-md text-center">
          <div className="mb-1.5 text-3xl sm:mb-2 sm:text-4xl">🚀</div>
          <h2 className="mb-2 text-xl font-bold text-white sm:mb-3 sm:text-3xl">
            ¿Te interesa?
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-primary-200 sm:mb-8 sm:text-base">
            Cuéntanos un poco más de tu experiencia y disponibilidad para continuar con el proceso.
          </p>

          <Link
            href="/aplicar"
            className="inline-block w-full animate-glow-pulse rounded-xl bg-white px-6 py-4 text-base font-bold text-primary-900 transition-all hover:bg-primary-50 active:scale-[0.97] sm:w-auto sm:px-14 sm:py-5 sm:text-xl"
          >
            Comenzar proceso de selección
          </Link>

          <p className="mt-3 text-xs text-primary-300/70 sm:mt-4 sm:text-sm">
            Proceso rápido &mdash; aproximadamente 15 minutos
          </p>
        </div>
      </section>
    </main>
  );
}
