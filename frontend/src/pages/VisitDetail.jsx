import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ExternalLink, Loader2, Download, Filter, X } from "lucide-react";

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

// ── Excel Download ─────────────────────────────────────────────────────────
async function downloadExcel(rows) {
  const ExcelJS = (await import("exceljs/dist/exceljs.min.js")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Patrika Director Office";

  // Colors
  const BLUE_BORDER = { style: "medium", color: { argb: "FF1D6FA8" } };
  const bdr = { top: BLUE_BORDER, left: BLUE_BORDER, bottom: BLUE_BORDER, right: BLUE_BORDER };
  const thinBdr = { top: { style: "thin", color: { argb: "FF1D6FA8" } }, left: { style: "thin", color: { argb: "FF1D6FA8" } }, bottom: { style: "thin", color: { argb: "FF1D6FA8" } }, right: { style: "thin", color: { argb: "FF1D6FA8" } } };

  const SEG = {
    BH:       "FFB91C1C",
    CIRC:     "FF166534",
    AGENT:    "FF92400E",
    HAWKER:   "FF1E3A5F",
    CORR:     "FF4A1D96",
    ADV:      "FF7C2D12",
    AGENCY:   "FF134E4A",
    RECOVERY: "FF312E81",
    SUMMARY:  "FF1F3864",
  };

  // Helper: add a sheet with header row + data rows
  const addSheet = (name, colDefs, dataFn) => {
    const ws = wb.addWorksheet(name, {
      views: [{ showGridLines: false, state: "frozen", ySplit: 1 }],
    });
    ws.columns = colDefs.map(c => ({ width: c.w }));

    // Header row
    const hRow = ws.addRow(colDefs.map(c => c.h));
    hRow.height = 26;
    hRow.eachCell((cell, i) => {
      cell.font = { bold: true, name: "Arial", size: 9, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colDefs[i-1].color || SEG.SUMMARY } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
      cell.border = bdr;
    });

    // Data rows
    dataFn(ws, thinBdr);
    return ws;
  };

  const addDataRow = (ws, vals, numCols, thinBdr) => {
    const row = ws.addRow(vals);
    row.height = 18;
    row.eachCell((cell, i) => {
      const isNum = numCols && numCols.includes(i - 1);
      cell.font = { name: "Arial", size: 9 };
      cell.alignment = { horizontal: isNum ? "center" : "left", vertical: "middle" };
      cell.border = thinBdr;
    });
    return row;
  };

  // ── Summary Sheet ──────────────────────────────────────────────────────
  const wsSummary = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  wsSummary.columns = [{ width: 36 }, { width: 22 }];

  const addSum = (label, value, bgArgb) => {
    const row = wsSummary.addRow([label, value]);
    row.height = 20;
    row.eachCell((cell, i) => {
      cell.font = { bold: !!bgArgb, name: "Arial", size: 10, color: { argb: bgArgb ? "FFFFFFFF" : "FF111827" } };
      cell.border = thinBdr;
      cell.alignment = { horizontal: i === 2 ? "center" : "left", vertical: "middle" };
      if (bgArgb) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    });
  };

  const tRow = wsSummary.addRow(["PATRIKA DIRECTOR OFFICE — VISIT MATRIX", ""]);
  wsSummary.mergeCells("A1:B1");
  const tc = tRow.getCell(1); tc.value = "PATRIKA DIRECTOR OFFICE — VISIT MATRIX";
  tc.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" }, name: "Arial" };
  tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SEG.SUMMARY } };
  tc.alignment = { horizontal: "center", vertical: "middle" };
  tc.border = bdr;
  tRow.height = 32;

  wsSummary.addRow([]);
  addSum("Generated On", new Date().toLocaleDateString("en-IN"));
  addSum("Total Visits", rows.length);
  addSum("Total Branches", new Set(rows.map(r => r.branch)).size);
  wsSummary.addRow([]);
  addSum("METRIC", "TOTAL", SEG.BH);
  addSum("Total Daily Copies", rows.reduce((s,r)=>s+(r.dailyCopies||0),0));
  addSum("Total LY Copies", rows.reduce((s,r)=>s+(r.lyCopies||0),0));
  addSum("Total Revenue (₹)", rows.reduce((s,r)=>s+(r.revenue||0),0));
  addSum("Total BH Outstanding (₹)", rows.reduce((s,r)=>s+(r.bhOutstanding||0),0));
  addSum("Total Ad Target (₹)", rows.reduce((s,r)=>s+(r.adTarget||0),0));
  addSum("Total Ad Achievement (₹)", rows.reduce((s,r)=>s+(r.adAchiev||0),0));
  addSum("Total Agent Outstanding (₹)", rows.reduce((s,r)=>s+(r.agentOutstanding||0),0));
  addSum("Total Recovery Outstanding (₹)", rows.reduce((s,r)=>s+(r.totalRecovery||0),0));
  addSum("Total Weak Agents", rows.reduce((s,r)=>s+(r.weakAgentsCount||0),0));
  addSum("Total Lost Clients", rows.reduce((s,r)=>s+(r.lostClientsCount||0),0));

  // ── Branch Head Sheet ──────────────────────────────────────────────────
  const bhCols = [
    {h:"Branch Name",w:18,color:SEG.BH},{h:"Date",w:13,color:SEG.BH},{h:"Visited By",w:16,color:SEG.BH},
    {h:"BH Name",w:22,color:SEG.BH},{h:"Mobile",w:14,color:SEG.BH},{h:"Current Copies",w:14,color:SEG.BH},
    {h:"LY Copies",w:13,color:SEG.BH},{h:"Growth %",w:12,color:SEG.BH},{h:"Revenue (₹)",w:16,color:SEG.BH},
    {h:"Outstanding (₹)",w:16,color:SEG.BH},{h:"Staff Vacancy",w:12,color:SEG.BH},
    {h:"Q1. 3 Biggest Problems",w:32,color:SEG.BH},{h:"Q2. Circulation Reason",w:30,color:SEG.BH},
    {h:"Q3. Recovery Barrier",w:28,color:SEG.BH},{h:"Q4. Ad Revenue Suggestion",w:28,color:SEG.BH},
    {h:"Q5. HO Support",w:26,color:SEG.BH},{h:"Team Observation",w:28,color:SEG.BH},
  ];
  addSheet("Branch Head", bhCols, (ws, tb) => {
    rows.forEach(r => (r._bhArr.length ? r._bhArr : [{}]).forEach(e =>
      addDataRow(ws, [r.branch,r.date,r.visitedBy,e.name||"",e.mobile||"",e.daily_copies||"",e.last_year_copies||"",e.growth_pct?`${e.growth_pct}%`:"",e.monthly_revenue||"",e.outstanding||"",e.staff_vacancy||"",e.q1_problems||"",e.q2_circulation_reason||"",e.q3_recovery_barrier||"",e.q4_ad_revenue||"",e.q5_ho_help||"",e.team_observation||""], [5,6,7,8,9], tb)
    ));
  });

  // ── Circulation Sheet ──────────────────────────────────────────────────
  const circCols = [
    {h:"Branch Name",w:18,color:SEG.CIRC},{h:"Date",w:13,color:SEG.CIRC},{h:"Visited By",w:16,color:SEG.CIRC},
    {h:"Incharge Name",w:24,color:SEG.CIRC},{h:"Mobile",w:14,color:SEG.CIRC},{h:"Designation",w:18,color:SEG.CIRC},
    {h:"Decline Area",w:20,color:SEG.CIRC},{h:"Decline Reason",w:28,color:SEG.CIRC},
    {h:"Q3. Competitor Strong",w:28,color:SEG.CIRC},{h:"Q4. Growth Potential",w:26,color:SEG.CIRC},
    {h:"Q5. 90-Day Growth",w:24,color:SEG.CIRC},
  ];
  addSheet("Circulation", circCols, (ws, tb) => {
    rows.forEach(r => (r._circArr.length ? r._circArr : [{}]).forEach(e =>
      addDataRow(ws, [r.branch,r.date,r.visitedBy,e.name||"",e.mobile||"",e.designation||"",e.decline_area||"",e.decline_reason||"",e.q3_competitor_strong||"",e.q4_growth_potential||"",e.q5_90_day_growth||""], [], tb)
    ));
  });

  // ── Agent Sheet ────────────────────────────────────────────────────────
  const agentCols = [
    {h:"Branch Name",w:18,color:SEG.AGENT},{h:"Date",w:13,color:SEG.AGENT},{h:"Visited By",w:16,color:SEG.AGENT},
    {h:"Agent Name",w:22,color:SEG.AGENT},{h:"Mobile",w:14,color:SEG.AGENT},{h:"Agency",w:18,color:SEG.AGENT},
    {h:"Area",w:16,color:SEG.AGENT},{h:"Current Copies",w:14,color:SEG.AGENT},{h:"LY Copies",w:13,color:SEG.AGENT},
    {h:"Outstanding (₹)",w:16,color:SEG.AGENT},{h:"Payment Regularity",w:18,color:SEG.AGENT},
    {h:"Q1. Biggest Problem",w:28,color:SEG.AGENT},{h:"Q2. Competitor Offer",w:26,color:SEG.AGENT},
    {h:"Q3. 3-Month Growth",w:22,color:SEG.AGENT},{h:"Q4. Help Required",w:24,color:SEG.AGENT},
    {h:"Q5. Market Growth",w:24,color:SEG.AGENT},{h:"Commitment (Copies)",w:18,color:SEG.AGENT},{h:"Timeline",w:16,color:SEG.AGENT},
  ];
  addSheet("Agent", agentCols, (ws, tb) => {
    rows.forEach(r => (r._agentArr.length ? r._agentArr : [{}]).forEach(e =>
      addDataRow(ws, [r.branch,r.date,r.visitedBy,e.agent_name||"",e.mobile||"",e.agency||"",e.area||"",e.current_copies||"",e.last_year_copies||"",e.outstanding||"",e.payment_regularity||"",e.q1_problem||"",e.q2_competitor_offer||"",e.q3_3month_growth||"",e.q4_company_help||"",e.q5_market_growth||"",e.additional_copies||"",e.timeline||""], [7,8,9,16], tb)
    ));
  });

  // ── Hawker Sheet ───────────────────────────────────────────────────────
  const hawkerCols = [
    {h:"Branch Name",w:18,color:SEG.HAWKER},{h:"Date",w:13,color:SEG.HAWKER},{h:"Visited By",w:16,color:SEG.HAWKER},
    {h:"Hawker Name",w:22,color:SEG.HAWKER},{h:"Mobile",w:14,color:SEG.HAWKER},{h:"Area",w:16,color:SEG.HAWKER},
    {h:"Q1. Top Selling Newspaper",w:26,color:SEG.HAWKER},{h:"Q2. Reader Complaints",w:28,color:SEG.HAWKER},
    {h:"Q3. Competitor Scheme",w:26,color:SEG.HAWKER},{h:"Q4. Demand Growth Area",w:26,color:SEG.HAWKER},
    {h:"Q5. Delivery Problems",w:26,color:SEG.HAWKER},{h:"Team Remarks",w:28,color:SEG.HAWKER},
  ];
  addSheet("Hawker", hawkerCols, (ws, tb) => {
    rows.forEach(r => (r._hawkerArr.length ? r._hawkerArr : [{}]).forEach(e =>
      addDataRow(ws, [r.branch,r.date,r.visitedBy,e.hawker_name||"",e.mobile||"",e.area||"",e.q1_top_newspaper||"",e.q2_reader_complaint||"",e.q3_competitor_scheme||"",e.q4_demand_area||"",e.q5_delivery_problem||"",e.team_remarks||""], [], tb)
    ));
  });

  // ── Correspondent Sheet ────────────────────────────────────────────────
  const corrCols = [
    {h:"Branch Name",w:18,color:SEG.CORR},{h:"Date",w:13,color:SEG.CORR},{h:"Visited By",w:16,color:SEG.CORR},
    {h:"Name",w:24,color:SEG.CORR},{h:"Mobile",w:14,color:SEG.CORR},{h:"Area",w:16,color:SEG.CORR},
    {h:"Q1. Reader Sentiment",w:28,color:SEG.CORR},{h:"Q2. Weak Areas",w:26,color:SEG.CORR},
    {h:"Q3. Competitor Strong",w:26,color:SEG.CORR},{h:"Q4. Content Feedback",w:28,color:SEG.CORR},
    {h:"Q5. Growth Scope",w:26,color:SEG.CORR},{h:"Observation",w:28,color:SEG.CORR},
  ];
  addSheet("Correspondent", corrCols, (ws, tb) => {
    rows.forEach(r => (r._corrArr.length ? r._corrArr : [{}]).forEach(e =>
      addDataRow(ws, [r.branch,r.date,r.visitedBy,e.name||"",e.mobile||"",e.area||"",e.q1_reader_sentiment||"",e.q2_weak_areas||"",e.q3_competitor_strong||"",e.q4_content_feedback||"",e.q5_growth_scope||"",e.observation||""], [], tb)
    ));
  });

  // ── Advertisement Sheet ────────────────────────────────────────────────
  const advCols = [
    {h:"Branch Name",w:18,color:SEG.ADV},{h:"Date",w:13,color:SEG.ADV},{h:"Visited By",w:16,color:SEG.ADV},
    {h:"Member Name",w:22,color:SEG.ADV},{h:"Designation",w:18,color:SEG.ADV},
    {h:"Ad Target (₹)",w:16,color:SEG.ADV},{h:"Achievement (₹)",w:16,color:SEG.ADV},{h:"Achievement %",w:14,color:SEG.ADV},
    {h:"Q3. Why Clients Lost",w:28,color:SEG.ADV},{h:"Q4. Top Opportunity",w:26,color:SEG.ADV},{h:"Q5. 6-Month Potential",w:26,color:SEG.ADV},
  ];
  addSheet("Advertisement", advCols, (ws, tb) => {
    rows.forEach(r => (r._advArr.length ? r._advArr : [{}]).forEach(e => {
      const pct = e.target && e.achievement ? `${((Number(e.achievement)/Number(e.target))*100).toFixed(1)}%` : "";
      addDataRow(ws, [r.branch,r.date,r.visitedBy,e.name||"",e.designation||"",e.target||"",e.achievement||"",pct,e.q3_why_lost||"",e.q4_top_opportunity||"",e.q5_6month_potential||""], [5,6,7], tb);
    }));
  });

  // ── Ad Agency Sheet ────────────────────────────────────────────────────
  const agencyCols = [
    {h:"Branch Name",w:18,color:SEG.AGENCY},{h:"Date",w:13,color:SEG.AGENCY},{h:"Visited By",w:16,color:SEG.AGENCY},
    {h:"Agency Name",w:24,color:SEG.AGENCY},{h:"Contact Person",w:20,color:SEG.AGENCY},
    {h:"Q1. Market Reputation",w:28,color:SEG.AGENCY},{h:"Q2. Advertiser Complaints",w:28,color:SEG.AGENCY},
    {h:"Q3. Competitor Strength",w:26,color:SEG.AGENCY},{h:"Q4. Sector Potential",w:26,color:SEG.AGENCY},{h:"Q5. Improvements",w:26,color:SEG.AGENCY},
  ];
  addSheet("Ad Agency", agencyCols, (ws, tb) => {
    rows.forEach(r => (r._agencyArr.length ? r._agencyArr : [{}]).forEach(e =>
      addDataRow(ws, [r.branch,r.date,r.visitedBy,e.agency_name||"",e.contact_person||"",e.q1_market_reputation||"",e.q2_advertiser_complaint||"",e.q3_competitor_strength||"",e.q4_sector_potential||"",e.q5_improvement||""], [], tb)
    ));
  });

  // ── Recovery Sheet ─────────────────────────────────────────────────────
  const recCols = [
    {h:"Branch Name",w:18,color:SEG.RECOVERY},{h:"Date",w:13,color:SEG.RECOVERY},{h:"Visited By",w:16,color:SEG.RECOVERY},
    {h:"Party Name",w:24,color:SEG.RECOVERY},{h:"Outstanding (₹)",w:18,color:SEG.RECOVERY},
    {h:"Ageing (Days)",w:14,color:SEG.RECOVERY},{h:"Reason",w:26,color:SEG.RECOVERY},
    {h:"Recovery Plan",w:26,color:SEG.RECOVERY},{h:"Expected Date",w:16,color:SEG.RECOVERY},
  ];
  addSheet("Recovery", recCols, (ws, tb) => {
    rows.forEach(r => (r._allParties.length ? r._allParties : [{}]).forEach(p =>
      addDataRow(ws, [r.branch,r.date,r.visitedBy,p.party||"",p.outstanding||"",p.ageing||"",p.reason||"",p.recovery_plan||"",p.expected_date||""], [4,5], tb)
    ));
  });

  // Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Patrika-Visit-Matrix-${new Date().toISOString().slice(0,10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Visit Card UI ──────────────────────────────────────────────────────────
function VisitCard({ row, isAdmin }) {
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] opacity-60 uppercase tracking-wider">Date</div>
            <div className="text-sm font-mono font-semibold">{row.date}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-60 uppercase tracking-wider">Visited By</div>
            <div className="text-sm font-semibold">{row.visitedBy}</div>
          </div>
          {isAdmin && (
            <Link to={`/visits/${row.id}`} className="text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-70 border border-secondary-foreground/30 px-3 py-1.5 bg-primary text-primary-foreground">
              Edit <ExternalLink className="w-3 h-3" />
            </Link>
          )}
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
        <Field label="Weak Agents" value={String(row.weakAgentsCount || 0)} accent={row.weakAgentsCount > 0 ? "text-red-600 font-bold" : ""} />
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

// ── Main ───────────────────────────────────────────────────────────────────
export default function VisitMatrix() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get isAdmin from auth
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setIsAdmin(u.role === "admin");
    } catch {}
  }, []);

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

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadExcel(filtered); }
    catch (e) { console.error(e); alert("Download failed: " + e.message); }
    finally { setDownloading(false); }
  };

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
            <Button onClick={handleDownload} disabled={downloading} className="rounded-none h-10 bg-emerald-700 hover:bg-emerald-800">
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {downloading ? "Preparing..." : "Download Excel"}
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
          <div className="space-y-6">
            {filtered.map(row => <VisitCard key={row.id} row={row} isAdmin={isAdmin} />)}
          </div>
        )}
      </main>
    </div>
  );
}
