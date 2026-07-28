"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { SIT_TOOLS, SIT_UI, type Lang } from "../_lib/sit-tools-data";
import { SIT_DIAGRAM_BY_ID } from "./sit-diagrams";
import styles from "./sit-tool.module.css";

type FieldValues = Record<string, string>;
type Shared = {
  product: string;
  problem: string;
  internalComponents: string;
  externalComponents: string;
  variables: string;
};
type Answers = Record<string, FieldValues>;
type AiStatus = "idle" | "loading" | "error" | "rate_limited";

const PRODUCT_MAX_LEN = 160;
const PROBLEM_MAX_LEN = 300;
const COMPONENTS_MAX_LEN = 300;
const VARIABLES_MAX_LEN = 300;

// v4: Variablen/Attribute als eigenes Feld ergänzt (siehe SIT-Testreihe —
// Multiplication und Attribute Dependency treffen deutlich öfter, wenn die
// im Fall genannten Variablen wie "Durchmesser, Position, Strömungsrichtung"
// explizit als Kandidaten mitgegeben werden statt frei erfunden zu werden).
// v3: Produkt/Komponenten-Duo wurde durch Produkt + Problem + interne/externe
// Komponenten ersetzt. Beide Male strukturell inkompatibel zur Vorversion;
// kein Migrationscode, Nutzer starten neu.
function storageKey(lang: Lang) {
  return `sit-tools-v4-${lang}`;
}

function isFilled(values: FieldValues | undefined): boolean {
  if (!values) return false;
  return Object.values(values).some((v) => v && v.trim().length > 0);
}

export function SitTool({ lang }: { lang: Lang }) {
  const tools = SIT_TOOLS[lang];
  const ui = SIT_UI[lang];

  const [shared, setShared] = useState<Shared>({
    product: "",
    problem: "",
    internalComponents: "",
    externalComponents: "",
    variables: "",
  });
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [genStatus, setGenStatus] = useState<Record<string, AiStatus>>({});
  const [suggestions, setSuggestions] = useState<Record<string, Record<string, string>[]>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [globalNotice, setGlobalNotice] = useState(false);
  const hintTimer = useRef<number | null>(null);
  const productInputRef = useRef<HTMLInputElement | null>(null);

  function requireProduct(): boolean {
    setGlobalNotice(true);
    productInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    productInputRef.current?.focus();
    return false;
  }

  // Client-only Load — localStorage existiert nicht beim Server-Render, ein
  // lazy useState-Initializer würde hier zum Hydration-Mismatch führen.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(lang));
      if (raw) {
        const parsed = JSON.parse(raw) as { shared?: Shared; answers?: Answers };
        if (parsed && typeof parsed === "object") {
          if (parsed.shared) setShared(parsed.shared);
          if (parsed.answers) setAnswers(parsed.answers);
        }
      }
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
      localStorage.setItem(storageKey(lang), JSON.stringify({ shared, answers }));
    } catch {
      // Storage voll/blockiert — Eingaben bleiben trotzdem im UI erhalten
    }
  }, [shared, answers, loaded, lang]);

  function flashSaved() {
    setSavedHint(`${ui.savedPrefix} ${new Date().toLocaleTimeString()}`);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setSavedHint(null), 1400);
  }

  function handleSharedChange(key: keyof Shared, value: string) {
    setShared((prev) => ({ ...prev, [key]: value }));
    if (key === "product" && value.trim()) setGlobalNotice(false);
    flashSaved();
  }

  function handleAnswerFieldChange(toolId: string, key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [toolId]: { ...prev[toolId], [key]: value } }));
    flashSaved();
  }

  function handleReset() {
    if (!window.confirm(ui.confirmResetText)) return;
    setShared({ product: "", problem: "", internalComponents: "", externalComponents: "", variables: "" });
    setAnswers({});
    setSuggestions({});
    setGenStatus({});
  }

  async function generateForTool(toolId: string, product: string) {
    setGenStatus((prev) => ({ ...prev, [toolId]: "loading" }));
    try {
      const res = await fetch("/api/tools/sit-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          toolId,
          product,
          problem: shared.problem,
          internalComponents: shared.internalComponents,
          externalComponents: shared.externalComponents,
          variables: shared.variables,
        }),
      });
      if (res.status === 429) {
        setGenStatus((prev) => ({ ...prev, [toolId]: "rate_limited" }));
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { suggestions?: Record<string, string>[] };
      setSuggestions((prev) => ({ ...prev, [toolId]: data.suggestions ?? [] }));
      setGenStatus((prev) => ({ ...prev, [toolId]: "idle" }));
    } catch {
      setGenStatus((prev) => ({ ...prev, [toolId]: "error" }));
    }
  }

  async function handleGenerateAll() {
    const product = shared.product.trim();
    if (!product) return requireProduct();
    setGlobalNotice(false);
    setBulkLoading(true);
    await Promise.all(tools.map((tool) => generateForTool(tool.id, product)));
    setBulkLoading(false);
  }

  async function handleGenerateOne(toolId: string) {
    const product = shared.product.trim();
    if (!product) return requireProduct();
    setGlobalNotice(false);
    await generateForTool(toolId, product);
  }

  function handleApplySuggestion(toolId: string, suggestion: Record<string, string>) {
    setAnswers((prev) => {
      const next = { ...(prev[toolId] || {}) };
      for (const [key, value] of Object.entries(suggestion)) {
        if (key === "why" || !value) continue;
        next[key] = value;
      }
      return { ...prev, [toolId]: next };
    });
  }

  function buildExportText(): string {
    const filled = tools.filter((t) => isFilled(answers[t.id]));
    if (!shared.product.trim() && filled.length === 0) return ui.emptyText;
    const lines = [ui.exportHeader, ""];
    if (shared.product.trim()) lines.push(`${ui.sharedProductLabel}: ${shared.product.trim()}`);
    if (shared.problem.trim()) lines.push(`${ui.sharedProblemLabel}: ${shared.problem.trim()}`);
    if (shared.internalComponents.trim())
      lines.push(`${ui.sharedInternalComponentsLabel}: ${shared.internalComponents.trim()}`);
    if (shared.externalComponents.trim())
      lines.push(`${ui.sharedExternalComponentsLabel}: ${shared.externalComponents.trim()}`);
    if (shared.variables.trim()) lines.push(`${ui.sharedVariablesLabel}: ${shared.variables.trim()}`);
    lines.push("");
    filled.forEach((tool) => {
      const values = answers[tool.id] || {};
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

  const filledTools = tools.filter((t) => isFilled(answers[t.id]));

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
          <p className={styles.credit}>{ui.bookCredit}</p>
        </header>

        <div className={styles.proof}>
          <p className={styles.proofTitle}>{ui.proofTitle}</p>
          <div className={styles.proofItems}>
            {ui.proofItems.map((item) => (
              <div className={styles.proofItem} key={item.brand}>
                <div className={styles.proofItemHead}>
                  <span className={styles.proofBrand}>{item.brand}</span>
                  <span className={styles.proofScore}>{item.score}</span>
                </div>
                <span className={styles.proofMethod}>{item.method}</span>
                <p className={styles.proofQuote}>{item.quote}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.toolbench}>
          {tools.map((tool) => {
            const Diagram = SIT_DIAGRAM_BY_ID[tool.id];
            const filled = isFilled(answers[tool.id]);
            return (
              <a key={tool.id} href={`#${tool.id}`} className={styles.tile}>
                <span className={`${styles.stamp} ${filled ? styles.stampShow : ""}`}>
                  {ui.stampText}
                </span>
                <span className={styles.tileTag}>{tool.num}</span>
                {Diagram && <Diagram s={styles} />}
                <span className={styles.tileName}>{tool.name}</span>
              </a>
            );
          })}
        </div>

        <div className={styles.detail}>
          <div className={styles.detailHead}>
            <h2>{ui.sharedSectionTitle}</h2>
          </div>
          <form className={styles.worksheet} autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <div className={styles.field}>
              <label htmlFor="sit-shared-product">{ui.sharedProductLabel}</label>
              <input
                ref={productInputRef}
                id="sit-shared-product"
                type="text"
                maxLength={PRODUCT_MAX_LEN}
                value={shared.product}
                onChange={(e) => handleSharedChange("product", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="sit-shared-problem">{ui.sharedProblemLabel}</label>
              <textarea
                id="sit-shared-problem"
                maxLength={PROBLEM_MAX_LEN}
                value={shared.problem}
                onChange={(e) => handleSharedChange("problem", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="sit-shared-internal">{ui.sharedInternalComponentsLabel}</label>
              <textarea
                id="sit-shared-internal"
                maxLength={COMPONENTS_MAX_LEN}
                value={shared.internalComponents}
                onChange={(e) => handleSharedChange("internalComponents", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="sit-shared-external">{ui.sharedExternalComponentsLabel}</label>
              <textarea
                id="sit-shared-external"
                maxLength={COMPONENTS_MAX_LEN}
                value={shared.externalComponents}
                onChange={(e) => handleSharedChange("externalComponents", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="sit-shared-variables">{ui.sharedVariablesLabel}</label>
              <textarea
                id="sit-shared-variables"
                maxLength={VARIABLES_MAX_LEN}
                value={shared.variables}
                onChange={(e) => handleSharedChange("variables", e.target.value)}
              />
            </div>
            <p className={`${styles.saveHint} ${savedHint ? styles.saveHintShow : ""}`}>
              {savedHint ?? " "}
            </p>
          </form>

          <div className={styles.aiRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleGenerateAll}
              disabled={bulkLoading}
            >
              {bulkLoading ? ui.generateAllLoadingLabel : ui.generateAllLabel}
            </button>
            {globalNotice && <span className={styles.aiNotice}>{ui.aiRequireProductLabel}</span>}
          </div>
        </div>

        {tools.map((tool) => {
          const Diagram = SIT_DIAGRAM_BY_ID[tool.id];
          const toolAnswers = answers[tool.id] || {};
          const toolSuggestions = suggestions[tool.id] ?? [];
          const status = genStatus[tool.id];

          return (
            <div className={styles.detail} id={tool.id} key={tool.id}>
              <div className={styles.detailHead}>
                <span className={styles.tag}>{tool.num}</span>
                <h2>{tool.name}</h2>
              </div>
              <p className={styles.definition}>{tool.def}</p>
              <div className={styles.example}>
                <span className={styles.exampleKey}>{ui.exampleLabel}</span>
                <span className={`${styles.exampleVal} ${styles.exampleValName}`}>
                  {tool.example.name}
                </span>
                {tool.example.rows.map(([k, v]) => (
                  <Fragment key={k}>
                    <span className={styles.exampleKey}>{k}</span>
                    <span className={styles.exampleVal}>{v}</span>
                  </Fragment>
                ))}
              </div>

              <div className={styles.aiRow}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => handleGenerateOne(tool.id)}
                  disabled={status === "loading"}
                >
                  {status === "loading"
                    ? ui.aiLoadingLabel
                    : toolSuggestions.length > 0
                      ? ui.regenerateLabel
                      : ui.aiButtonLabel}
                </button>
                {Diagram && <Diagram s={styles} />}
                {globalNotice && <span className={styles.aiNotice}>{ui.aiRequireProductLabel}</span>}
                {status === "error" && <span className={styles.aiNotice}>{ui.aiErrorLabel}</span>}
                {status === "rate_limited" && (
                  <span className={styles.aiNotice}>{ui.aiRateLimitLabel}</span>
                )}
              </div>

              {toolSuggestions.length > 0 && (
                <div className={styles.aiSuggestions}>
                  <p className={styles.aiSuggestionsHeading}>{ui.aiSuggestionsHeading}</p>
                  <div className={styles.aiCards}>
                    {toolSuggestions.map((sugg, i) => {
                      const applied = tool.fields.every(
                        (f) => (toolAnswers[f.key] ?? "") === (sugg[f.key] ?? ""),
                      );
                      return (
                        <div className={styles.aiCard} key={i}>
                          <p className={styles.aiCardLabel}>{ui.aiSuggestionLabel(i + 1)}</p>
                          <dl className={styles.aiCardFields}>
                            {tool.fields
                              .filter((f) => sugg[f.key])
                              .map((f, idx) => (
                                <Fragment key={f.key}>
                                  <dt>{f.label}</dt>
                                  <dd className={idx === 0 ? styles.aiCardFieldsPrimary : undefined}>
                                    {sugg[f.key]}
                                  </dd>
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
                            onClick={() => handleApplySuggestion(tool.id, sugg)}
                          >
                            {applied ? ui.aiAppliedLabel : ui.aiApplyLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isFilled(toolAnswers) && (
                <div className={styles.answerBlock}>
                  <p className={styles.aiSuggestionsHeading}>{ui.yourPickHeading}</p>
                  <div className={styles.worksheet}>
                    {tool.fields.map((f) => {
                      const fieldId = `${tool.id}-${f.key}`;
                      const value = toolAnswers[f.key] ?? "";
                      return (
                        <div className={styles.field} key={f.key}>
                          <label htmlFor={fieldId}>{f.label}</label>
                          {f.type === "textarea" ? (
                            <textarea
                              id={fieldId}
                              value={value}
                              onChange={(e) => handleAnswerFieldChange(tool.id, f.key, e.target.value)}
                            />
                          ) : (
                            <input
                              id={fieldId}
                              type="text"
                              value={value}
                              onChange={(e) => handleAnswerFieldChange(tool.id, f.key, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

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

          {!shared.product.trim() && filledTools.length === 0 ? (
            <p className={styles.empty}>{ui.emptyText}</p>
          ) : (
            <div className={styles.sheet}>
              {(shared.product.trim() ||
                shared.problem.trim() ||
                shared.internalComponents.trim() ||
                shared.externalComponents.trim() ||
                shared.variables.trim()) && (
                <div className={styles.sheetItem}>
                  <span className={styles.tag}>—</span>
                  <div className={styles.sheetBody}>
                    <dl>
                      {shared.product.trim() && (
                        <Fragment>
                          <dt>{ui.sharedProductLabel}</dt>
                          <dd>{shared.product}</dd>
                        </Fragment>
                      )}
                      {shared.problem.trim() && (
                        <Fragment>
                          <dt>{ui.sharedProblemLabel}</dt>
                          <dd>{shared.problem}</dd>
                        </Fragment>
                      )}
                      {shared.internalComponents.trim() && (
                        <Fragment>
                          <dt>{ui.sharedInternalComponentsLabel}</dt>
                          <dd>{shared.internalComponents}</dd>
                        </Fragment>
                      )}
                      {shared.externalComponents.trim() && (
                        <Fragment>
                          <dt>{ui.sharedExternalComponentsLabel}</dt>
                          <dd>{shared.externalComponents}</dd>
                        </Fragment>
                      )}
                      {shared.variables.trim() && (
                        <Fragment>
                          <dt>{ui.sharedVariablesLabel}</dt>
                          <dd>{shared.variables}</dd>
                        </Fragment>
                      )}
                    </dl>
                  </div>
                </div>
              )}
              {filledTools.map((tool) => {
                const values = answers[tool.id] || {};
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
