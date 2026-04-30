import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

// Kunden-PDF: kuratierte Sicht auf eine Application. Bewusst NICHT enthalten:
// red_flags (Diskriminierungsrisiko bei Versand), volle Transcripts, vapi_call_id,
// recording_url, operator_notes, pipeline_stage, customer-decision-Felder.

export type ApplicantReportData = {
  job_title: string;
  company_name: string;
  primary_color: string | null;
  applicant: {
    full_name: string;
    email: string;
    phone: string | null;
    cv_file_url: string | null;
  };
  funnel_name: string | null;
  source: string;
  applied_at: string;
  overall_score: number | null;
  score_breakdown: {
    hard_skills: number;
    soft_skills: number;
    experience: number;
    education: number;
    ko_criteria_passed: boolean;
  } | null;
  cv_analysis: {
    summary: string | null;
    strengths: string[];
    gaps: string[];
    structured: {
      skills: string[];
      years_experience: number | null;
      education: string | null;
      languages: string[];
    };
  } | null;
  funnel_qa: { question: string; answers: string[] }[];
  voice_calls: {
    started_at: string | null;
    duration_seconds: number | null;
    interview_score: number | null;
    recommendation: string | null;
    summary: string | null;
    key_insights: string[];
    quotes: { speaker: string; text: string }[];
  }[];
  generated_at: string;
};

const DEFAULT_ACCENT = "#1f2937";

const recommendationLabel: Record<string, string> = {
  strong_yes: "Starkes Ja",
  yes: "Ja",
  maybe: "Vielleicht",
  no: "Nein",
  strong_no: "Starkes Nein",
};

const sourceLabel: Record<string, string> = {
  facebook: "Facebook Ads",
  instagram: "Instagram Ads",
  linkedin: "LinkedIn",
  direct: "Direkt",
  referral: "Empfehlung",
};

function formatDateDe(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTimeDe(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-AT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(s: number | null): string {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")} min`;
}

function scoreColor(score: number | null, accent: string): string {
  if (score === null) return "#9ca3af";
  if (score >= 75) return accent;
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function buildStyles(accent: string) {
  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1f2937",
      lineHeight: 1.45,
    },
    headerBanner: {
      backgroundColor: accent,
      color: "#ffffff",
      padding: 18,
      borderRadius: 8,
      marginBottom: 18,
    },
    headerKicker: {
      fontSize: 9,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: "#ffffff",
      opacity: 0.85,
      marginBottom: 4,
      fontFamily: "Helvetica-Bold",
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
      marginBottom: 2,
    },
    headerSub: {
      fontSize: 10,
      color: "#ffffff",
      opacity: 0.9,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 1,
      color: accent,
      marginBottom: 8,
      marginTop: 14,
    },
    card: {
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderRadius: 6,
      padding: 12,
      marginBottom: 10,
    },
    rowSpread: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    candidateName: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#111827",
      marginBottom: 4,
    },
    metaLine: {
      fontSize: 9,
      color: "#4b5563",
      marginTop: 2,
    },
    label: {
      fontSize: 8,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#6b7280",
      fontFamily: "Helvetica-Bold",
      marginBottom: 2,
    },
    bigScore: {
      fontSize: 36,
      fontFamily: "Helvetica-Bold",
      lineHeight: 1,
    },
    scoreSubtle: {
      fontSize: 9,
      color: "#6b7280",
      marginTop: 2,
    },
    pillarRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    pillar: {
      flex: 1,
      backgroundColor: "#f9fafb",
      borderRadius: 4,
      padding: 8,
    },
    pillarLabel: {
      fontSize: 7,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#6b7280",
      fontFamily: "Helvetica-Bold",
    },
    pillarValue: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      marginTop: 4,
    },
    koPass: {
      marginTop: 8,
      padding: 6,
      borderRadius: 4,
      fontSize: 9,
      backgroundColor: "#ecfdf5",
      color: "#047857",
      fontFamily: "Helvetica-Bold",
    },
    koFail: {
      marginTop: 8,
      padding: 6,
      borderRadius: 4,
      fontSize: 9,
      backgroundColor: "#fef2f2",
      color: "#b91c1c",
      fontFamily: "Helvetica-Bold",
    },
    summaryText: {
      fontSize: 10,
      color: "#1f2937",
      marginBottom: 8,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: 3,
    },
    bulletDot: {
      width: 10,
      fontSize: 10,
      color: accent,
    },
    bulletText: {
      flex: 1,
      fontSize: 9,
      color: "#1f2937",
    },
    twoCol: {
      flexDirection: "row",
      gap: 12,
      marginTop: 6,
    },
    halfCol: {
      flex: 1,
    },
    structuredItem: {
      marginBottom: 4,
    },
    structuredLabel: {
      fontSize: 7,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#6b7280",
      fontFamily: "Helvetica-Bold",
    },
    structuredValue: {
      fontSize: 9,
      color: "#1f2937",
    },
    qaQuestion: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#374151",
      marginBottom: 2,
    },
    qaAnswer: {
      fontSize: 9,
      color: "#1f2937",
      marginBottom: 8,
    },
    callHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    callDate: {
      fontSize: 9,
      color: "#6b7280",
    },
    badge: {
      fontSize: 8,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: "Helvetica-Bold",
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    quoteBlock: {
      borderLeftWidth: 2,
      borderLeftColor: accent,
      paddingLeft: 8,
      marginBottom: 6,
    },
    quoteSpeaker: {
      fontSize: 7,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#6b7280",
      fontFamily: "Helvetica-Bold",
      marginBottom: 1,
    },
    quoteText: {
      fontSize: 9,
      fontStyle: "italic",
      color: "#374151",
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: {
      fontSize: 8,
      color: "#9ca3af",
    },
    cvLink: {
      fontSize: 9,
      color: accent,
      textDecoration: "underline",
    },
    emptyHint: {
      fontSize: 9,
      color: "#9ca3af",
      fontStyle: "italic",
    },
  });
}

function recommendationBadgeStyle(rec: string | null, accent: string) {
  if (!rec) return { backgroundColor: "#f3f4f6", color: "#6b7280" };
  if (rec === "strong_yes" || rec === "yes") return { backgroundColor: accent, color: "#ffffff" };
  if (rec === "maybe") return { backgroundColor: "#fef3c7", color: "#92400e" };
  return { backgroundColor: "#fee2e2", color: "#b91c1c" };
}

export function ApplicantReportPDF({ data }: { data: ApplicantReportData }) {
  const accent = data.primary_color?.trim() || DEFAULT_ACCENT;
  const styles = buildStyles(accent);
  const cv = data.cv_analysis;
  const sb = data.score_breakdown;

  return (
    <Document
      title={`${data.applicant.full_name} — ${data.job_title}`}
      author="Neuronic Recruiting"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerKicker}>Bewerber-Report</Text>
          <Text style={styles.headerTitle}>
            {data.job_title} · {data.company_name}
          </Text>
          <Text style={styles.headerSub}>Erstellt am {formatDateDe(data.generated_at)}</Text>
        </View>

        {/* Bewerber-Hero */}
        <View style={styles.card}>
          <View style={styles.rowSpread}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Bewerber</Text>
              <Text style={styles.candidateName}>{data.applicant.full_name}</Text>
              <Text style={styles.metaLine}>E-Mail: {data.applicant.email}</Text>
              {data.applicant.phone && (
                <Text style={styles.metaLine}>Telefon: {data.applicant.phone}</Text>
              )}
              <Text style={styles.metaLine}>
                Beworben am {formatDateDe(data.applied_at)} · Quelle:{" "}
                {sourceLabel[data.source] ?? data.source}
                {data.funnel_name ? ` · Funnel: ${data.funnel_name}` : ""}
              </Text>
              {data.applicant.cv_file_url && (
                <Link src={data.applicant.cv_file_url} style={styles.cvLink}>
                  Lebenslauf herunterladen
                </Link>
              )}
            </View>
          </View>
        </View>

        {/* Score-Übersicht */}
        <Text style={styles.sectionTitle}>Score-Übersicht</Text>
        <View style={styles.card}>
          <View style={styles.rowSpread}>
            <View>
              <Text style={styles.label}>Gesamt-Match</Text>
              <Text style={[styles.bigScore, { color: scoreColor(data.overall_score, accent) }]}>
                {data.overall_score ?? "—"}
              </Text>
              <Text style={styles.scoreSubtle}>von 100 Punkten</Text>
            </View>
          </View>

          {sb && (
            <>
              <View style={styles.pillarRow}>
                <View style={styles.pillar}>
                  <Text style={styles.pillarLabel}>Hard Skills</Text>
                  <Text style={[styles.pillarValue, { color: scoreColor(sb.hard_skills, accent) }]}>
                    {sb.hard_skills}
                  </Text>
                </View>
                <View style={styles.pillar}>
                  <Text style={styles.pillarLabel}>Soft Skills</Text>
                  <Text style={[styles.pillarValue, { color: scoreColor(sb.soft_skills, accent) }]}>
                    {sb.soft_skills}
                  </Text>
                </View>
                <View style={styles.pillar}>
                  <Text style={styles.pillarLabel}>Erfahrung</Text>
                  <Text style={[styles.pillarValue, { color: scoreColor(sb.experience, accent) }]}>
                    {sb.experience}
                  </Text>
                </View>
                <View style={styles.pillar}>
                  <Text style={styles.pillarLabel}>Bildung</Text>
                  <Text style={[styles.pillarValue, { color: scoreColor(sb.education, accent) }]}>
                    {sb.education}
                  </Text>
                </View>
              </View>
              <Text style={sb.ko_criteria_passed ? styles.koPass : styles.koFail}>
                {sb.ko_criteria_passed
                  ? "KO-Kriterien: erfüllt"
                  : "KO-Kriterien: nicht erfüllt"}
              </Text>
            </>
          )}
        </View>

        {/* KI CV-Empfehlung */}
        {cv && (
          <>
            <Text style={styles.sectionTitle}>KI-Bewertung Lebenslauf</Text>
            <View style={styles.card}>
              {cv.summary && <Text style={styles.summaryText}>{cv.summary}</Text>}

              {(cv.strengths.length > 0 || cv.gaps.length > 0) && (
                <View style={styles.twoCol}>
                  <View style={styles.halfCol}>
                    <Text style={styles.label}>Stärken</Text>
                    {cv.strengths.length > 0 ? (
                      cv.strengths.map((s, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{s}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyHint}>Keine Stärken erfasst.</Text>
                    )}
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={styles.label}>Lücken</Text>
                    {cv.gaps.length > 0 ? (
                      cv.gaps.map((g, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{g}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyHint}>Keine Lücken erfasst.</Text>
                    )}
                  </View>
                </View>
              )}

              <View style={[styles.twoCol, { marginTop: 10 }]}>
                <View style={styles.halfCol}>
                  <View style={styles.structuredItem}>
                    <Text style={styles.structuredLabel}>Skills</Text>
                    <Text style={styles.structuredValue}>
                      {cv.structured.skills.length > 0 ? cv.structured.skills.join(", ") : "—"}
                    </Text>
                  </View>
                  <View style={styles.structuredItem}>
                    <Text style={styles.structuredLabel}>Sprachen</Text>
                    <Text style={styles.structuredValue}>
                      {cv.structured.languages.length > 0
                        ? cv.structured.languages.join(", ")
                        : "—"}
                    </Text>
                  </View>
                </View>
                <View style={styles.halfCol}>
                  <View style={styles.structuredItem}>
                    <Text style={styles.structuredLabel}>Berufserfahrung</Text>
                    <Text style={styles.structuredValue}>
                      {cv.structured.years_experience !== null
                        ? `${cv.structured.years_experience} Jahre`
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.structuredItem}>
                    <Text style={styles.structuredLabel}>Bildung</Text>
                    <Text style={styles.structuredValue}>
                      {cv.structured.education ?? "—"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Funnel-Antworten */}
        {data.funnel_qa.length > 0 && (
          <>
            <Text style={styles.sectionTitle} break={data.funnel_qa.length > 4}>
              Funnel-Antworten
            </Text>
            <View style={styles.card}>
              {data.funnel_qa.map((qa, i) => (
                <View key={i} wrap={false}>
                  <Text style={styles.qaQuestion}>{qa.question}</Text>
                  <Text style={styles.qaAnswer}>
                    {qa.answers.length > 0 ? qa.answers.join(", ") : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Interview-Highlights */}
        {data.voice_calls.length > 0 && (
          <>
            <Text style={styles.sectionTitle} break>
              Interview-Highlights
            </Text>
            {data.voice_calls.map((call, i) => {
              const recBadge = recommendationBadgeStyle(call.recommendation, accent);
              return (
                <View key={i} style={styles.card} wrap={false}>
                  <View style={styles.callHeader}>
                    <View>
                      <Text style={styles.label}>Interview {i + 1}</Text>
                      <Text style={styles.callDate}>
                        {formatDateTimeDe(call.started_at)} · {formatDuration(call.duration_seconds)}
                      </Text>
                    </View>
                    {call.recommendation && (
                      <Text style={[styles.badge, recBadge]}>
                        {recommendationLabel[call.recommendation] ?? call.recommendation}
                        {call.interview_score !== null ? ` · ${call.interview_score}/100` : ""}
                      </Text>
                    )}
                  </View>

                  {call.summary && <Text style={styles.summaryText}>{call.summary}</Text>}

                  {call.key_insights.length > 0 && (
                    <>
                      <Text style={[styles.label, { marginTop: 4 }]}>Key Insights</Text>
                      {call.key_insights.map((ins, j) => (
                        <View key={j} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{ins}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {call.quotes.length > 0 && (
                    <>
                      <Text style={[styles.label, { marginTop: 8 }]}>Aussagen aus dem Gespräch</Text>
                      {call.quotes.map((q, j) => (
                        <View key={j} style={styles.quoteBlock}>
                          <Text style={styles.quoteSpeaker}>{q.speaker}</Text>
                          <Text style={styles.quoteText}>&quot;{q.text}&quot;</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Footer (fixed, jede Seite) */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Vertraulich – nur für autorisierte Empfänger · Generiert am{" "}
            {formatDateDe(data.generated_at)}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
