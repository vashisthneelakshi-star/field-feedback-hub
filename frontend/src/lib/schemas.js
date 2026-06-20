// Default question schemas — multi-entry (table-based) for all segments

export const SCHEMAS = {
  branch_head: {
    sections: [
      {
        id: "entries", title: null, type: "table", key: "entries",
        columns: [
          { key: "name", label: "Name" },
          { key: "designation", label: "Designation" },
          { key: "mobile", label: "Mobile" },
          { key: "daily_copies", label: "Daily Copies" },
          { key: "last_year_copies", label: "Last Year Copies" },
          { key: "growth_pct", label: "Growth %" },
          { key: "monthly_revenue", label: "Revenue (₹)" },
          { key: "outstanding", label: "Outstanding (₹)" },
          { key: "staff_vacancy", label: "Staff Vacancy" },
          { key: "q1_problems", label: "3 Biggest Problems" },
          { key: "q2_circulation_reason", label: "Circulation Growth/Decline Reason" },
          { key: "q3_recovery_barrier", label: "Recovery Barrier" },
          { key: "q4_ad_revenue", label: "Ad Revenue Growth Suggestion" },
          { key: "q5_ho_help", label: "HO Support Required" },
          { key: "team_observation", label: "Team Observation" },
        ],
      },
    ],
  },

  circulation: {
    sections: [
      {
        id: "entries", title: null, type: "table", key: "entries",
        columns: [
          { key: "name", label: "Name" },
          { key: "designation", label: "Designation" },
          { key: "decline_area", label: "Decline Area" },
          { key: "decline_reason", label: "Decline Reason" },
          { key: "q3_competitor_strong", label: "Competitor Strong Area" },
          { key: "q4_growth_potential", label: "Growth Potential" },
          { key: "q5_90_day_growth", label: "90-Day Growth Possible" },
        ],
      },
      {
        id: "weak_agents", title: "Weakest Agents", type: "table", key: "weak_agents",
        columns: [
          { key: "agent_name", label: "Agent Name" },
          { key: "copies_lost", label: "Copies Lost" },
          { key: "reason", label: "Reason" },
        ],
      },
      {
        id: "best_agents", title: "Best Performing Agents", type: "table", key: "best_agents",
        columns: [
          { key: "agent_name", label: "Agent Name" },
          { key: "copies_added", label: "Copies Added" },
          { key: "strength", label: "Strength / Why Strong" },
        ],
      },
    ],
  },

  agent: {
    sections: [
      {
        id: "entries", title: null, type: "table", key: "entries",
        columns: [
          { key: "agent_name", label: "Agent Name" },
          { key: "agency", label: "Agency" },
          { key: "mobile", label: "Mobile" },
          { key: "area", label: "Area" },
          { key: "current_copies", label: "Current Copies" },
          { key: "last_year_copies", label: "Last Year Copies" },
          { key: "outstanding", label: "Outstanding (₹)" },
          { key: "payment_regularity", label: "Payment Regularity" },
          { key: "q1_problem", label: "Biggest Problem" },
          { key: "q2_competitor_offer", label: "Competitor Offer" },
          { key: "q3_3month_growth", label: "3-Month Growth" },
          { key: "q4_company_help", label: "Help Required" },
          { key: "q5_market_growth", label: "Market Growth Area" },
          { key: "additional_copies", label: "Commitment (Copies)" },
          { key: "timeline", label: "Timeline" },
        ],
      },
    ],
  },

  hawker: {
    sections: [
      {
        id: "entries", title: null, type: "table", key: "entries",
        columns: [
          { key: "hawker_name", label: "Hawker Name" },
          { key: "area", label: "Area" },
          { key: "mobile", label: "Mobile" },
          { key: "q1_top_newspaper", label: "Top Selling Newspaper" },
          { key: "q2_reader_complaint", label: "Reader Complaints" },
          { key: "q3_competitor_scheme", label: "Competitor Scheme" },
          { key: "q4_demand_area", label: "Demand Growth Area" },
          { key: "q5_delivery_problem", label: "Delivery Problems" },
          { key: "team_remarks", label: "Team Remarks" },
        ],
      },
    ],
  },

  correspondent: {
    sections: [
      {
        id: "entries", title: null, type: "table", key: "entries",
        columns: [
          { key: "name", label: "Name" },
          { key: "area", label: "Area" },
          { key: "q1_reader_sentiment", label: "Reader Sentiment" },
          { key: "q2_weak_areas", label: "Weak Areas" },
          { key: "q3_competitor_strong", label: "Competitor Strong" },
          { key: "q4_content_feedback", label: "Content Feedback" },
          { key: "q5_growth_scope", label: "Growth Scope" },
          { key: "observation", label: "Observation" },
        ],
      },
    ],
  },

  advertisement: {
    sections: [
      {
        id: "entries", title: null, type: "table", key: "entries",
        columns: [
          { key: "name", label: "Name" },
          { key: "designation", label: "Designation" },
          { key: "target", label: "Target (₹)" },
          { key: "achievement", label: "Achievement (₹)" },
          { key: "q3_why_lost", label: "Why Clients Lost" },
          { key: "q4_top_opportunity", label: "Top Opportunity" },
          { key: "q5_6month_potential", label: "6-Month Potential" },
        ],
      },
      {
        id: "lost_clients", title: "Top Lost Clients", type: "table", key: "lost_clients",
        columns: [
          { key: "client", label: "Client" },
          { key: "revenue_loss", label: "Revenue Loss (₹)" },
          { key: "reason", label: "Reason" },
        ],
      },
      {
        id: "top_clients", title: "Top Performing Clients", type: "table", key: "top_clients",
        columns: [
          { key: "client", label: "Client" },
          { key: "revenue", label: "Revenue (₹)" },
          { key: "category", label: "Category" },
        ],
      },
    ],
  },

  ad_agency: {
    sections: [
      {
        id: "entries", title: null, type: "table", key: "entries",
        columns: [
          { key: "agency_name", label: "Agency Name" },
          { key: "contact_person", label: "Contact Person" },
          { key: "q1_market_reputation", label: "Market Reputation" },
          { key: "q2_advertiser_complaint", label: "Advertiser Complaints" },
          { key: "q3_competitor_strength", label: "Competitor Strength" },
          { key: "q4_sector_potential", label: "Sector Potential" },
          { key: "q5_improvement", label: "Improvements Suggested" },
        ],
      },
    ],
  },

  recovery: {
    sections: [
      {
        id: "parties", title: "Recovery Review (Party-wise Outstanding)", type: "table", key: "parties",
        columns: [
          { key: "party", label: "Party Name" },
          { key: "outstanding", label: "Outstanding (₹)" },
          { key: "ageing", label: "Ageing (days)" },
          { key: "reason", label: "Reason" },
          { key: "recovery_plan", label: "Recovery Plan" },
          { key: "expected_date", label: "Expected Date" },
        ],
      },
    ],
  },

  summary: {
    sections: [
      { id: "top_issues", title: "Top Issues", type: "list", key: "top_issues", placeholder: "Write an issue...", min: 5 },
      { id: "worst_5", title: "Worst Performers / Weak Areas", type: "list", key: "worst_5_performers", placeholder: "Weakest area / performer...", min: 5 },
      { id: "top_opportunities", title: "Top Opportunities", type: "list", key: "top_opportunities", placeholder: "Write an opportunity...", min: 5 },
      { id: "immediate_actions", title: "Immediate Actions Required", type: "list", key: "immediate_actions", placeholder: "Write an action...", min: 3 },
      {
        id: "remarks", title: "Director Office Remarks", type: "grid", fields: [
          { key: "director_remarks", label: "Remarks", kind: "textarea", span: 2 },
        ],
      },
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
