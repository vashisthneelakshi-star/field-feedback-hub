import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Users } from "lucide-react";

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
      <div className={`kpi-num text-3xl ${accent || "text-secondary"}`} data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-2">{sub}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Dashboard Section</div>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      </div>
      <div className="editorial-rule mb-5" />
      {children}
    </section>
  );
}

// helper: get first entry or empty object from array-or-object
const first = (val) => Array.isArray(val) ? (val[0] || {}) : (val || {});
const arr = (val) => Array.isArray(val) ? val : (val ? [val] : []);

export default function Dashboard({ visit }) {
  const seg = visit.segments || {};

  // Branch head — now array of entries
  const bhEntries = arr(seg.branch_head);
  const bh = first(seg.branch_head);

  // Aggregate across all branch head entries
  const totalDaily = bhEntries.reduce((s, e) => s + (Number(e.daily_copies) || 0), 0);
  const totalLastYear = bhEntries.reduce((s, e) => s + (Number(e.last_year_copies) || 0), 0);
  const totalRevenue = bhEntries.reduce((s, e) => s + (Number(e.monthly_revenue) || 0), 0);
  const totalBhOutstanding = bhEntries.reduce((s, e) => s + (Number(e.outstanding) || 0), 0);

  const growth = totalLastYear
    ? (((totalDaily - totalLastYear) / totalLastYear) * 100).toFixed(1)
    : (bh.growth_pct || "—");
  const isDecline = totalLastYear && totalDaily < totalLastYear;

  // Advertisement — now array
  const advEntries = arr(seg.advertisement);
  const totalTarget = advEntries.reduce((s, e) => s + (Number(e.target) || 0), 0);
  const totalAchievement = advEntries.reduce((s, e) => s + (Number(e.achievement) || 0), 0);
  const adGap = totalTarget - totalAchievement;
  const achievementPct = totalTarget ? ((totalAchievement / totalTarget) * 100).toFixed(1) : 0;

  // Lost clients across all adv entries
  const lostClients = advEntries.flatMap(e => (e.lost_clients || []).filter(r => r.client));

  // Circulation — now array, weak agents across all
  const circEntries = arr(seg.circulation);
  const weakAgents = circEntries.flatMap(e => (e.weak_agents || []).filter(r => r.agent_name));

  // Recovery — now array of entries, each with parties
  const recoveryEntries = arr(seg.recovery);
  const allParties = recoveryEntries.flatMap(e => (e.parties || []));

  // Ageing buckets
  const ageingBuckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  allParties.forEach(r => {
    const age = Number(r.ageing) || 0;
    const amt = Number(r.outstanding) || 0;
    if (age <= 30) ageingBuckets["0-30"] += amt;
    else if (age <= 60) ageingBuckets["31-60"] += amt;
    else if (age <= 90) ageingBuckets["61-90"] += amt;
    else ageingBuckets["90+"] += amt;
  });
  const ageingData = Object.entries(ageingBuckets).map(([k, v]) => ({ name: k, value: v }));
  const totalOutstanding = ageingData.reduce((a, b) => a + b.value, 0);

  const circulationData = [
    { name: "Last Year", copies: totalLastYear },
    { name: "Current", copies: totalDaily },
  ];
  const adRevenueData = [
    { name: "Target", val: totalTarget },
    { name: "Achievement", val: totalAchievement },
  ];

  // Summary
  const summary = seg.summary || {};

  return (
    <div data-testid="dashboard-view">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-border bg-muted">
        <KPI label="Daily Copies" value={totalDaily ? totalDaily.toLocaleString("en-IN") : "—"} icon={Users}
          sub={totalLastYear ? `vs ${totalLastYear.toLocaleString("en-IN")} LY` : `${bhEntries.length} branch head(s)`} />
        <KPI label="Growth %" value={growth !== "—" ? `${growth}%` : "—"}
          icon={isDecline ? TrendingDown : TrendingUp}
          accent={isDecline ? "text-primary" : "text-emerald-700"} />
        <KPI label="Monthly Revenue" value={fmtINR(totalRevenue)} icon={DollarSign} />
        <KPI label="Outstanding (BH)" value={fmtINR(totalBhOutstanding)} icon={AlertTriangle}
          accent={totalBhOutstanding > 0 ? "text-primary" : ""} />
        <KPI label="Ad Target" value={fmtINR(totalTarget)} icon={Target} />
        <KPI label="Ad Achievement" value={fmtINR(totalAchievement)}
          sub={totalTarget ? `${achievementPct}% of target` : null} />
        <KPI label="Ad Gap" value={fmtINR(adGap)}
          accent={adGap > 0 ? "text-primary" : "text-emerald-700"} />
        <KPI label="Weak Agents" value={weakAgents.length} sub="Circulation" icon={AlertTriangle} />
      </div>

      {/* Branch Head entries table */}
      {bhEntries.length > 0 && (
        <Section title="Branch Head Summary">
          <div className="border border-border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-foreground">
                <tr>
                  {["Name","Designation","Mobile","Daily Copies","Last Year","Growth %","Revenue","Outstanding","Staff Vacancy"].map(h => (
                    <th key={h} className="text-left p-3 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bhEntries.map((e, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40">
                    <td className="p-3 font-semibold">{e.name || "—"}</td>
                    <td className="p-3">{e.designation || "—"}</td>
                    <td className="p-3 font-mono text-xs">{e.mobile || "—"}</td>
                    <td className="p-3 text-right font-mono">{e.daily_copies || "—"}</td>
                    <td className="p-3 text-right font-mono">{e.last_year_copies || "—"}</td>
                    <td className={`p-3 text-right font-mono ${Number(e.growth_pct) < 0 ? "text-primary" : "text-emerald-700"}`}>
                      {e.growth_pct ? `${e.growth_pct}%` : "—"}
                    </td>
                    <td className="p-3 text-right font-mono">{e.monthly_revenue ? fmtINR(e.monthly_revenue) : "—"}</td>
                    <td className="p-3 text-right font-mono text-primary">{e.outstanding ? fmtINR(e.outstanding) : "—"}</td>
                    <td className="p-3 text-right">{e.staff_vacancy || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Charts */}
      <Section title="Circulation & Ad Revenue">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-l border-border bg-white">
          <div className="p-6 border-r border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Last Year vs Current Daily Copies</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={circulationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="copies">
                  {circulationData.map((_, i) => <Cell key={i} fill={i === 0 ? "#171717" : "#B91C1C"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-6 border-r border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Ad Revenue · Target vs Achievement</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={adRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtINR} />
                <Tooltip formatter={(v) => fmtINR(v)} />
                <Bar dataKey="val">
                  {adRevenueData.map((_, i) => <Cell key={i} fill={i === 0 ? "#171717" : "#B91C1C"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Weak agents + Lost clients */}
      {(weakAgents.length > 0 || lostClients.length > 0) && (
        <Section title="Critical Lists · Weak Agents & Lost Clients">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-l border-border bg-white">
            <div className="p-6 border-r border-b border-border">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-4">Weak Agents</div>
              {weakAgents.length ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-foreground">
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Agent</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-wider">Copies Lost</th>
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Reason</th>
                  </tr></thead>
                  <tbody>
                    {weakAgents.map((a, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted">
                        <td className="py-2 font-medium">{a.agent_name}</td>
                        <td className="py-2 text-right font-mono text-primary">{a.copies_lost || "—"}</td>
                        <td className="py-2 text-muted-foreground">{a.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="text-xs text-muted-foreground py-4">No weak agent records.</div>}
            </div>
            <div className="p-6 border-r border-b border-border">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-4">Lost Clients</div>
              {lostClients.length ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-foreground">
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Client</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-wider">Loss</th>
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Reason</th>
                  </tr></thead>
                  <tbody>
                    {lostClients.map((c, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted">
                        <td className="py-2 font-medium">{c.client}</td>
                        <td className="py-2 text-right font-mono text-primary">{fmtINR(c.revenue_loss)}</td>
                        <td className="py-2 text-muted-foreground">{c.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="text-xs text-muted-foreground py-4">No lost-client data.</div>}
            </div>
          </div>
        </Section>
      )}

      {/* Recovery ageing */}
      {allParties.length > 0 && (
        <Section title="Recovery Ageing · Outstanding by Bucket">
          <div className="grid grid-cols-1 lg:grid-cols-3 border-t border-l border-border bg-white">
            <div className="p-6 border-r border-b border-border lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
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
            <div className="p-6 border-r border-b border-border">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Total Outstanding</div>
              <div className="kpi-num text-3xl text-primary">{fmtINR(totalOutstanding)}</div>
              <div className="text-xs text-muted-foreground mt-2 mb-4">{allParties.length} parties</div>
              <div className="space-y-2">
                {ageingData.map((b) => (
                  <div key={b.name} className="flex justify-between text-xs border-b border-border pb-1">
                    <span className="text-muted-foreground">{b.name} days</span>
                    <span className="font-mono">{fmtINR(b.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Summary highlights */}
      {(summary.top_issues?.some(Boolean) || summary.top_opportunities?.some(Boolean) || summary.worst_5_performers?.some(Boolean)) && (
        <Section title="Daily Summary Highlights">
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-border bg-white">
            {[
              { key: "top_issues", label: "Top Issues", accent: "text-primary" },
              { key: "worst_5_performers", label: "Worst Performers", accent: "text-amber-700" },
              { key: "top_opportunities", label: "Opportunities", accent: "text-emerald-700" },
            ].map(({ key, label, accent }) => (
              <div key={key} className="p-6 border-r border-b border-border">
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${accent} mb-4`}>{label}</div>
                <ol className="space-y-2">
                  {(summary[key] || []).filter(Boolean).map((it, i) => (
                    <li key={i} className="flex gap-3 text-sm border-b border-border pb-2">
                      <span className="font-mono text-muted-foreground">{i + 1}.</span><span>{it}</span>
                    </li>
                  ))}
                  {!(summary[key] || []).some(Boolean) && <li className="text-xs text-muted-foreground">—</li>}
                </ol>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
