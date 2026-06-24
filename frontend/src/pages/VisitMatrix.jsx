import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ExternalLink, Loader2, Download, Filter, X } from "lucide-react";
import * as XLSX from "xlsx";

const fmtINR = (n) => {
  const v = Number(n) || 0;
  if (!v) return "";
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v.toLocaleString("en-IN");
};

const arrOf = (val) => Array.isArray(val) ? val : (val ? [val] : []);
const names = (val, key) => arrOf(val).map(e => e[key] || e.name || "").filter(Boolean).join(", ") || "";

function buildRow(v) {
  const seg = v.segments || {};
  const bhArr = arrOf(seg.branch_head);
  const circArr = arrOf(seg.circulation);
  const agentArr = arrOf(seg.agent);
  const hawkerArr = arrOf(seg.hawker);
  const corrArr = arrOf(seg.correspondent);
  const advArr = arrOf(seg.advertisement);
  const agencyArr = arrOf(seg.ad_agency);
  const recoveryArr = arrOf(seg.recovery);
  const totalDaily = bhArr.reduce((s, e) => s + (Number(e.daily_copies) || 0), 0);
  const totalLY = bhArr.reduce((s, e) => s + (Number(e.last_year_copies) || 0), 0);
  const totalRev = bhArr.reduce((s, e) => s + (Number(e.monthly_revenue) || 0), 0);
  const totalBhOut = bhArr.reduce((s, e) => s + (Number(e.outstanding) || 0), 0);
  const growthVals = bhArr.map(e => Number(e.growth_pct)).filter(Boolean);
  const avgGrowth = growthVals.length ? (growthVals.reduce((a, b) => a + b, 0) / growthVals.length) : null;
  const weakAgents = circArr.flatMap(e => (e.weak_agents || []).filter(r => r.agent_name));
  const totalAgentOut = agentArr.reduce((s, e) => s + (Number(e.outstanding) || 0), 0);
  const totalTarget = advArr.reduce((s, e) => s + (Number(e.target) || 0), 0);
  const totalAchiev = advArr.reduce((s, e) => s + (Number(e.achievement) || 0), 0);
  const lostClients = advArr.flatMap(e => (e.lost_clients || []).filter(r => r.client));
  const allParties = recoveryArr.flatMap(e => (e.parties || []));
  const totalRecovery = allParties.reduce((s, p) => s + (Number(p.outstanding) || 0), 0);
  return {
    id: v.id, branch: v.branch_name, date: v.visit_date, visitedBy: v.created_by_name || "",
    bhNames: names(seg.branch_head, "name"),
    bhDesig: bhArr.map(e => e.designation || "").filter(Boolean).join(", "),
    bhMobile: bhArr.map(e => e.mobile || "").filter(Boolean).join(", "),
    dailyCopies: totalDaily || null, lyCopies: totalLY || null, growth: avgGrowth,
    revenue: totalRev || null, bhOutstanding: totalBhOut || null,
    staffVacancy: bhArr.map(e => e.staff_vacancy || "").filter(Boolean).join(", "),
    circNames: names(seg.circulation, "name"),
    weakAgentsCount: weakAgents.length || null,
    weakAgentsList: weakAgents.map(a => a.agent_name).join(", "),
    agentNames: names(seg.agent, "agent_name"), agentCount: agentArr.length || null,
    agentOutstanding: totalAgentOut || null,
    hawkerNames: names(seg.hawker, "hawker_name"), hawkerCount: hawkerArr.length || null,
    corrNames: names(seg.correspondent, "name"), corrCount: corrArr.length || null,
    advNames: names(seg.advertisement, "name"),
    adTarget: totalTarget || null, adAchiev: totalAchiev || null,
    adPct: totalTarget ? Number(((totalAchiev / totalTarget) * 100).toFixed(1)) : null,
    lostClientsCount: lostClients.length || null,
    lostClientsList: lostClients.map(c => c.client).join(", "),
    agencyNames: names(seg.ad_agency, "agency_name"), agencyCount: agencyArr.length || null,
    recoveryParties: allParties.length || null, totalRecovery: totalRecovery || null,
    _bhArr: bhArr, _circArr: circArr, _agentArr: agentArr, _hawkerArr: hawkerArr,
    _corrArr: corrArr, _advArr: advArr, _agencyArr: agencyArr,
    _weakAgents: weakAgents, _lostClients: lostClients, _allParties: allParties,
  };
}

// ── Excel Download using SheetJS ──────────────────────────────────────────────
function makeSheet(headers, dataRows, colWidths) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws["!cols"] = colWidths.map(w => ({ wch: w }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };
  return ws;
}

function downloadExcel(rows) {
  const wb = XLSX.utils.book_new();

  // ── 1. Summary ──
  const summaryData = [
    ["PATRIKA DIRECTOR OFFICE — VISIT MATRIX REPORT"],
    ["Generated On", new Date().toLocaleDateString("en-IN")],
    ["Total Visits", rows.length],
    ["Total Branches", new Set(rows.map(r => r.branch)).size],
    [],
    ["METRIC", "TOTAL"],
    ["Total Daily Copies", rows.reduce((s, r) => s + (r.dailyCopies || 0), 0)],
    ["Total LY Copies", rows.reduce((s, r) => s + (r.lyCopies || 0), 0)],
    ["Total Revenue (₹)", rows.reduce((s, r) => s + (r.revenue || 0), 0)],
    ["Total BH Outstanding (₹)", rows.reduce((s, r) => s + (r.bhOutstanding || 0), 0)],
    ["Total Ad Target (₹)", rows.reduce((s, r) => s + (r.adTarget || 0), 0)],
    ["Total Ad Achievement (₹)", rows.reduce((s, r) => s + (r.adAchiev || 0), 0)],
    ["Total Agent Outstanding (₹)", rows.reduce((s, r) => s + (r.agentOutstanding || 0), 0)],
    ["Total Recovery Outstanding (₹)", rows.reduce((s, r) => s + (r.totalRecovery || 0), 0)],
    ["Total Weak Agents", rows.reduce((s, r) => s + (r.weakAgentsCount || 0), 0)],
    ["Total Lost Clients", rows.reduce((s, r) => s + (r.lostClientsCount || 0), 0)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 36 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── 2. Branch Head ──
  const bhHeaders = ["Branch Name","Date","Visited By","BH Name","Mobile","Current Copies","LY Copies","Growth %","Revenue (₹)","Outstanding (₹)","Staff Vacancy","Q1. 3 Biggest Problems","Q2. Circulation Growth/Decline Reason","Q3. Recovery Barrier","Q4. Ad Revenue Suggestion","Q5. HO Support Required","Team Observation"];
  const bhData = [];
  rows.forEach(r => {
    (r._bhArr.length ? r._bhArr : [{}]).forEach(e => {
      bhData.push([r.branch, r.date, r.visitedBy, e.name||"", e.mobile||"", e.daily_copies||"", e.last_year_copies||"", e.growth_pct ? `${e.growth_pct}%` : "", e.monthly_revenue||"", e.outstanding||"", e.staff_vacancy||"", e.q1_problems||"", e.q2_circulation_reason||"", e.q3_recovery_barrier||"", e.q4_ad_revenue||"", e.q5_ho_help||"", e.team_observation||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(bhHeaders, bhData, [18,13,16,22,14,13,13,12,16,16,12,32,32,28,28,26,28]), "Branch Head");

  // ── 3. Circulation ──
  const circHeaders = ["Branch Name","Date","Visited By","Incharge Name","Mobile","Designation","Decline Area","Decline Reason","Q3. Competitor Strong Area","Q4. Growth Potential","Q5. 90-Day Growth"];
  const circData = [];
  rows.forEach(r => {
    (r._circArr.length ? r._circArr : [{}]).forEach(e => {
      circData.push([r.branch, r.date, r.visitedBy, e.name||"", e.mobile||"", e.designation||"", e.decline_area||"", e.decline_reason||"", e.q3_competitor_strong||"", e.q4_growth_potential||"", e.q5_90_day_growth||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(circHeaders, circData, [18,13,16,24,14,18,20,28,28,26,26]), "Circulation");

  // ── 4. Agent ──
  const agentHeaders = ["Branch Name","Date","Visited By","Agent Name","Mobile","Agency","Area","Current Copies","LY Copies","Outstanding (₹)","Payment Regularity","Q1. Biggest Problem","Q2. Competitor Offer","Q3. 3-Month Growth","Q4. Help Required","Q5. Market Growth","Commitment (Copies)","Timeline"];
  const agentData = [];
  rows.forEach(r => {
    (r._agentArr.length ? r._agentArr : [{}]).forEach(e => {
      agentData.push([r.branch, r.date, r.visitedBy, e.agent_name||"", e.mobile||"", e.agency||"", e.area||"", e.current_copies||"", e.last_year_copies||"", e.outstanding||"", e.payment_regularity||"", e.q1_problem||"", e.q2_competitor_offer||"", e.q3_3month_growth||"", e.q4_company_help||"", e.q5_market_growth||"", e.additional_copies||"", e.timeline||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(agentHeaders, agentData, [18,13,16,22,14,18,16,13,13,16,18,28,26,22,24,24,16,14]), "Agent");

  // ── 5. Hawker ──
  const hawkerHeaders = ["Branch Name","Date","Visited By","Hawker Name","Mobile","Area","Q1. Top Selling Newspaper","Q2. Reader Complaints","Q3. Competitor Scheme","Q4. Demand Growth Area","Q5. Delivery Problems","Team Remarks"];
  const hawkerData = [];
  rows.forEach(r => {
    (r._hawkerArr.length ? r._hawkerArr : [{}]).forEach(e => {
      hawkerData.push([r.branch, r.date, r.visitedBy, e.hawker_name||"", e.mobile||"", e.area||"", e.q1_top_newspaper||"", e.q2_reader_complaint||"", e.q3_competitor_scheme||"", e.q4_demand_area||"", e.q5_delivery_problem||"", e.team_remarks||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(hawkerHeaders, hawkerData, [18,13,16,22,14,16,26,28,26,26,26,28]), "Hawker");

  // ── 6. Correspondent ──
  const corrHeaders = ["Branch Name","Date","Visited By","Correspondent Name","Mobile","Area","Q1. Reader Sentiment","Q2. Weak Areas","Q3. Competitor Strong","Q4. Content Feedback","Q5. Growth Scope","Observation"];
  const corrData = [];
  rows.forEach(r => {
    (r._corrArr.length ? r._corrArr : [{}]).forEach(e => {
      corrData.push([r.branch, r.date, r.visitedBy, e.name||"", e.mobile||"", e.area||"", e.q1_reader_sentiment||"", e.q2_weak_areas||"", e.q3_competitor_strong||"", e.q4_content_feedback||"", e.q5_growth_scope||"", e.observation||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(corrHeaders, corrData, [18,13,16,24,14,16,28,26,26,28,26,28]), "Correspondent");

  // ── 7. Advertisement ──
  const advHeaders = ["Branch Name","Date","Visited By","Member Name","Designation","Ad Target (₹)","Achievement (₹)","Achievement %","Q3. Why Clients Lost","Q4. Top Opportunity","Q5. 6-Month Potential"];
  const advData = [];
  rows.forEach(r => {
    (r._advArr.length ? r._advArr : [{}]).forEach(e => {
      const pct = e.target && e.achievement ? `${((Number(e.achievement)/Number(e.target))*100).toFixed(1)}%` : "";
      advData.push([r.branch, r.date, r.visitedBy, e.name||"", e.designation||"", e.target||"", e.achievement||"", pct, e.q3_why_lost||"", e.q4_top_opportunity||"", e.q5_6month_potential||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(advHeaders, advData, [18,13,16,22,18,16,16,14,28,26,26]), "Advertisement");

  // ── 8. Ad Agency ──
  const agencyHeaders = ["Branch Name","Date","Visited By","Agency Name","Contact Person","Q1. Market Reputation","Q2. Advertiser Complaints","Q3. Competitor Strength","Q4. Sector Potential","Q5. Improvements"];
  const agencyData = [];
  rows.forEach(r => {
    (r._advArr.length ? r._advArr : [{}]).forEach(e => {
      agencyData.push([r.branch, r.date, r.visitedBy, e.agency_name||"", e.contact_person||"", e.q1_market_reputation||"", e.q2_advertiser_complaint||"", e.q3_competitor_strength||"", e.q4_sector_potential||"", e.q5_improvement||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(agencyHeaders, agencyData, [18,13,16,24,20,28,28,26,26,26]), "Ad Agency");

  // ── 9. Recovery ──
  const recHeaders = ["Branch Name","Date","Visited By","Party Name","Outstanding (₹)","Ageing (Days)","Reason","Recovery Plan","Expected Date"];
  const recData = [];
  rows.forEach(r => {
    (r._allParties.length ? r._allParties : [{}]).forEach(p => {
      recData.push([r.branch, r.date, r.visitedBy, p.party||"", p.outstanding||"", p.ageing||"", p.reason||"", p.recovery_plan||"", p.expected_date||""]);
    });
  });
  XLSX.utils.book_append_sheet(wb, makeSheet(recHeaders, recData, [18,13,16,24,16,14,26,26,16]), "Recovery");

  // Download
  XLSX.writeFile(wb, `Patrika-Visit-Matrix-${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ── Visit Card UI ─────────────────────────────────────────────────────────────
function VisitCard({ row }) {
  const growthColor = row.growth === null ? "" : row.growth < 0 ? "text-red-600" : "text-emerald-700";
  const Section = ({ title, children }) => (
    <div className="border-t border-border">
      <div className="bg-secondary text-secondary-foreground px-4 py-1.5">
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold">{title}</span>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">{children}</div>
    </div>
  );
  const Field = ({ label, value, accent }) => (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-sm font-medium mt-0.5 ${accent || ""}`}>{value || "—"}</div>
    </div>
  );
  return (
    <div className="border border-border bg-white">
      <div className="bg-secondary text-secondary-foreground px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">Branch Visit</div>
          <h3 className="text-xl font-bold">{row.branch}</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] opacity-60 uppercase tracking-wider">Date</div>
            <div className="text-sm font-mono font-semibold">{row.date}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-60 uppercase tracking-wider">Visited By</div>
            <div className="text-sm font-semibold">{row.visitedBy}</div>
          </div>
          <Link to={`/visits/${row.id}`} className="text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-70 border border-secondary-foreground/30 px-3 py-1.5">
            Open <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <Section title="Branch Head">
        <Field label="Name(s)" value={row.bhNames} />
        <Field label="Designation" value={row.bhDesig} />
        <Field label="Mobile" value={row.bhMobile} />
        <Field label="Staff Vacancy" value={row.staffVacancy} />
        <Field label="Daily Copies" value={row.dailyCopies?.toLocaleString("en-IN")} />
        <Field label="Last Year Copies" value={row.lyCopies?.toLocaleString("en-IN")} />
        <Field label="Growth %" value={row.growth !== null ? `${row.growth}%` : null} accent={growthColor} />
        <Field label="Monthly Revenue" value={fmtINR(row.revenue)} />
        <Field label="Outstanding" value={fmtINR(row.bhOutstanding)} accent={row.bhOutstanding > 0 ? "text-red-600" : ""} />
      </Section>
      <Section title="Circulation">
        <Field label="Incharge(s)" value={row.circNames} />
        <Field label="Weak Agents" value={row.weakAgentsCount || "0"} accent={row.weakAgentsCount > 0 ? "text-red-600 font-bold" : ""} />
        <Field label="Weak Agent Names" value={row.weakAgentsList} />
      </Section>
      <Section title="Agent">
        <Field label="Agent(s)" value={row.agentNames} />
        <Field label="Total Agents" value={String(row.agentCount || 0)} />
        <Field label="Outstanding" value={fmtINR(row.agentOutstanding)} accent={row.agentOutstanding > 0 ? "text-red-600" : ""} />
      </Section>
      <Section title="Hawker">
        <Field label="Hawker(s)" value={row.hawkerNames} />
        <Field label="Total" value={String(row.hawkerCount || 0)} />
      </Section>
      <Section title="Correspondent">
        <Field label="Correspondent(s)" value={row.corrNames} />
        <Field label="Total" value={String(row.corrCount || 0)} />
      </Section>
      <Section title="Advertisement">
        <Field label="Member(s)" value={row.advNames} />
        <Field label="Ad Target" value={fmtINR(row.adTarget)} />
        <Field label="Achievement" value={fmtINR(row.adAchiev)} />
        <Field label="Achievement %" value={row.adPct ? `${row.adPct}%` : null} accent={row.adPct && Number(row.adPct) < 80 ? "text-red-600" : "text-emerald-700"} />
        <Field label="Lost Clients" value={String(row.lostClientsCount || 0)} accent={row.lostClientsCount > 0 ? "text-red-600" : ""} />
        <Field label="Lost Client Names" value={row.lostClientsList} />
      </Section>
      <Section title="Ad Agency">
        <Field label="Agency(s)" value={row.agencyNames} />
        <Field label="Total" value={String(row.agencyCount || 0)} />
      </Section>
      <Section title="Recovery">
        <Field label="Parties" value={String(row.recoveryParties || 0)} />
        <Field label="Total Outstanding" value={fmtINR(row.totalRecovery)} accent={row.totalRecovery > 0 ? "text-red-600 font-bold" : ""} />
      </Section>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VisitMatrix() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get("/visits").then(({ data }) => setVisits(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => visits.map(buildRow), [visits]);
  const filtered = useMemo(() => rows.filter(r => {
    if (filterBranch && !r.branch.toLowerCase().includes(filterBranch.toLowerCase())) return false;
    if (filterUser && !r.visitedBy.toLowerCase().includes(filterUser.toLowerCase())) return false;
    if (filterDateFrom && r.date < filterDateFrom) return false;
    if (filterDateTo && r.date > filterDateTo) return false;
    return true;
  }), [rows, filterBranch, filterUser, filterDateFrom, filterDateTo]);

  const hasFilters = filterBranch || filterUser || filterDateFrom || filterDateTo;
  const clearFilters = () => { setFilterBranch(""); setFilterUser(""); setFilterDateFrom(""); setFilterDateTo(""); };

  if (loading) return (
    <div className="min-h-screen bg-background"><AppHeader />
      <div className="p-12 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">All Visits</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Visit Matrix</h2>
            <p className="text-sm text-muted-foreground mt-2">{filtered.length} of {rows.length} visits</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="rounded-none h-10">
              <Filter className="w-4 h-4 mr-2" />
              Filters {hasFilters && <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">ON</span>}
            </Button>
            <Button onClick={() => downloadExcel(filtered)} className="rounded-none h-10 bg-emerald-700 hover:bg-emerald-800">
              <Download className="w-4 h-4 mr-2" /> Download Excel
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="border border-border bg-white p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Branch Name</div>
              <Input value={filterBranch} onChange={e => setFilterBranch(e.target.value)} placeholder="e.g. Bikaner" className="rounded-none h-9" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Visited By</div>
              <Input value={filterUser} onChange={e => setFilterUser(e.target.value)} placeholder="e.g. Admin" className="rounded-none h-9" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Date From</div>
              <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="rounded-none h-9" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Date To</div>
              <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="rounded-none h-9" />
            </div>
            {hasFilters && (
              <div className="col-span-2 md:col-span-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-none h-8 text-xs">
                  <X className="w-3 h-3 mr-1" /> Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="editorial-rule mb-8" />
        {filtered.length === 0 ? (
          <div className="border border-border p-16 text-center bg-white">
            <p className="text-sm text-muted-foreground">{hasFilters ? "No visits match filters." : "No visits yet."}</p>
          </div>
        ) : (
          <div className="space-y-6">{filtered.map(row => <VisitCard key={row.id} row={row} />)}</div>
        )}
      </main>
    </div>
  );
}
