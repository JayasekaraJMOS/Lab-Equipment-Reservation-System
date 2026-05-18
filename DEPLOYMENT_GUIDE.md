# EE4207 – Full-Stack Deployment Guide

This guide will walk you through hosting your **Smart Lab Equipment Reservation System (LabReserve)** live on the web for free using **GitHub** and **Render** (or Vercel).

---

## 🚀 Recommended Method: 1-Click Render Cloud Deployment (Free)

With our root `package.json` and `render.yaml` configurations, the frontend and backend can be hosted together on one URL. Configure a MongoDB Atlas database for persistent data storage.

### Step 1: Initialize Git & Push to GitHub

1. Open your terminal in the project folder (`c:\JMOS\Projects\Academic_projects\Web Development`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit for EE4207 LabReserve full-stack application"
   ```

2. Create a new repository on [GitHub.com](https://github.com/new) named `ee4207-lab-equipment-reservation`.

3. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ee4207-lab-equipment-reservation.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Deploy Free on Render (Render.com)

1. Go to [Render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** $\rightarrow$ Select **Blueprint**.
3. Connect your `ee4207-lab-equipment-reservation` GitHub repository.
4. Render will automatically detect `render.yaml` and configure:
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
5. Click **Apply**. Render will build the React SPA and start your Node.js API server!
6. In the Render service environment settings, set `MONGODB_URI` to your MongoDB Atlas connection string. Set a strong `JWT_SECRET` as well.
7. Once the service is deployed with those environment variables, Render will give you your live application URL (e.g. `https://ee4207-lab-reserve.onrender.com`).

---

## 🌟 Alternative Method: Split Frontend (Vercel) + Backend (Render)

If you prefer deploying the frontend on **Vercel**:

1. **Backend (Render Web Service)**:
   * Build Command: `cd backend && npm install`
   * Start Command: `cd backend && npm start`
   * Environment Variables: Set `MONGODB_URI` to your MongoDB Atlas connection string and configure a strong `JWT_SECRET`.
2. **Frontend (Vercel)**:
   * Framework Preset: `Vite`
   * Root Directory: `frontend`
   * Build Command: `npm run build`
   * Output Directory: `dist`
   * Environment Variable: Add `VITE_API_BASE_URL` pointing to your live Render backend URL.

---

### 📊 Verification After Deployment
Once deployed, open your live URL in a web browser:
* Verify live equipment catalog loads.
* Click **🎓 Student Demo**, **🔬 Lab Tech Demo**, or **⚡ Admin Demo** buttons to verify role login.
* Submit a test reservation slot to test anti-collision validation.
