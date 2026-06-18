import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash2, Pencil, EyeOff, Eye, Loader2 } from "lucide-react";
import { listFields, SCHEMAS } from "../lib/schemas";
import { toast } from "sonner";

export default function QuestionEditor({ open, onOpenChange, segmentKey, onSaved }) {
  const [override, setOverride] = useState({ label_overrides: {}, disabled_fields: [], extra_questions: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !segmentKey) return;
    setLoading(true);
    api.get(`/schemas/${segmentKey}`)
      .then(({ data }) => setOverride({
        label_overrides: data.label_overrides || {},
        disabled_fields: data.disabled_fields || [],
        extra_questions: data.extra_questions || [],
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, segmentKey]);

  if (!segmentKey) return null;
  const defaults = listFields(SCHEMAS[segmentKey]);
  const disabled = new Set(override.disabled_fields);

  const setLabel = (key, val) => setOverride(o => ({ ...o, label_overrides: { ...o.label_overrides, [key]: val } }));
  const toggleDisabled = (key) => setOverride(o => ({
    ...o,
    disabled_fields: o.disabled_fields.includes(key)
      ? o.disabled_fields.filter(k => k !== key)
      : [...o.disabled_fields, key],
  }));
  const addExtra = () => setOverride(o => ({
    ...o,
    extra_questions: [...o.extra_questions, { id: crypto.randomUUID?.() || String(Date.now()), key: `custom_${o.extra_questions.length + 1}`, label: "", hindi: "", kind: "textarea", span: 2, order: 0 }],
  }));
  const updateExtra = (idx, patch) => setOverride(o => ({
    ...o, extra_questions: o.extra_questions.map((q, i) => i === idx ? { ...q, ...patch } : q),
  }));
  const removeExtra = (idx) => setOverride(o => ({
    ...o, extra_questions: o.extra_questions.filter((_, i) => i !== idx),
  }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/schemas/${segmentKey}`, { segment_key: segmentKey, ...override });
      toast.success("Questions updated");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-foreground max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Edit Questions</DialogTitle>
          <p className="text-xs text-muted-foreground">Rename or disable default questions. Add new custom questions.</p>
        </DialogHeader>

        {loading ? <div className="p-8 text-sm text-muted-foreground">Loading...</div> : (
          <div className="space-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-2">Default Questions</div>
              <div className="border border-border bg-white divide-y divide-border">
                {defaults.map(f => {
                  const isDisabled = disabled.has(f.key);
                  return (
                    <div key={f.key} className={`flex items-center gap-3 p-3 ${isDisabled ? "opacity-40 bg-muted" : ""}`}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <Input data-testid={`qedit-label-${f.key}`}
                             value={override.label_overrides[f.key] ?? f.label}
                             onChange={(e) => setLabel(f.key, e.target.value)}
                             className="rounded-none h-9 text-sm flex-1" disabled={isDisabled} />
                      <code className="text-[10px] text-muted-foreground font-mono">{f.key}</code>
                      <button data-testid={`qedit-toggle-${f.key}`} onClick={() => toggleDisabled(f.key)}
                              className={`p-1.5 hover:bg-muted ${isDisabled ? "text-muted-foreground" : "text-foreground"}`}
                              title={isDisabled ? "Enable" : "Disable"}>
                        {isDisabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
                {defaults.length === 0 && <div className="p-3 text-xs text-muted-foreground">No editable fields in this section (only tables).</div>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">Custom Questions (Added by Admin)</div>
                <Button data-testid="add-custom-q-btn" type="button" onClick={addExtra} variant="outline" size="sm" className="rounded-none h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Question
                </Button>
              </div>
              <div className="space-y-2">
                {override.extra_questions.map((q, idx) => (
                  <div key={q.id || idx} className="border border-border bg-white p-3 grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Label className="text-[10px] uppercase tracking-wider">Question Label</Label>
                      <Input value={q.label} onChange={(e) => updateExtra(idx, { label: e.target.value })} className="rounded-none h-9 mt-1" data-testid={`custom-q-label-${idx}`} placeholder="e.g. Feedback about distributor?" />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-[10px] uppercase tracking-wider">Key (unique)</Label>
                      <Input value={q.key} onChange={(e) => updateExtra(idx, { key: e.target.value.replace(/[^a-z0-9_]/gi, "_") })} className="rounded-none h-9 mt-1 font-mono text-xs" />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-[10px] uppercase tracking-wider">Type</Label>
                      <Select value={q.kind} onValueChange={(v) => updateExtra(idx, { kind: v })}>
                        <SelectTrigger className="rounded-none h-9 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Short Text</SelectItem>
                          <SelectItem value="textarea">Long Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex justify-end pt-5">
                      <button onClick={() => removeExtra(idx)} className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary" data-testid={`remove-custom-q-${idx}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {override.extra_questions.length === 0 && (
                  <div className="border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No custom questions yet. Click &ldquo;Add Question&rdquo; above to start.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={save} disabled={saving} data-testid="save-questions-btn" className="rounded-none bg-primary hover:bg-primary/90">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
