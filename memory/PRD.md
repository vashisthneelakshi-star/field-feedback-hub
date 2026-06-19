# Patrika Director Office Visit - PRD

## Problem Statement
A web app for Director Office visits to Patrika branches. Field teams capture data across 9 segments (Branch Head, Circulation, Agent, Hawker, Correspondent, Advt, Ad Agency, Recovery, Daily Summary). Dashboard shows per-segment analytics + AI-powered insights (Hinglish). Executive Summary auto-generated for Director. Multi-visit support with full audit trail.

## User Personas
- **Director / Senior Mgmt**: Reads executive summary + dashboard, makes decisions
- **Admin**: Manages users, edits questions, views all visits + audit history
- **Field User**: Creates branch visits, fills 9 segments, generates AI insights

## Core Requirements (static)
1. JWT auth (admin@patrika.com / admin123 pre-seeded)
2. 9 segment forms in Hinglish
3. Per-segment AI analysis (Claude Sonnet 4.6 via Emergent LLM)
4. Executive Summary AI generation
5. Dashboard with KPIs, charts (Recharts) for circulation, ad revenue, recovery ageing
6. Multi-visit support (each branch visit a separate record)
7. Admin: full rights — manage users, edit/add/disable questions per segment
8. Worst 5 Performers + Top 5 Issues + Top 5 Opportunities in Daily Summary
9. Audit trail / History page (who edited what, with positives/negatives notes)
10. Print/PDF export via browser print

## Implemented (2026-02-17)
- Backend: FastAPI + MongoDB
  - Auth: /api/auth/login, /me, /logout (Bearer JWT, 7-day)
  - Users CRUD (admin): /api/users [GET POST PATCH DELETE]
  - Visits CRUD: /api/visits with role-scoped access
  - Segment update: PUT /api/visits/{id}/segment/{key} with optional positives/negatives/note
  - AI: POST /api/visits/{id}/analyze/{key}, POST /api/visits/{id}/executive-summary (Claude Sonnet 4.6)
  - Schema overrides (admin): GET/PUT /api/schemas/{key} — label overrides, disabled fields, custom questions
  - Audit logs: GET /api/audit-logs (auto-recorded on every action)
- Frontend: React 19 + Tailwind + Shadcn/UI + Recharts
  - Pages: Login, VisitsList, VisitDetail (10 tabs: Dashboard, Executive, 8 segments + Summary), AdminUsers, History
  - Components: AppHeader, ProtectedRoute, QuestionEditor, AIInsightPanel, Dashboard, FormPrimitives (RepeaterTable, SegmentForm)
  - Auth context with localStorage Bearer token, axios interceptor
  - Hinglish copy throughout, Swiss/Editorial design (red #B91C1C primary, sharp 1px borders, no rounded corners)

## What's Implemented Status
- ✅ End-to-end visit lifecycle (create → fill → AI analyze → executive summary → audit trail)
- ✅ Role-based access (admin vs user) — backend + frontend gates
- ✅ Worst 5 Performers section + Top 5 Best Agents/Clients added
- ✅ Question Editor (admin): rename/disable defaults, add custom questions per segment
- ✅ Audit trail with positives + negatives + note per save action
- ✅ History page with search and per-visit grouping
- ✅ Backend test suite passing 22/22, frontend E2E pass ~95%

## Prioritized Backlog (P0/P1/P2)
- P1: True PDF export (server-side wkhtmltopdf / weasyprint) — currently browser-print only
- P1: Excel/CSV export for visits + audit logs
- P2: Email Director the executive summary as PDF
- P2: Comparison view across multiple branch visits (trend over time per branch)
- P2: Photo / file upload per segment (e.g. signed agent commitment letter)
- P2: SMS/Push notification when AI flags a critical issue
- P2: Custom segment ordering/hiding per visit type

## Next Tasks
- Server-side PDF export with branded letterhead for Director
- Excel multi-sheet export matching the original 8-sheet workbook
- Multi-branch trend dashboard (year-over-year)
