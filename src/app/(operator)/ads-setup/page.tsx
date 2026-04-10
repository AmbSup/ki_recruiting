import { AdsSetupClient } from "./client";

export default async function AdsSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ funnel_id?: string }>;
}) {
  const { funnel_id } = await searchParams;
  return <AdsSetupClient funnelId={funnel_id ?? null} />;
}
