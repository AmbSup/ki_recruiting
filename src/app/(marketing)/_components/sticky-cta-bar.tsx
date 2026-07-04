"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { t, type Lang } from "../_lib/t";
import { dogfoodUrl } from "../_lib/dogfood";

// Sticky Bottom-Bar. Erscheint nach ~600px Scroll (Hero durch), verschwindet
// wenn der User innerhalb der Dogfood-Section ist (dort ist der CTA prominent
// als Card vorhanden — Doppelung wäre nervig).
//
// Variante: "home" zeigt beide Demo-Links, sonst nur der jeweils passende.

type Variant = "home" | "sales" | "recruiting";

export function StickyCTABar({
  lang,
  variant,
}: {
  lang: Lang;
  variant: Variant;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function check() {
      const y = window.scrollY;
      const dogfood = document.getElementById("dogfood");
      // Wenn Dogfood-Section im Viewport → hide.
      if (dogfood) {
        const rect = dogfood.getBoundingClientRect();
        const dogfoodInView =
          rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
        setVisible(y > 600 && !dogfoodInView);
      } else {
        setVisible(y > 600);
      }
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const showSales = variant === "home" || variant === "sales";
  const showRecruiting = variant === "home" || variant === "recruiting";
  const label = t(lang, "sticky_cta.label");

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white pl-5 pr-2 py-2 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.4)]">
        <span className="text-sm hidden sm:inline">{label}</span>
        <span className="text-sm sm:hidden">📞</span>
        {showSales && (
          <Link
            href={dogfoodUrl("sales", lang)}
            className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 transition"
          >
            {t(lang, "sticky_cta.sales")}
          </Link>
        )}
        {showRecruiting && (
          <Link
            href={dogfoodUrl("recruiting", lang)}
            className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-200 transition"
          >
            {t(lang, "sticky_cta.recruiting")}
          </Link>
        )}
      </div>
    </div>
  );
}
