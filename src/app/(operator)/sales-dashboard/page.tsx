import { KpiCard } from "@/components/operator/kpi-card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SalesDashboardPage() {
  const supabase = await createClient();

  const [
    { count: programsActive },
    { count: leadsNew },
    { data: weekMeetings },
    { data: ratings },
  ] = await Promise.all([
    supabase.from("sales_programs").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("sales_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("sales_call_analyses")
      .select("id, meeting_booked, meeting_datetime")
      .eq("meeting_booked", true)
      .gte("meeting_datetime", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lte("meeting_datetime", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("sales_call_analyses").select("call_rating").not("call_rating", "is", null),
  ]);

  const meetingsThisWindow = weekMeetings?.length ?? 0;
  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((a, r) => a + (r.call_rating ?? 0), 0) / ratings.length).toFixed(1)
    : "–";

  return (
    <div className="px-8 pt-10 pb-32">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            Operator Panel
          </p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Sales</h1>
          <p className="font-body text-on-surface-variant mt-2">
            AI-Outbound-Calls für B2B-Leads · parallel zum Recruiting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sales/programs"
            className="border border-outline-variant/30 text-on-surface-variant rounded-xl px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
          >
            Programs
          </Link>
          <Link
            href="/sales/leads"
            className="bg-primary text-on-primary rounded-xl px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">people</span>
            Leads
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-8">
        <KpiCard className="col-span-12 md:col-span-3" icon="trending_up" label="Aktive Programs" value={String(programsActive ?? 0)} />
        <KpiCard className="col-span-12 md:col-span-3" icon="inbox" label="Neue Leads" value={String(leadsNew ?? 0)} />
        <KpiCard className="col-span-12 md:col-span-3" icon="event_available" label="Meetings (±7 Tage)" value={String(meetingsThisWindow)} />
        <KpiCard className="col-span-12 md:col-span-3" icon="star" label="Ø Call-Rating" value={String(avgRating)} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Link
          href="/sales/programs"
          className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all group"
        >
          <span className="material-symbols-outlined text-tertiary text-3xl mb-3 block">trending_up</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-1 group-hover:text-primary transition-colors">Programs</h3>
          <p className="font-body text-sm text-outline">Pitch, Value Prop, Assistant-ID, Booking-Link je Zielmarkt anlegen und pflegen.</p>
        </Link>
        <Link
          href="/sales/leads"
          className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all group"
        >
          <span className="material-symbols-outlined text-primary text-3xl mb-3 block">people</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-1 group-hover:text-primary transition-colors">Leads</h3>
          <p className="font-body text-sm text-outline">Meta · CSV · Funnel · Manual — alle Quellen, ein Status-Bild.</p>
        </Link>
        <Link
          href="/sales/calls"
          className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all group"
        >
          <span className="material-symbols-outlined text-primary text-3xl mb-3 block">call</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-1 group-hover:text-primary transition-colors">Calls</h3>
          <p className="font-body text-sm text-outline">Transkripte, Claude-Analysen, Meeting-Buchungen, Objection-Log.</p>
        </Link>
      </div>
    </div>
  );
}
