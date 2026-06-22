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
    // raw arrays for Excel detail
    _bhArr: bhArr, _circArr: circArr, _agentArr: agentArr, _hawkerArr: hawkerArr,
    _corrArr: corrArr, _advArr: advArr, _agencyArr: agencyArr, _recoveryArr: recoveryArr,
    _weakAgents: weakAgents, _lostClients: lostClients, _allParties: allParties,
  };
}

// ── Excel helpers ────────────────────────────────────────────────────────────
const THIN = { style: "thin", color: { argb: "FFD1D5DB" } };
const border = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const thickBorder = {
  top: { style: "medium", color: { argb: "FF1F3864" } },
  left: { style: "medium", color: { argb: "FF1F3864" } },
  bottom: { style: "medium", color: { argb: "FF1F3864" } },
  right: { style: "medium", color: { argb: "FF1F3864" } },
};

const SECTION_COLORS = {
  META: "FF1F3864",        // dark blue
  BH: "FFB91C1C",          // red
  CIRC: "FF166534",        // green
  AGENT: "FF854D0E",       // amber
  HAWKER: "FF1E3A5F",      // navy
  CORR: "FF4A1D96",        // purple
  ADV: "FF7C2D12",         // orange-red
  AGENCY: "FF134E4A",      // teal
  RECOVERY: "FF312E81",    // indigo
};

function styleHeader(cell, bgArgb) {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
  cell.border = border;
}

function styleLabel(cell) {
  cell.font = { bold: true, name: "Arial", size: 9, color: { argb: "FF374151" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  cell.alignment = { horizontal: "left", vertical: "middle" };
  cell.border = border;
}

function styleValue(cell, isNum = false) {
  cell.font = { name: "Arial", size: 10 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  cell.alignment = { horizontal: isNum ? "center" : "left", vertical: "middle" };
  cell.border = border;
}

function styleVisitHeader(cell) {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 11 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } };
  cell.alignment = { horizontal: "left", vertical: "middle" };
  cell.border = thickBorder;
}

async function downloadExcel(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Patrika Director Office";
  wb.created = new Date();

  // ── Sheet 1: Summary ────────────────────────────────────────────────────
  const ws = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 36 }, { width: 22 }];

  const addSummaryRow = (label, value, bgArgb, bold = false) => {
    const row = ws.addRow([label, value]);
    row.height = 22;
    const c1 = row.getCell(1);
    const c2 = row.getCell(2);
    if (bgArgb) {
      [c1, c2].forEach(c => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
        c.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
        c.alignment = { horizontal: "center", vertical: "middle" };
        c.border = border;
      });
    } else {
      c1.font = { bold, name: "Arial", size: 10 };
      c1.alignment = { horizontal: "left", vertical: "middle" };
      c1.border = border;
      c2.font = { bold, name: "Arial", size: 10 };
      c2.alignment = { horizontal: "center", vertical: "middle" };
      c2.border = border;
      if (bold) {
        [c1, c2].forEach(c => c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } });
      }
    }
  };

  // Title
  const titleRow = ws.addRow(["VISIT MATRIX SUMMARY", ""]);
  ws.mergeCells(`A${titleRow.number}:B${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "VISIT MATRIX SUMMARY";
  tc.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" }, name: "Arial" };
  tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } };
  tc.alignment = { horizontal: "center", vertical: "middle" };
  tc.border = thickBorder;
  titleRow.height = 36;

  ws.addRow([]);
  addSummaryRow("Generated On", new Date().toLocaleDateString("en-IN"));
  addSummaryRow("Total Visits", rows.length);
  addSummaryRow("Total Branches", new Set(rows.map(r => r.branch)).size);
  ws.addRow([]);
  addSummaryRow("METRIC", "TOTAL", "FFB91C1C");
  addSummaryRow("Total Daily Copies", rows.reduce((s, r) => s + (r.dailyCopies || 0), 0), null, true);
  addSummaryRow("Total LY Copies", rows.reduce((s, r) => s + (r.lyCopies || 0), 0));
  addSummaryRow("Total Revenue (₹)", rows.reduce((s, r) => s + (r.revenue || 0), 0), null, true);
  addSummaryRow("Total BH Outstanding (₹)", rows.reduce((s, r) => s + (r.bhOutstanding || 0), 0));
  addSummaryRow("Total Ad Target (₹)", rows.reduce((s, r) => s + (r.adTarget || 0), 0), null, true);
  addSummaryRow("Total Ad Achievement (₹)", rows.reduce((s, r) => s + (r.adAchiev || 0), 0));
  addSummaryRow("Total Agent Outstanding (₹)", rows.reduce((s, r) => s + (r.agentOutstanding || 0), 0), null, true);
  addSummaryRow("Total Recovery Outstanding (₹)", rows.reduce((s, r) => s + (r.totalRecovery || 0), 0));
  addSummaryRow("Total Weak Agents", rows.reduce((s, r) => s + (r.weakAgentsCount || 0), 0), null, true);
  addSummaryRow("Total Lost Clients", rows.reduce((s, r) => s + (r.lostClientsCount || 0), 0));

  // ── Sheet 2: Visit Matrix (Vertical) ────────────────────────────────────
  const wm = wb.addWorksheet("Visit Matrix", { views: [{ showGridLines: false }] });
  wm.columns = [
    { width: 28 }, // Label
    { width: 30 }, // Value 1
    { width: 28 }, // Label
    { width: 30 }, // Value 2
  ];

  let currentRow = 1;

  const addBlankRow = () => {
    wm.addRow([]);
    currentRow++;
  };

  const addSectionHeader = (title, colorArgb) => {
    const row = wm.getRow(currentRow);
    wm.mergeCells(`A${currentRow}:D${currentRow}`);
    const cell = row.getCell(1);
    cell.value = title;
    styleHeader(cell, colorArgb);
    row.height = 24;
    currentRow++;
  };

  const addDataRow = (label1, val1, label2, val2, isNum1 = false, isNum2 = false) => {
    const row = wm.getRow(currentRow);
    row.height = 20;
    const c1 = row.getCell(1); c1.value = label1; styleLabel(c1);
    const c2 = row.getCell(2); c2.value = val1 ?? "—"; styleValue(c2, isNum1);
    if (label2 !== undefined) {
      const c3 = row.getCell(3); c3.value = label2; styleLabel(c3);
      const c4 = row.getCell(4); c4.value = val2 ?? "—"; styleValue(c4, isNum2);
    } else {
      wm.mergeCells(`B${currentRow}:D${currentRow}`);
    }
    currentRow++;
  };

  const addFullRow = (label, value, isNum = false) => {
    const row = wm.getRow(currentRow);
    row.height = 20;
    const c1 = row.getCell(1); c1.value = label; styleLabel(c1);
    wm.mergeCells(`B${currentRow}:D${currentRow}`);
    const c2 = row.getCell(2); c2.value = value ?? "—"; styleValue(c2, isNum);
    currentRow++;
  };

  // ── Per visit block ──
  for (const row of rows) {
    // Visit header
    const vRow = wm.getRow(currentRow);
    wm.mergeCells(`A${currentRow}:D${currentRow}`);
    const vCell = vRow.getCell(1);
    vCell.value = `${row.branch}   ·   ${row.date}   ·   Visited by: ${row.visitedBy}`;
    styleVisitHeader(vCell);
    vRow.height = 30;
    currentRow++;

    // ── Branch Head ──
    addSectionHeader("BRANCH HEAD", SECTION_COLORS.BH);
    addDataRow("Name(s)", row.bhNames, "Designation", row.bhDesig);
    addDataRow("Mobile", row.bhMobile, "Staff Vacancy", row.staffVacancy);
    addDataRow("Daily Copies", row.dailyCopies, "LY Copies", row.lyCopies, true, true);
    addDataRow("Growth %", row.growth !== null ? `${row.growth}%` : "—", "Monthly Revenue (₹)", row.revenue ? `₹${Number(row.revenue).toLocaleString("en-IN")}` : "—", true, true);
    addFullRow("BH Outstanding (₹)", row.bhOutstanding ? `₹${Number(row.bhOutstanding).toLocaleString("en-IN")}` : "—", true);

    // Branch Head questions (if any)
    for (const bh of row._bhArr) {
      if (bh.q1_problems) addFullRow("Q1. Biggest Problems", bh.q1_problems);
      if (bh.q2_circulation_reason) addFullRow("Q2. Circulation Reason", bh.q2_circulation_reason);
      if (bh.q3_recovery_barrier) addFullRow("Q3. Recovery Barrier", bh.q3_recovery_barrier);
      if (bh.q4_ad_revenue) addFullRow("Q4. Ad Revenue Suggestion", bh.q4_ad_revenue);
      if (bh.q5_ho_help) addFullRow("Q5. HO Support Required", bh.q5_ho_help);
      if (bh.team_observation) addFullRow("Team Observation", bh.team_observation);
    }

    // ── Circulation ──
    addSectionHeader("CIRCULATION", SECTION_COLORS.CIRC);
    addDataRow("Incharge(s)", row.circNames, "Weak Agents Count", row.weakAgentsCount, false, true);
    if (row.weakAgentsList !== "—") addFullRow("Weak Agent Names", row.weakAgentsList);
    for (const c of row._circArr) {
      if (c.decline_area) addDataRow("Decline Area", c.decline_area, "Decline Reason", c.decline_reason);
      if (c.q3_competitor_strong) addFullRow("Q3. Competitor Strong Area", c.q3_competitor_strong);
      if (c.q4_growth_potential) addFullRow("Q4. Growth Potential", c.q4_growth_potential);
      if (c.q5_90_day_growth) addFullRow("Q5. 90-Day Growth", c.q5_90_day_growth);
    }

    // ── Agent ──
    addSectionHeader("AGENT", SECTION_COLORS.AGENT);
    addDataRow("Agent Name(s)", row.agentNames, "Total Agents", row.agentCount, false, true);
    addFullRow("Agent Outstanding (₹)", row.agentOutstanding ? `₹${Number(row.agentOutstanding).toLocaleString("en-IN")}` : "—", true);
    for (const a of row._agentArr) {
      if (a.agent_name) addDataRow("Agent", a.agent_name, "Area", a.area);
      if (a.current_copies) addDataRow("Current Copies", a.current_copies, "LY Copies", a.last_year_copies, true, true);
      if (a.q1_problem) addFullRow("Q1. Biggest Problem", a.q1_problem);
      if (a.q2_competitor_offer) addFullRow("Q2. Competitor Offer", a.q2_competitor_offer);
      if (a.additional_copies) addDataRow("Commitment (Copies)", a.additional_copies, "Timeline", a.timeline, true);
    }

    // ── Hawker ──
    addSectionHeader("HAWKER", SECTION_COLORS.HAWKER);
    addDataRow("Hawker Name(s)", row.hawkerNames, "Total Hawkers", row.hawkerCount, false, true);
    for (const h of row._hawkerArr) {
      if (h.hawker_name) addDataRow("Hawker", h.hawker_name, "Area", h.area);
      if (h.q1_top_newspaper) addFullRow("Q1. Top Selling Newspaper", h.q1_top_newspaper);
      if (h.q2_reader_complaint) addFullRow("Q2. Reader Complaints", h.q2_reader_complaint);
    }

    // ── Correspondent ──
    addSectionHeader("CORRESPONDENT", SECTION_COLORS.CORR);
    addDataRow("Correspondent(s)", row.corrNames, "Total", row.corrCount, false, true);
    for (const c of row._corrArr) {
      if (c.name) addDataRow("Name", c.name, "Area", c.area);
      if (c.q1_reader_sentiment) addFullRow("Q1. Reader Sentiment", c.q1_reader_sentiment);
      if (c.q4_content_feedback) addFullRow("Q4. Content Feedback", c.q4_content_feedback);
    }

    // ── Advertisement ──
    addSectionHeader("ADVERTISEMENT", SECTION_COLORS.ADV);
    addDataRow("Member(s)", row.advNames, "Lost Clients Count", row.lostClientsCount, false, true);
    addDataRow("Ad Target (₹)", row.adTarget ? `₹${Number(row.adTarget).toLocaleString("en-IN")}` : "—", "Ad Achievement (₹)", row.adAchiev ? `₹${Number(row.adAchiev).toLocaleString("en-IN")}` : "—", true, true);
    addFullRow("Achievement %", row.adPct ? `${row.adPct}%` : "—", true);
    if (row.lostClientsList !== "—") addFullRow("Lost Client Names", row.lostClientsList);
    for (const a of row._advArr) {
      if (a.q3_why_lost) addFullRow("Q3. Why Clients Lost", a.q3_why_lost);
      if (a.q4_top_opportunity) addFullRow("Q4. Top Opportunity", a.q4_top_opportunity);
      if (a.q5_6month_potential) addFullRow("Q5. 6-Month Potential", a.q5_6month_potential);
    }

    // ── Ad Agency ──
    addSectionHeader("AD AGENCY", SECTION_COLORS.AGENCY);
    addDataRow("Agency Name(s)", row.agencyNames, "Total Agencies", row.agencyCount, false, true);
    for (const a of row._agencyArr) {
      if (a.q1_market_reputation) addFullRow("Q1. Market Reputation", a.q1_market_reputation);
      if (a.q5_improvement) addFullRow("Q5. Improvement Suggested", a.q5_improvement);
    }

    // ── Recovery ──
    addSectionHeader("RECOVERY", SECTION_COLORS.RECOVERY);
    addDataRow("Parties Tracked", row.recoveryParties, "Total Outstanding (₹)", row.totalRecovery ? `₹${Number(row.totalRecovery).toLocaleString("en-IN")}` : "—", true, true);
    if (row._allParties.length > 0) {
      // Party table header
      const ph = wm.getRow(currentRow);
      ["Party Name", "Outstanding (₹)", "Ageing (days)", "Recovery Plan"].forEach((h, i) => {
        const c = ph.getCell(i + 1);
        c.value = h;
        c.font = { bold: true, name: "Arial", size: 9, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
        c.alignment = { horizontal: "center", vertical: "middle" };
        c.border = border;
      });
      ph.height = 18;
      currentRow++;
      for (const p of row._allParties) {
        const pr = wm.getRow(currentRow);
        [p.party || "—", p.outstanding ? `₹${Number(p.outstanding).toLocaleString("en-IN")}` : "—", p.ageing || "—", p.recovery_plan || "—"].forEach((v, i) => {
          const c = pr.getCell(i + 1);
          c.value = v;
          c.font = { name: "Arial", size: 9 };
          c.alignment = { horizontal: i > 0 ? "center" : "left", vertical: "middle" };
          c.border = border;
        });
        pr.height = 18;
        currentRow++;
      }
    }

    addBlankRow();
    addBlankRow();
  }

  // Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Patrika-Visit-Matrix-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Visit Card (UI) ──────────────────────────────────────────────────────────
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

// ── Main ─────────────────────────────────────────────────────────────────────
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
