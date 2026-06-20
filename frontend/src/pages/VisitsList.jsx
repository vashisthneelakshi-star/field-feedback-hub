import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import AppHeader from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, FileText, Trash2, Calendar, ArrowUpRight, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VisitsList() {
  const { isAdmin } = useAuth();
  const [visits, setVisits] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterUser, setFilterUser] = useState("__all__");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ branch_name: "", visit_date: new Date().toISOString().slice(0, 10), visiting_team: "", notes: "" });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/visits"); setVisits(data); }
    catch { toast.error("Failed to load visits"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/users").then(({ data }) => setUsers(data)).catch(() => {});
  }, [isAdmin]);

  const filtered = useMemo(() => {
    if (filterUser === "__all__") return visits;
    return visits.filter(v => v.created_by === filterUser);
  }, [visits, filterUser]);

  const createVisit = async (e) => {
    e.preventDefault();
    if (!form.branch_name.trim()) return toast.error("Branch name is required");
    setCreating(true);
    try {
      const { data } = await api.post("/visits", form);
      toast.success("Visit created");
      setOpen(false);
      navigate(`/visits/${data.id}`);
    } catch { toast.error("Failed to create visit"); }
    finally { setCreating(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this visit? This cannot be undone.")) return;
    try {
      await api.delete(`/visits/${id}`);
      toast.success("Visit deleted");
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">Branch Visits Archive</div>
            <h2 className="text-4xl font-extrabold tracking-tight">All Branch Visits</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">{isAdmin ? "All visits across the organisation. Filter by user to focus." : "Your branch visits with segment-wise analytics and AI-powered insights."}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger data-testid="visits-user-filter" className="rounded-none h-10 w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Users</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="new-visit-btn" className="rounded-none bg-primary hover:bg-primary/90 h-10 px-5">
                  <Plus className="w-4 h-4 mr-2" /> New Visit
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-foreground">
                <DialogHeader><DialogTitle className="text-2xl font-extrabold">New Branch Visit</DialogTitle></DialogHeader>
                <form onSubmit={createVisit} className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Branch Name</Label>
                    <Input data-testid="branch-name-input" value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} placeholder="e.g. Bikaner" className="rounded-none mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Visit Date</Label>
                    <Input data-testid="visit-date-input" type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} className="rounded-none mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Visiting Team</Label>
                    <Input data-testid="visiting-team-input" value={form.visiting_team} onChange={(e) => setForm({ ...form, visiting_team: e.target.value })} placeholder="e.g. R. Sharma, M. Gupta" className="rounded-none mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Notes</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-none mt-1" rows={2} />
                  </div>
                  <DialogFooter>
                    <Button data-testid="create-visit-submit" type="submit" disabled={creating} className="rounded-none bg-primary hover:bg-primary/90">
                      {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Visit
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="editorial-rule mb-8" />

        {loading ? <div className="text-sm text-muted-foreground">Loading...</div>
         : filtered.length === 0 ? (
          <div className="border border-border p-16 text-center bg-white">
            <FileText className="w-10 h-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No visits {filterUser !== "__all__" ? "for this user" : "yet"}. Create one above to get started.</p>
          </div>
         ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-border bg-white">
            {filtered.map((v) => (
              <Link to={`/visits/${v.id}`} key={v.id} data-testid={`visit-card-${v.id}`} className="p-6 border-r border-b border-border hover:bg-muted transition-colors duration-150 group block">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">{new Date(v.created_at).toLocaleDateString('en-IN')}</div>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">{v.branch_name}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {v.visit_date}</span>
                  {v.created_by_name && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {v.created_by_name}</span>}
                </div>
                {v.visiting_team && <div className="text-xs text-muted-foreground mb-3">Team: {v.visiting_team}</div>}
                <div className="flex items-center justify-between border-t pt-3 mt-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Segments: {Object.values(v.segments || {}).filter(s => s && Object.keys(s).length).length}/9</span>
                  <button data-testid={`delete-visit-${v.id}`} onClick={(e) => { e.preventDefault(); remove(v.id); }} className="text-muted-foreground hover:text-primary">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
