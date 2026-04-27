# Deployment Guide - Klypup Pricing Dashboard

This guide explains how to deploy the full-stack application using **Railway** (Backend) and **Vercel** (Frontend).

## 1. Backend Deployment (Railway)

1.  **Log in to Railway**: Go to [railway.app](https://railway.app/) and create an account.
2.  **Create New Project**: Click "New Project" -> "Deploy from GitHub repo".
3.  **Select Repository**: Choose your `pricing-dashboard` repo.
4.  **Configure Root Directory**: In the settings, set the **Root Directory** to `backend`.
5.  **Add Environment Variables**:
    *   `DATABASE_URL`: `postgresql://neondb_owner:npg_3r5mWTkJhjeD@ep-late-hat-aoegf8xu-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
    *   `SECRET_KEY`: (Any random long string)
    *   `CORS_ORIGINS`: `https://your-frontend-name.vercel.app` (Add this *after* you deploy to Vercel)
    *   `GROQ_API_KEY`: (Your Groq API Key)
    *   `PORT`: `8000` (Railway will usually set this automatically)
6.  **Deploy**: Railway will detect the `Procfile` and start the FastAPI server.

---

## 2. Frontend Deployment (Vercel)

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com/) and create an account.
2.  **Add New Project**: Click "Add New" -> "Project".
3.  **Select Repository**: Import your `pricing-dashboard` repo.
4.  **Configure Project**:
    *   **Root Directory**: Set to `frontend`.
    *   **Framework Preset**: Next.js.
5.  **Add Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: (The URL Railway gives you, e.g., `https://backend-production.up.railway.app`)
6.  **Deploy**: Click "Deploy".

---

## 3. Post-Deployment Steps

1.  Once Vercel gives you a domain (e.g., `https://pricing-dashboard.vercel.app`), go back to your **Railway Backend Settings**.
2.  Update the `CORS_ORIGINS` variable to include your Vercel domain.
3.  (Optional) Run migrations or seed the database if needed. Since you're using Neon, the tables will be created automatically on the first run of the app (due to `models.Base.metadata.create_all(bind=engine)` in `main.py`).

### Note on Neon PostgreSQL
We have added `psycopg2-binary` to `requirements.txt` and updated `database.py` to handle the `postgresql://` protocol and SSL requirements for Neon.
