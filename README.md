# Patrika Field Feedback Hub

Director Office branch-visit feedback tool for Patrika Group. Field teams record data across 9 segments (Branch Head, Circulation, Agent, Hawker, Correspondent, Advertisement, Ad Agency, Recovery, Daily Summary), with AI-generated per-segment insights and an executive summary for the Director, plus a dashboard, audit trail, and admin user management.

## Stack
- **Backend**: FastAPI + MongoDB (Motor), JWT auth, Google Gemini AI for insights
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + Recharts (via CRACO)

## Project Structure
```
field-feedback-hub/
├── backend/          # FastAPI app (server.py)
│   ├── server.py
│   ├── requirements.txt
│   ├── Procfile      # For Render deployment
│   └── .env.example
├── frontend/         # React app
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vercel.json   # Vercel deployment config
│   └── .env.example
└── README.md
```

---

## Local Development Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
# Fill in MONGO_URL, JWT_SECRET, GEMINI_API_KEY, etc.
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
# Set REACT_APP_BACKEND_URL=http://localhost:8000
yarn install
yarn start
```

Default admin credentials (auto-seeded on first backend startup):
- Email: `admin@patrika.com`
- Password: `admin123`

> ⚠️ **Change `ADMIN_PASSWORD` in your `.env` before going live!**

---

## Deployment

### Frontend → Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Set **Root Directory** to `frontend`
4. Add Environment Variable:
   - `REACT_APP_BACKEND_URL` = your backend URL (e.g. `https://your-app.onrender.com`)
5. Deploy

### Backend → Render (Free Tier)

1. Go to [render.com](https://render.com) → New Web Service → Connect your repo
2. Set **Root Directory** to `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables (see table below)

### Database → MongoDB Atlas (Free M0)

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user and whitelist `0.0.0.0/0` for Render access
3. Copy the connection string to `MONGO_URL` in Render env vars

> **Note:** Render free tier sleeps after 15 min of inactivity (30–60s wake-up on next request).  
> Use a free uptime pinger like [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) hitting `/api/` every ~10 minutes during work hours.

---

## Environment Variables

### `backend/.env.example`
| Variable | Purpose |
|---|---|
| `MONGO_URL` | MongoDB Atlas connection string |
| `DB_NAME` | Database name (e.g. `field_feedback_hub`) |
| `JWT_SECRET` | Random secret for signing auth tokens |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. `https://your-app.vercel.app`) |
| `ADMIN_EMAIL` | Auto-seeded admin email |
| `ADMIN_PASSWORD` | Auto-seeded admin password — **change this!** |
| `GEMINI_API_KEY` | Google Gemini API key for AI Insights (free, no card needed) |

### `frontend/.env.example`
| Variable | Purpose |
|---|---|
| `REACT_APP_BACKEND_URL` | Base URL of deployed backend, no trailing slash, no `/api` |

---

## Getting a Free Gemini API Key
1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google → Create API Key
3. Copy and set as `GEMINI_API_KEY` in backend env vars
