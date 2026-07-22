# Cloud Native Deployment Guide

This guide covers deploying the ProManager platform using modern managed services:
- **Database:** Supabase (PostgreSQL)
- **Backend API & WebSockets:** Render
- **Frontend App:** Vercel

---

## 1. Database Setup (Supabase / PostgreSQL)

Supabase offers a highly performant managed PostgreSQL database with an excellent free tier.

1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Click **New Project** and select your organization.
3. Name your project (e.g., `promanager-db`), generate a secure database password, and select a region closest to your users.
4. Click **Create new project** (it will take a few minutes to provision).
5. Once your project is ready, click on **Settings** (the gear icon) at the bottom of the left sidebar.
6. Navigate to **Database** settings.
7. Scroll down to the **Connection string** section and select the **URI** tab.
8. Uncheck "Use connection pooling" if you are using direct Prisma connections (or append `?pgbouncer=true` if using pooling).
9. Copy the provided connection string. Replace `[YOUR-PASSWORD]` with the password you generated in step 3. 
   It will look like this:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres`

---

## 2. Backend Deployment (Render)

Render is perfect for Node.js apps that require persistent WebSockets.

1. Go to [Render Dashboard](https://dashboard.render.com/) and connect your GitHub account.
2. Click **New** -> **Web Service**.
3. Select the `promanager` repository.
4. **Configuration:**
   - **Name:** `promanager-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start Command:** `npm run start`
5. **Environment Variables:**
   Add the following variables in the Render dashboard:
   - `DATABASE_URL`: *(Paste the Aiven URI from Step 1)*
   - `JWT_SECRET`: *(Generate a secure 32+ char string)*
   - `JWT_REFRESH_SECRET`: *(Generate another secure string)*
   - `CLIENT_URL`: *(Leave blank for now, we will update this after Vercel gives us a URL)*
6. Click **Create Web Service**. 
7. Once deployed, Render will give you a backend URL (e.g., `https://promanager-backend.onrender.com`).

### 2.1 Seed Data (Optional)
If you want to populate your production database with demo data, you don't need shell access. You can simply run this command from your **local terminal** (make sure your `.env` is temporarily set to the Supabase URL):
```bash
cd backend
npx prisma generate
npx prisma db seed
```

---

## 3. Frontend Deployment (Vercel)

Vercel is the creator of Next.js and provides the best hosting experience for the frontend.

1. Go to [Vercel Dashboard](https://vercel.com/) and connect your GitHub.
2. Click **Add New** -> **Project**.
3. Import the `promanager` repository.
4. **Configuration:**
   - **Project Name:** `promanager-frontend`
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend-v2` *(Important! Click Edit and select the frontend-v2 folder)*
5. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: `https://promanager-backend.onrender.com/api` *(Use the URL Render gave you)*
6. Click **Deploy**.
7. Vercel will build and deploy your frontend, giving you a URL (e.g., `https://promanager-frontend.vercel.app`).

---

## 4. Final Wiring

Now that the Frontend is live, we need to tell the Backend to accept requests from it.

1. Go back to the **Render Dashboard**.
2. Open your `promanager-backend` service.
3. Go to **Environment**.
4. Update the `CLIENT_URL` variable to your new Vercel URL (e.g., `https://promanager-frontend.vercel.app`).
5. Render will automatically redeploy the backend with the new configuration.

**Congratulations! Your enterprise SaaS application is now live! 🎉**
