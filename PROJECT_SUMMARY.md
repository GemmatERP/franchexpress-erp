# FranchExpress ERP — Full Project Summary

**Business**: Gemmat Enterprises Pvt Ltd  
**App**: FranchExpress ERP (Courier Service Management System)  
**Live URL**: https://shipments.gemmat.net  
**GitHub Repo**: https://github.com/GemmatERP/franchexpress-erp (public)  
**Firebase Project**: `franchexpress-erp`  
**Stack**: Next.js 14, Firebase (Firestore + Auth), Firebase Admin SDK, Vercel  
**Local Path**: `/Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp`

---

## 📋 Full Conversation — Planned & Executed Tasks

---

### ✅ PHASE 1 — Project Setup & Initial Configuration

**Goal**: Bootstrap the ERP application with a working local dev environment.

| # | Task | Status |
|---|------|--------|
| 1 | Cloned the FranchExpress ERP source code into the scratch directory | ✅ Done |
| 2 | Installed all npm dependencies (`npm install`) | ✅ Done |
| 3 | Configured Firebase Client SDK environment variables in `.env.local` | ✅ Done |
| 4 | Configured Firebase Admin SDK service account credentials in `.env.local` | ✅ Done |
| 5 | Started local dev server on `http://localhost:3000` | ✅ Done |

---

### ✅ PHASE 2 — Firebase Auth & User Role Seeding

**Goal**: Set up role-based authentication with pre-seeded users in Firebase Auth and Firestore.

| # | Task | Status |
|---|------|--------|
| 1 | Created 3 Firebase Auth users via Admin SDK | ✅ Done |
| 2 | Seeded Firestore `/users` collection with role documents | ✅ Done |

**Users Created:**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@fe.com` | `Admin@123` |
| Employee | `employee@fe.com` | `Emp@123` |
| Delivery | `delivery@fe.com` | `Del@123` |

---

### ✅ PHASE 3 — Real Data Import from Excel

**Goal**: Import 2,882 live consignment records from the business's Excel tracker.

| # | Task | Status |
|---|------|--------|
| 1 | Parsed `2026 Franch Express Tracker(1).xls` (AWB Tracker sheet) | ✅ Done |
| 2 | Cleared previously imported data | ✅ Done |
| 3 | Filtered rows — skipped any without valid AWB numbers | ✅ Done |
| 4 | Auto-generated sequential SNOs: `FE-0001` → `FE-2882` | ✅ Done |
| 5 | Batch-imported 2,882 consignment documents (500 docs/batch) | ✅ Done |
| 6 | Updated Firestore `/counters/bookingCounter` document to `2882` | ✅ Done |

---

### ✅ PHASE 4 — Firestore Security Rules

**Goal**: Protect the database with role-based access control rules.

| # | Task | Status |
|---|------|--------|
| 1 | Designed `firestore.rules` with `isAdmin()`, `isEmployee()`, `isAuth()` functions | ✅ Done |
| 2 | Applied rules: Employees can create/update consignments, Admins can delete | ✅ Done |
| 3 | Provided deploy instructions for Firebase Console | ✅ Done |

---

### ✅ PHASE 5 — Firestore Read Optimisation (50K Free Tier Limit Fix)

**Problem**: The dashboard was fetching all consignments on every page load, burning through the free Firestore tier's 50,000 daily reads limit with a single user.

**Goal**: Redesign data-fetching architecture to be extremely read-efficient.

| # | Task | Status |
|---|------|--------|
| 1 | Created `/app/api/consignments/stats/route.js` — dedicated stats API | ✅ Done |
| 2 | Used Firestore `count()` aggregation queries for KPIs (1 read per count instead of N reads) | ✅ Done |
| 3 | Added 5-minute server-side cache (module-level) on the stats API | ✅ Done |
| 4 | Added `export const dynamic = 'force-dynamic'` to prevent static rendering | ✅ Done |
| 5 | Updated `/app/api/consignments/route.js` — default 30-day window + cursor-based pagination (limit=50) | ✅ Done |
| 6 | Updated `/app/api/consignments/[id]/route.js` — cache invalidation on write (PUT/DELETE) | ✅ Done |
| 7 | Updated `/hooks/useConsignments.js` — added `fetchDashboardStats()` and `loadMoreConsignments()` | ✅ Done |
| 8 | Updated `/app/dashboard/page.jsx` — calls `fetchDashboardStats()` instead of full collection fetch | ✅ Done |
| 9 | Updated `/app/dashboard/delivery/page.jsx` — passes today's date filter | ✅ Done |

**Estimated Read Reduction**: ~99.96% fewer Firestore reads on dashboard load.

---

### ✅ PHASE 6 — Next.js Viewport Metadata Warning Fix

**Problem**: Build logs showed warnings on every page:
```
⚠ Unsupported metadata viewport is configured in metadata export. Please move it to viewport export instead.
```

| # | Task | Status |
|---|------|--------|
| 1 | Moved `viewport` config out of `metadata` export in `app/layout.jsx` | ✅ Done |
| 2 | Created separate `export const viewport = { width: 'device-width', initialScale: 1 }` | ✅ Done |

---

### ✅ PHASE 7 — GitHub Repository Setup & Vercel Deployment

**Problem**: Vercel Hobby plan blocks deployments from private GitHub repos not owned by the deploying account.

| # | Task | Status |
|---|------|--------|
| 1 | Created GitHub org `GemmatERP` | ✅ Done |
| 2 | Pushed repo to `https://github.com/GemmatERP/franchexpress-erp` | ✅ Done |
| 3 | Made repo **public** (required by Vercel Hobby plan for non-owner accounts) | ✅ Done |
| 4 | Authenticated Vercel CLI under `gemmat-s-projects` team | ✅ Done |
| 5 | Linked project to `gemmat-s-projects/franchexpress-erp` on Vercel | ✅ Done |
| 6 | Deployed to production using `npx vercel --prod --yes` | ✅ Done |
| 7 | Aliased production URL to custom domain `https://shipments.gemmat.net` | ✅ Done |

---

### ✅ PHASE 8 — Next.js Build Error Fix (Dynamic Server Usage)

**Problem**: Vercel's build pipeline threw:
```
Stats API Error: Dynamic server usage: Route /api/consignments/stats couldn't be rendered
statically because it accessed `request.headers`.
```
Root cause: `route.js` files were cross-importing each other (e.g., `[id]/route.js` imported `stats/route.js`), causing Next.js static analysis to try to pre-render the stats endpoint at build time.

| # | Task | Status |
|---|------|--------|
| 1 | Created `/lib/stats-cache.js` — a dedicated shared module for cache state | ✅ Done |
| 2 | Exported `getCachedStats()`, `setCachedStats()`, `invalidateStatsCache()` from shared module | ✅ Done |
| 3 | Refactored `stats/route.js` to import from `lib/stats-cache.js` (removed inline state variables) | ✅ Done |
| 4 | Refactored `consignments/route.js` — changed import from `./stats/route` to `../../../lib/stats-cache` | ✅ Done |
| 5 | Refactored `consignments/[id]/route.js` — same import fix | ✅ Done |
| 6 | Added `export const dynamic = 'force-dynamic'` to all 3 route files | ✅ Done |
| 7 | Verified local `npm run build` — clean build, all 11 pages generated without errors | ✅ Done |

---

### ✅ PHASE 9 — Vercel Speed Insights & Analytics Integration

**Goal**: Add Vercel's built-in performance monitoring and usage analytics.

| # | Task | Status |
|---|------|--------|
| 1 | Installed `@vercel/speed-insights` package | ✅ Done |
| 2 | Installed `@vercel/analytics` package | ✅ Done |
| 3 | Imported `<SpeedInsights />` from `@vercel/speed-insights/next` in `app/layout.jsx` | ✅ Done |
| 4 | Imported `<Analytics />` from `@vercel/analytics/next` in `app/layout.jsx` | ✅ Done |
| 5 | Rendered both components inside the `<body>` tag of `RootLayout` | ✅ Done |
| 6 | Committed all changes and pushed to GitHub | ✅ Done |
| 7 | Deployed final build to Vercel production (`npx vercel --prod --yes`) | ✅ Done |
| 8 | Verified live site at `https://shipments.gemmat.net` loads correctly | ✅ Done |

---

### ⏳ PHASE 10 — FranchExpress API Bulk Status Auto-Sync

**Goal**: Implement an auto-sync system to fetch live shipment updates from the FranchExpress tracking API and display a detailed tracking timeline in the ERP.

| # | Task | Status |
|---|------|--------|
| 1 | Analyze FranchExpress tracking API response fields & UI mapping | ✅ Done |
| 2 | Design implementation plan for bulk status sync and tracking UI | ✅ Done |
| 3 | Create admin sync API endpoint (`/api/consignments/sync`) | ⏳ Pending |
| 4 | Create admin bulk sync dashboard page (`/dashboard/sync`) | ⏳ Pending |
| 5 | Modify `lib/tracking.js` to parse live statuses | ⏳ Pending |
| 6 | Update consignment list details to display rich tracking timeline | ⏳ Pending |

---

## 📂 Key Files Modified / Created

| File | Change |
|------|--------|
| `app/layout.jsx` | Added SpeedInsights + Analytics; separated `viewport` export |
| `app/dashboard/page.jsx` | Uses `fetchDashboardStats()` instead of full collection fetch |
| `app/dashboard/delivery/page.jsx` | Date-filtered delivery fetch |
| `app/api/consignments/route.js` | 30-day default, cursor pagination, `force-dynamic`, cache import fix |
| `app/api/consignments/[id]/route.js` | Cache invalidation import fix, `force-dynamic` |
| `app/api/consignments/stats/route.js` | New dedicated stats API with `count()` aggregations + 5-min cache |
| `hooks/useConsignments.js` | `fetchDashboardStats()` + `loadMoreConsignments()` helpers |
| `lib/stats-cache.js` | **[NEW]** Shared cache state module (decoupled from routes) |
| `firestore.rules` | Role-based Firestore security rules |

---

## 🏗 Architecture Overview

```
Browser (Next.js Client)
        │
        ▼
/hooks/useConsignments.js
    ├── fetchDashboardStats()  →  GET /api/consignments/stats
    │                               ├── count() x2 (1 read each)
    │                               ├── today's docs fetch
    │                               ├── 14-day chart data fetch
    │                               └── 5-min module-level cache
    │
    └── loadMoreConsignments() →  GET /api/consignments?limit=50&cursor=...
                                    └── 30-day default window, paginated

Write operations (POST/PUT/DELETE) → invalidateStatsCache() → lib/stats-cache.js
```

---

## 🔧 Deployment Commands

```bash
# Local dev
npm run dev

# Local production build check
npm run build

# Deploy to Vercel production
npx vercel --prod --yes
```

---

## ⚠️ Known / Pending Items

---

### 1. 📱 WhatsApp Integration — Permanent System User Token

**Priority**: High  
**Status**: Partially built — notification code exists but token is expired/temporary

**Background**:  
The WhatsApp Business API integration was partially implemented in `lib/notifications.js` to send automated shipment status notifications to consignees. A temporary 24-hour access token was used during development, which has likely expired by now.

**What's Working**:
- `lib/notifications.js` — notification dispatch logic is built
- `app/api/notify/route.js` — API endpoint accepts `consigneePhone`, `awbNumber`, `consigneeName`, `deliveryStatus`
- Called automatically when delivery status is updated

**What's Needed**:
1. Log in to [Meta Business Manager](https://business.facebook.com/) using the business account
2. Navigate to **WhatsApp → Configuration → System Users**
3. Create or locate the **System User** (not a personal user)
4. Generate a **Permanent Token** with `whatsapp_business_messaging` permission
5. Update `.env.local`:
   ```env
   WHATSAPP_TOKEN=your_permanent_system_token_here
   WHATSAPP_PHONE_ID=your_phone_number_id_here
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id_here
   ```
6. Redeploy to Vercel and update the environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**

**Important**: Never commit the token to GitHub. The repo is public, so `.env.local` must stay gitignored (it already is).

---

### 2. 🔒 npm Audit Vulnerabilities — 21 Security Issues

**Priority**: Medium  
**Status**: Non-blocking for functionality, but should be addressed

**Summary**: `npm audit` reported:
- 18 Moderate
- 2 High  
- 1 Critical

**How to inspect**:
```bash
cd /Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp
npm audit
```

**Safe fixes (non-breaking)**:
```bash
npm audit fix
```

**Aggressive fixes (may break things — test after)**:
```bash
npm audit fix --force
```

**Recommended approach**:
1. Run `npm audit` first to read the full report
2. Identify which package has the **critical** vulnerability
3. Check if the vulnerable package has a patched version — update it in `package.json`
4. Run `npm run build` after fixing to confirm nothing broke
5. Re-deploy

> Most vulnerabilities in Next.js projects come from transitive dependencies (dependencies of dependencies). If the fix requires breaking changes, you may need to wait for the upstream package maintainer to release a patch.

---

### 3. 🛡️ Firestore Security Rules Deployment

**Priority**: High  
**Status**: Rules file exists locally — needs manual deployment to Firebase

**Background**:  
The `firestore.rules` file was written and reviewed, but deployment to the live Firebase project requires either the Firebase CLI or the Firebase Console. Since the Spark (free) plan was used, the CLI may need re-authentication.

**Rules Summary** (in `firestore.rules`):
- `/consignments/{id}` — **Read**: any authenticated user | **Create/Update**: Employee or Admin | **Delete**: Admin only
- `/users/{uid}` — **Read**: own profile or Admin | **Write**: Admin only
- `/counters/{doc}` — **Read/Write**: Employee or Admin

**Option A — Firebase Console (Easiest, No CLI needed)**:
1. Go to [Firebase Console](https://console.firebase.google.com/) → Select `franchexpress-erp` project
2. Navigate to **Build → Firestore Database → Rules tab**
3. Copy-paste the contents of [`firestore.rules`](file:///Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp/firestore.rules)
4. Click **Publish**

**Option B — Firebase CLI**:
```bash
npx -y firebase-tools@latest login
npx firebase use franchexpress-erp
npx firebase deploy --only firestore:rules
```

> ⚠️ Without deploying these rules, the Firestore database is potentially using the default **open rules** (`allow read, write: if true`) which exposes all data publicly.

---

### 4. 🖼️ Favicon 404 — Missing Browser Icon

**Priority**: Low  
**Status**: Minor UX issue — does not affect functionality

**Problem**:  
The browser console shows a `favicon.ico` 404 error because no favicon file exists in the `/public/` directory. This causes an extra failed network request on every page load.

**Fix**:
1. Create or download a 32×32 or 64×64 `.ico` or `.png` file
2. Place it at:
   ```
   /Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp/public/favicon.ico
   ```
3. Optionally, add a high-res PNG for modern browsers in `app/layout.jsx`:
   ```jsx
   export const metadata = {
     title: 'FranchExpress ERP - Courier Service Management',
     description: '...',
     icons: {
       icon: '/favicon.ico',
       apple: '/apple-touch-icon.png',
     },
   };
   ```
4. Commit and redeploy

> You can generate a free favicon from your logo at [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/).

---

### 5. 📦 GitHub Remote URL Warning (Minor)

**Priority**: Low  
**Status**: Informational — git pushes still work correctly

**Problem**:  
Every `git push` shows:
```
remote: This repository moved. Please use the new location:
remote:   https://github.com/GemmatERP/franchexpress-erp.git
To https://github.com/MK5169/franchexpress-erp.git
```

This is because the remote URL in the local git config still points to the old `MK5169` account URL instead of the new `GemmatERP` org URL.

**Fix**:
```bash
cd /Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp
git remote set-url origin https://github.com/GemmatERP/franchexpress-erp.git
```

Verify with:
```bash
git remote -v
```

---

### 6. 🔄 Bulk Status Auto-Sync & Tracking Timeline

**Priority**: High  
**Status**: Planned & Analyzed — Implementation Plan ready

**Background**:  
The business needs to track the latest delivery status from the FranchExpress tracking API (`POST https://franchexpress.com/proxy.php`) for all pending consignments in Firestore and display a detailed tracking timeline to users.

**What's Planned**:
1. Add an admin page (`/dashboard/sync`) to trigger bulk updates.
2. Develop a background batch synchronizer calling the proxy endpoint with a rate limit.
3. Enhance the tracking modal with origin/destination details, consignment description, and a styled vertical status timeline mirroring the FranchExpress website.

---

*Last updated: 2026-06-16*
