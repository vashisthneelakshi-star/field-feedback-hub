import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import AppHeader from "../components/AppHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Users, FileText, ExternalLink } from "lucide-react";

const fmtINR = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v.toLocaleString("en-IN");
};

function KPI({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="p-6 border-r border-b border-border bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}
      </div>
      <div className={`kpi-num text-3xl ${accent || "text-secondary"}`} data-testid={`agg-kpi-${label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-2">{sub}</div>}
    </div>
  );
}

export default function GlobalDashboard() {
  const { isAdmin, user } = useAuth();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [filterUser, setFilterUser] = useState("__all__");
  const [loading, setLoading] = useState(true);

  // Load users for admin filter
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/users").then(({ data }) => setUsers(data)).catch(() => {});
  }, [isAdmin]);

  // Load aggregate
  useEffect(() => {
    setLoading(true);
    const params = filterUser !== "__all__" ? { user_id: filterUser } : {};
    api.get("/dashboard/aggregate", { params })
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterUser]);

  const k = data?.kpis || {};
  const isDecline = (k.growth_pct ?? 0) < 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ageing = data?.ageing_buckets || {};
  const ageingData = useMemo(() => [
    { name: "0-30", value: ageing["0-30"] || 0 },
    { name: "31-60", value: ageing["31-60"] || 0 },
    { name: "61-90", value: ageing["61-90"] || 0 },
    { name: "90+", value: ageing["90+"] || 0 },
  ], [ageing]);
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  const byBranch = data?.by_branch || [];
  const branchChart = useMemo(() => byBranch.map(b => ({
    name: b.branch,
    Current: b.daily_copies || 0,
    LastYear: b.last_year_copies || 0,
  })), [byBranch]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">Aggregate Performance</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Global Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {isAdmin
                ? "Consolidated view of every branch visit across all users. Filter by team member to drill down."
                : "Consolidated view across all your branch visits."}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Filter by user</div>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger data-testid="user-filter-select" className="rounded-none h-10 w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Users (Aggregate)</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="editorial-rule mb-8" />

        {loading ? <div className="text-sm text-muted-foreground">Loading...</div> :
         !data || data.visit_count === 0 ? (
          <div className="border border-border p-16 text-center bg-white">
            <FileText className="w-10 h-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No visits to aggregate yet.</p>
          </div>
         ) : (
          <>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-3">
              Showing {data.visit_count} {data.visit_count === 1 ? "visit" : "visits"} · scope: {data.scope.replace("_", " ")}
            </div>
            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-border bg-muted">
              <KPI label="Total Daily Copies" value={Math.round(k.total_daily_copies || 0).toLocaleString("en-IN")} icon={Users} sub={k.total_last_year_copies ? `vs ${Math.round(k.total_last_year_copies).toLocaleString('en-IN')} LY` : null} />
              <KPI label="Combined Growth" value={k.growth_pct == null ? "—" : `${k.growth_pct.toFixed(1)}%`} icon={isDecline ? TrendingDown : TrendingUp} accent={isDecline ? "text-primary" : "text-emerald-700"} />
              <KPI label="Total Monthly Revenue" value={fmtINR(k.total_monthly_revenue)} icon={DollarSign} />
              <KPI label="Total Outstanding" value={fmtINR(k.total_outstanding)} icon={AlertTriangle} accent={(k.total_outstanding || 0) > 0 ? "text-primary" : ""} />
              <KPI label="Combined Ad Target" value={fmtINR(k.total_ad_target)} icon={Target} />
              <KPI label="Combined Achievement" value={fmtINR(k.total_ad_achievement)} sub={k.ad_achievement_pct != null ? `${k.ad_achievement_pct.toFixed(1)}% of target` : null} />
              <KPI label="Weak Agents (Total)" value={k.weak_agents_count || 0} icon={AlertTriangle} />
              <KPI label="Lost Clients (Total)" value={k.lost_clients_count || 0} icon={AlertTriangle} accent="text-primary" />
            </div>

            {/* Branch comparison chart */}
            <section className="mt-10">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Dashboard Section</div>
                  <h3 className="text-xl font-bold tracking-tight">Branch Comparison · Daily Copies</h3>
                </div>
              </div>
              <div className="editorial-rule mb-5" />
              <div className="border border-border bg-white p-6">
                <ResponsiveContainer width="100%" height={Math.max(260, byBranch.length * 50)}>
                  <BarChart data={branchChart} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="LastYear" fill="#171717" />
                    <Bar dataKey="Current" fill="#B91C1C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recovery ageing */}
            <section className="mt-10">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Dashboard Section</div>
                  <h3 className="text-xl font-bold tracking-tight">Recovery Ageing (All Branches)</h3>
                </div>
              </div>
              <div className="editorial-rule mb-5" />
              <div className="border border-border bg-white p-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ageingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtINR} />
                    <Tooltip formatter={(v) => fmtINR(v)} />
                    <Bar dataKey="value">
                      {ageingData.map((d, i) => (
                        <Cell key={i} fill={d.name === "90+" ? "#B91C1C" : d.name === "61-90" ? "#CA8A04" : "#171717"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Per-branch table */}
            <section className="mt-10">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Dashboard Section</div>
                  <h3 className="text-xl font-bold tracking-tight">Branch-by-Branch Performance</h3>
                </div>
              </div>
              <div className="editorial-rule mb-5" />
              <div className="border border-border bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-foreground">
                    <tr>
                      <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Branch</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Date</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold">Owner</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider font-semibold">Daily Copies</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider font-semibold">Growth %</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider font-semibold">Revenue</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider font-semibold">Outstanding</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider font-semibold">Ad Achv.</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {byBranch.map(b => (
                      <tr key={b.visit_id} className="border-b border-border hover:bg-muted/40" data-testid={`agg-row-${b.visit_id}`}>
                        <td className="p-3 font-semibold">{b.branch}</td>
                        <td className="p-3 text-xs text-muted-foreground font-mono">{b.visit_date}</td>
                        <td className="p-3 text-xs">{b.owner || "—"}</td>
                        <td className="p-3 text-right font-mono">{(b.daily_copies || 0).toLocaleString("en-IN")}</td>
                        <td className={`p-3 text-right font-mono ${b.growth_pct == null ? '' : b.growth_pct < 0 ? 'text-primary' : 'text-emerald-700'}`}>
                          {b.growth_pct == null ? "—" : `${b.growth_pct.toFixed(1)}%`}
                        </td>
                        <td className="p-3 text-right font-mono">{fmtINR(b.monthly_revenue)}</td>
                        <td className="p-3 text-right font-mono">{fmtINR(b.outstanding)}</td>
                        <td className="p-3 text-right font-mono">{b.ad_target ? `${((b.ad_achievement / b.ad_target) * 100).toFixed(0)}%` : "—"}</td>
                        <td className="p-3">
                          <Link to={`/visits/${b.visit_id}`} className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
