"use client";
import { COMMISSION_FIELDS, type FieldDef } from "@/lib/log-schemas";

interface Props {
  values: Record<string, string>;
  onChange: (key: string, v: string) => void;
}

export default function FormCommission({ values, onChange }: Props) {
  const sections = groupBySection(COMMISSION_FIELDS);

  return (
    <div className="space-y-4">
      {Object.entries(sections).map(([section, fields]) => (
        <div key={section}>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            {section}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <FieldRow key={f.key} field={f} value={values[f.key] || ""} onChange={onChange} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupBySection(fields: FieldDef[]): Record<string, FieldDef[]> {
  const groups: Record<string, FieldDef[]> = {};
  for (const f of fields) {
    if (!groups[f.section]) groups[f.section] = [];
    groups[f.section].push(f);
  }
  return groups;
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, v: string) => void;
}) {
  const fullWidth = field.type === "textarea";
  const colSpan = fullWidth ? "sm:col-span-2" : "";

  return (
    <div className={`${colSpan}`}>
      <label className="mb-1 block text-[11px] font-medium text-[var(--ink-soft)]">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-400">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full resize-none rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)]"
        />
      ) : field.type === "select" || field.type === "multiselect" ? (
        <select
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)]"
        >
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : field.type === "money" || field.type === "number" ? (
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)]"
        />
      )}
    </div>
  );
}
