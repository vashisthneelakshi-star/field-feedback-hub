import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, SEGMENTS } from "../lib/api";
import { SCHEMAS, mergeSchema } from "../lib/schemas";
import { useAuth } from "../lib/auth";
import AppHeader from "../components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { SegmentForm } from "../components/FormPrimitives";
import AIInsightPanel, { renderMd } from "../components/AIInsightPanel";
import Dashboard from "../components/Dashboard";
import QuestionEditor from "../components/QuestionEditor";
import { ArrowLeft, Save, Loader2, FileText, Sparkles, Printer, BarChart3, ScrollText, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [visit, setVisit] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [overrides, setOverrides] = useState({});  // segment_key -> override
  const [saving, setSaving] = useState(false);
  const [genExec, setGenExec] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSegment, setEditorSegment] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pendingSaveKey, setPendingSaveKey] = useState(null);
  const [noteForm, setNoteForm] = useState({ positives: "", negatives: "", note: "" });

  const load = useCallback(async () => {
    try {
      const [v, s] = await Promise.all([api.get(`/visits/${id}`), api.get(`/schemas`)]);
      setVisit(v.data);
      setOverrides(s.data || {});
    } catch (err) {
      if (err.response?.status === 403) toast.error("Access denied");
      else toast.error("Visit nahi mili");
      navigate("/");
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const updateSegmentLocal = (key, data) => {
    setVisit((v) => ({ ...v, segments: { ...v.segments, [key]: data } }));
  };

  const openSaveDialog = (key) => {
    setPendingSaveKey(key);
    setNoteForm({ positives: "", negatives: "", note: "" });
    setSaveDialogOpen(true);
  };

  const saveSegment = async () => {
    const key = pendingSaveKey;
    if (!key) return;
    setSaving(true);
    try {
      await api.put(`/visits/${id}/segment/${key}`, {
        data: visit.segments[key] || {},
        ...noteForm,
      });
      toast.success("Save ho gaya");
      setSaveDialogOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save fail");
    } finally { setSaving(false); }
  };

  const setAiInsight = (key, text) => {
    setVisit((v) => ({ ...v, ai_insights: { ...(v.ai_insights || {}), [key]: text } }));
  };

  const generateExec = async () => {
    setGenExec(true);
    try {
      const { data } = await api.post(`/visits/${id}/executive-summary`);
      setVisit((v) => ({ ...v, executive_summary: data.summary }));
      toast.success("Executive Summary ready");
      setActiveTab("executive");
    } catch { toast.error("Summary fail"); }
    finally { setGenExec(false); }
  };

  const openEditor = (segKey) => { setEditorSegment(segKey); setEditorOpen(true); };
  const onSchemaSaved = () => { api.get("/schemas").then(({ data }) => setOverrides(data || {})); };

  if (!visit) return <div className="min-h-screen bg-background"><AppHeader /><div className="p-12 text-sm text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Visit sub-header */}
        <div className="flex items-end justify-between mb-6 no-print">
          <div className="flex items-center gap-4">
            <Link to="/" data-testid="back-to-list-btn" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> All Visits
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Branch Visit</div>
              <h1 className="text-3xl font-extrabold tracking-tight">{visit.branch_name} <span className="text-muted-foreground font-normal">· {visit.visit_date}</span></h1>
              <div className="text-xs text-muted-foreground mt-1">By {visit.created_by_name} · Last edited: {visit.last_edited_by_name || "—"}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="print-btn" variant="outline" onClick={() => window.print()} className="rounded-none h-10">
              <Printer className="w-4 h-4 mr-2" /> Print / PDF
            </Button>
            <Button data-testid="gen-exec-summary-btn" onClick={generateExec} disabled={genExec} className="rounded-none bg-primary hover:bg-primary/90 h-10">
              {genExec ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Director Summary
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-none h-auto p-0 bg-transparent border-b border-foreground w-full justify-start overflow-x-auto flex-wrap">
            <TabsTrigger data-testid="tab-dashboard" value="dashboard" className="rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-r border-border">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger data-testid="tab-executive" value="executive" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-r border-border">
              <ScrollText className="w-3.5 h-3.5 mr-1.5" /> Executive
            </TabsTrigger>
            {SEGMENTS.map(s => (
              <TabsTrigger key={s.key} data-testid={`tab-${s.key}`} value={s.key} className="rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-r border-border">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="mt-8"><Dashboard visit={visit} /></TabsContent>

          <TabsContent value="executive" className="mt-8">
            <div className="border border-border bg-white p-8 max-w-4xl">
              <div className="flex items-start justify-between mb-6 border-b border-foreground pb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Director&apos;s Brief</div>
                  <h2 className="text-3xl font-extrabold tracking-tight mt-1">Executive Summary</h2>
                  <p className="text-xs text-muted-foreground mt-2">{visit.branch_name} · {visit.visit_date} · {visit.visiting_team || "Visiting Team"}</p>
                </div>
                <div className="text-right text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Patrika<br />Director Office</div>
              </div>
              {visit.executive_summary ? (
                <div data-testid="executive-summary-text" className="ai-md">{renderMd(visit.executive_summary)}</div>
              ) : (
                <div className="py-16 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground mb-4">Executive Summary abhi nahi bani.</p>
                  <Button data-testid="gen-exec-summary-inline-btn" onClick={generateExec} disabled={genExec} className="rounded-none bg-primary hover:bg-primary/90">
                    {genExec ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generate Executive Summary
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {SEGMENTS.map((s) => {
            const merged = mergeSchema(SCHEMAS[s.key], overrides[s.key]);
            return (
              <TabsContent key={s.key} value={s.key} className="mt-8">
                <div className="flex items-end justify-between mb-5 no-print">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Segment {SEGMENTS.findIndex(x => x.key === s.key) + 1} of {SEGMENTS.length}</div>
                    <h2 className="text-3xl font-extrabold tracking-tight">{s.label} <span className="text-muted-foreground font-normal">· {s.hindi}</span></h2>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <Button data-testid={`edit-questions-${s.key}-btn`} variant="outline" onClick={() => openEditor(s.key)} className="rounded-none h-10">
                        <Settings2 className="w-4 h-4 mr-2" /> Edit Questions
                      </Button>
                    )}
                    <Button data-testid={`save-${s.key}-btn`} onClick={() => openSaveDialog(s.key)} className="rounded-none bg-secondary hover:bg-secondary/90 h-10">
                      <Save className="w-4 h-4 mr-2" /> Save Segment
                    </Button>
                  </div>
                </div>
                <div className="editorial-rule mb-6" />
                <SegmentForm data={visit.segments[s.key] || {}} onChange={(d) => updateSegmentLocal(s.key, d)} schema={merged} />
                <AIInsightPanel visitId={visit.id} segmentKey={s.key} currentInsight={(visit.ai_insights || {})[s.key]} onUpdate={(t) => setAiInsight(s.key, t)} />
              </TabsContent>
            );
          })}
        </Tabs>
      </main>

      {/* Question editor */}
      <QuestionEditor open={editorOpen} onOpenChange={setEditorOpen} segmentKey={editorSegment} onSaved={onSchemaSaved} />

      {/* Save with note dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="rounded-none border-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Save Segment</DialogTitle>
            <p className="text-xs text-muted-foreground">Audit trail ke liye - optional positive / problem note add karein.</p>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-emerald-700">What was Positive · सकारात्मक</Label>
              <Textarea data-testid="save-positives-input" value={noteForm.positives} onChange={(e) => setNoteForm({ ...noteForm, positives: e.target.value })} placeholder="e.g. Branch head proactive, recovery improving..." rows={2} className="rounded-none mt-1" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-primary">Problems / Issues · समस्या</Label>
              <Textarea data-testid="save-negatives-input" value={noteForm.negatives} onChange={(e) => setNoteForm({ ...noteForm, negatives: e.target.value })} placeholder="e.g. Outstanding badh raha hai, 2 weak agents..." rows={2} className="rounded-none mt-1" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider">Note (optional)</Label>
              <Textarea data-testid="save-note-input" value={noteForm.note} onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })} rows={2} className="rounded-none mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSaveDialogOpen(false)} variant="outline" className="rounded-none">Cancel</Button>
            <Button data-testid="confirm-save-btn" onClick={saveSegment} disabled={saving} className="rounded-none bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
