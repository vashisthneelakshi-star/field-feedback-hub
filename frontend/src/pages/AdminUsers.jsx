import { useEffect, useState } from "react";
import { api } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { UserPlus, Trash2, Shield, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch { toast.error("Users load fail"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createUser = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password min 6 chars");
    setCreating(true);
    try {
      await api.post("/users", form);
      toast.success("User created");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "user" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Create fail");
    } finally { setCreating(false); }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Delete this user? Yeh permanent hai.")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Delete fail");
    }
  };

  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Role ko ${newRole} me change karein?`)) return;
    try {
      await api.patch(`/users/${u.id}`, { role: newRole });
      toast.success("Role updated");
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Update fail"); }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/users/${u.id}`, { is_active: !u.is_active });
      toast.success(u.is_active ? "Deactivated" : "Activated");
      load();
    } catch { toast.error("Update fail"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">Administration</div>
            <h2 className="text-4xl font-extrabold tracking-tight">User Management · उपयोगकर्ता प्रबंधन</h2>
            <p className="text-sm text-muted-foreground mt-2">Visiting team members ko add karein, roles assign karein.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-user-btn" className="rounded-none bg-primary hover:bg-primary/90 h-10">
                <UserPlus className="w-4 h-4 mr-2" /> Naya User Banayein
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-foreground">
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold">Create User</DialogTitle>
              </DialogHeader>
              <form onSubmit={createUser} className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Full Name</Label>
                  <Input data-testid="new-user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-none mt-1" required />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Email</Label>
                  <Input data-testid="new-user-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-none mt-1" required />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Password</Label>
                  <Input data-testid="new-user-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-none mt-1" required />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger data-testid="new-user-role" className="rounded-none mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User (Field Team)</SelectItem>
                      <SelectItem value="admin">Admin (Full Rights)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button data-testid="create-user-submit" type="submit" disabled={creating} className="rounded-none bg-primary hover:bg-primary/90">
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="editorial-rule mb-6" />

        <div className="border border-border bg-white">
          {loading ? <div className="p-8 text-sm text-muted-foreground">Loading...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-foreground">
                <tr>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Name</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Email</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Role</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Status</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Last Login</th>
                  <th className="w-32"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/40" data-testid={`user-row-${u.id}`}>
                    <td className="p-3 font-semibold">{u.name}</td>
                    <td className="p-3 font-mono text-xs">{u.email}</td>
                    <td className="p-3">
                      <button onClick={() => toggleRole(u)} disabled={u.id === me.id}
                              className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold ${u.role === 'admin' ? 'text-primary' : 'text-muted-foreground'} ${u.id === me.id ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}>
                        {u.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />} {u.role}
                      </button>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(u)} disabled={u.id === me.id}
                              className={`text-xs font-mono ${u.is_active ? 'text-emerald-700' : 'text-muted-foreground'} ${u.id === me.id ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}>
                        {u.is_active ? "● Active" : "○ Disabled"}
                      </button>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground font-mono">{u.last_login ? new Date(u.last_login).toLocaleString("en-IN") : "—"}</td>
                    <td className="p-3 text-right">
                      {u.id !== me.id && (
                        <button data-testid={`delete-user-${u.id}`} onClick={() => removeUser(u.id)}
                                className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
