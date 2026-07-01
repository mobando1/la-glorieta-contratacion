"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClocheCrest } from "@/components/brand/cloche-crest";
import { BrandBackdrop } from "@/components/brand/brand-backdrop";
import { LogoPlaque } from "@/components/brand/logo-plaque";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);

  // Subtle pointer-reactive highlight on the brand panel (desktop / fine pointer).
  const handlePointer = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = glowRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin/candidatos");
      } else {
        const data = await res.json();
        setError(data.error || "Correo o contraseña incorrectos.");
        setLoading(false);
      }
    } catch {
      setError("No pudimos conectar. Revisa tu internet e intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] bg-canvas lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* ============ BRAND PANEL ============ */}
      <section
        onMouseMove={handlePointer}
        className="relative flex min-h-[46vh] flex-col overflow-hidden text-cream lg:min-h-screen"
      >
        <BrandBackdrop variant="dark" />

        {/* Pointer-follow highlight */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] hidden opacity-70 lg:block"
          style={{
            background:
              "radial-gradient(340px circle at var(--mx, 70%) var(--my, 30%), color-mix(in oklch, var(--color-primary-300) 22%, transparent), transparent 60%)",
          }}
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-14">
          {/* Top — restaurant signage */}
          <div className="animate-fade-in flex items-center gap-3 sm:gap-4" style={{ animationDelay: "150ms" }}>
            <LogoPlaque src="/logos/la-glorieta.jpg" alt="La Glorieta Restaurante — desde 1960" className="h-12 w-20 sm:h-14 sm:w-24" priority />
            <span className="font-serif text-lg italic text-cream-soft sm:text-xl" aria-hidden="true">y</span>
            <LogoPlaque src="/logos/salome.png" alt="Salomé — momentos · restó · café" className="h-12 w-20 sm:h-14 sm:w-24" priority />
          </div>

          {/* Center — the crest + welcome */}
          <div className="flex flex-col items-center py-6 text-center sm:py-10">
            <div className="relative mb-5 sm:mb-7">
              {/* glow behind the crest */}
              <div
                aria-hidden="true"
                className="animate-glow-pulse absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-56 sm:w-56"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklch, var(--color-accent-400) 40%, transparent), transparent 68%)",
                  filter: "blur(18px)",
                }}
              />
              <ClocheCrest className="relative h-28 w-28 sm:h-40 sm:w-40" />
            </div>

            <div className="flex w-full max-w-md flex-col items-center px-1">
              <p
                className="eyebrow animate-rise-in mb-3 text-accent-300"
                style={{ animationDelay: "500ms" }}
              >
                Panel de contratación
              </p>
              <h1
                className="animate-rise-in w-full text-balance font-serif text-[1.75rem] font-semibold leading-[1.12] text-cream sm:text-4xl lg:text-[2.7rem]"
                style={{ animationDelay: "620ms" }}
              >
                Bienvenido de nuevo.
              </h1>
              <p
                className="animate-rise-in mt-3 w-full text-pretty font-serif text-[0.95rem] italic leading-snug text-cream-soft sm:mt-4 sm:text-lg"
                style={{ animationDelay: "760ms" }}
              >
                Sirviendo con orgullo a Guaduas desde 1960.
              </p>
            </div>
          </div>

          {/* Bottom — place */}
          <div
            className="animate-fade-in hidden items-center text-xs text-cream-soft/80 sm:flex"
            style={{ animationDelay: "900ms" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Guaduas, Cundinamarca
            </span>
          </div>
        </div>
      </section>

      {/* ============ FORM PANEL ============ */}
      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <BrandBackdrop variant="light" />

        <div className="relative z-10 w-full max-w-sm">
          <Link
            href="/"
            className="link-underline animate-fade-in mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-primary-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver al inicio
          </Link>

          <form onSubmit={handleSubmit} className="stagger">
            <h2
              className="animate-rise-in font-serif text-3xl font-semibold text-ink"
              style={{ ["--i" as string]: 0 }}
            >
              Iniciar sesión
            </h2>
            <p
              className="animate-rise-in mt-2 text-[15px] text-ink-soft"
              style={{ ["--i" as string]: 1 }}
            >
              Ingresa para gestionar tu proceso de selección.
            </p>

            {error && (
              <div
                role="alert"
                id="login-error"
                className="animate-rise-in mt-6 flex items-start gap-2.5 rounded-field border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-accent-700"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="animate-rise-in mt-7" style={{ ["--i" as string]: 2 }}>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                Correo electrónico
              </label>
              <Field
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                }
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-describedby={error ? "login-error" : undefined}
                  placeholder="admin@laglorieta.com"
                  className="w-full bg-transparent py-3 pl-11 pr-4 text-[15px] text-ink placeholder-ink-mute/60 focus:outline-none"
                />
              </Field>
            </div>

            <div className="animate-rise-in mt-4" style={{ ["--i" as string]: 3 }}>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                Contraseña
              </label>
              <Field
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                }
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full bg-transparent py-3 pl-11 pr-12 text-[15px] text-ink placeholder-ink-mute/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-primary-50 hover:text-primary-700"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    )}
                  </svg>
                </button>
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group animate-rise-in relative mt-7 flex h-12 w-full items-center justify-center overflow-hidden rounded-field bg-primary-700 font-semibold text-cream shadow-button transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-button-hover active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              style={{ ["--i" as string]: 4 }}
            >
              {/* sheen sweep on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <p
            className="animate-fade-in mt-8 text-center text-[13px] leading-relaxed text-ink-mute"
            style={{ animationDelay: "700ms" }}
          >
            ¿Problemas para entrar? Escríbenos a{" "}
            <a href="mailto:laglorietarest@gmail.com" className="link-underline font-medium text-primary-700">
              laglorietarest@gmail.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

/* Input shell: warm surface, icon prefix, animated petrol focus ring */
function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="group relative rounded-field bg-surface shadow-field ring-1 ring-line transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500 hover:ring-line-strong">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute transition-colors duration-200 group-focus-within:text-primary-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        {icon}
      </svg>
      {children}
    </div>
  );
}
