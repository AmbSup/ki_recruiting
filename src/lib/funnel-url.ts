// Platform-Default für Funnel-Share-URLs. Hardcoded weil "alles auf eine
// Domain". NEXT_PUBLIC_FUNNEL_BASE_URL kann ihn überschreiben, ABER die alte
// Vercel-Default-Domain (ki-recruiting.vercel.app) wird ignoriert — sonst
// blendet eine veraltete Vercel-Env-Var weiter die alten Links ein.
const PLATFORM_BASE_URL = "https://app.neuronic-automation.ai";
const LEGACY_VERCEL_HOST = "ki-recruiting.vercel.app";

export function getFunnelPublicUrl(funnel: {
  funnel_type: string;
  external_url: string | null;
  slug: string;
}): string {
  if (funnel.funnel_type === "external" && funnel.external_url) {
    return funnel.external_url;
  }
  const envBase = process.env.NEXT_PUBLIC_FUNNEL_BASE_URL;
  const base = envBase && !envBase.includes(LEGACY_VERCEL_HOST)
    ? envBase
    : PLATFORM_BASE_URL;
  return `${base}/${funnel.slug}`;
}
