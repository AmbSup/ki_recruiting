import { Sidebar } from "@/components/operator/sidebar";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Grid Background */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 relative z-10 min-h-screen">
        {children}
      </main>
    </div>
  );
}
