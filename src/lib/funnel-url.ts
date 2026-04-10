export function getFunnelPublicUrl(funnel: {
  funnel_type: string;
  external_url: string | null;
  slug: string;
}): string {
  if (funnel.funnel_type === "external" && funnel.external_url) {
    return funnel.external_url;
  }
  const base = process.env.NEXT_PUBLIC_FUNNEL_BASE_URL ?? "https://apply.domain.com";
  return `${base}/${funnel.slug}`;
}
