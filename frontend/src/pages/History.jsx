import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Input } from "../components/ui/input";
import { Sparkles, FileEdit, FilePlus, Trash2, ScrollText, BarChart3, ExternalLink } from "lucide-react";
import { useAuth } from "../lib/auth";

const ACTION_META = {
  visit_created: { label: "Visit Created", icon: FilePlus, color: "text-emerald-700" },
  segment_updated: { label: "Segment Updated", icon: FileEdit, color: "text-secondary" },
  visit_deleted: { label: "Visit Deleted", icon: Trash2, color: "text-primary" },
  ai_analysis: { label: "AI Insight Generated", icon: Sparkles, color: "text-primary" },
  executive_summary: { label: "Executive Summary", icon: ScrollText, color: "text-primary" },
};

export default function HistoryPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/audit-logs")
      .then(({ data }) => setLogs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter(l =>
      (l.branch_name || "").toLowerCase().includes(term) ||
      (l.user_name || "").toLowerCase().includes(term) ||
      (l.note || "").toLowerCase().includes(term) ||
      (l.positives || "").toLowerCase().includes(term) ||
      (l.negatives || "").toLowerCase().includes(term)
    );
  }, [logs, q]);

  // group by visit_id
  const byVisit = useMemo(() => {
    const map = {};
    filtered.forEach(l => {
      if (!map[l.visit_id]) map[l.visit_id] = { branch_name: l.branch_name, items: [] };
      map[l.visit_id].items.push(l);
    });
    return Object.entries(map);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">Audit Trail</div>
            <h2 className="text-4xl font-extrabold tracking-tight">History · इतिहास</h2>
            <p className="text-sm text-muted-foreground mt-2">{isAdmin ? "Sabhi visits ki" : "Aapki visits ki"} timeline — kab, kisne, kya kiya — saath me positive/negative notes.</p>
          </div>
          <Input data-testid="history-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search branch / user / note..." className="rounded-none h-10 w-80" />
        </div>
        <div className="editorial-rule mb-6" />

        {loading ? <div className="text-sm text-muted-foreground">Loading...</div> :
         byVisit.length === 0 ? <div className="border border-border p-12 text-center bg-white text-sm text-muted-foreground">No history yet.</div> :
         (
          <div className="space-y-8">
            {byVisit.map(([vid, group]) => (
              <div key={vid} className="border border-border bg-white">
                <div className="border-b border-foreground px-5 py-3 flex items-center justify-between bg-secondary text-secondary-foreground">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Branch Visit</div>
                    <h3 className="text-xl font-bold">{group.branch_name}</h3>
                  </div>
                  <Link to={`/visits/${vid}`} className="text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-70">
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {group.items.map(l => {
                    const meta = ACTION_META[l.action] || { label: l.action, icon: BarChart3, color: "text-muted-foreground" };
                    const Icon = meta.icon;
                    return (
                      <div key={l.id} className="p-5 flex gap-5" data-testid={`audit-log-${l.id}`}>
                        <div className="w-32 flex-shrink-0">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{new Date(l.timestamp).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{new Date(l.timestamp).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${meta.color}`} strokeWidth={1.5} />
                            <span className={`text-xs uppercase tracking-wider font-semibold ${meta.color}`}>{meta.label}</span>
                            {l.segment_key && <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5">{l.segment_key.replace("_", " ")}</span>}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">{l.user_name}</span> <span className="text-muted-foreground">· {l.user_email}</span>
                          </div>
                          {l.note && <div className="text-sm text-muted-foreground mt-1.5">{l.note}</div>}
                          {(l.positives || l.negatives) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              {l.positives && (
                                <div className="border-l-2 border-emerald-700 pl-3">
                                  <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mb-1">Positive</div>
                                  <div className="text-sm">{l.positives}</div>
                                </div>
                              )}
                              {l.negatives && (
                                <div className="border-l-2 border-primary pl-3">
                                  <div className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">Problem / Issue</div>
                                  <div className="text-sm">{l.negatives}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
