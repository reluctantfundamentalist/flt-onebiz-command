"use client";
import { useState } from "react";
import type { MappedForm } from "@/lib/mapper";
import { withFlags } from "@/lib/mapper";
import type { Field } from "@/lib/forms";

export default function FormReview({
  form,
  index,
  onChange,
}: {
  form: MappedForm;
  index: number;
  onChange: (index: number, key: string, value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const schema = withFlags(form.schema, form.values);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-3 text-left"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">
          {index + 1}
        </span>
        <span className="text-sm font-semibold text-[var(--ink)]">
          {form.schema.sheetType}
        </span>
        <span className="truncate text-xs text-[var(--ink-faint)]">
          from “{form.clause}”
        </span>
        <span className="ml-auto text-xs text-[var(--ink-faint)]">
          {form.flags.length ? `${form.flags.length} to check` : "clean"}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--line)] px-5 pb-5 pt-3">
          {form.lever && (
            <div className="mb-3 rounded-lg border border-[var(--brand-soft)] bg-[var(--brand-soft)] p-3">
              <div className="text-[11px] font-semibold text-[var(--brand-dark)]">
                {form.lever.name} · {form.lever.releaseTreatment}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-[var(--ink-soft)]">
                <span>Owning team: {form.lever.owningTeam}</span>
                <span>Approver: {form.lever.approverChain || "—"}</span>
                <span>Scope: {form.lever.scopeDimensions}</span>
                <span>Value: {form.lever.valueType}</span>
                {form.lever.fundHubKeyPattern && <span>Fund hub: {form.lever.fundHubKeyPattern}</span>}
              </div>
              {form.lever.distinguishFrom && (
                <div className="mt-1 text-[10px] text-[var(--ink-faint)]">
                  Disambiguation: {form.lever.distinguishFrom}
                </div>
              )}
            </div>
          )}
          {form.flags.length > 0 && (
            <div className="mb-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3">
              {form.flags.map((f, i) => (
                <div key={i} className="text-[11px] text-amber-800">
                  ⚠ {f}
                </div>
              ))}
            </div>
          )}
          {schema.sections.map((sec) => (
            <div key={sec.title} className="mb-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                {sec.title}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {sec.fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    field={f}
                    value={form.values[f.key] ?? ""}
                    onChange={(v) => onChange(index, f.key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-md border bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white";
  const border = field.flag && !value ? "border-amber-300" : "border-[var(--line)]";
  const isOpen = field.open && value === field.open;

  const openChip = field.open ? (
    <button
      type="button"
      onClick={() => onChange(isOpen ? "" : field.open!)}
      className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition ${
        isOpen
          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
      }`}
      title={`Keep open: ${field.open}`}
    >
      {field.open}
    </button>
  ) : null;

  const label = (
    <div className="mb-0.5 flex items-center gap-1">
      <span className="text-[11px] text-[var(--ink-soft)]">
        {field.required && <span className="text-[var(--bad)]">*</span>} {field.label}
      </span>
      {field.flag && !value && <span title="needs input">⚠</span>}
    </div>
  );

  if (field.type === "fixed") {
    return (
      <div>
        {label}
        <div className={`${base} ${border} bg-[var(--brand-soft)] font-medium`}>
          {value || field.label}
        </div>
      </div>
    );
  }

  const inputEl = (() => {
    if (field.type === "textarea") {
      return (
        <textarea
          className={`${base} ${border} resize-none`}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.helper}
        />
      );
    }
    if (field.type === "select" && field.options && field.options.length > 0) {
      return (
        <select
          className={`${base} ${border}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— pick —</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        className={`${base} ${border}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.helper || field.placeholder || ""}
      />
    );
  })();

  const showPrompt = field.flag && !value && field.open;

  if (field.type === "textarea" || !field.open) {
    return (
      <div className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
        {label}
        {inputEl}
      </div>
    );
  }

  return (
    <div>
      {label}
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">{inputEl}</div>
        {openChip}
      </div>
      {showPrompt && (
        <div className="mt-1 text-[10px] text-amber-700">
          Not in note/attachment — type a value or keep open.
        </div>
      )}
    </div>
  );
}
