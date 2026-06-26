import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import AppHeader from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Save, Plus, Trash2, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, Circle, ArrowLeft
} from "lucide-react";

// ─── Segment config ───────────────────────────────────────────────────────────
const SEGMENTS = [
  { key: "branch_head",    label: "Branch Head",       color: "bg-blue-700" },
  { key: "circulation",   label: "Circulation",        color: "bg-green-700" },
  { key: "agent",         label: "Agent",              color: "bg-purple-700" },
  { key: "hawker",        label: "Hawker",             color: "bg-orange-700" },
  { key: "correspondent", label: "Correspondent",      color: "bg-teal-700" },
  { key: "advertisement", label: "Advertisement",      color: "bg-rose-700" },
  { key: "ad_agency",     label: "Ad Agency",          color: "bg-indigo-700" },
  { key: "recovery",      label: "Recovery",           color: "bg-amber-700" },
  { key: "summary",       label: "Daily Summary",      color: "bg-gray-700" },
];

const emptyBranchHead = () => ({ name: "", designation: "", mobile: "", daily_copies: "", last_year_copies: "", growth_pct: "", monthly_revenue: "", outstanding: "", staff_vacancy: "", notes: "" });
const emptyCirculation = () => ({ name: "", weak_agents: 0, weak_agent_names: "", notes: "" });
const emptyAgent       = () => ({ agent_name: "", area: "", outstanding: "", notes: "" });
const emptyHawker      = () => ({ hawker_name: "", area: "", issues: "", notes: "" });
const emptyCorrespondent = () => ({ name: "", mobile: "", issues: "", notes: "" });
const emptyAdvertisement = () => ({ name: "", target: "", achievement: "", lost_clients: "", notes: "" });
const emptyAdAgency    = () => ({ agency_name: "", contact: "", issues: "", notes: "" });
const emptyRecovery    = () => ({ party_name: "", outstanding: "", age_days: "", notes: "" });

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", rows, span = 1 }) {
  const cls = span === 2 ? "col-span-2" : "";
  return (
    <div className={cls}>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">{label}</Label>
      {rows ? (
        <Textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={rows} className="rounded-none text-sm" />
      ) : (
        <Input type={type} value={value || ""} onChange={e => onChange(e.target.value)} className="rounded-none text-sm h-9" />
      )}
    </div>
  );
}

// ─── Multi-entry card ─────────────────────────────────────────────────────────
function MultiCard({ items, onUpdate, onAdd, onRemove, emptyFn, renderFields }) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="border border-border bg-white p-5 relative">
          <div className="absolute top-3 right-3">
            {items.length > 1 && (
              <button onClick={() => onRemove(idx)} className="text-muted-foreground hover:text-primary">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pr-8">
            {renderFields(item, (field, val) => onUpdate(idx, field, val))}
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground border border-dashed border-border w-full justify-center py-3 transition-colors hover:border-foreground"
      >
        <Plus className="w-3.5 h-3.5" /> Add Entry
      </button>
    </div>
  );
}

// ─── Segment Panels ───────────────────────────────────────────────────────────
function BranchHeadPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyBranchHead()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyBranchHead()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyBranchHead}
      renderFields={(item, upd) => (<>
        <Field label="Name" value={item.name} onChange={v => upd("name", v)} />
        <Field label="Designation" value={item.designation} onChange={v => upd("designation", v)} />
        <Field label="Mobile" value={item.mobile} onChange={v => upd("mobile", v)} />
        <Field label="Staff Vacancy" value={item.staff_vacancy} onChange={v => upd("staff_vacancy", v)} />
        <Field label="Daily Copies" type="number" value={item.daily_copies} onChange={v => upd("daily_copies", v)} />
        <Field label="Last Year Copies" type="number" value={item.last_year_copies} onChange={v => upd("last_year_copies", v)} />
        <Field label="Growth %" type="number" value={item.growth_pct} onChange={v => upd("growth_pct", v)} />
        <Field label="Monthly Revenue (₹)" type="number" value={item.monthly_revenue} onChange={v => upd("monthly_revenue", v)} />
        <Field label="Outstanding (₹)" type="number" value={item.outstanding} onChange={v => upd("outstanding", v)} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} span={2} />
      </>)}
    />
  );
}

function CirculationPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyCirculation()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyCirculation()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyCirculation}
      renderFields={(item, upd) => (<>
        <Field label="Incharge Name" value={item.name} onChange={v => upd("name", v)} />
        <Field label="Weak Agents Count" type="number" value={item.weak_agents} onChange={v => upd("weak_agents", v)} />
        <Field label="Weak Agent Names" value={item.weak_agent_names} onChange={v => upd("weak_agent_names", v)} span={2} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} span={2} />
      </>)}
    />
  );
}

function AgentPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyAgent()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyAgent()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyAgent}
      renderFields={(item, upd) => (<>
        <Field label="Agent Name" value={item.agent_name} onChange={v => upd("agent_name", v)} />
        <Field label="Area" value={item.area} onChange={v => upd("area", v)} />
        <Field label="Outstanding (₹)" type="number" value={item.outstanding} onChange={v => upd("outstanding", v)} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} />
      </>)}
    />
  );
}

function HawkerPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyHawker()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyHawker()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyHawker}
      renderFields={(item, upd) => (<>
        <Field label="Hawker Name" value={item.hawker_name} onChange={v => upd("hawker_name", v)} />
        <Field label="Area" value={item.area} onChange={v => upd("area", v)} />
        <Field label="Issues" value={item.issues} onChange={v => upd("issues", v)} rows={2} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} />
      </>)}
    />
  );
}

function CorrespondentPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyCorrespondent()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyCorrespondent()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyCorrespondent}
      renderFields={(item, upd) => (<>
        <Field label="Name" value={item.name} onChange={v => upd("name", v)} />
        <Field label="Mobile" value={item.mobile} onChange={v => upd("mobile", v)} />
        <Field label="Issues" value={item.issues} onChange={v => upd("issues", v)} rows={2} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} />
      </>)}
    />
  );
}

function AdvertisementPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyAdvertisement()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyAdvertisement()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyAdvertisement}
      renderFields={(item, upd) => (<>
        <Field label="Name" value={item.name} onChange={v => upd("name", v)} />
        <Field label="Target (₹)" type="number" value={item.target} onChange={v => upd("target", v)} />
        <Field label="Achievement (₹)" type="number" value={item.achievement} onChange={v => upd("achievement", v)} />
        <Field label="Lost Clients" value={item.lost_clients} onChange={v => upd("lost_clients", v)} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} span={2} />
      </>)}
    />
  );
}

function AdAgencyPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyAdAgency()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyAdAgency()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyAdAgency}
      renderFields={(item, upd) => (<>
        <Field label="Agency Name" value={item.agency_name} onChange={v => upd("agency_name", v)} />
        <Field label="Contact" value={item.contact} onChange={v => upd("contact", v)} />
        <Field label="Issues" value={item.issues} onChange={v => upd("issues", v)} rows={2} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} />
      </>)}
    />
  );
}

function RecoveryPanel({ data, setData }) {
  const items = Array.isArray(data) ? data : (data ? [data] : [emptyRecovery()]);
  const set = (arr) => setData(arr);
  return (
    <MultiCard
      items={items}
      onAdd={() => set([...items, emptyRecovery()])}
      onRemove={(i) => set(items.filter((_, idx) => idx !== i))}
      onUpdate={(i, f, v) => { const a = [...items]; a[i] = { ...a[i], [f]: v }; set(a); }}
      emptyFn={emptyRecovery}
      renderFields={(item, upd) => (<>
        <Field label="Party Name" value={item.party_name} onChange={v => upd("party_name", v)} />
        <Field label="Outstanding (₹)" type="number" value={item.outstanding} onChange={v => upd("outstanding", v)} />
        <Field label="Age (Days)" type="number" value={item.age_days} onChange={v => upd("age_days", v)} />
        <Field label="Notes" value={item.notes} onChange={v => upd("notes", v)} rows={2} />
      </>)}
    />
  );
}

function SummaryPanel({ data, setData }) {
  const d = data || {};
  const upd = (f, v) => setData({ ...d, [f]: v });
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Overall Summary" value={d.overall_summary} onChange={v => upd("overall_summary", v)} rows={3} span={2} />
      <Field label="Key Positives" value={d.positives} onChange={v => upd("positives", v)} rows={2} />
      <Field label="Key Negatives / Issues" value={d.negatives} onChange={v => upd("negatives", v)} rows={2} />
      <Field label="Action Items" value={d.action_items} onChange={v => upd("action_items", v)} rows={2} span={2} />
    </div>
  );
}

const PANEL_MAP = {
  branch_head:    BranchHeadPanel,
  circulation:    CirculationPanel,
  agent:          AgentPanel,
  hawker:         HawkerPanel,
  correspondent:  CorrespondentPanel,
  advertisement:  AdvertisementPanel,
  ad_agency:      AdAgencyPanel,
  recovery:       RecoveryPanel,
  summary:        SummaryPanel,
};

// ─── Segment Section ──────────────────────────────────────────────────────────
function SegmentSection({ seg, segData, visitId, isSaved, onSaved }) {
  const [open, setOpen] = useState(false);
  const [localData, setLocalData] = useState(segData);
  const [saving, setSaving] = useState(false);
  const Panel = PANEL_MAP[seg.key];

  useEffect(() => { setLocalData(segData); }, [segData]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/visits/${visitId}/segment/${seg.key}`, { data: localData });
      toast.success(`${seg.label} saved!`);
      onSaved(seg.key, localData);
    } catch {
      toast.error(`Failed to save ${seg.label}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border overflow-hidden">
      {/* Header */}
      <button
        className={`w-full flex items-center justify-between px-5 py-4 ${seg.color} text-white`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          {isSaved
            ? <CheckCircle2 className="w-4 h-4 text-white/90" />
            : <Circle className="w-4 h-4 text-white/50" />}
          <span className="text-sm font-bold uppercase tracking-wider">{seg.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {isSaved && <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5">Saved</span>}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="bg-muted/30 p-5">
          <Panel data={localData} setData={setLocalData} />
          <div className="flex justify-end mt-5">
            <Button
              onClick={save}
              disabled={saving}
              className="rounded-none bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-6 text-xs uppercase tracking-wider"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save {seg.label}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VisitDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedKeys, setSavedKeys] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/visits/${id}`);
      setVisit(data);
      // Mark already-filled segments as saved
      const filled = Object.entries(data.segments || {})
        .filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : Object.values(v).some(Boolean)))
        .map(([k]) => k);
      setSavedKeys(new Set(filled));
    } catch {
      toast.error("Failed to load visit");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (key, data) => {
    setSavedKeys(prev => new Set([...prev, key]));
    setVisit(v => ({ ...v, segments: { ...v.segments, [key]: data } }));
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex items-center justify-center py-32 text-muted-foreground">Loading...</div>
    </div>
  );

  if (!visit) return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-[900px] mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Visit not found.</p>
        <Link to="/" className="text-sm underline mt-4 block">← Back to visits</Link>
      </div>
    </div>
  );

  const completedCount = savedKeys.size;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-[900px] mx-auto px-6 py-10">

        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> All Visits
        </Link>

        {/* Visit header */}
        <div className="bg-secondary text-secondary-foreground px-6 py-5 mb-2">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1">Branch Visit</div>
          <h2 className="text-3xl font-black tracking-tight capitalize">{visit.branch_name}</h2>
          <div className="flex gap-6 mt-3 text-xs opacity-70">
            <span>📅 {visit.visit_date}</span>
            {visit.visiting_team && <span>👥 {visit.visiting_team}</span>}
            {visit.created_by_name && <span>🧑 {visit.created_by_name}</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white border border-t-0 border-border px-6 py-4 mb-8 flex items-center gap-4">
          <div className="flex-1 bg-muted h-2 overflow-hidden">
            <div
              className="h-2 bg-secondary transition-all duration-500"
              style={{ width: `${(completedCount / SEGMENTS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {completedCount}/{SEGMENTS.length} Segments Saved
          </span>
        </div>

        {/* Segment sections */}
        <div className="space-y-3">
          {SEGMENTS.map(seg => (
            <SegmentSection
              key={seg.key}
              seg={seg}
              visitId={id}
              segData={(visit.segments || {})[seg.key]}
              isSaved={savedKeys.has(seg.key)}
              onSaved={handleSaved}
            />
          ))}
        </div>

        {completedCount === SEGMENTS.length && (
          <div className="mt-8 border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-800">All segments complete! Visit data saved.</p>
            <Link to="/" className="text-xs text-emerald-700 underline mt-2 block">← Back to All Visits</Link>
          </div>
        )}
      </main>
    </div>
  );
}
