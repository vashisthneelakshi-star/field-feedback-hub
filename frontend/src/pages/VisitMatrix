import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { ExternalLink, Loader2 } from "lucide-react";

const fmtINR = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return v ? "₹" + v.toLocaleString("en-IN") : "—";
};

const arr = (val) => Array.isArray(val) ? val : (val ? [val] : []);
const first = (val) => arr(val)[0] || {};
const names = (val, nameKey) => arr(val).map(e => e[nameKey] || e.name || "").filter(Boolean).join(", ") || "—";

export default function VisitMatrix() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/visits").then(({ data }) => {
      setVisits(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="p-12 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading visits...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="px-6 py-10">
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">All Visits</div>
          <h2 className="text-4xl font-extrabold tracking-tight">Visit Matrix</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Complete horizontal view of all branch visits — branch head, circulation, agents, hawkers, correspondents, advt, ad agency, recovery.
          </p>
        </div>
        <div className="editorial-rule mb-8" />

        {visits.length === 0 ? (
          <div className="border border-border p-16 text-center bg-white">
            <p className="text-sm text-muted-foreground">No visits yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="text-xs whitespace-nowrap">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  {/* Meta */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider sticky left-0 bg-secondary z-10">Branch</th>
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Visit Date</th>
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Visited By</th>
                  {/* Branch Head */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">BH Name(s)</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">Daily Copies</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">LY Copies</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">Growth %</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">Revenue</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">BH Outstanding</th>
                  {/* Circulation */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Circulation Incharge(s)</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Weak Agents</th>
                  {/* Agent */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">Agent(s)</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">Agent Outstanding</th>
                  {/* Hawker */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Hawker(s)</th>
                  {/* Correspondent */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">Correspondent(s)</th>
                  {/* Advertisement */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Advt. Member(s)</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Ad Target</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Ad Achievement</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Lost Clients</th>
                  {/* Ad Agency */}
                  <th className="text-left p-3 border-r border-border/30 font-semibold uppercase tracking-wider bg-secondary/80">Ad Agency(s)</th>
                  {/* Recovery */}
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Recovery Parties</th>
                  <th className="text-right p-3 border-r border-border/30 font-semibold uppercase tracking-wider">Total Outstanding</th>
                  {/* Link */}
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => {
                  const seg = v.segments || {};
                  const bhArr = arr(seg.branch_head);
                  const circArr = arr(seg.circulation);
                  const agentArr = arr(seg.agent);
                  const hawkerArr = arr(seg.hawker);
                  const corrArr = arr(seg.correspondent);
                  const advArr = arr(seg.advertisement);
                  const agencyArr = arr(seg.ad_agency);
                  const recoveryArr = arr(seg.recovery);

                  const totalDaily = bhArr.reduce((s, e) => s + (Number(e.daily_copies) || 0), 0);
                  const totalLY = bhArr.reduce((s, e) => s + (Number(e.last_year_copies) || 0), 0);
                  const totalRev = bhArr.reduce((s, e) => s + (Number(e.monthly_revenue) || 0), 0);
                  const totalBhOut = bhArr.reduce((s, e) => s + (Number(e.outstanding) || 0), 0);
                  const avgGrowth = bhArr.length ? (bhArr.reduce((s, e) => s + (Number(e.growth_pct) || 0), 0) / bhArr.length).toFixed(1) : "—";

                  const weakAgentsCount = circArr.flatMap(e => (e.weak_agents || []).filter(r => r.agent_name)).length;

                  const totalAgentOut = agentArr.reduce((s, e) => s + (Number(e.outstanding) || 0), 0);

                  const totalAdTarget = advArr.reduce((s, e) => s + (Number(e.target) || 0), 0);
                  const totalAdAchiev = advArr.reduce((s, e) => s + (Number(e.achievement) || 0), 0);
                  const lostClientsCount = advArr.flatMap(e => (e.lost_clients || []).filter(r => r.client)).length;

                  const allParties = recoveryArr.flatMap(e => (e.parties || []));
                  const totalRecovery = allParties.reduce((s, p) => s + (Number(p.outstanding) || 0), 0);

                  const growthNum = Number(avgGrowth);

                  return (
                    <tr key={v.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-bold border-r border-border/20 sticky left-0 bg-white hover:bg-muted/30">{v.branch_name}</td>
                      <td className="p-3 font-mono border-r border-border/20">{v.visit_date}</td>
                      <td className="p-3 border-r border-border/20">{v.created_by_name || "—"}</td>
                      {/* BH */}
                      <td className="p-3 border-r border-border/20">{names(seg.branch_head, "name")}</td>
                      <td className="p-3 text-right font-mono border-r border-border/20">{totalDaily ? totalDaily.toLocaleString("en-IN") : "—"}</td>
                      <td className="p-3 text-right font-mono border-r border-border/20">{totalLY ? totalLY.toLocaleString("en-IN") : "—"}</td>
                      <td className={`p-3 text-right font-mono border-r border-border/20 ${avgGrowth !== "—" ? (growthNum < 0 ? "text-red-600" : "text-emerald-700") : ""}`}>
                        {avgGrowth !== "—" ? `${avgGrowth}%` : "—"}
                      </td>
                      <td className="p-3 text-right font-mono border-r border-border/20">{totalRev ? fmtINR(totalRev) : "—"}</td>
                      <td className={`p-3 text-right font-mono border-r border-border/20 ${totalBhOut > 0 ? "text-red-600" : ""}`}>{totalBhOut ? fmtINR(totalBhOut) : "—"}</td>
                      {/* Circulation */}
                      <td className="p-3 border-r border-border/20">{names(seg.circulation, "name")}</td>
                      <td className={`p-3 text-right font-mono border-r border-border/20 ${weakAgentsCount > 0 ? "text-red-600 font-bold" : ""}`}>{weakAgentsCount || "—"}</td>
                      {/* Agent */}
                      <td className="p-3 border-r border-border/20">{names(seg.agent, "agent_name")}</td>
                      <td className={`p-3 text-right font-mono border-r border-border/20 ${totalAgentOut > 0 ? "text-red-600" : ""}`}>{totalAgentOut ? fmtINR(totalAgentOut) : "—"}</td>
                      {/* Hawker */}
                      <td className="p-3 border-r border-border/20">{names(seg.hawker, "hawker_name")}</td>
                      {/* Correspondent */}
                      <td className="p-3 border-r border-border/20">{names(seg.correspondent, "name")}</td>
                      {/* Advt */}
                      <td className="p-3 border-r border-border/20">{names(seg.advertisement, "name")}</td>
                      <td className="p-3 text-right font-mono border-r border-border/20">{totalAdTarget ? fmtINR(totalAdTarget) : "—"}</td>
                      <td className="p-3 text-right font-mono border-r border-border/20">{totalAdAchiev ? fmtINR(totalAdAchiev) : "—"}</td>
                      <td className={`p-3 text-right font-mono border-r border-border/20 ${lostClientsCount > 0 ? "text-red-600" : ""}`}>{lostClientsCount || "—"}</td>
                      {/* Agency */}
                      <td className="p-3 border-r border-border/20">{names(seg.ad_agency, "agency_name")}</td>
                      {/* Recovery */}
                      <td className="p-3 text-right font-mono border-r border-border/20">{allParties.length || "—"}</td>
                      <td className={`p-3 text-right font-mono border-r border-border/20 ${totalRecovery > 0 ? "text-red-600" : ""}`}>{totalRecovery ? fmtINR(totalRecovery) : "—"}</td>
                      <td className="p-3">
                        <Link to={`/visits/${v.id}`} className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
