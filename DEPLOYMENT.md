# 🚀 Production Hosting & Deployment Guide

This guide explains how to host the **Meeting Room Management & Live Meeting Display System** with a **PostgreSQL** database on any cloud platform or self-hosted server.

---

## 📋 Prerequisites & Environment Variables

Before deploying, ensure you have these two environment variables ready:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `AUTH_SECRET` | Secret key for JWT session encryption | `your-secure-random-32-char-secret-key-2026` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployed website | `https://your-app.vercel.app` |

---

## 🌐 Option 1: Free Cloud Hosting with Vercel + Neon (Recommended)

This is the easiest, fastest, and most cost-effective setup (100% free tier available).

### Step 1: Create a Free PostgreSQL Database on Neon
1. Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2. Click **Create Project** -> Name it `meeting-room-db`.
3. Copy the **Connection String** provided on the dashboard (it starts with `postgresql://...`).

### Step 2: Push Database Schema & Seed Data
From your local terminal, run:
```bash
# Set your Neon connection string in your .env or command line
npx prisma db push

# Seed initial admin users (Pradhan, Rahul, Priya) and rooms
npm run db:seed
```

### Step 3: Deploy Frontend & API to Vercel
1. Push your project code to a GitHub / GitLab repository.
2. Go to [Vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `DATABASE_URL` = *(Your Neon connection string from Step 1)*
   - `AUTH_SECRET` = *(Any secure random string, e.g. `secret-key-production-2026`)*
   - `NEXT_PUBLIC_APP_URL` = `https://your-project.vercel.app`
5. Click **Deploy**. Vercel will automatically build and publish your app!

---

## 🚆 Option 2: 1-Click Fullstack Hosting on Railway

Railway hosts both your Next.js application and your PostgreSQL database in a single project.

1. Go to [Railway.app](https://railway.app) and create a project.
2. Click **New** -> **Database** -> **Add PostgreSQL**.
3. Click **New** -> **GitHub Repo** -> Select your repository.
4. In your Web Service settings, add the variable:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `AUTH_SECRET` = `railway-jwt-secret-meeting-room-2026`
5. Under **Build Command**, enter: `npm run build`
6. Under **Start Command**, enter: `npx prisma db push && npm start`
7. Railway will automatically provision the database and deploy your live URL.

---

## 🎨 Option 3: Hosting on Render

1. Go to [Render.com](https://render.com).
2. Click **New** -> **PostgreSQL** -> Create database `meeting-room-db`.
3. Copy the **Internal Database URL** (or External URL).
4. Click **New** -> **Web Service** -> Connect your GitHub repo.
5. Set:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command**: `npm start`
   - Add Environment Variables (`DATABASE_URL`, `AUTH_SECRET`).

---

## 🐳 Option 4: Self-Hosted Docker / VPS (Ubuntu / Debian / Windows)

A production-ready `Dockerfile` and `docker-compose.yml` are included in the root directory.

### Quick Start with Docker Compose:
```bash
# 1. Clone or extract the project on your VPS
cd meeting-room-system

# 2. Start PostgreSQL container and Next.js container together:
docker compose up -d --build

# 3. Push schema and seed database inside the container:
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```
Your app is now running live at `http://YOUR_SERVER_IP:3000`!

---

## 👥 Default Login Credentials (After Seeding)

| Role | Username / Identifier | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Primary Administrator** | `Pradhan` *(or `pradhan@office.com`)* | `123` | Full Admin CRUD |
| **Secondary Administrator** | `admin@office.com` | `Admin@123` | Full Admin CRUD |
| **Normal Employee User** | `priya@office.com` | `User@123` | Schedule Viewer |
