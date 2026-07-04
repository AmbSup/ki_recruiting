// Dot-Path-Lookup in verschachteltem Dict. Pattern angelehnt an
// funnel-player.tsx (dort flat), aber für Marketing besser verschachtelt
// (dict.sales.hero.headline) damit die Struktur der Copy erkennbar bleibt.

import { dict, type Lang, type Dict } from "./dict";

export function t(lang: Lang, path: string): string {
  const parts = path.split(".");
  let cursor: unknown = dict[lang];
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else {
      // Fallback auf DE-Dict wenn EN-Key fehlt (defense-in-depth während
      // Copy-Iteration). Debug-friendly: gibt den Key zurück statt "".
      if (lang !== "de") {
        return t("de", path);
      }
      return path;
    }
  }
  return typeof cursor === "string" ? cursor : path;
}

export function tList(lang: Lang, path: string): string[] {
  const parts = path.split(".");
  let cursor: unknown = dict[lang];
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else {
      if (lang !== "de") return tList("de", path);
      return [];
    }
  }
  return Array.isArray(cursor) ? (cursor as string[]) : [];
}

export type { Lang, Dict };
