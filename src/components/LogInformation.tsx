"use client";
import { useState } from "react";
import { structure, type StructureResult } from "@/lib/mapper";
import { parseLog, type ParsedEntry } from "@/lib/log-parser";
import { getFormCategoryName, type FormCategory } from "@/lib/log-schemas";
import { processAttachment } from "@/lib/attachment";
import { ACCOUNT, APPROVERS } from "@/lib/data";
import FormReview from "@/components/FormReview";
import FormFlightIncentive from "@/components/FormFlightIncentive";
import FormCommission from "@/components/FormCommission";
import FormCampaign from "@/components/FormCampaign";
import type { Session } from "@/lib/accounts";

type Stage = "intake" | "processing" | "review" | "submitted";

const SAMPLE_NOTES: Record<string, string> = {
  "Egypt Air": "Egypt Air 5% BSP commission, 3% backend, 2% virtual card incentive, 50k to drive NDC, 1% marketing incentive, 300k marketing cash, 5% off private fare Europe origin",
  "Emirates Airline": "Emirates 4% BSP commission, 2% backend, selling period 2026/08/01>2026/08/31, fare brands Basic $20 Value $30 Comfort $35 Deluxe $40, GDS Type Amadeus,Abacus, Economy cabin, OW trip, backend incentive Basic USD 20 Value USD 30",
  "Etihad Airways": "Etihad Airways — Agent Code All EY agent codes, Priority UKXC,DEXC,NLXC,FRTV, Selling Period 2026/08/01>2026/08/31, Outbound Period 2026/08/15>2026/09/30, Economy cabin, fare brands Basic USD 20 Value USD 30 Comfort USD 35 Deluxe USD 40",
  "Qatar Airways": "Upfront commission with QR. Economy – 5%, Business – 8%. Agent Code AEDC. GDS Type Amadeus. Travel Period 2026/07/26>2026/08/31. Commission type: Rate. Currency: USD,GBP",
  "Saudia Airlines": "CRM - Summer Sale campaign with SV. Ladder Discount: Spend 500-999 SAR 30 off, 1000-1999 SAR 60 off. Campaign Period 2026/07/21>2026/07/26. Budget USD 6000. OD Pairs SA-AE, SA-EG, SA-IN. Coupon quantity 90.",
  "Air India": "Air India 5% BSP commission, 2% backend, 1% marketing incentive, 1% private fare discount",
};

interface Props {
  session: Session;
}

export default function LogInformation({ session }: Props) {
  const [stage, setStage] = useState<Stage>("intake");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [attachText, setAttachText] = useState("");
  const [progress, setProgress] = useState("");
  const [parseResult, setParseResult] = useState<ParsedEntry | null>(null);
  const [leverResult, setLeverResult] = useState<StructureResult | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [leverValues, setLeverValues] = useState<Record<number, Record<string, string>>>({});

  function loadScenario() {
    const sample = SAMPLE_NOTES[session.airline] || SAMPLE_NOTES["Egypt Air"];
    setNote(sample);
    setFile(undefined);
    setAttachText("");
    setStage("intake");
    setParseResult(null);
    setLeverResult(null);
  }

  async function run() {
    if (!note.trim()) return;
    setStage("processing");
    setProgress("");
    let att = "";
    if (file) {
      try {
        att = await processAttachment(file, setProgress);
        setAttachText(att);
      } catch (e: any) {
        setProgress("attachment OCR failed: " + (e?.message || ""));
        att = "";
      }
    }

    // Parse: new hybrid parser for sample form types
    const combinedText = [note, att].filter(Boolean).join("\n\n--- Attachment OCR ---\n");
    const parsed = parseLog(combinedText);
    setParseResult(parsed);
    setValues({ ...parsed.extractedValues });

    // Also run the existing lever-based structure for BSP commission etc.
    const lev = structure(note, att);
    setLeverResult(lev);
    const lv: Record<number, Record<string, string>> = {};
    lev.forms.forEach((f, i) => (lv[i] = { ...f.values }));
    setLeverValues(lv);

    setStage("review");
  }

  function setVal(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  function setLeverVal(i: number, key: string, v: string) {
    setLeverValues((s) => ({ ...s, [i]: { ...(s[i] || {}), [key]: v } }));
  }

  function submit() {
    setStage("submitted");
  }

  function reset() {
    setStage("intake");
    setParseResult(null);
    setLeverResult(null);
    setNote("");
    setFile(undefined);
    setAttachText("");
    setValues({});
    setLeverValues({});
  }

  const hasLeverForms = leverResult && leverResult.forms.length > 0;
  const categoryName = parseResult ? getFormCategoryName(parseResult.category) : "Unknown";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {/* Intake */}
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">1</span>
            <div>
              <div className="text-sm font-semibold text-[var(--ink)]">Free-text Intake</div>
              <div className="text-[11px] text-[var(--ink-faint)]">
                Write deal notes like a chat message — system classifies & pre-fills
              </div>
            </div>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Emirates 4% BSP commission, 2% backend, selling period 2026/08/01>2026/08/31, fare brands Basic $20 Value $30, GDS Type Amadeus,Abacus…"
            rows={6}
            className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-sm outline-none focus:border-[var(--brand)] focus:bg-white"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)]">
              {file ? `📎 ${file.name}` : "📎 Attach file (PNG/PDF)"}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
            </label>
            <button
              onClick={loadScenario}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)]"
            >
              Load {session.airline.split(" ")[0]} scenario
            </button>
            <button
              onClick={run}
              disabled={!note.trim() || stage === "processing"}
              className="ml-auto rounded-lg bg-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-50"
            >
              {stage === "processing" ? "Processing…" : "Structure it →"}
            </button>
          </div>
          {stage === "processing" && progress && (
            <div className="mt-2 text-xs text-[var(--ink-faint)]">{progress}</div>
          )}
        </section>

        {/* Review */}
        {stage === "review" && parseResult && (
          <section className="space-y-4">
            {/* Classification banner */}
            <div
              className={`rounded-xl border p-4 ${
                parseResult.confidence === "high"
                  ? "border-green-200 bg-green-50"
                  : parseResult.confidence === "medium"
                  ? "border-[var(--brand-soft)] bg-[var(--brand-soft)]"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="text-sm font-semibold">
                Classified: <span className="text-[var(--brand-dark)]">{categoryName}</span>
                <span className="ml-2 text-[11px] font-normal text-[var(--ink-faint)]">
                  (confidence: {parseResult.confidence})
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--ink-soft)]">{parseResult.reason}</div>
            </div>

            {/* Sample-based form */}
            <section className="rounded-2xl border border-[var(--brand)] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">2</span>
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">{categoryName} — Review & Confirm</div>
                  <div className="text-[11px] text-[var(--ink-faint)]">
                    Pre-filled from your note. Fix flagged fields, then submit.
                  </div>
                </div>
              </div>

              {parseResult.category === "flight-incentive" && (
                <FormFlightIncentive values={values} onChange={setVal} />
              )}
              {parseResult.category === "commission" && (
                <FormCommission values={values} onChange={setVal} />
              )}
              {parseResult.category === "campaign" && (
                <FormCampaign values={values} onChange={setVal} />
              )}
            </section>

            {/* Lever-based forms (BSP commission, Promo Fund, etc.) */}
            {hasLeverForms && (
              <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-dark)]">3</span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink)]">
                      Commission Instruments — {leverResult!.forms.length} form(s)
                    </div>
                    <div className="text-[11px] text-[var(--ink-faint)]">
                      Routed into FltOneBiz form types via lever taxonomy
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {leverResult!.forms.map((_, i) => (
                    <FormReview
                      key={i}
                      form={{ ...leverResult!.forms[i], values: leverValues[i] || leverResult!.forms[i].values } as any}
                      index={i}
                      onChange={setLeverVal}
                    />
                  ))}
                </div>

                {leverResult!.flaggedClauses.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1 text-[11px] font-semibold text-amber-800">
                      Flagged — pick the sheet type manually
                    </div>
                    {leverResult!.flaggedClauses.map((c, i) => (
                      <div key={i} className="text-xs text-amber-800">
                        • {c.text}
                        {c.lever && (
                          <span className="ml-1 text-amber-600">
                            → {c.lever.name} · {c.lever.releaseTreatment} (owning: {c.lever.owningTeam})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Submit */}
            <div className="flex items-center gap-2">
              <button
                onClick={submit}
                className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                Confirm & Submit
              </button>
              <span className="text-xs text-[var(--ink-faint)]">
                Triggers the existing approval flow — approvers get notified.
              </span>
            </div>
          </section>
        )}

        {/* Submitted */}
        {stage === "submitted" && (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--good)] text-[11px] font-semibold text-white">✓</span>
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">Submitted</div>
                <div className="text-[11px] text-[var(--ink-faint)]">Routed into Flt OneBiz.</div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm text-[var(--ink-soft)]">
              <div className="font-medium text-[var(--ink)]">
                {categoryName} submitted for {session.airline}.
              </div>
              {hasLeverForms && (
                <div className="mt-1 text-xs">
                  + {leverResult!.forms.length} commission instrument(s) submitted.
                </div>
              )}
              <div className="mt-2 text-xs">Approvers notified (existing flow):</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {APPROVERS.map((a) => (
                  <span key={a.name} className="rounded-md bg-white px-2 py-1 text-[11px] text-[var(--ink-soft)]">
                    {a.name} · {a.role}
                  </span>
                ))}
              </div>
              <button
                onClick={reset}
                className="mt-3 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg)]"
              >
                Log another entry
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside className="rounded-2xl border border-[var(--line)] bg-white p-5 lg:sticky lg:top-4 lg:self-start">
        <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">Current session</div>
        <h2 className="mt-1 text-base font-semibold text-[var(--ink)]">
          {session.airline}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
          {session.bm} · BD
        </p>
        <hr className="my-3 border-[var(--line)]" />
        <div className="text-[12px] leading-relaxed text-[var(--ink-soft)]">
          <p className="font-medium text-[var(--ink)]">How it works:</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-[11px]">
            <li>Write your deal notes in free text — like a chat message</li>
            <li>System auto-classifies into Flight Incentive, Commission, or Campaign forms</li>
            <li>Also routes BSP commission, marketing cash, etc. into FltOneBiz sheet types</li>
            <li>Review pre-filled fields, fix flagged ones, submit</li>
            <li>Cross-team action items auto-route to Ops, Marketing, NDC</li>
          </ol>
        </div>
        <div className="mt-3 rounded-lg bg-[var(--bg)] p-3 text-[11px] text-[var(--ink-faint)]">
          <span className="font-medium text-[var(--ink-soft)]">Supported form types:</span>
          <ul className="mt-1 space-y-0.5">
            <li>• Flight Incentive Program (Sample1)</li>
            <li>• Commission Management (Sample2)</li>
            <li>• Promotional Campaign / Coupon (Sample3)</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
