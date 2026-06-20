# Step-by-Step Deployment Guide

## Overview
- **Frontend** → Vercel (free)
- **Backend** → Render (free)
- **Database** → MongoDB Atlas (free M0)
- **AI** → Google Gemini API (free)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Sign up (free)
2. Create a **free M0 cluster** (choose any region)
3. Under **Database Access** → Add a new user with password auth → note the username/password
4. Under **Network Access** → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → Copy the connection string
   - Replace `<password>` with your database user's password
   - Save this as your `MONGO_URL`

---

## Step 2: Get Gemini API Key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google → **Create API Key**
3. Copy and save the key

---

## Step 3: Deploy Backend on Render

1. Go to [render.com](https://render.com) → Sign up (free, no credit card)
2. **New** → **Web Service** → Connect your GitHub repo
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
4. Under **Environment Variables**, add:
   ```
   MONGO_URL        = <your Atlas connection string>
   DB_NAME          = field_feedback_hub
   JWT_SECRET       = <run: openssl rand -hex 32>
   CORS_ORIGINS     = https://your-app.vercel.app  (update after Vercel deploy)
   ADMIN_EMAIL      = admin@patrika.com
   ADMIN_PASSWORD   = <your secure password>
   GEMINI_API_KEY   = <your Gemini key>
   ```
5. Click **Create Web Service** → wait for deployment
6. Copy your Render URL (e.g. `https://field-feedback-hub-abc.onrender.com`)

---

## Step 4: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up (free) → **New Project**
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App (auto-detected)
   - **Build Command**: `yarn build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)
4. Under **Environment Variables**, add:
   ```
   REACT_APP_BACKEND_URL = https://your-render-url.onrender.com
   ```
   (Use your actual Render URL from Step 3, no trailing slash)
5. Click **Deploy**
6. Copy your Vercel URL (e.g. `https://field-feedback-hub.vercel.app`)

---

## Step 5: Update CORS on Render

1. Go back to Render → your service → **Environment**
2. Update `CORS_ORIGINS` to your actual Vercel URL:
   ```
   CORS_ORIGINS = https://field-feedback-hub.vercel.app
   ```
3. Save → Render will auto-redeploy

---

## Step 6: First Login

- Open your Vercel URL
- Login with: `admin@patrika.com` / `<your ADMIN_PASSWORD>`
- Create field user accounts under **Admin → Users**

---

## Tips

- **Render free tier sleeps** after 15 min of inactivity. Use [UptimeRobot](https://uptimerobot.com) to ping `/api/` every 10 minutes.
- **Vercel** auto-deploys every time you push to your GitHub `main` branch.
- **Render** also auto-deploys on push if you enable it in the dashboard.
