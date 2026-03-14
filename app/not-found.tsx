import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl text-gray-300">404</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          P&aacute;gina no encontrada
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          La p&aacute;gina que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Ir al inicio
        </Link>
        <p className="mt-4 text-xs text-gray-400">
          &iquest;Necesitas ayuda? Escr&iacute;benos a{" "}
          <a href="mailto:laglorietarest@gmail.com" className="text-green-600 underline">laglorietarest@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
