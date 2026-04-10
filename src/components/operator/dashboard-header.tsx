"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function formatDate() {
  return new Date().toLocaleDateString("de-AT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DashboardHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const displayName = email ? email.split("@")[0] : "Dashboard";

  return (
    <div className="mb-12">
      <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-3">
        Operator Panel · {formatDate()}
      </p>
      <h1 className="font-headline text-5xl md:text-6xl italic text-on-surface leading-none mb-4">
        {getGreeting()},<br />
        <span className="text-primary">{displayName}</span>
      </h1>
      {email && (
        <p className="font-body text-on-surface-variant text-lg">
          Eingeloggt als <span className="text-on-surface font-medium">{email}</span>
        </p>
      )}
      {!email && (
        <p className="font-body text-on-surface-variant text-lg">
          Übersicht aller aktiven Firmen, Jobs und Bewerber-Pipelines.
        </p>
      )}
    </div>
  );
}
