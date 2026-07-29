import {
  loadPageEvents,
  loadPageEventsMulti,
  loadAllFunnelViewEvents,
  computeDailyVisits,
  countUniqueVisitors,
} from "@/lib/page-analytics";
import { LineChart } from "@/components/operator/charts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WebsiteAnalyticsPage() {
  const [wissenEvents, kmuEvents, innovationsEvents, pilotEvents, funnelEvents] = await Promise.all([
    loadPageEvents("wissen"),
    loadPageEvents("kmu"),
    loadPageEventsMulti(["innovations-werkzeuge", "en/innovations-werkzeuge"]),
    loadPageEventsMulti(["pilot-30-tage", "en/pilot-30-tage"]),
    loadAllFunnelViewEvents(),
  ]);

  const cards = [
    { label: "Wissensmanagement", path: "/wissen", accent: "#7b555c", events: wissenEvents },
    { label: "KMU-Lösungen", path: "/kmu", accent: "#B45309", events: kmuEvents },
    { label: "Innovations-Werkzeuge", path: "/innovations-werkzeuge", accent: "#c6491f", events: innovationsEvents },
    { label: "Pilot 30 Tage", path: "/pilot-30-tage", accent: "#0f766e", events: pilotEvents },
    { label: "Funnels (alle, aggregiert)", path: "/[slug]", accent: "#1f2937", events: funnelEvents },
  ];

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1400px]">
      <div className="mb-8">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-1">
          Website-Analytics · letzte 30 Tage
        </p>
        <h1 className="font-headline text-4xl italic text-on-surface leading-none">Besucher pro Tag</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <KpiTile key={c.label} label={c.label} value={countUniqueVisitors(c.events).toString()} accent={c.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-1">{c.label}</h3>
            <p className="font-label text-[10px] text-outline mb-4">{c.path}</p>
            <LineChart points={computeDailyVisits(c.events)} accent={c.accent} showSecondary={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-sm text-outline">visibility</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{label}</span>
      </div>
      <div className="font-headline text-3xl text-on-surface leading-none" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="font-label text-[10px] text-outline mt-1">Besucher letzte 30 Tage</div>
    </div>
  );
}
