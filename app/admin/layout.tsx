import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="min-h-screen flex-1 pt-14 lg:ml-64 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
