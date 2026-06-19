// Default question schemas — English only

export const SCHEMAS = {
  branch_head: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "name", label: "Name" },
        { key: "designation", label: "Designation" },
        { key: "mobile", label: "Mobile" },
      ]},
      { id: "status", title: "A. Current Branch Status", type: "grid", fields: [
        { key: "daily_copies", label: "Daily Copies", kind: "number" },
        { key: "last_year_copies", label: "Last Year Copies", kind: "number" },
        { key: "growth_pct", label: "Growth/Decline %", placeholder: "e.g. -8 or +5" },
        { key: "monthly_revenue", label: "Monthly Revenue (₹)", kind: "number" },
        { key: "outstanding", label: "Outstanding (₹)", kind: "number" },
        { key: "staff_vacancy", label: "Staff Vacancy", kind: "number" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_problems", label: "Q1. What are the 3 biggest problems of the branch?", kind: "textarea", span: 2 },
        { key: "q2_circulation_reason", label: "Q2. Why has circulation grown/declined in the last year?", kind: "textarea", span: 2 },
        { key: "q3_recovery_barrier", label: "Q3. What is the biggest barrier in recovery?", kind: "textarea", span: 2 },
        { key: "q4_ad_revenue", label: "Q4. What should be done to grow advertisement revenue?", kind: "textarea", span: 2 },
        { key: "q5_ho_help", label: "Q5. What support is required from Head Office?", kind: "textarea", span: 2 },
        { key: "team_observation", label: "Observation by Visiting Team", kind: "textarea", span: 2 },
      ]},
    ],
  },
  circulation: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "name", label: "Name" },
        { key: "designation", label: "Designation" },
      ]},
      { id: "decline", title: "Q1. Where have copies declined the most?", type: "grid", fields: [
        { key: "decline_area", label: "Area" },
        { key: "decline_reason", label: "Reason", kind: "textarea" },
      ]},
      { id: "weak_agents", title: "Q2. Weakest Agents", type: "table", key: "weak_agents", columns: [
        { key: "agent_name", label: "Agent Name" },
        { key: "copies_lost", label: "Copies Lost" },
        { key: "reason", label: "Reason" },
      ]},
      { id: "best_agents", title: "Best Performing Agents", type: "table", key: "best_agents", columns: [
        { key: "agent_name", label: "Agent Name" },
        { key: "copies_added", label: "Copies Added" },
        { key: "strength", label: "Strength / Why Strong" },
      ]},
      { id: "questions", title: "Other Questions", type: "grid", fields: [
        { key: "q3_competitor_strong", label: "Q3. Which area is the competitor strong in?", kind: "textarea", span: 2 },
        { key: "q4_growth_potential", label: "Q4. Where is the growth potential?", kind: "textarea", span: 2 },
        { key: "q5_90_day_growth", label: "Q5. How much growth is possible in next 90 days?", kind: "textarea", span: 2 },
      ]},
    ],
  },
  agent: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "agent_name", label: "Agent Name" },
        { key: "agency", label: "Agency" },
        { key: "mobile", label: "Mobile" },
        { key: "area", label: "Area" },
      ]},
      { id: "status", title: "Current Status", type: "grid", fields: [
        { key: "current_copies", label: "Current Copies", kind: "number" },
        { key: "last_year_copies", label: "Last Year Copies", kind: "number" },
        { key: "outstanding", label: "Outstanding (₹)", kind: "number" },
        { key: "payment_regularity", label: "Payment Regularity" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_problem", label: "Q1. Biggest problem in growing copies?", kind: "textarea", span: 2 },
        { key: "q2_competitor_offer", label: "Q2. What offer is the competitor giving?", kind: "textarea", span: 2 },
        { key: "q3_3month_growth", label: "Q3. How many copies can you grow in next 3 months?", kind: "textarea", span: 2 },
        { key: "q4_company_help", label: "Q4. What help is required from the company?", kind: "textarea", span: 2 },
        { key: "q5_market_growth", label: "Q5. Where do you see growth in the market?", kind: "textarea", span: 2 },
      ]},
      { id: "commitment", title: "Commitment", type: "grid", fields: [
        { key: "additional_copies", label: "Additional Copies (Commitment)", kind: "number" },
        { key: "timeline", label: "Timeline" },
      ]},
    ],
  },
  hawker: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "hawker_name", label: "Hawker Name" },
        { key: "area", label: "Area" },
        { key: "mobile", label: "Mobile" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_top_newspaper", label: "Q1. Which newspaper is selling the most?", kind: "textarea", span: 2 },
        { key: "q2_reader_complaint", label: "Q2. What complaints do readers have about Patrika?", kind: "textarea", span: 2 },
        { key: "q3_competitor_scheme", label: "Q3. What scheme is the competitor running?", kind: "textarea", span: 2 },
        { key: "q4_demand_area", label: "Q4. In which area is demand growing?", kind: "textarea", span: 2 },
        { key: "q5_delivery_problem", label: "Q5. Any delivery-related problems?", kind: "textarea", span: 2 },
        { key: "team_remarks", label: "Visiting Team Remarks", kind: "textarea", span: 2 },
      ]},
    ],
  },
  correspondent: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "name", label: "Name" },
        { key: "area", label: "Area" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_reader_sentiment", label: "Q1. What is reader sentiment toward the newspaper?", kind: "textarea", span: 2 },
        { key: "q2_weak_areas", label: "Q2. In which areas is Patrika weak?", kind: "textarea", span: 2 },
        { key: "q3_competitor_strong", label: "Q3. Where is the competitor strong?", kind: "textarea", span: 2 },
        { key: "q4_content_feedback", label: "Q4. What feedback do you get on content?", kind: "textarea", span: 2 },
        { key: "q5_growth_scope", label: "Q5. Where is the scope for growth?", kind: "textarea", span: 2 },
        { key: "observation", label: "Observation", kind: "textarea", span: 2 },
      ]},
    ],
  },
  advertisement: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "name", label: "Name" },
        { key: "designation", label: "Designation" },
      ]},
      { id: "target", title: "Q1. Revenue Target", type: "grid", fields: [
        { key: "target", label: "Target (₹)", kind: "number" },
        { key: "achievement", label: "Achievement (₹)", kind: "number" },
      ]},
      { id: "lost_clients", title: "Q2. Top Lost Clients", type: "table", key: "lost_clients", columns: [
        { key: "client", label: "Client" },
        { key: "revenue_loss", label: "Revenue Loss (₹)" },
        { key: "reason", label: "Reason" },
      ]},
      { id: "top_clients", title: "Top Performing Clients", type: "table", key: "top_clients", columns: [
        { key: "client", label: "Client" },
        { key: "revenue", label: "Revenue (₹)" },
        { key: "category", label: "Category" },
      ]},
      { id: "questions", title: "Other Questions", type: "grid", fields: [
        { key: "q3_why_lost", label: "Q3. Why are clients going to the competitor?", kind: "textarea", span: 2 },
        { key: "q4_top_opportunity", label: "Q4. Where is the top revenue opportunity?", kind: "textarea", span: 2 },
        { key: "q5_6month_potential", label: "Q5. Revenue potential in the next 6 months?", kind: "textarea", span: 2 },
      ]},
    ],
  },
  ad_agency: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "agency_name", label: "Agency Name" },
        { key: "contact_person", label: "Contact Person" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_market_reputation", label: "Q1. Market reputation of Patrika?", kind: "textarea", span: 2 },
        { key: "q2_advertiser_complaint", label: "Q2. Main complaints of advertisers?", kind: "textarea", span: 2 },
        { key: "q3_competitor_strength", label: "Q3. Biggest strength of the competitor?", kind: "textarea", span: 2 },
        { key: "q4_sector_potential", label: "Q4. Which sectors have advertising potential?", kind: "textarea", span: 2 },
        { key: "q5_improvement", label: "Q5. What improvements should Patrika make?", kind: "textarea", span: 2 },
      ]},
    ],
  },
  recovery: {
    sections: [
      { id: "parties", title: "Recovery Review (Party-wise Outstanding)", type: "table", key: "parties", columns: [
        { key: "party", label: "Party Name" },
        { key: "outstanding", label: "Outstanding (₹)" },
        { key: "ageing", label: "Ageing (days)" },
        { key: "reason", label: "Reason" },
        { key: "recovery_plan", label: "Recovery Plan" },
        { key: "expected_date", label: "Expected Date" },
      ]},
    ],
  },
  summary: {
    sections: [
      { id: "top_issues", title: "Top Issues", type: "list", key: "top_issues", placeholder: "Write an issue...", min: 5 },
      { id: "worst_5", title: "Worst Performers / Weak Areas", type: "list", key: "worst_5_performers", placeholder: "Weakest area / performer...", min: 5 },
      { id: "top_opportunities", title: "Top Opportunities", type: "list", key: "top_opportunities", placeholder: "Write an opportunity...", min: 5 },
      { id: "immediate_actions", title: "Immediate Actions Required", type: "list", key: "immediate_actions", placeholder: "Write an action...", min: 3 },
      { id: "remarks", title: "Director Office Remarks", type: "grid", fields: [
        { key: "director_remarks", label: "Remarks", kind: "textarea", span: 2 },
      ]},
    ],
  },
};

// Merge default schema with admin override (label_overrides, disabled_fields, extra_questions)
export function mergeSchema(defaultSchema, override) {
  if (!override) return defaultSchema;
  const labelOverrides = override.label_overrides || {};
  const disabled = new Set(override.disabled_fields || []);
  const sections = defaultSchema.sections.map(sec => {
    if (sec.type !== "grid") return sec;
    return {
      ...sec,
      fields: (sec.fields || [])
        .filter(f => !disabled.has(f.key))
        .map(f => labelOverrides[f.key] ? { ...f, label: labelOverrides[f.key] } : f),
    };
  });
  const extras = override.extra_questions || [];
  if (extras.length) {
    const extraFields = extras.map(q => ({
      key: q.key, label: q.label, hindi: q.hindi || "",
      kind: q.kind || "textarea", span: q.span || 2,
    }));
    sections.push({
      id: "_custom", title: "Custom Questions",
      type: "grid", fields: extraFields,
    });
  }
  return { ...defaultSchema, sections };
}

// Get all editable field-keys+labels for the question editor
export function listFields(defaultSchema) {
  const out = [];
  defaultSchema.sections.forEach(sec => {
    if (sec.type === "grid") {
      (sec.fields || []).forEach(f => out.push({ key: f.key, label: f.label, section: sec.title }));
    }
  });
  return out;
}
