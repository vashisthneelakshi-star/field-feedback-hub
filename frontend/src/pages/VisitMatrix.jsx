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
  if (!v) return "—";
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v.toLocaleString("en-IN");
};

const arrOf = (val) => Array.isArray(val) ? val : (val ? [val] : []);
const names = (val, key) => arrOf(val).map(e => e[key] || e.name || "").filter(Boolean).join(", ") || "—";

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
    id: v.id,
    branch: v.branch_name,
    date: v.visit_date,
    visitedBy: v.created_by_name || "—",
    bhNames: names(seg.branch_head, "name"),
    bhDesig: bhArr.map(e => e.designation || "").filter(Boolean).join(", ") || "—",
    bhMobile: bhArr.map(e => e.mobile || "").filter(Boolean).join(", ") || "—",
    dailyCopies: totalDaily || null,
    lyCopies: totalLY || null,
    growth: avgGrowth,
    revenue: totalRev || null,
    bhOutstanding: totalBhOut || null,
    staffVacancy: bhArr.map(e => e.staff_vacancy || "").filter(Boolean).join(", ") || "—",
    circNames: names(seg.circulation, "name"),
    weakAgentsCount: weakAgents.length || null,
    weakAgentsList: weakAgents.map(a => a.agent_name).join(", ") || "—",
    agentNames: names(seg.agent, "agent_name"),
    agentCount: agentArr.length || null,
    agentOutstanding: totalAgentOut || null,
    hawkerNames: names(seg.hawker, "hawker_name"),
    hawkerCount: hawkerArr.length || null,
    corrNames: names(seg.correspondent, "name"),
    corrCount: corrArr.length || null,
    advNames: names(seg.advertisement, "name"),
    adTarget: totalTarget || null,
    adAchiev: totalAchiev || null,
    adPct: totalTarget ? Number(((totalAchiev / totalTarget) * 100).toFixed(1)) : null,
    lostClientsCount: lostClients.length || null,
    lostClientsList: lostClients.map(c => c.client).join(", ") || "—",
    agencyNames: names(seg.ad_agency, "agency_name"),
    agencyCount: agencyArr.length || null,
    recoveryParties: allParties.length || null,
    totalRecovery: totalRecovery || null,
  };
}

// ── Excel Download ──────────────────────────────────────────────────────────
function downloadExcel(rows) {
  const wb = XLSX.utils.book_new();

  // ── Column definitions ──
  const COLS = [
    // Meta
    { header: "Branch", key: "branch", type: "text", width: 18 },
    { header: "Visit Date", key: "date", type: "text", width: 14 },
    { header: "Visited By", key: "visitedBy", type: "text", width: 16 },
    // Branch Head
    { header: "BH Name(s)", key: "bhNames", type: "text", width: 22 },
    { header: "BH Designation", key: "bhDesig", type: "text", width: 20 },
    { header: "BH Mobile", key: "bhMobile", type: "text", width: 16 },
    { header: "Daily Copies", key: "dailyCopies", type: "number", width: 14 },
    { header: "LY Copies", key: "lyCopies", type: "number", width: 12 },
    { header: "Growth %", key: "growth", type: "percent", width: 12 },
    { header: "Monthly Revenue (₹)", key: "revenue", type: "currency", width: 20 },
    { header: "BH Outstanding (₹)", key: "bhOutstanding", type: "currency", width: 20 },
    { header: "Staff Vacancy", key: "staffVacancy", type: "text", width: 14 },
    // Circulation
    { header: "Circulation Incharge(s)", key: "circNames", type: "text", width: 24 },
    { header: "Weak Agents Count", key: "weakAgentsCount", type: "number", width: 18 },
    { header: "Weak Agent Names", key: "weakAgentsList", type: "text", width: 28 },
    // Agent
    { header: "Agent Name(s)", key: "agentNames", type: "text", width: 24 },
    { header: "Agent Count", key: "agentCount", type: "number", width: 13 },
    { header: "Agent Outstanding (₹)", key: "agentOutstanding", type: "currency", width: 22 },
    // Hawker
    { header: "Hawker Name(s)", key: "hawkerNames", type: "text", width: 24 },
    { header: "Hawker Count", key: "hawkerCount", type: "number", width: 14 },
    // Correspondent
    { header: "Correspondent(s)", key: "corrNames", type: "text", width: 24 },
    { header: "Correspondent Count", key: "corrCount", type: "number", width: 20 },
    // Advertisement
    { header: "Advt. Member(s)", key: "advNames", type: "text", width: 22 },
    { header: "Ad Target (₹)", key: "adTarget", type: "currency", width: 16 },
    { header: "Ad Achievement (₹)", key: "adAchiev", type: "currency", width: 20 },
    { header: "Achievement %", key: "adPct", type: "percent", width: 14 },
    { header: "Lost Clients Count", key: "lostClientsCount", type: "number", width: 18 },
    { header: "Lost Client Names", key: "lostClientsList", type: "text", width: 28 },
    // Ad Agency
    { header: "Ad Agency(s)", key: "agencyNames", type: "text", width: 22 },
    { header: "Agency Count", key: "agencyCount", type: "number", width: 13 },
    // Recovery
    { header: "Recovery Parties", key: "recoveryParties", type: "number", width: 17 },
    { header: "Total Recovery Outstanding (₹)", key: "totalRecovery", type: "currency", width: 30 },
  ];

  // Section color map for column headers
  const SECTION_COLORS = {
    "Branch": "1F3864", "Visit Date": "1F3864", "Visited By": "1F3864",
    "BH Name(s)": "B91C1C", "BH Designation": "B91C1C", "BH Mobile": "B91C1C",
    "Daily Copies": "B91C1C", "LY Copies": "B91C1C", "Growth %": "B91C1C",
    "Monthly Revenue (₹)": "B91C1C", "BH Outstanding (₹)": "B91C1C", "Staff Vacancy": "B91C1C",
    "Circulation Incharge(s)": "166534", "Weak Agents Count": "166534", "Weak Agent Names": "166534",
    "Agent Name(s)": "854D0E", "Agent Count": "854D0E", "Agent Outstanding (₹)": "854D0E",
    "Hawker Name(s)": "1E3A5F", "Hawker Count": "1E3A5F",
    "Correspondent(s)": "4A1D96", "Correspondent Count": "4A1D96",
    "Advt. Member(s)": "7C2D12", "Ad Target (₹)": "7C2D12", "Ad Achievement (₹)": "7C2D12",
    "Achievement %": "7C2D12", "Lost Clients Count": "7C2D12", "Lost Client Names": "7C2D12",
    "Ad Agency(s)": "134E4A", "Agency Count": "134E4A",
    "Recovery Parties": "312E81", "Total Recovery Outstanding (₹)": "312E81",
  };

  // Build data rows
  const dataRows = rows.map(row =>
    COLS.map(col => {
      const val = row[col.key];
      if (val === null || val === undefined) return "";
      return val;
    })
  );

  // Create worksheet with header + data
  const wsData = [COLS.map(c => c.header), ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = COLS.map(c => ({ wch: c.width }));

  // Freeze first row (header) and first 3 columns
  ws["!freeze"] = { xSplit: 3, ySplit: 1, topLeftCell: "D2", activePane: "bottomRight" };

  // Apply styles using SheetJS with styles
  const totalRows = rows.length + 1;
  const totalCols = COLS.length;

  for (let C = 0; C < totalCols; C++) {
    const colDef = COLS[C];
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });

    // Header row styling
    if (!ws[cellAddr]) ws[cellAddr] = { v: colDef.header, t: "s" };
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial", sz: 10 },
      fill: { fgColor: { rgb: SECTION_COLORS[colDef.header] || "1F3864" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "FFFFFF" } },
        bottom: { style: "thin", color: { rgb: "FFFFFF" } },
        left: { style: "thin", color: { rgb: "FFFFFF" } },
        right: { style: "thin", color: { rgb: "FFFFFF" } },
      },
    };

    // Data rows styling
    for (let R = 1; R <= rows.length; R++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const val = dataRows[R - 1][C];
      const isEven = R % 2 === 0;

      if (!ws[addr]) ws[addr] = { v: val === "" ? null : val, t: val === "" ? "z" : (typeof val === "number" ? "n" : "s") };

      const isNum = colDef.type === "number" || colDef.type === "currency" || colDef.type === "percent";
      let numFmt = undefined;
      if (colDef.type === "currency" && val) numFmt = '₹#,##0;(₹#,##0);"-"';
      else if (colDef.type === "number" && val) numFmt = '#,##0;(#,##0);"-"';
      else if (colDef.type === "percent" && val) numFmt = '0.0%;(0.0%);"-"';

      ws[addr].s = {
        font: { name: "Arial", sz: 10 },
        fill: { fgColor: { rgb: isEven ? "F3F4F6" : "FFFFFF" } },
        alignment: {
          horizontal: isNum ? "center" : "left",
          vertical: "center",
          wrapText: false,
        },
        border: {
          top: { style: "hair", color: { rgb: "D1D5DB" } },
          bottom: { style: "hair", color: { rgb: "D1D5DB" } },
          left: { style: "hair", color: { rgb: "D1D5DB" } },
          right: { style: "hair", color: { rgb: "D1D5DB" } },
        },
        ...(numFmt ? { numFmt } : {}),
      };
    }
  }

  // Set row heights
  ws["!rows"] = [{ hpt: 36 }, ...Array(rows.length).fill({ hpt: 20 })];

  // Summary sheet
  const summaryData = [
    ["VISIT MATRIX SUMMARY", ""],
    ["Generated On", new Date().toLocaleDateString("en-IN")],
    ["Total Visits", rows.length],
    ["Total Branches", new Set(rows.map(r => r.branch)).size],
    [""],
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
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 20 }];

  // Style summary headers
  ["A1", "B1"].forEach(addr => {
    if (!wsSummary[addr]) return;
    wsSummary[addr].s = { font: { bold: true, sz: 13, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: "1F3864" } }, alignment: { horizontal: "center" } };
  });
  ["A6", "B6"].forEach(addr => {
    if (!wsSummary[addr]) return;
    wsSummary[addr].s = { font: { bold: true, sz: 10, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: "B91C1C" } }, alignment: { horizontal: "center" } };
  });

  wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, ws, "Visit Matrix");

  const filename = `Patrika-Visit-Matrix-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ── Visit Card ──────────────────────────────────────────────────────────────
function VisitCard({ row }) {
  const growthColor = row.growth === null ? "" : row.growth < 0 ? "text-red-600" : "text-emerald-700";

  const Section = ({ title, children }) => (
    <div className="border-t border-border">
      <div className="bg-secondary text-secondary-foreground px-4 py-1.5">
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold">{title}</span>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, accent }) => (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-sm font-medium mt-0.5 ${accent || ""}`}>{value ?? "—"}</div>
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
        <Field label="Daily Copies" value={row.dailyCopies ? row.dailyCopies.toLocaleString("en-IN") : "—"} />
        <Field label="Last Year Copies" value={row.lyCopies ? row.lyCopies.toLocaleString("en-IN") : "—"} />
        <Field label="Growth %" value={row.growth !== null ? `${row.growth}%` : "—"} accent={growthColor} />
        <Field label="Monthly Revenue" value={fmtINR(row.revenue)} />
        <Field label="Outstanding" value={fmtINR(row.bhOutstanding)} accent={row.bhOutstanding > 0 ? "text-red-600" : ""} />
      </Section>

      <Section title="Circulation">
        <Field label="Incharge(s)" value={row.circNames} />
        <Field label="Weak Agents" value={row.weakAgentsCount ?? "0"} accent={row.weakAgentsCount > 0 ? "text-red-600 font-bold" : ""} />
        <Field label="Weak Agent Names" value={row.weakAgentsList} />
      </Section>

      <Section title="Agent">
        <Field label="Agent(s)" value={row.agentNames} />
        <Field label="Total Agents" value={row.agentCount ?? "0"} />
        <Field label="Agent Outstanding" value={fmtINR(row.agentOutstanding)} accent={row.agentOutstanding > 0 ? "text-red-600" : ""} />
      </Section>

      <Section title="Hawker">
        <Field label="Hawker(s)" value={row.hawkerNames} />
        <Field label="Total Hawkers" value={row.hawkerCount ?? "0"} />
      </Section>

      <Section title="Correspondent">
        <Field label="Correspondent(s)" value={row.corrNames} />
        <Field label="Total" value={row.corrCount ?? "0"} />
      </Section>

      <Section title="Advertisement">
        <Field label="Member(s)" value={row.advNames} />
        <Field label="Ad Target" value={fmtINR(row.adTarget)} />
        <Field label="Achievement" value={fmtINR(row.adAchiev)} />
        <Field label="Achievement %" value={row.adPct ? `${row.adPct}%` : "—"} accent={row.adPct && Number(row.adPct) < 80 ? "text-red-600" : "text-emerald-700"} />
        <Field label="Lost Clients" value={row.lostClientsCount ?? "0"} accent={row.lostClientsCount > 0 ? "text-red-600" : ""} />
        <Field label="Lost Client Names" value={row.lostClientsList} />
      </Section>

      <Section title="Ad Agency">
        <Field label="Agency(s)" value={row.agencyNames} />
        <Field label="Total" value={row.agencyCount ?? "0"} />
      </Section>

      <Section title="Recovery">
        <Field label="Parties Tracked" value={row.recoveryParties ?? "0"} />
        <Field label="Total Outstanding" value={fmtINR(row.totalRecovery)} accent={row.totalRecovery > 0 ? "text-red-600 font-bold" : ""} />
      </Section>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
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

  const clearFilters = () => {
    setFilterBranch(""); setFilterUser(""); setFilterDateFrom(""); setFilterDateTo("");
  };

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
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">All Visits</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Visit Matrix</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {filtered.length} of {rows.length} visits · complete segment-wise view
            </p>
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
            <p className="text-sm text-muted-foreground">{hasFilters ? "No visits match your filters." : "No visits yet."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(row => <VisitCard key={row.id} row={row} />)}
          </div>
        )}
      </main>
    </div>
  );
}
