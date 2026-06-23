import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ExternalLink, Loader2, Download, Filter, X } from "lucide-react";
import ExcelJS from "exceljs";

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
    id: v.id, branch: v.branch_name, date: v.visit_date, visitedBy: v.created_by_name || "—",
    bhNames: names(seg.branch_head, "name"),
    bhDesig: bhArr.map(e => e.designation || "").filter(Boolean).join(", ") || "—",
    bhMobile: bhArr.map(e => e.mobile || "").filter(Boolean).join(", ") || "—",
    dailyCopies: totalDaily || null, lyCopies: totalLY || null, growth: avgGrowth,
    revenue: totalRev || null, bhOutstanding: totalBhOut || null,
    staffVacancy: bhArr.map(e => e.staff_vacancy || "").filter(Boolean).join(", ") || "—",
    circNames: names(seg.circulation, "name"),
    weakAgentsCount: weakAgents.length || null,
    weakAgentsList: weakAgents.map(a => a.agent_name).join(", ") || "—",
    agentNames: names(seg.agent, "agent_name"), agentCount: agentArr.length || null,
    agentOutstanding: totalAgentOut || null,
    hawkerNames: names(seg.hawker, "hawker_name"), hawkerCount: hawkerArr.length || null,
    corrNames: names(seg.correspondent, "name"), corrCount: corrArr.length || null,
    advNames: names(seg.advertisement, "name"),
    adTarget: totalTarget || null, adAchiev: totalAchiev || null,
    adPct: totalTarget ? Number(((totalAchiev / totalTarget) * 100).toFixed(1)) : null,
    lostClientsCount: lostClients.length || null,
    lostClientsList: lostClients.map(c => c.client).join(", ") || "—",
    agencyNames: names(seg.ad_agency, "agency_name"), agencyCount: agencyArr.length || null,
    recoveryParties: allParties.length || null, totalRecovery: totalRecovery || null,
    _bhArr: bhArr, _circArr: circArr, _agentArr: agentArr, _hawkerArr: hawkerArr,
    _corrArr: corrArr, _advArr: advArr, _agencyArr: agencyArr, _recoveryArr: recoveryArr,
    _weakAgents: weakAgents, _lostClients: lostClients, _allParties: allParties,
  };
}

// ── Excel Download ────────────────────────────────────────────────────────────
const THIN = { style: "thin", color: { argb: "FFBDBDBD" } };
const bdr = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const SEG_COLORS = {
  BH:       { bg: "FFB91C1C", fg: "FFFFFFFF" },
  CIRC:     { bg: "FF166534", fg: "FFFFFFFF" },
  AGENT:    { bg: "FF92400E", fg: "FFFFFFFF" },
  HAWKER:   { bg: "FF1E3A5F", fg: "FFFFFFFF" },
  CORR:     { bg: "FF4A1D96", fg: "FFFFFFFF" },
  ADV:      { bg: "FF7C2D12", fg: "FFFFFFFF" },
  AGENCY:   { bg: "FF134E4A", fg: "FFFFFFFF" },
  RECOVERY: { bg: "FF312E81", fg: "FFFFFFFF" },
};

function applyHeader(row, cols, color) {
  row.height = 28;
  cols.forEach((val, i) => {
    const c = row.getCell(i + 1);
    c.value = val;
    c.font = { bold: true, name: "Arial", size: 9, color: { argb: color.fg } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.bg } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.border = bdr;
  });
}

function applyDataRow(row, vals, numCols = []) {
  row.height = 18;
  vals.forEach((val, i) => {
    const c = row.getCell(i + 1);
    c.value = val ?? "—";
    c.font = { name: "Arial", size: 9 };
    c.alignment = { horizontal: numCols.includes(i) ? "center" : "left", vertical: "middle", wrapText: false };
    c.border = bdr;
    // alternate fill — even rows light gray
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
  });
}

async function downloadExcel(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Patrika Director Office";

  // ─── SEGMENT SHEETS ───────────────────────────────────────────────────────
  // Each segment gets its own sheet, rows = one data row per entry per visit

  // 1. BRANCH HEAD
  const wsSummary = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  const wsBH = wb.addWorksheet("Branch Head", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const bhCols = [
    { header: "Branch Name", key: "branch", width: 18 },
    { header: "Date of Visit", key: "date", width: 14 },
    { header: "Visited By", key: "visitedBy", width: 16 },
    { header: "Name of Branch Head", key: "name", width: 22 },
    { header: "Mobile No.", key: "mobile", width: 14 },
    { header: "Current Copies", key: "daily_copies", width: 14 },
    { header: "Last Year Copies", key: "last_year_copies", width: 16 },
    { header: "Growth/Decline %", key: "growth_pct", width: 14 },
    { header: "Monthly Revenue (₹)", key: "monthly_revenue", width: 18 },
    { header: "Outstanding (₹)", key: "outstanding", width: 16 },
    { header: "Staff Vacancy", key: "staff_vacancy", width: 12 },
    { header: "Q1. 3 Biggest Problems", key: "q1_problems", width: 30 },
    { header: "Q2. Circulation Growth/Decline Reason", key: "q2_circulation_reason", width: 32 },
    { header: "Q3. Recovery Barrier", key: "q3_recovery_barrier", width: 28 },
    { header: "Q4. Ad Revenue Suggestion", key: "q4_ad_revenue", width: 28 },
    { header: "Q5. HO Support Required", key: "q5_ho_help", width: 26 },
    { header: "Team Observation", key: "team_observation", width: 28 },
  ];
  wsBH.columns = bhCols.map(c => ({ width: c.width }));
  applyHeader(wsBH.addRow(bhCols.map(c => c.header)), bhCols.map(c => c.header), SEG_COLORS.BH);
  const numBH = [5, 6, 7, 8, 9];
  rows.forEach(r => {
    (r._bhArr.length ? r._bhArr : [{}]).forEach(e => {
      applyDataRow(wsBH.addRow([
        r.branch, r.date, r.visitedBy,
        e.name || "—", e.mobile || "—",
        e.daily_copies || "—", e.last_year_copies || "—",
        e.growth_pct ? `${e.growth_pct}%` : "—",
        e.monthly_revenue || "—", e.outstanding || "—", e.staff_vacancy || "—",
        e.q1_problems || "—", e.q2_circulation_reason || "—",
        e.q3_recovery_barrier || "—", e.q4_ad_revenue || "—",
        e.q5_ho_help || "—", e.team_observation || "—",
      ]), numBH);
    });
  });

  // 2. CIRCULATION
  const wsCirc = wb.addWorksheet("Circulation", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const circCols = [
    { header: "Branch Name", width: 18 }, { header: "Date of Visit", width: 14 },
    { header: "Visited By", width: 16 }, { header: "Name of Circulation Incharge", width: 26 },
    { header: "Mobile No.", width: 14 }, { header: "Designation", width: 18 },
    { header: "Decline Area", width: 20 }, { header: "Decline Reason", width: 28 },
    { header: "Q3. Competitor Strong Area", width: 28 }, { header: "Q4. Growth Potential", width: 26 },
    { header: "Q5. 90-Day Growth Possible", width: 26 },
  ];
  wsCirc.columns = circCols.map(c => ({ width: c.width }));
  applyHeader(wsCirc.addRow(circCols.map(c => c.header)), circCols.map(c => c.header), SEG_COLORS.CIRC);
  rows.forEach(r => {
    (r._circArr.length ? r._circArr : [{}]).forEach(e => {
      applyDataRow(wsCirc.addRow([
        r.branch, r.date, r.visitedBy,
        e.name || "—", e.mobile || "—", e.designation || "—",
        e.decline_area || "—", e.decline_reason || "—",
        e.q3_competitor_strong || "—", e.q4_growth_potential || "—", e.q5_90_day_growth || "—",
      ]));
    });
  });

  // 3. AGENT
  const wsAgent = wb.addWorksheet("Agent", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const agentCols = [
    { header: "Branch Name", width: 18 }, { header: "Date of Visit", width: 14 },
    { header: "Visited By", width: 16 }, { header: "Agent Name", width: 22 },
    { header: "Mobile No.", width: 14 }, { header: "Agency", width: 18 },
    { header: "Area", width: 16 }, { header: "Current Copies", width: 14 },
    { header: "Last Year Copies", width: 16 }, { header: "Outstanding (₹)", width: 16 },
    { header: "Payment Regularity", width: 18 },
    { header: "Q1. Biggest Problem", width: 28 }, { header: "Q2. Competitor Offer", width: 26 },
    { header: "Q3. 3-Month Growth", width: 22 }, { header: "Q4. Help Required", width: 24 },
    { header: "Q5. Market Growth Area", width: 24 },
    { header: "Commitment (Copies)", width: 18 }, { header: "Timeline", width: 16 },
  ];
  wsAgent.columns = agentCols.map(c => ({ width: c.width }));
  applyHeader(wsAgent.addRow(agentCols.map(c => c.header)), agentCols.map(c => c.header), SEG_COLORS.AGENT);
  const numAgent = [7, 8, 9, 16];
  rows.forEach(r => {
    (r._agentArr.length ? r._agentArr : [{}]).forEach(e => {
      applyDataRow(wsAgent.addRow([
        r.branch, r.date, r.visitedBy,
        e.agent_name || "—", e.mobile || "—", e.agency || "—", e.area || "—",
        e.current_copies || "—", e.last_year_copies || "—", e.outstanding || "—",
        e.payment_regularity || "—", e.q1_problem || "—", e.q2_competitor_offer || "—",
        e.q3_3month_growth || "—", e.q4_company_help || "—", e.q5_market_growth || "—",
        e.additional_copies || "—", e.timeline || "—",
      ]), numAgent);
    });
  });

  // 4. HAWKER
  const wsHawker = wb.addWorksheet("Hawker", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const hawkerCols = [
    { header: "Branch Name", width: 18 }, { header: "Date of Visit", width: 14 },
    { header: "Visited By", width: 16 }, { header: "Hawker Name", width: 22 },
    { header: "Mobile", width: 14 }, { header: "Area", width: 16 },
    { header: "Q1. Top Selling Newspaper", width: 26 }, { header: "Q2. Reader Complaints", width: 28 },
    { header: "Q3. Competitor Scheme", width: 26 }, { header: "Q4. Demand Growth Area", width: 26 },
    { header: "Q5. Delivery Problems", width: 26 }, { header: "Team Remarks", width: 28 },
  ];
  wsHawker.columns = hawkerCols.map(c => ({ width: c.width }));
  applyHeader(wsHawker.addRow(hawkerCols.map(c => c.header)), hawkerCols.map(c => c.header), SEG_COLORS.HAWKER);
  rows.forEach(r => {
    (r._hawkerArr.length ? r._hawkerArr : [{}]).forEach(e => {
      applyDataRow(wsHawker.addRow([
        r.branch, r.date, r.visitedBy,
        e.hawker_name || "—", e.mobile || "—", e.area || "—",
        e.q1_top_newspaper || "—", e.q2_reader_complaint || "—",
        e.q3_competitor_scheme || "—", e.q4_demand_area || "—",
        e.q5_delivery_problem || "—", e.team_remarks || "—",
      ]));
    });
  });

  // 5. CORRESPONDENT
  const wsCorr = wb.addWorksheet("Correspondent", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const corrCols = [
    { header: "Branch Name", width: 18 }, { header: "Date of Visit", width: 14 },
    { header: "Visited By", width: 16 }, { header: "Correspondent Name", width: 24 },
    { header: "Mobile", width: 14 }, { header: "Area", width: 16 },
    { header: "Q1. Reader Sentiment", width: 28 }, { header: "Q2. Weak Areas", width: 26 },
    { header: "Q3. Competitor Strong", width: 26 }, { header: "Q4. Content Feedback", width: 28 },
    { header: "Q5. Growth Scope", width: 26 }, { header: "Observation", width: 28 },
  ];
  wsCorr.columns = corrCols.map(c => ({ width: c.width }));
  applyHeader(wsCorr.addRow(corrCols.map(c => c.header)), corrCols.map(c => c.header), SEG_COLORS.CORR);
  rows.forEach(r => {
    (r._corrArr.length ? r._corrArr : [{}]).forEach(e => {
      applyDataRow(wsCorr.addRow([
        r.branch, r.date, r.visitedBy,
        e.name || "—", e.mobile || "—", e.area || "—",
        e.q1_reader_sentiment || "—", e.q2_weak_areas || "—",
        e.q3_competitor_strong || "—", e.q4_content_feedback || "—",
        e.q5_growth_scope || "—", e.observation || "—",
      ]));
    });
  });

  // 6. ADVERTISEMENT
  const wsAdv = wb.addWorksheet("Advertisement", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const advCols = [
    { header: "Branch Name", width: 18 }, { header: "Date of Visit", width: 14 },
    { header: "Visited By", width: 16 }, { header: "Member Name", width: 22 },
    { header: "Designation", width: 18 }, { header: "Ad Target (₹)", width: 16 },
    { header: "Achievement (₹)", width: 16 }, { header: "Achievement %", width: 14 },
    { header: "Q3. Why Clients Lost", width: 28 }, { header: "Q4. Top Opportunity", width: 26 },
    { header: "Q5. 6-Month Potential", width: 26 },
  ];
  wsAdv.columns = advCols.map(c => ({ width: c.width }));
  applyHeader(wsAdv.addRow(advCols.map(c => c.header)), advCols.map(c => c.header), SEG_COLORS.ADV);
  const numAdv = [5, 6, 7];
  rows.forEach(r => {
    (r._advArr.length ? r._advArr : [{}]).forEach(e => {
      const pct = e.target && e.achievement ? `${((e.achievement/e.target)*100).toFixed(1)}%` : "—";
      applyDataRow(wsAdv.addRow([
        r.branch, r.date, r.visitedBy,
        e.name || "—", e.designation || "—",
        e.target || "—", e.achievement || "—", pct,
        e.q3_why_lost || "—", e.q4_top_opportunity || "—", e.q5_6month_potential || "—",
      ]), numAdv);
    });
  });

  // 7. AD AGENCY
  const wsAgency = wb.addWorksheet("Ad Agency", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const agencyCols = [
    { header: "Branch Name", width: 18 }, { header: "Date of Visit", width: 14 },
    { header: "Visited By", width: 16 }, { header: "Agency Name", width: 24 },
    { header: "Contact Person", width: 20 },
    { header: "Q1. Market Reputation", width: 28 }, { header: "Q2. Advertiser Complaints", width: 28 },
    { header: "Q3. Competitor Strength", width: 26 }, { header: "Q4. Sector Potential", width: 26 },
    { header: "Q5. Improvements", width: 26 },
  ];
  wsAgency.columns = agencyCols.map(c => ({ width: c.width }));
  applyHeader(wsAgency.addRow(agencyCols.map(c => c.header)), agencyCols.map(c => c.header), SEG_COLORS.AGENCY);
  rows.forEach(r => {
    (r._agencyArr.length ? r._agencyArr : [{}]).forEach(e => {
      applyDataRow(wsAgency.addRow([
        r.branch, r.date, r.visitedBy,
        e.agency_name || "—", e.contact_person || "—",
        e.q1_market_reputation || "—", e.q2_advertiser_complaint || "—",
        e.q3_competitor_strength || "—", e.q4_sector_potential || "—", e.q5_improvement || "—",
      ]));
    });
  });

  // 8. RECOVERY
  const wsRec = wb.addWorksheet("Recovery", { views: [{ showGridLines: false, state: "frozen", ySplit: 1 }] });
  const recCols = [
    { header: "Branch Name", width: 18 }, { header: "Date of Visit", width: 14 },
    { header: "Visited By", width: 16 }, { header: "Party Name", width: 24 },
    { header: "Outstanding (₹)", width: 18 }, { header: "Ageing (Days)", width: 14 },
    { header: "Reason", width: 26 }, { header: "Recovery Plan", width: 26 },
    { header: "Expected Date", width: 16 },
  ];
  wsRec.columns = recCols.map(c => ({ width: c.width }));
  applyHeader(wsRec.addRow(recCols.map(c => c.header)), recCols.map(c => c.header), SEG_COLORS.RECOVERY);
  const numRec = [4, 5];
  rows.forEach(r => {
    (r._allParties.length ? r._allParties : [{}]).forEach(p => {
      applyDataRow(wsRec.addRow([
        r.branch, r.date, r.visitedBy,
        p.party || "—", p.outstanding || "—", p.ageing || "—",
        p.reason || "—", p.recovery_plan || "—", p.expected_date || "—",
      ]), numRec);
    });
  });

  // ─── SUMMARY SHEET ────────────────────────────────────────────────────────
  wsSummary.columns = [{ width: 36 }, { width: 22 }];

  const addSum = (label, value, isBold = false, bgArgb = null) => {
    const row = wsSummary.addRow([label, value]);
    row.height = 20;
    [1, 2].forEach(i => {
      const c = row.getCell(i);
      c.font = { bold: isBold, name: "Arial", size: 10, color: { argb: bgArgb ? "FFFFFFFF" : "FF111827" } };
      c.border = bdr;
      c.alignment = { horizontal: i === 2 ? "center" : "left", vertical: "middle" };
      if (bgArgb) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      else if (isBold) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    });
  };

  const titleR = wsSummary.addRow(["VISIT MATRIX SUMMARY", ""]);
  wsSummary.mergeCells(`A1:B1`);
  const tc = titleR.getCell(1);
  tc.value = "VISIT MATRIX SUMMARY";
  tc.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" }, name: "Arial" };
  tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } };
  tc.alignment = { horizontal: "center", vertical: "middle" };
  tc.border = bdr;
  titleR.height = 36;

  wsSummary.addRow([]);
  addSum("Generated On", new Date().toLocaleDateString("en-IN"));
  addSum("Total Visits", rows.length, true);
  addSum("Total Branches", new Set(rows.map(r => r.branch)).size);
  wsSummary.addRow([]);
  addSum("METRIC", "TOTAL", true, "FFB91C1C");
  addSum("Total Daily Copies", rows.reduce((s, r) => s + (r.dailyCopies || 0), 0), true);
  addSum("Total LY Copies", rows.reduce((s, r) => s + (r.lyCopies || 0), 0));
  addSum("Total Revenue (₹)", rows.reduce((s, r) => s + (r.revenue || 0), 0), true);
  addSum("Total BH Outstanding (₹)", rows.reduce((s, r) => s + (r.bhOutstanding || 0), 0));
  addSum("Total Ad Target (₹)", rows.reduce((s, r) => s + (r.adTarget || 0), 0), true);
  addSum("Total Ad Achievement (₹)", rows.reduce((s, r) => s + (r.adAchiev || 0), 0));
  addSum("Total Agent Outstanding (₹)", rows.reduce((s, r) => s + (r.agentOutstanding || 0), 0), true);
  addSum("Total Recovery Outstanding (₹)", rows.reduce((s, r) => s + (r.totalRecovery || 0), 0));
  addSum("Total Weak Agents", rows.reduce((s, r) => s + (r.weakAgentsCount || 0), 0), true);
  addSum("Total Lost Clients", rows.reduce((s, r) => s + (r.lostClientsCount || 0), 0));

  // Move Summary to first position

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Patrika-Visit-Matrix-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Visit Card (UI) ───────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
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
            <p className="text-sm text-muted-foreground mt-2">{filtered.length} of {rows.length} visits · complete segment-wise view</p>
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
          <div className="space-y-6">{filtered.map(row => <VisitCard key={row.id} row={row} />)}</div>
        )}
      </main>
    </div>
  );
}
