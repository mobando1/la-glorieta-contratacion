export function StatCard({
  label,
  value,
  icon,
  color = "primary",
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: "primary" | "amber" | "purple" | "blue" | "teal";
}) {
  const colorMap = {
    primary: "bg-primary-50 text-primary-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    teal: "bg-teal-50 text-teal-600",
  };

  const iconColors = colorMap[color];

  return (
    <div className="rounded-card bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColors}`}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs font-medium text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
