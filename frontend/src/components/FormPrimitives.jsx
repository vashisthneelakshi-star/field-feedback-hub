import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Trash2, Plus } from "lucide-react";

export function Field({ label, hindi, children, span = 1 }) {
  return (
    <div className={`p-4 ${span === 2 ? "md:col-span-2" : ""} ${span === 4 ? "md:col-span-4" : ""}`}>
      <Label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground block mb-2">
        {label}
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

export function RepeaterTable({ columns, rows = [], onChange, testIdPrefix = "row" }) {
  const update = (idx, key, value) => onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
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
            <tr><td colSpan={columns.length + 1} className="text-center p-6 text-xs text-muted-foreground">No rows. Add one below.</td></tr>
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
          <Plus className="w-3 h-3 mr-1" /> Add Row
        </Button>
      </div>
    </div>
  );
}

// Dynamic list - allow more than min entries
export function DynamicList({ items = [], onChange, placeholder = "", min = 0, testIdPrefix = "item" }) {
  // ensure at least `min` entries are present visually
  const displayed = items.length >= min ? items : [...items, ...Array(min - items.length).fill("")];

  const update = (idx, val) => {
    const next = [...displayed];
    next[idx] = val;
    onChange(next);
  };
  const add = () => onChange([...displayed, ""]);
  const remove = (idx) => {
    if (displayed.length <= min) {
      // just clear the value
      const next = [...displayed];
      next[idx] = "";
      onChange(next);
      return;
    }
    onChange(displayed.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {displayed.map((val, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground w-6 flex-shrink-0">{i + 1}.</span>
          <TInput data-testid={`${testIdPrefix}-${i}`} value={val || ""} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
          <button onClick={() => remove(i)} className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary flex-shrink-0" title="Remove">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button data-testid={`${testIdPrefix}-add-btn`} variant="outline" size="sm" onClick={add} className="rounded-none h-8 text-xs">
        <Plus className="w-3 h-3 mr-1" /> Add Another
      </Button>
    </div>
  );
}

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
                <Field key={f.key} label={f.label} span={f.span}>
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
              <RepeaterTable columns={sec.columns} rows={data[sec.key] || []} onChange={(v) => set(sec.key, v)} testIdPrefix={sec.key} />
            </div>
          )}
          {sec.type === "list" && (
            <div className="p-4">
              <DynamicList
                items={data[sec.key] || []}
                onChange={(v) => set(sec.key, v)}
                placeholder={sec.placeholder}
                min={sec.min || 0}
                testIdPrefix={sec.key}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
