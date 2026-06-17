import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Users } from "lucide-react";

const fmtINR = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v.toLocaleString("en-IN");
};

const COLORS = ["#B91C1C", "#171717", "#737373", "#CA8A04", "#1D4ED8"];

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

function Section({ title, children, actions }) {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Dashboard Section</div>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        </div>
        {actions}
      </div>
      <div className="editorial-rule mb-5" />
      {children}
    </section>
  );
}

export default function Dashboard({ visit }) {
  const seg = visit.segments || {};
  const bh = seg.branch_head || {};
  const circ = seg.circulation || {};
  const agent = seg.agent || {};
  const adv = seg.advertisement || {};
  const recovery = (seg.recovery || {}).parties || [];
  const summary = seg.summary || {};

  const daily = Number(bh.daily_copies) || 0;
  const lastYear = Number(bh.last_year_copies) || 0;
  const growth = lastYear ? (((daily - lastYear) / lastYear) * 100).toFixed(1) : (bh.growth_pct || "—");
  const isDecline = lastYear && daily < lastYear;

  const revenue = Number(bh.monthly_revenue) || 0;
  const outstanding = Number(bh.outstanding) || 0;
  const target = Number(adv.target) || 0;
  const achievement = Number(adv.achievement) || 0;
  const adGap = target - achievement;
  const achievementPct = target ? ((achievement / target) * 100).toFixed(1) : 0;

  const weakAgents = (circ.weak_agents || []).filter(r => r.agent_name);
  const lostClients = (adv.lost_clients || []).filter(r => r.client);

  // Recovery ageing buckets
  const ageingBuckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  recovery.forEach(r => {
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
    { name: "Last Year", copies: lastYear },
    { name: "Current", copies: daily },
  ];

  const adRevenueData = [
    { name: "Target", val: target },
    { name: "Achievement", val: achievement },
  ];

  return (
    <div data-testid="dashboard-view">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-border bg-muted">
        <KPI label="Daily Copies" value={daily.toLocaleString("en-IN") || "—"} icon={Users} sub={lastYear ? `vs ${lastYear.toLocaleString("en-IN")} LY` : "Branch Head data se"} />
        <KPI label="Growth %" value={`${growth}${typeof growth === 'number' || !isNaN(parseFloat(growth)) ? '%' : ''}`} icon={isDecline ? TrendingDown : TrendingUp} accent={isDecline ? "text-primary" : "text-emerald-700"} />
        <KPI label="Monthly Revenue" value={fmtINR(revenue)} icon={DollarSign} />
        <KPI label="Outstanding" value={fmtINR(outstanding)} icon={AlertTriangle} accent={outstanding > 0 ? "text-primary" : ""} />
        <KPI label="Ad Target" value={fmtINR(target)} icon={Target} />
        <KPI label="Ad Achievement" value={fmtINR(achievement)} sub={target ? `${achievementPct}% of target` : null} />
        <KPI label="Ad Gap" value={fmtINR(adGap)} accent={adGap > 0 ? "text-primary" : "text-emerald-700"} />
        <KPI label="Weak Agents" value={weakAgents.length} sub="Circulation Sheet" icon={AlertTriangle} />
      </div>

      {/* Charts row 1 */}
      <Section title="Circulation Trend · सर्कुलेशन रुझान">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-l border-border bg-white">
          <div className="p-6 border-r border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Last Year vs Current Daily Copies</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={circulationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="copies" fill="#B91C1C">
                  {circulationData.map((d, i) => <Cell key={i} fill={i === 0 ? "#171717" : "#B91C1C"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-6 border-r border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Ad Revenue · Target vs Achievement</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={adRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtINR} />
                <Tooltip formatter={(v) => fmtINR(v)} />
                <Bar dataKey="val">
                  {adRevenueData.map((d, i) => <Cell key={i} fill={i === 0 ? "#171717" : "#B91C1C"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Weak agents + Lost clients */}
      <Section title="Critical Lists · Weak Agents & Lost Clients">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-l border-border bg-white">
          <div className="p-6 border-r border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-4">Top Weak Agents</div>
            {weakAgents.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-foreground">
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Agent</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-wider">Copies Lost</th>
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
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
            ) : <div className="text-xs text-muted-foreground py-6">Koi weak agent record nahi.</div>}
          </div>
          <div className="p-6 border-r border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-4">Top Lost Clients (Ad Revenue)</div>
            {lostClients.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-foreground">
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Client</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-wider">Loss</th>
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
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
            ) : <div className="text-xs text-muted-foreground py-6">No lost-client data.</div>}
          </div>
        </div>
      </Section>

      {/* Recovery ageing */}
      <Section title="Recovery Ageing · ₹ Outstanding by Bucket">
        <div className="grid grid-cols-1 lg:grid-cols-3 border-t border-l border-border bg-white">
          <div className="p-6 border-r border-b border-border lg:col-span-2">
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
          <div className="p-6 border-r border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Total Outstanding (Parties)</div>
            <div className="kpi-num text-3xl text-primary">{fmtINR(totalOutstanding)}</div>
            <div className="text-xs text-muted-foreground mt-2 mb-4">{recovery.length} parties tracked</div>
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

      {/* Top 5 issues / Worst / opportunities */}
      {(summary.top_issues?.some(Boolean) || summary.top_opportunities?.some(Boolean) || summary.worst_5_performers?.some(Boolean)) && (
        <Section title="Daily Summary Highlights">
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-border bg-white">
            <div className="p-6 border-r border-b border-border">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-4">Top 5 Issues</div>
              <ol className="space-y-2">
                {(summary.top_issues || []).filter(Boolean).map((it, i) => (
                  <li key={i} className="flex gap-3 text-sm border-b border-border pb-2">
                    <span className="font-mono text-muted-foreground">{i + 1}.</span> <span>{it}</span>
                  </li>
                ))}
                {!(summary.top_issues || []).some(Boolean) && <li className="text-xs text-muted-foreground">—</li>}
              </ol>
            </div>
            <div className="p-6 border-r border-b border-border">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-4">Worst 5 Performers / Areas</div>
              <ol className="space-y-2">
                {(summary.worst_5_performers || []).filter(Boolean).map((it, i) => (
                  <li key={i} className="flex gap-3 text-sm border-b border-border pb-2">
                    <span className="font-mono text-muted-foreground">{i + 1}.</span> <span>{it}</span>
                  </li>
                ))}
                {!(summary.worst_5_performers || []).some(Boolean) && <li className="text-xs text-muted-foreground">—</li>}
              </ol>
            </div>
            <div className="p-6 border-r border-b border-border">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mb-4">Top 5 Opportunities</div>
              <ol className="space-y-2">
                {(summary.top_opportunities || []).filter(Boolean).map((it, i) => (
                  <li key={i} className="flex gap-3 text-sm border-b border-border pb-2">
                    <span className="font-mono text-muted-foreground">{i + 1}.</span> <span>{it}</span>
                  </li>
                ))}
                {!(summary.top_opportunities || []).some(Boolean) && <li className="text-xs text-muted-foreground">—</li>}
              </ol>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
