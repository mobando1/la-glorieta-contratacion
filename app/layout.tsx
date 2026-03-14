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
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
