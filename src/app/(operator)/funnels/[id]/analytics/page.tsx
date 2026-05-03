import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadFunnelEvents,
  loadPageLabels,
  computeTopKpis,
  computeStepDropoff,
  computeTimeSeries,
  computeDeviceDistribution,
  computeCallMetrics,
} from "@/lib/funnel-analytics";
import { BarWaterfall, LineChart, Donut } from "@/components/operator/charts";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Funnel = {
  id: string;
  name: string;
  slug: string;
  job_id: string | null;
  sales_program_id: string | null;
  branding: { primary_color?: string } | null;
};

export default async function FunnelAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: funnelData } = await supabase
    .from("funnels")
    .select("id, name, slug, job_id, sales_program_id, branding")
    .eq("id", id)
    .single();
  const funnel = funnelData as Funnel | null;
  if (!funnel) {
    return (
      <div className="px-8 pt-10">
        <p className="font-body text-on-surface-variant">Funnel nicht gefunden.</p>
      </div>
    );
  }

  const accent = funnel.branding?.primary_color ?? "#1f2937";

  const [events, pageLabels, callMetrics] = await Promise.all([
    loadFunnelEvents(id),
    loadPageLabels(id),
    computeCallMetrics(id, { job_id: funnel.job_id, sales_program_id: funnel.sales_program_id }),
  ]);

  const kpis = computeTopKpis(events);
  const dropoff = computeStepDropoff(events, pageLabels);
  const timeSeries = computeTimeSeries(events);
  const deviceDist = computeDeviceDistribution(events);
  const purpose = funnel.job_id ? "recruiting" : "sales";

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1400px]">
      <Link href="/funnels"
        className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-6">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Funnels</span>
      </Link>

      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-1">
            Funnel-Analytics · letzte 30 Tage
          </p>
          <h1 className="font-headline text-4xl italic text-on-surface leading-none">{funnel.name}</h1>
          <p className="font-label text-xs text-outline mt-2">/{funnel.slug}</p>
        </div>
        <Link
          href={`/funnels/${id}/editor`}
          className="flex items-center gap-2 border border-outline-variant/30 text-on-surface-variant rounded-xl px-4 py-2 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Editor
        </Link>
      </div>

      {/* ── KPI-Tiles ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiTile label="Besuche" value={kpis.visits.toString()} icon="visibility" />
        <KpiTile label="Conversions" value={kpis.conversions.toString()} icon="check_circle" />
        <KpiTile label="Conversion-Rate" value={`${kpis.conversionRate.toFixed(1)}%`} icon="trending_up" accent={accent} />
        <KpiTile label="Top-Quelle" value={kpis.topSource} icon="ads_click" />
      </div>

      {events.length === 0 && (
        <div className="bg-tertiary-container/15 border border-tertiary-container/40 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-tertiary text-base flex-shrink-0 mt-0.5">info</span>
          <div className="flex-1">
            <p className="font-body text-sm text-on-surface">
              Noch keine Tracking-Daten — sobald jemand den Funnel besucht, erscheinen Werte hier.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Step-Drop-off ───────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">
            Seite-zu-Seite-Conversion
          </h3>
          <BarWaterfall steps={dropoff} accent={accent} />
        </div>

        {/* ── Time-Series ─────────────────────────────────────────── */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">
            Conversion-Rate über Zeit
          </h3>
          <LineChart points={timeSeries} accent={accent} />
        </div>

        {/* ── Device-Distribution ─────────────────────────────────── */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">
            Geräteverteilung
          </h3>
          <Donut slices={deviceDist} accent={accent} />
        </div>
      </div>

      {/* ── KI-Call-Metriken ─────────────────────────────────────── */}
      {callMetrics && callMetrics.callsCompleted > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline">
              KI-Call-Metriken
            </h3>
            <span className="font-label text-[10px] text-outline">{callMetrics.side}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat label="Calls geführt" value={callMetrics.callsCompleted.toString()} />
            <MiniStat
              label="Avg Dauer"
              value={callMetrics.avgDurationSec ? `${Math.floor(callMetrics.avgDurationSec / 60)}:${(callMetrics.avgDurationSec % 60).toString().padStart(2, "0")} min` : "—"}
            />
            <MiniStat
              label={purpose === "recruiting" ? "Avg Interview-Score" : "Avg Call-Rating"}
              value={callMetrics.avgRating !== null ? `${callMetrics.avgRating}` : "—"}
            />
            {purpose === "sales" ? (
              <MiniStat
                label="Meeting-Rate"
                value={callMetrics.meetingBookingRate !== null ? `${callMetrics.meetingBookingRate}%` : "—"}
                sub={`${callMetrics.meetingsBooked} gebucht`}
              />
            ) : (
              <MiniStat
                label="Empfehlung Ja"
                value={callMetrics.recommendYesPct !== null ? `${callMetrics.recommendYesPct}%` : "—"}
              />
            )}
          </div>
        </div>
      )}

      {callMetrics && callMetrics.callsCompleted === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mt-5 text-center">
          <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">call</span>
          <p className="font-body text-sm text-on-surface-variant">
            Noch keine abgeschlossenen KI-Calls für diesen Funnel.
          </p>
        </div>
      )}
    </div>
  );
}

function KpiTile({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-sm text-outline">{icon}</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{label}</span>
      </div>
      <div className="font-headline text-3xl text-on-surface leading-none truncate" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-1">{label}</div>
      <div className="font-headline text-2xl text-on-surface leading-none">{value}</div>
      {sub && <div className="font-label text-[10px] text-outline mt-1">{sub}</div>}
    </div>
  );
}
