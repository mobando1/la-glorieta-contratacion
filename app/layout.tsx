import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Glorieta y Salomé — Sistema de Contratación",
  description: "Sistema de contratación inteligente para restaurantes La Glorieta y Salomé en Guaduas, Cundinamarca",
  openGraph: {
    title: "La Glorieta y Salomé — Trabaja con nosotros",
    description: "Aplica para trabajar en los restaurantes La Glorieta y Salomé en Guaduas, Cundinamarca",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
