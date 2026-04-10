import { FunnelEditor } from "./funnel-editor";

export default async function FunnelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FunnelEditor funnelId={id} />;
}
