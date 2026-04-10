"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      {/* Grid Background */}
      <div className="fixed inset-0 grid-pattern pointer-events-none" />

      {/* Dekorative Shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-container/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary-container/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-on-primary text-xl">psychology</span>
          </div>
          <span className="font-headline text-2xl italic font-semibold text-on-surface">KI Recruit</span>
        </div>

        {/* Headline */}
        <h1 className="font-headline text-5xl italic text-on-surface leading-none mb-3">
          Willkommen<br />zurück.
        </h1>
        <p className="font-body text-on-surface-variant mb-10">
          Melde dich im Operator Panel an.
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="operator@kirecruit.at"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="font-body text-sm text-error">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-label text-sm font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Anmelden…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">login</span>
                Anmelden
              </>
            )}
          </button>
        </form>

        <p className="font-body text-sm text-on-surface-variant text-center mt-8">
          Noch kein Account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
