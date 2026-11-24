"use client";

import { startTransition, useActionState, useId, useRef, useState } from "react";
import Icon from "@/components/app/hub/icons";
import { CATEGORIES, CATEGORY, looksLikeRealData, type Category, type FieldInput } from "@/lib/inventory";
import { saveDataSet, type SaveState } from "./actions";

export type EditorValues = {
  id?: string;
  /** The saved version these values come from; a new one after each save. */
  version?: number;
  name: string; storage_location: string; access: string; purpose: string;
  retention: string; owner: string; processor: string; records: string;
  fields: FieldInput[];
};
type Person = { id: string; name: string };
type Row = FieldInput & { key: number };

function Save({ isNew, pending }: { isNew: boolean; pending: boolean }) {
  return (
    <button type="submit" className="hub-btn inv-save" disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : isNew ? "Create data set" : "Save changes"}
    </button>
  );
}

// Controlled on purpose: React resets uncontrolled form fields after an action,
// which would wipe what the person typed when a save is refused.
function Text({ label, name, value, onChange, hint, required, area, max }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  hint?: string; required?: boolean; area?: boolean; max?: number;
}) {
  const id = useId();
  return (
    <div className="inv-field">
      <label htmlFor={id}>{label}{required ? "" : <span> (optional)</span>}</label>
      {area
        ? <textarea id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={2} aria-describedby={hint ? id + "h" : undefined} />
        : <input id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={max} aria-describedby={hint ? id + "h" : undefined} />}
      {hint && <small id={id + "h"}>{hint}</small>}
    </div>
  );
}

export default function DataSetEditor({ values, people }: { values: EditorValues; people: Person[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveDataSet, {});
  const next = useRef(values.fields.length);
  const [rows, setRows] = useState<Row[]>(() =>
    values.fields.length ? values.fields.map((f, i) => ({ ...f, key: i })) : [{ name: "", category: "other", sensitive: false, key: next.current++ }]);
  const listRef = useRef<HTMLOListElement>(null);
  const isNew = !values.id;
  const [v, setV] = useState(values);
  const set = (k: keyof EditorValues) => (x: string) => setV((o) => ({ ...o, [k]: x }));

  // After a save the page sends the saved values again (new version number).
  // Take them over, so new fields get their ids and the next save does not add
  // them a second time.
  const [seen, setSeen] = useState(values.version);
  if (values.version !== seen) {
    setSeen(values.version);
    setV(values);
    setRows(values.fields.map((f, i) => ({ ...f, key: i })));
    next.current = values.fields.length;
  }

  // Submit without React's automatic form reset: the reset puts every box back
  // to how the page first loaded (the Owner box showed "Nobody yet" after a
  // save, and the next save would have removed the owner).
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  const update = (key: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const add = () => {
    setRows((r) => [...r, { name: "", category: "other", sensitive: false, key: next.current++ }]);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLInputElement>("li:last-child input")?.focus());
  };
  const remove = (key: number) => setRows((r) => r.filter((x) => x.key !== key));

  const names = rows.map((r) => r.name.trim().toLowerCase()).filter(Boolean);
  const dupes = new Set(names.filter((n, i) => names.indexOf(n) !== i));

  return (
    <form onSubmit={submit} className="inv-editor">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="fields" value={JSON.stringify(rows.map(({ key: _k, ...f }) => f))} />

      <section className="hub-card" aria-labelledby="details-h">
        <h2 id="details-h" className="inv-h"><Icon name="db" />Details</h2>
        <p className="inv-sub">These answer the first questions on the official breach notification form.</p>
        <div className="inv-grid">
          <Text label="Name" name="name" value={v.name} onChange={set("name")} required max={120} hint="What people call it, e.g. Payroll records" />
          <Text label="Where it is kept" name="storage_location" value={v.storage_location} onChange={set("storage_location")} required max={200} hint="System, folder or place, e.g. PayCloud payroll system" />
          <div className="inv-field">
            <label htmlFor="owner">Owner <span>(optional)</span></label>
            <select id="owner" name="owner" value={v.owner} onChange={(e) => set("owner")(e.target.value)} aria-describedby="owner-h">
              <option value="">Nobody yet</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <small id="owner-h">The person responsible for keeping it safe</small>
          </div>
          <Text label="Approximate number of records" name="records" value={v.records} onChange={set("records")} hint="How many people are in it. Over 1,000 matters for notification." max={12} />
          <Text label="Purpose" name="purpose" value={v.purpose} onChange={set("purpose")} required area hint="Why the business keeps it" />
          <Text label="Who can access it" name="access" value={v.access} onChange={set("access")} area hint="Roles or teams, e.g. HR and finance only" />
          <Text label="Retention period" name="retention" value={v.retention} onChange={set("retention")} max={120} hint="How long it is kept, e.g. 7 years after an employee leaves" />
          <Text label="Processor" name="processor" value={v.processor} onChange={set("processor")} max={120} hint="An outside company that handles it for you, if any" />
        </div>
      </section>

      <section className="hub-card" aria-labelledby="fields-h">
        <h2 id="fields-h" className="inv-h"><Icon name="list" />Personal data fields</h2>
        <p className="inv-reminder" role="note">
          <Icon name="lock" className="size-4" />
          Enter field <b>names</b> only, such as &ldquo;Phone number&rdquo;. Never type real customer or staff data here.
        </p>
        <ol className="inv-fields" ref={listRef}>
          {rows.map((r, i) => {
            const real = looksLikeRealData(r.name);
            const dupe = dupes.has(r.name.trim().toLowerCase());
            const problem = real ? "This looks like real data. Enter the field name only." : dupe ? "Another field has this name." : "";
            return (
              <li key={r.key} className={problem ? "bad" : undefined}>
                <label className="sr-only" htmlFor={`f${r.key}`}>Field {i + 1} name</label>
                <input id={`f${r.key}`} value={r.name} maxLength={80} placeholder="Field name, e.g. Bank account number"
                  onChange={(e) => update(r.key, { name: e.target.value })} aria-invalid={problem ? true : undefined}
                  aria-describedby={problem ? `p${r.key}` : undefined} />
                <label className="sr-only" htmlFor={`c${r.key}`}>Field {i + 1} category</label>
                <select id={`c${r.key}`} value={r.category} title={CATEGORY[r.category].hint}
                  onChange={(e) => { const c = e.target.value as Category; update(r.key, { category: c, sensitive: c === "sensitive" ? true : r.sensitive }); }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY[c].label}</option>)}
                </select>
                <label className="inv-check" title={r.category === "sensitive" ? "Sensitive category is always marked sensitive" : undefined}>
                  <input type="checkbox" checked={r.category === "sensitive" || r.sensitive} disabled={r.category === "sensitive"}
                    onChange={(e) => update(r.key, { sensitive: e.target.checked })} />
                  Sensitive
                </label>
                <button type="button" className="inv-remove" onClick={() => remove(r.key)} aria-label={`Remove ${r.name || `field ${i + 1}`}`}>
                  <Icon name="x" />
                </button>
                {problem && <small id={`p${r.key}`} className="inv-problem">{problem}</small>}
              </li>
            );
          })}
        </ol>
        <button type="button" className="hub-btn soft" onClick={add}><Icon name="plus" className="size-4" />Add field</button>
        <details className="inv-cats">
          <summary>What do the categories mean?</summary>
          <dl>{CATEGORIES.map((c) => <div key={c}><dt>{CATEGORY[c].label}</dt><dd>{CATEGORY[c].hint}</dd></div>)}</dl>
          <p>The assessment rules use these categories, for example a financial field exposed in a breach can mean a risk of financial loss.</p>
        </details>
      </section>

      <div className="inv-actions">
        <Save isNew={isNew} pending={pending} />
        {!isNew && <span className="inv-note">Every save is kept as a new version.</span>}
        {state.error && <p role="alert" className="hub-msg-err">{state.error}</p>}
        {state.ok && <p role="status" className="hub-msg-ok"><Icon name="check" className="size-4" />{state.ok}</p>}
      </div>
    </form>
  );
}
