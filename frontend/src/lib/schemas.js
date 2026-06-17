// Default question schemas - merged at runtime with admin overrides

export const SCHEMAS = {
  branch_head: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "name", label: "Name · नाम" },
        { key: "designation", label: "Designation · पद" },
        { key: "mobile", label: "Mobile · मोबाइल" },
      ]},
      { id: "status", title: "A. Current Branch Status", type: "grid", fields: [
        { key: "daily_copies", label: "Daily Copies · डेली कॉपीज़", kind: "number" },
        { key: "last_year_copies", label: "Last Year Copies · पिछले साल", kind: "number" },
        { key: "growth_pct", label: "Growth/Decline %", placeholder: "e.g. -8 or +5" },
        { key: "monthly_revenue", label: "Monthly Revenue · मासिक राजस्व (₹)", kind: "number" },
        { key: "outstanding", label: "Outstanding · बकाया (₹)", kind: "number" },
        { key: "staff_vacancy", label: "Staff Vacancy · रिक्तियां", kind: "number" },
      ]},
      { id: "questions", title: "Questions · प्रश्न", type: "grid", fields: [
        { key: "q1_problems", label: "Q1. Branch की सबसे बड़ी 3 समस्याएं?", kind: "textarea", span: 2 },
        { key: "q2_circulation_reason", label: "Q2. पिछले 1 साल में Circulation क्यों बढ़ी/घटी?", kind: "textarea", span: 2 },
        { key: "q3_recovery_barrier", label: "Q3. Recovery में सबसे बड़ी बाधा?", kind: "textarea", span: 2 },
        { key: "q4_ad_revenue", label: "Q4. Advertisement Revenue बढ़ाने के लिए?", kind: "textarea", span: 2 },
        { key: "q5_ho_help", label: "Q5. Head Office से किस सहायता की आवश्यकता?", kind: "textarea", span: 2 },
        { key: "team_observation", label: "Observation by Visiting Team", kind: "textarea", span: 2 },
      ]},
    ],
  },
  circulation: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "name", label: "Name · नाम" },
        { key: "designation", label: "Designation · पद" },
      ]},
      { id: "decline", title: "Q1. Copies सबसे ज्यादा कहाँ घटी हैं?", type: "grid", fields: [
        { key: "decline_area", label: "Area · क्षेत्र" },
        { key: "decline_reason", label: "Reason · कारण", kind: "textarea" },
      ]},
      { id: "weak_agents", title: "Q2. Top 5 Weak Agents · कमजोर एजेंट", type: "table", key: "weak_agents", columns: [
        { key: "agent_name", label: "Agent Name" },
        { key: "copies_lost", label: "Copies Lost" },
        { key: "reason", label: "Reason" },
      ]},
      { id: "best_agents", title: "Top 5 Best Agents · सर्वश्रेष्ठ एजेंट", type: "table", key: "best_agents", columns: [
        { key: "agent_name", label: "Agent Name" },
        { key: "copies_added", label: "Copies Added" },
        { key: "strength", label: "Strength / Why Strong" },
      ]},
      { id: "questions", title: "Other Questions", type: "grid", fields: [
        { key: "q3_competitor_strong", label: "Q3. Competitor किस Area में मजबूत है?", kind: "textarea", span: 2 },
        { key: "q4_growth_potential", label: "Q4. Growth Potential कहाँ है?", kind: "textarea", span: 2 },
        { key: "q5_90_day_growth", label: "Q5. अगले 90 दिन में कितनी Growth संभव है?", kind: "textarea", span: 2 },
      ]},
    ],
  },
  agent: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "agent_name", label: "Agent Name" },
        { key: "agency", label: "Agency" },
        { key: "mobile", label: "Mobile" },
        { key: "area", label: "Area · क्षेत्र" },
      ]},
      { id: "status", title: "Current Status", type: "grid", fields: [
        { key: "current_copies", label: "Current Copies", kind: "number" },
        { key: "last_year_copies", label: "Last Year Copies", kind: "number" },
        { key: "outstanding", label: "Outstanding (₹)", kind: "number" },
        { key: "payment_regularity", label: "Payment Regularity" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_problem", label: "Q1. Copies बढ़ाने में सबसे बड़ी समस्या?", kind: "textarea", span: 2 },
        { key: "q2_competitor_offer", label: "Q2. Competitor क्या Offer दे रहा है?", kind: "textarea", span: 2 },
        { key: "q3_3month_growth", label: "Q3. अगले 3 महीने में कितनी Copies बढ़ा सकते हैं?", kind: "textarea", span: 2 },
        { key: "q4_company_help", label: "Q4. Company से क्या सहायता चाहिए?", kind: "textarea", span: 2 },
        { key: "q5_market_growth", label: "Q5. Market में Growth कहाँ दिखाई देती है?", kind: "textarea", span: 2 },
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
        { key: "area", label: "Area · क्षेत्र" },
        { key: "mobile", label: "Mobile" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_top_newspaper", label: "Q1. सबसे ज्यादा कौन सा Newspaper बिक रहा है?", kind: "textarea", span: 2 },
        { key: "q2_reader_complaint", label: "Q2. Patrika के बारे में Readers क्या शिकायत करते हैं?", kind: "textarea", span: 2 },
        { key: "q3_competitor_scheme", label: "Q3. Competitor कौन सी Scheme चला रहा है?", kind: "textarea", span: 2 },
        { key: "q4_demand_area", label: "Q4. कौन से Area में Demand बढ़ रही है?", kind: "textarea", span: 2 },
        { key: "q5_delivery_problem", label: "Q5. Delivery से जुड़ी समस्या क्या है?", kind: "textarea", span: 2 },
        { key: "team_remarks", label: "Visiting Team Remarks", kind: "textarea", span: 2 },
      ]},
    ],
  },
  correspondent: {
    sections: [
      { id: "identification", title: "Identification", type: "grid", fields: [
        { key: "name", label: "Name · नाम" },
        { key: "area", label: "Area · क्षेत्र" },
      ]},
      { id: "questions", title: "Questions", type: "grid", fields: [
        { key: "q1_reader_sentiment", label: "Q1. Readers का Newspaper के प्रति रुझान?", kind: "textarea", span: 2 },
        { key: "q2_weak_areas", label: "Q2. किन क्षेत्रों में Patrika कमजोर है?", kind: "textarea", span: 2 },
        { key: "q3_competitor_strong", label: "Q3. Competitor कहाँ मजबूत है?", kind: "textarea", span: 2 },
        { key: "q4_content_feedback", label: "Q4. Content के बारे में Feedback?", kind: "textarea", span: 2 },
        { key: "q5_growth_scope", label: "Q5. Growth की संभावना कहाँ है?", kind: "textarea", span: 2 },
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
      { id: "lost_clients", title: "Q2. Top Lost Clients · खोए हुए क्लाइंट्स", type: "table", key: "lost_clients", columns: [
        { key: "client", label: "Client" },
        { key: "revenue_loss", label: "Revenue Loss (₹)" },
        { key: "reason", label: "Reason" },
      ]},
      { id: "top_clients", title: "Top 5 Best Clients · सर्वश्रेष्ठ क्लाइंट्स", type: "table", key: "top_clients", columns: [
        { key: "client", label: "Client" },
        { key: "revenue", label: "Revenue (₹)" },
        { key: "category", label: "Category" },
      ]},
      { id: "questions", title: "Other Questions", type: "grid", fields: [
        { key: "q3_why_lost", label: "Q3. Competitor को Client क्यों जा रहे हैं?", kind: "textarea", span: 2 },
        { key: "q4_top_opportunity", label: "Q4. Top Revenue Opportunity कहाँ है?", kind: "textarea", span: 2 },
        { key: "q5_6month_potential", label: "Q5. अगले 6 महीने का Revenue Potential?", kind: "textarea", span: 2 },
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
        { key: "q1_market_reputation", label: "Q1. Patrika की Market Reputation?", kind: "textarea", span: 2 },
        { key: "q2_advertiser_complaint", label: "Q2. Advertisers की मुख्य शिकायत?", kind: "textarea", span: 2 },
        { key: "q3_competitor_strength", label: "Q3. Competitor की सबसे बड़ी ताकत?", kind: "textarea", span: 2 },
        { key: "q4_sector_potential", label: "Q4. किस Sector में Ad Potential है?", kind: "textarea", span: 2 },
        { key: "q5_improvement", label: "Q5. Patrika क्या सुधार करे?", kind: "textarea", span: 2 },
      ]},
    ],
  },
  recovery: {
    sections: [
      { id: "parties", title: "Recovery Review · पार्टी-वार बकाया", type: "table", key: "parties", columns: [
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
      { id: "top_issues", title: "Top 5 Issues · मुख्य 5 समस्याएं", type: "list5", key: "top_issues", placeholder: "Issue likhein..." },
      { id: "worst_5", title: "Worst 5 Performers / Weak Areas · कमजोर क्षेत्र", type: "list5", key: "worst_5_performers", placeholder: "Weakest area/performer..." },
      { id: "top_opportunities", title: "Top 5 Opportunities · मुख्य 5 अवसर", type: "list5", key: "top_opportunities", placeholder: "Opportunity likhein..." },
      { id: "immediate_actions", title: "Immediate Actions Required · तत्काल आवश्यक कार्य", type: "list3", key: "immediate_actions", placeholder: "Action likhein..." },
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
  // Append extra_questions to the last grid section (or a new section)
  const extras = override.extra_questions || [];
  if (extras.length) {
    const extraFields = extras.map(q => ({
      key: q.key, label: q.label, hindi: q.hindi || "",
      kind: q.kind || "textarea", span: q.span || 2,
    }));
    sections.push({
      id: "_custom", title: "Custom Questions · कस्टम प्रश्न",
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
