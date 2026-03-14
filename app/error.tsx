"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl text-red-500">!</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          Algo salió mal
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Reintentar
        </button>
        <p className="mt-4 text-xs text-gray-400">
          Si el problema persiste, escr&iacute;benos a{" "}
          <a href="mailto:laglorietarest@gmail.com" className="text-green-600 underline">laglorietarest@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
