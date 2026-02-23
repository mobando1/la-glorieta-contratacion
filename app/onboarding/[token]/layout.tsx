export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branding header */}
      <header className="border-b bg-white px-4 py-4 shadow-card">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
            <span className="text-lg">🍽️</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">La Glorieta y Salomé</h1>
            <p className="text-xs text-gray-500">Proceso de Contratación</p>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
