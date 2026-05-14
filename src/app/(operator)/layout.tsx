import { redirect } from "next/navigation";
import { Sidebar } from "@/components/operator/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role;
  if (role !== "admin" && role !== "operator" && role !== "viewer") {
    redirect("/login?reason=forbidden");
  }

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
