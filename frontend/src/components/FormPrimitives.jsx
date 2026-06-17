import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Trash2, Plus } from "lucide-react";

// ---------- Helper components ----------
export function Field({ label, hindi, children, span = 1 }) {
  return (
    <div className={`p-4 ${span === 2 ? "md:col-span-2" : ""} ${span === 4 ? "md:col-span-4" : ""}`}>
      <Label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground block mb-2">
        {label} {hindi && <span className="text-foreground/60 normal-case tracking-normal font-normal"> · {hindi}</span>}
      </Label>
      {children}
    </div>
  );
}

export function TInput(props) {
  return <Input {...props} className={`rounded-none h-10 ${props.className || ""}`} />;
}

export function TTextarea(props) {
  return <Textarea {...props} className={`rounded-none ${props.className || ""}`} rows={props.rows || 3} />;
}

// ---------- Editable table for repeating rows ----------
export function RepeaterTable({ columns, rows = [], onChange, testIdPrefix = "row" }) {
  const update = (idx, key, value) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r));
    onChange(next);
  };
  const add = () => onChange([...rows, columns.reduce((a, c) => ({ ...a, [c.key]: "" }), {})]);
  const remove = (idx) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div className="border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-muted border-b border-border">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                {c.label}
              </th>
            ))}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length + 1} className="text-center p-6 text-xs text-muted-foreground">No rows. Add karein neeche se.</td></tr>
          )}
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/40">
              {columns.map((c) => (
                <td key={c.key} className="p-1.5">
                  <input
                    data-testid={`${testIdPrefix}-${idx}-${c.key}`}
                    value={row[c.key] || ""}
                    onChange={(e) => update(idx, c.key, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-transparent outline-none border border-transparent focus:border-foreground"
                    placeholder={c.placeholder || ""}
                  />
                </td>
              ))}
              <td>
                <button onClick={() => remove(idx)} className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border p-2">
        <Button data-testid={`${testIdPrefix}-add-btn`} variant="outline" size="sm" onClick={add} className="rounded-none h-8 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Row Add Karein
        </Button>
      </div>
    </div>
  );
}

// ---------- Segment Form Builder ----------
export function SegmentForm({ data = {}, onChange, schema }) {
  const set = (key, value) => onChange({ ...data, [key]: value });

  return (
    <div className="border border-border bg-white">
      {schema.sections.map((sec, si) => (
        <div key={si} className={si > 0 ? "border-t border-border" : ""}>
          {sec.title && (
            <div className="bg-secondary text-secondary-foreground px-5 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold">{sec.title}</div>
            </div>
          )}
          {sec.type === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 grid-border">
              {sec.fields.map((f) => (
                <Field key={f.key} label={f.label} hindi={f.hindi} span={f.span}>
                  {f.kind === "textarea" ? (
                    <TTextarea data-testid={`field-${f.key}`} value={data[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
                  ) : (
                    <TInput data-testid={`field-${f.key}`} type={f.kind || "text"} value={data[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
                  )}
                </Field>
              ))}
            </div>
          )}
          {sec.type === "table" && (
            <div className="p-4">
              <RepeaterTable
                columns={sec.columns}
                rows={data[sec.key] || []}
                onChange={(v) => set(sec.key, v)}
                testIdPrefix={sec.key}
              />
            </div>
          )}
          {sec.type === "list5" && (
            <div className="p-4 space-y-2">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-6">{i+1}.</span>
                  <TInput data-testid={`${sec.key}-${i}`} value={(data[sec.key] || [])[i] || ""} onChange={(e) => {
                    const arr = [...(data[sec.key] || ["","","","",""])];
                    arr[i] = e.target.value;
                    set(sec.key, arr);
                  }} placeholder={sec.placeholder} />
                </div>
              ))}
            </div>
          )}
          {sec.type === "list3" && (
            <div className="p-4 space-y-2">
              {[0,1,2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-6">{i+1}.</span>
                  <TInput data-testid={`${sec.key}-${i}`} value={(data[sec.key] || [])[i] || ""} onChange={(e) => {
                    const arr = [...(data[sec.key] || ["","",""])];
                    arr[i] = e.target.value;
                    set(sec.key, arr);
                  }} placeholder={sec.placeholder} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
