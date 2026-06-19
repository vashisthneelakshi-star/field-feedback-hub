# Patrika Field Feedback Hub

Director Office branch-visit feedback tool for Patrika Group. Field teams record
data across 9 segments (Branch Head, Circulation, Agent, Hawker, Correspondent,
Advertisement, Ad Agency, Recovery, Daily Summary), with AI-generated per-segment
insights and an executive summary for the Director, plus a dashboard, audit
trail, and admin user management.

## Stack
- **Backend**: FastAPI + MongoDB (Motor), JWT auth, Anthropic Claude for AI insights
- **Frontend**: React 19 + Tailwind + shadcn/ui + Recharts (Create React App via craco)

## Project structure
```
backend/    FastAPI app (server.py)
frontend/   React app
```

## Local setup

### Backend
```bash
cd backend
cp .env.example .env     # fill in MONGO_URL, JWT_SECRET, GEMINI_API_KEY, etc.
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
cp .env.example .env     # set REACT_APP_BACKEND_URL=http://localhost:8000
yarn install
yarn start
```

Default admin (auto-seeded on first backend startup, override via env):
`admin@patrika.com` / `admin123` — **change `ADMIN_PASSWORD` before going live.**

## Deployment

- **Frontend** → Vercel (Root Directory: `frontend`, env var `REACT_APP_BACKEND_URL`)
- **Backend** → Render free tier (no card required) + MongoDB Atlas free M0 (no card required)
- **AI Insights** → Google Gemini API free tier (no card required)

Note: Render's free web service sleeps after 15 min of inactivity (30-60s wake-up on
next request). Use a free uptime pinger (e.g. cron-job.org or UptimeRobot) hitting
`/api/` every ~10 minutes during work hours if this is disruptive.

See the deployment walkthrough shared separately for exact steps.

## Environment variables

### backend/.env.example
| Var | Purpose |
|---|---|
| `MONGO_URL` | MongoDB connection string (Atlas in production) |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Random secret for signing auth tokens |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Auto-seeded admin login |
| `GEMINI_API_KEY` | Powers AI Insights & Executive Summary (free, no card) |

### frontend/.env.example
| Var | Purpose |
|---|---|
| `REACT_APP_BACKEND_URL` | Base URL of the deployed backend (no `/api` suffix) |
