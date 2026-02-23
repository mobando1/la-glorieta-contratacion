import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.15),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Branding */}
        <div className="mb-8 animate-fade-in">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-white">
            La Glorieta y Salomé
          </h1>
          <p className="text-primary-200">
            Restaurantes &mdash; Guaduas, Cundinamarca
          </p>
        </div>

        {/* CTA Card */}
        <div className="animate-slide-up rounded-card bg-white/10 p-8 backdrop-blur-md ring-1 ring-white/20">
          <h2 className="mb-2 text-xl font-semibold text-white">
            Trabaja con nosotros
          </h2>
          <p className="mb-6 text-sm text-primary-100">
            Completa nuestra entrevista virtual en pocos minutos
          </p>
          <Link
            href="/aplicar"
            className="inline-block w-full rounded-xl bg-white px-6 py-4 text-lg font-semibold text-primary-800 shadow-elevated transition-all hover:bg-primary-50 hover:shadow-card-hover active:scale-[0.98]"
          >
            Aplicar a un cargo
          </Link>
        </div>

        <p className="mt-8 animate-fade-in text-xs text-primary-300/60">
          Sistema de Contratación Inteligente
        </p>
      </div>
    </main>
  );
}
