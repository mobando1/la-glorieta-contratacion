"use client";

import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl text-red-500">!</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          Error en el panel
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Ocurrio un error al cargar esta seccion. Por favor intenta de nuevo.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Reintentar
          </button>
          <Link
            href="/admin/candidatos"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
