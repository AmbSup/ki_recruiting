"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 grid-pattern pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-container/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary-container/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 w-full max-w-md px-6 text-center">
          <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
          </div>
          <h1 className="font-headline text-4xl italic text-on-surface leading-none mb-3">
            Fast geschafft!
          </h1>
          <p className="font-body text-on-surface-variant mb-8">
            Wir haben eine Bestätigungs-E-Mail an <strong className="text-on-surface">{email}</strong> gesendet.
            Bitte klicke auf den Link darin, um deinen Account zu aktivieren.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-xl px-6 py-3 font-label text-sm font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
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
          Account<br />erstellen.
        </h1>
        <p className="font-body text-on-surface-variant mb-10">
          Registriere dich für das Operator Panel.
        </p>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
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
              placeholder="Mindestens 8 Zeichen"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Password strength */}
          {password.length > 0 && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      password.length >= level * 3
                        ? level <= 2 ? "bg-error" : level === 3 ? "bg-tertiary" : "bg-primary"
                        : "bg-outline-variant/30"
                    }`}
                  />
                ))}
              </div>
              <span className="font-label text-[10px] text-outline">
                {password.length < 6 ? "Zu kurz" : password.length < 9 ? "Schwach" : password.length < 12 ? "Gut" : "Stark"}
              </span>
            </div>
          )}

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
                Registrierung…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">person_add</span>
                Account erstellen
              </>
            )}
          </button>
        </form>

        <p className="font-body text-sm text-on-surface-variant text-center mt-8">
          Bereits registriert?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
