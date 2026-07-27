"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { SIT_TOOLS, SIT_UI, type Lang } from "../_lib/sit-tools-data";
import { SIT_DIAGRAM_BY_ID } from "./sit-diagrams";
import styles from "./sit-tool.module.css";

type FieldValues = Record<string, string>;
type ToolState = Record<string, FieldValues>;
type AiStatus = "idle" | "loading" | "error" | "rate_limited" | "notice";

function storageKey(lang: Lang) {
  return `sit-tools-v1-${lang}`;
}

function isFilled(values: FieldValues | undefined): boolean {
  if (!values) return false;
  return Object.values(values).some((v) => v && v.trim().length > 0);
}

export function SitTool({ lang }: { lang: Lang }) {
  const tools = SIT_TOOLS[lang];
  const ui = SIT_UI[lang];

  const [activeId, setActiveId] = useState(tools[0].id);
  const [state, setState] = useState<ToolState>({});
  const [loaded, setLoaded] = useState(false);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiStatus, setAiStatus] = useState<Record<string, AiStatus>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, Record<string, string>[]>>({});
  const hintTimer = useRef<number | null>(null);

  // Client-only Load — localStorage existiert nicht beim Server-Render, ein
  // lazy useState-Initializer würde hier zum Hydration-Mismatch führen.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(lang));
      if (raw) setState(JSON.parse(raw) as ToolState);
    } catch {
      // corrupt/blocked storage — einfach leer starten
    }
    setLoaded(true);
  }, [lang]);

  // Persist erst NACH dem initialen Load, sonst überschreibt der erste
  // Render (leerer State) das bereits gespeicherte localStorage.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey(lang), JSON.stringify(state));
    } catch {
      // Storage voll/blockiert — Eingaben bleiben trotzdem im UI erhalten
    }
  }, [state, loaded, lang]);

  function handleFieldChange(toolId: string, key: string, value: string) {
    setState((prev) => ({
      ...prev,
      [toolId]: { ...prev[toolId], [key]: value },
    }));
    setSavedHint(`${ui.savedPrefix} ${new Date().toLocaleTimeString()}`);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setSavedHint(null), 1400);
  }

  function handleReset() {
    if (!window.confirm(ui.confirmResetText)) return;
    setState({});
    setAiSuggestions({});
    setAiStatus({});
  }

  async function handleGenerateSuggestions(toolId: string) {
    const product = (state[toolId]?.product || "").trim();
    if (!product) {
      setAiStatus((prev) => ({ ...prev, [toolId]: "notice" }));
      return;
    }
    setAiStatus((prev) => ({ ...prev, [toolId]: "loading" }));
    try {
      const res = await fetch("/api/tools/sit-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, toolId, product, context: state[toolId] || {} }),
      });
      if (res.status === 429) {
        setAiStatus((prev) => ({ ...prev, [toolId]: "rate_limited" }));
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { suggestions?: Record<string, string>[] };
      setAiSuggestions((prev) => ({ ...prev, [toolId]: data.suggestions ?? [] }));
      setAiStatus((prev) => ({ ...prev, [toolId]: "idle" }));
    } catch {
      setAiStatus((prev) => ({ ...prev, [toolId]: "error" }));
    }
  }

  function handleApplySuggestion(toolId: string, suggestion: Record<string, string>) {
    setState((prev) => {
      const next = { ...(prev[toolId] || {}) };
      for (const [key, value] of Object.entries(suggestion)) {
        if (key === "why" || !value) continue;
        next[key] = value;
      }
      return { ...prev, [toolId]: next };
    });
  }

  function buildExportText(): string {
    const filled = tools.filter((t) => isFilled(state[t.id]));
    if (filled.length === 0) return ui.emptyText;
    const lines = [ui.exportHeader, ""];
    filled.forEach((tool) => {
      const values = state[tool.id] || {};
      lines.push(`${tool.num} · ${tool.name.toUpperCase()}`);
      tool.fields.forEach((f) => {
        const v = values[f.key];
        if (v && v.trim()) lines.push(`  ${f.label}: ${v.trim()}`);
      });
      lines.push("");
    });
    return lines.join("\n");
  }

  async function handleCopy() {
    const text = buildExportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      window.prompt(ui.copyLabel, text);
    }
  }

  const activeTool = tools.find((t) => t.id === activeId) ?? tools[0];
  const filledTools = tools.filter((t) => isFilled(state[t.id]));

  return (
    <div className={styles.wrap}>
      <div className={styles.page}>
        <span className={`${styles.reg} ${styles.regTl}`} />
        <span className={`${styles.reg} ${styles.regTr}`} />
        <span className={`${styles.reg} ${styles.regBl}`} />
        <span className={`${styles.reg} ${styles.regBr}`} />

        <header className={styles.masthead}>
          <p className={styles.eyebrow}>
            <span>{ui.eyebrowTag}</span>
            <span className={styles.eyebrowRule} />
            <span>{ui.eyebrowLabel}</span>
          </p>
          <h1 className={styles.title}>{ui.title}</h1>
          <p className={styles.lede}>{ui.lede}</p>
        </header>

        <div className={styles.toolbench} role="tablist" aria-label={ui.eyebrowLabel}>
          {tools.map((tool) => {
            const Diagram = SIT_DIAGRAM_BY_ID[tool.id];
            const filled = isFilled(state[tool.id]);
            return (
              <button
                key={tool.id}
                type="button"
                role="tab"
                aria-selected={tool.id === activeId}
                className={`${styles.tile} ${tool.id === activeId ? styles.tileActive : ""}`}
                onClick={() => setActiveId(tool.id)}
              >
                <span className={`${styles.stamp} ${filled ? styles.stampShow : ""}`}>
                  {ui.stampText}
                </span>
                <span className={styles.tileTag}>{tool.num}</span>
                {Diagram && <Diagram s={styles} />}
                <span className={styles.tileName}>{tool.name}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.detail}>
          <div className={styles.detailHead}>
            <span className={styles.tag}>{activeTool.num}</span>
            <h2>{activeTool.name}</h2>
          </div>
          <p className={styles.definition}>{activeTool.def}</p>
          <div className={styles.example}>
            <span className={styles.exampleKey}>{ui.exampleLabel}</span>
            <span className={`${styles.exampleVal} ${styles.exampleValName}`}>
              {activeTool.example.name}
            </span>
            {activeTool.example.rows.map(([k, v]) => (
              <Fragment key={k}>
                <span className={styles.exampleKey}>{k}</span>
                <span className={styles.exampleVal}>{v}</span>
              </Fragment>
            ))}
          </div>

          <form
            className={styles.worksheet}
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            {activeTool.fields
              .filter((f) => !f.aiGenerated || (state[activeTool.id]?.[f.key] ?? "").trim().length > 0)
              .map((f) => {
                const fieldId = `${activeTool.id}-${f.key}`;
                const value = state[activeTool.id]?.[f.key] ?? "";
                return (
                  <div className={styles.field} key={f.key}>
                    <label htmlFor={fieldId}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea
                        id={fieldId}
                        value={value}
                        onChange={(e) => handleFieldChange(activeTool.id, f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        id={fieldId}
                        type="text"
                        value={value}
                        onChange={(e) => handleFieldChange(activeTool.id, f.key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            <p className={`${styles.saveHint} ${savedHint ? styles.saveHintShow : ""}`}>
              {savedHint ?? " "}
            </p>
            {activeTool.fields.some((f) => f.aiGenerated) && (
              <p className={styles.aiNotice}>{ui.aiFieldsHint}</p>
            )}
          </form>

          <div className={styles.aiRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => handleGenerateSuggestions(activeTool.id)}
              disabled={aiStatus[activeTool.id] === "loading"}
            >
              {aiStatus[activeTool.id] === "loading" ? ui.aiLoadingLabel : ui.aiButtonLabel}
            </button>
            {aiStatus[activeTool.id] === "notice" && (
              <span className={styles.aiNotice}>{ui.aiRequireProductLabel}</span>
            )}
            {aiStatus[activeTool.id] === "error" && (
              <span className={styles.aiNotice}>{ui.aiErrorLabel}</span>
            )}
            {aiStatus[activeTool.id] === "rate_limited" && (
              <span className={styles.aiNotice}>{ui.aiRateLimitLabel}</span>
            )}
          </div>

          {(aiSuggestions[activeTool.id]?.length ?? 0) > 0 && (
            <div className={styles.aiSuggestions}>
              <p className={styles.aiSuggestionsHeading}>{ui.aiSuggestionsHeading}</p>
              <div className={styles.aiCards}>
                {aiSuggestions[activeTool.id]!.map((sugg, i) => (
                  <div className={styles.aiCard} key={i}>
                    <p className={styles.aiCardLabel}>{ui.aiSuggestionLabel(i + 1)}</p>
                    <dl className={styles.aiCardFields}>
                      {activeTool.fields
                        .filter((f) => f.key !== "product" && sugg[f.key])
                        .map((f) => (
                          <Fragment key={f.key}>
                            <dt>{f.label}</dt>
                            <dd>{sugg[f.key]}</dd>
                          </Fragment>
                        ))}
                    </dl>
                    {sugg.why && (
                      <p className={styles.aiWhy}>
                        <span className={styles.aiWhyLabel}>{ui.aiWhyLabel}: </span>
                        {sugg.why}
                      </p>
                    )}
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={() => handleApplySuggestion(activeTool.id, sugg)}
                    >
                      {ui.aiApplyLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className={styles.summary}>
          <div className={styles.summaryHead}>
            <div>
              <h2>{ui.summaryTitle}</h2>
              <p className={styles.summaryCount}>{ui.countLabel(filledTools.length, tools.length)}</p>
            </div>
            <div className={styles.summaryActions}>
              <button type="button" className={styles.btn} onClick={handleReset}>
                {ui.resetLabel}
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCopy}>
                {copied ? ui.copiedLabel : ui.copyLabel}
              </button>
            </div>
          </div>

          {filledTools.length === 0 ? (
            <p className={styles.empty}>{ui.emptyText}</p>
          ) : (
            <div className={styles.sheet}>
              {filledTools.map((tool) => {
                const values = state[tool.id] || {};
                return (
                  <div className={styles.sheetItem} key={tool.id}>
                    <span className={styles.tag}>{tool.num}</span>
                    <div className={styles.sheetBody}>
                      <h3>{tool.name}</h3>
                      <dl>
                        {tool.fields
                          .filter((f) => values[f.key]?.trim())
                          .map((f) => (
                            <Fragment key={f.key}>
                              <dt>{f.label}</dt>
                              <dd>{values[f.key]}</dd>
                            </Fragment>
                          ))}
                      </dl>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className={styles.footerNote}>{ui.footerNote}</footer>
      </div>
    </div>
  );
}
