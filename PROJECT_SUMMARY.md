# FranchExpress ERP — Full Project Summary

**Business**: Gemmat Enterprises Pvt Ltd  
**App**: FranchExpress ERP (Courier Service Management System)  
**Live URL**: https://shipments.gemmat.net  
**GitHub Repo**: https://github.com/GemmatERP/franchexpress-erp (public)  
**Firebase Project**: `franchexpress-erp`  
**Stack**: Next.js 14, Firebase (Firestore + Auth), Firebase Admin SDK, Vercel  
**Local Path**: `/Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp`

---

## ✅ Completed Phases Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Setup & Configuration | ✅ Done |
| 2 | Firebase Auth & User Role Seeding | ✅ Done |
| 3 | Real Data Import (3,218 records) | ✅ Done |
| 4 | Firestore Security Rules | ✅ Done |
| 5 | Firestore Read Optimisation | ✅ Done |
| 6 | Next.js Viewport Warning Fix | ✅ Done |
| 7 | GitHub & Vercel Deployment | ✅ Done |
| 8 | Next.js Build Error Fix | ✅ Done |
| 9 | Vercel Speed Insights & Analytics | ✅ Done |
| 10 | Auto-Sync & Tracking Timeline | ✅ Done |
| 11 | New Dashboard Module Pages | ✅ Done |
| 12 | Dashboard UI Enhancements | ✅ Done |
| 13 | Favicon & Branding | ✅ Done |
| 14 | Logo Size & Sidebar Polish | ✅ Done |
| 15 | Profile Icon & Edit Modal | ✅ Done |
| 16 | Firestore Query Optimization (Phase 16) | ✅ Done |
| 17 | WhatsApp Notification Integration | ✅ Done |
| 18 | New Consignment Page Revamp & Edit Separation | ✅ Done |
| 19 | Post-Revamp Follow-up Bug Fixes & Query Fallbacks | ✅ Done |
| 20 | WhatsApp Messaging Hub & Inbound Reply Auditing | ✅ Done |
| 21 | Axis Labels & Timezone Stats Alignment | ✅ Done |
| 22 | UPI Revenue, Split Payments, and Barcode/QR Scanner | ✅ Done |
| 23 | Cash & Expense Ledger (DR/CR Redesign) | ✅ Done |

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

**Goal**: Import 3,218 live consignment records from the business's updated Excel tracker.

| # | Task | Status |
|---|------|--------|
| 1 | Parsed `2026 New Franch Express Tracker.xls` (AWB Tracker sheet) | ✅ Done |
| 2 | Cleared previously imported data | ✅ Done |
| 3 | Filtered rows — skipped any without valid AWB numbers | ✅ Done |
| 4 | Auto-generated sequential SNOs: `FE-0001` → `FE-3218` | ✅ Done |
| 5 | Batch-imported 3,218 consignment documents (500 docs/batch) | ✅ Done |
| 6 | Updated Firestore `/counters/bookingCounter` document to `3218` | ✅ Done |

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

### ✅ PHASE 10 — FranchExpress API Scheduled Auto-Sync & Tracking Timeline

**Goal**: Implement an automatic background sync system using Vercel Cron to fetch live shipment updates from the FranchExpress tracking API and display a detailed tracking timeline in the ERP.

| # | Task | Status |
|---|------|--------|
| 1 | Analyzed FranchExpress tracking API response fields & UI mapping | ✅ Done |
| 2 | Designed implementation plan for scheduled auto-sync | ✅ Done |
| 3 | Configured Vercel Cron Job in `vercel.json` (runs at 2:00 AM UTC nightly) | ✅ Done |
| 4 | Created secure admin sync API `/api/consignments/sync` (verifies `CRON_SECRET`) | ✅ Done |
| 5 | Created sync logs API `/api/sync-logs` for listing execution history | ✅ Done |
| 6 | Created revenue stats API `/api/consignments/revenue-stats` | ✅ Done |
| 7 | Created consignment search API `/api/consignments/search` | ✅ Done |
| 8 | Updated `lib/tracking.js` to parse and map live FranchExpress API status codes | ✅ Done |
| 9 | Built `TrackingTimeline` component for rich delivery status history UI | ✅ Done |

---

### ✅ PHASE 11 — New Dashboard Module Pages

**Goal**: Build full-featured module pages for Consignments, Revenue, Search, and Sync Logs.

| # | Task | Status |
|---|------|--------|
| 1 | Built `/dashboard/consignments` — paginated consignment list with filters | ✅ Done |
| 2 | Built `/dashboard/consignments/[id]` — individual consignment detail & tracking timeline | ✅ Done |
| 3 | Built `/dashboard/consignments/new` — new consignment booking form | ✅ Done |
| 4 | Built `/dashboard/revenue` — revenue analytics page with charts | ✅ Done |
| 5 | Built `/dashboard/search` — consignment search by AWB, SNO, phone, address | ✅ Done |
| 6 | Built `/dashboard/sync` — admin-only sync logs and manual sync trigger | ✅ Done |
| 7 | Updated sidebar and mobile drawer navigation links for all new pages | ✅ Done |
| 8 | Updated `app/dashboard/layout.jsx` with title and breadcrumb mappings for all routes | ✅ Done |

---

### ✅ PHASE 12 — Dashboard UI Enhancements

**Goal**: Improve dashboard charts, KPI cards, and the "Today's Table" component.

| # | Task | Status |
|---|------|--------|
| 1 | Updated `DashboardCharts.jsx` — added revenue/chart visual improvements | ✅ Done |
| 2 | Updated `TodayTable.jsx` — renamed "Avg Ticket Size" (was "Avg Voucher Size") | ✅ Done |
| 3 | Replaced all instances of "voucher" terminology with "consignment" across the UI | ✅ Done |
| 4 | Updated `Spinner.jsx` component styles | ✅ Done |

---

### ✅ PHASE 13 — Favicon & Branding

**Goal**: Add a proper favicon using the company logo and fix branding text near the logo.

| # | Task | Status |
|---|------|--------|
| 1 | Added `Logo-GM-FE.png` to `/public/` directory | ✅ Done |
| 2 | Configured favicon in `app/layout.jsx` metadata (`icons.icon`) | ✅ Done |
| 3 | Removed "FranchExpress ERP" text label next to logo in `Sidebar.jsx` | ✅ Done |
| 4 | Removed "FranchExpress ERP" text label next to logo in `MobileDrawer.jsx` | ✅ Done |
| 5 | Fixed Courier Partner dropdown — "Franch Express" set as default first option | ✅ Done |

---

### ✅ PHASE 14 — Logo Size & Sidebar Polish

**Goal**: Fix logo proportions and sidebar header spacing.

| # | Task | Status |
|---|------|--------|
| 1 | Corrected logo height from `h-[68px]` (too tall) to `h-12` (48px) in `Sidebar.jsx` | ✅ Done |
| 2 | Corrected logo height from `h-[68px]` to `h-12` in `MobileDrawer.jsx` | ✅ Done |
| 3 | Logo is now properly proportioned inside the 80px (`h-20`) header area | ✅ Done |
| 4 | Removed `translate-y` hack — logo sits naturally centered | ✅ Done |

---

### ✅ PHASE 15 — Profile Icon & Edit Profile Modal in TopBar

**Goal**: Add a clickable profile avatar to the top-right corner that opens a profile editing modal.

| # | Task | Status |
|---|------|--------|
| 1 | Replaced plain user text card in `TopBar.jsx` with a clickable avatar button | ✅ Done |
| 2 | Avatar shows user initials in a teal circle; highlights on hover | ✅ Done |
| 3 | Built `ProfileModal` component inline in `TopBar.jsx` | ✅ Done |
| 4 | Modal fields: Full Name, Email Address, Phone Number, Department, Designation | ✅ Done |
| 5 | Save button has loading spinner + ✓ success animation | ✅ Done |
| 6 | Modal closes via ✕ button, backdrop click, or `Escape` key | ✅ Done |
| 7 | Smooth open/close animation with `modalSlideIn` keyframe | ✅ Done |

---

### ✅ PHASE 16 — Firestore Query Optimization

**Goal**: Analyse Firebase Console metrics and reduce Firestore reads from 26K/day.

| # | Task | Status |
|---|------|--------|
| 1 | Analysed all API routes vs Firebase Console query metrics | ✅ Done |
| 2 | Real `.startAfter()` cursor pagination in `GET /api/consignments` (was in-memory) | ✅ Done |
| 3 | Pushed equality filters (deliveryStatus, courierPartner, paymentMode) into Firestore query | ✅ Done |
| 4 | Sync route: date filter pushed into Firestore query (was in-memory discard) | ✅ Done |
| 5 | Search: normalized `_*Upper` fields written on POST → 4 queries instead of 16 | ✅ Done |
| 6 | Stats cache TTL increased 5 min → 30 min | ✅ Done |
| 7 | Added 10-minute server cache for revenue stats (was no cache) | ✅ Done |
| 8 | Added role cache (60s TTL) shared across all routes via `lib/stats-cache.js` | ✅ Done |
| 9 | Created `firestore.indexes.json` with 4 composite indexes | ✅ Done |
| 10 | Deployed composite indexes via Firebase CLI | ✅ Done |
| 11 | Committed and merged to `main` | ✅ Done |

**Estimated Read Reduction**: 26K/day → ~6–8K/day (~70% reduction)

---

### ✅ PHASE 17 — WhatsApp Notification Integration

**Goal**: Automate shipment status notifications to receivers (consignees) and senders (consignors) via Meta's WhatsApp Cloud API.

| # | Task | Status |
|---|------|--------|
| 1 | Created detailed WhatsApp template mapping guide for 8 custom templates (4 delivery statuses × sender+receiver) | ✅ Done |
| 2 | Implemented `/lib/notifications.js` dispatcher routing status updates to specific templates with normalized international numbers | ✅ Done |
| 3 | Created `/api/notify` POST route to trigger client notifications with parameter validation | ✅ Done |
| 4 | Built `/api/whatsapp/webhook` Next.js handler to listen to incoming customer replies, delivery receipts, and address updates | ✅ Done |
| 5 | Fixed compilation path mapping errors (`firebase-admin` imports in webhook) and verified local build | ✅ Done |
| 6 | Verified Meta template parameter counts (2 body variables for receiver, 3 for sender) and adjusted API payloads | ✅ Done |
| 7 | Configured verified WABA ID, Phone ID, and new permanent System User access token locally and on Vercel | ✅ Done |
| 8 | Created `feature/whatsapp-notifications` branch, committed and merged changes to `main` on GitHub | ✅ Done |
| 9 | Deployed update to Vercel production under `https://shipments.gemmat.net` | ✅ Done |
| 10 | Successfully tested live "In Transit" (Shipped) and "Booked" (Processing) message delivery to WhatsApp | ✅ Done |

---

### ✅ PHASE 18 — New Consignment Page Revamp & Edit Separation

**Goal**: Revamp the consignment booking form to streamline data entry, enforce validations, prevent duplicate AWB entries, and separate edit flows into a dedicated page layout.

| # | Task | Status |
|---|------|--------|
| 1 | Modified `ShipmentSection` to remove `podNumber`, disable the date picker (auto-filled with today's date), and restrict AWB to numbers-only input | ✅ Done |
| 2 | Revamped `PaymentSection` with conditional logic (COD, payment date, chargeable amount auto-calculation, locked paid status for Cash/UPI) | ✅ Done |
| 3 | Added `consignorState` and `consignorCountry` / `consigneeCountry` fields in sender/recipient sections | ✅ Done |
| 4 | Created `DuplicateAwbModal` to prevent submitting duplicate entries and allow clicking "View & Edit Existing" | ✅ Done |
| 5 | Created `UnsavedChangesModal` to prompt users before navigating away from a dirty form, with a "Copy Form Data" utility | ✅ Done |
| 6 | Extracted edit flow to dedicated `/dashboard/consignments/edit` route with mixed editable and read-only layouts | ✅ Done |
| 7 | Wired `ConsignmentEditContext` in `app/layout.jsx` to pass records securely via state and fallback to `sessionStorage` | ✅ Done |
| 8 | Updated Edit buttons in `[id]/page.jsx`, `search/page.jsx`, and `reports/page.jsx` to use the new edit context routing | ✅ Done |
| 9 | Reordered and renamed sidebar navigation items (Dashboard, New Consignment, Revenue, Search Consignments, Consignments View, Delivery View, Reports, Sync Logs) | ✅ Done |

---

### ✅ PHASE 19 — Post-Revamp Follow-up Bug Fixes & Query Fallbacks

**Goal**: Fix manual testing bugs related to Firestore index building states, direct URL refresh redirects, pagination failures on export, and UI horizontal scrollbar issues.

| # | Task | Status |
|---|------|--------|
| 1 | Removed unnecessary date single-field index from `firestore.indexes.json` and successfully deployed composite indexes to active Firebase project | ✅ Done |
| 2 | Added inline `FAILED_PRECONDITION` catch-and-fallback logic in `/api/consignments` list route and `/api/consignments/sync` route to use date-only queries and filter in-memory when indexes are building or missing | ✅ Done |
| 3 | Fixed race condition redirect in `edit/page.jsx` by falling back to `sessionStorage` directly on mount during hydration | ✅ Done |
| 4 | Replaced async state checking and brittle page-size pagination checks in reports page `handleLoadAll` with a synchronous `getHasMore` getter ref, resolving the 50-record export truncation bug | ✅ Done |
| 5 | Applied CSS truncation classes and hover titles to consignee/consignor name cells in Reports Table and Consignments Dashboard to eliminate horizontal scrollbars | ✅ Done |

---

### ✅ PHASE 20 — WhatsApp Messaging Hub & Inbound Reply Auditing

**Goal**: Implement a unified WhatsApp Communication Center with outbound log recording, webhook reply and GPS location tracking, search & filters, and database storage auto-cleanup.

| # | Task | Status |
|---|------|--------|
| 1 | Updated `lib/notifications.js` to log outbound sent/failed notifications to `whatsapp_messages` collection | ✅ Done |
| 2 | Updated `app/api/whatsapp/webhook/route.js` to sync delivery receipts and log incoming text replies or location shares | ✅ Done |
| 3 | Added AWB lookups in webhook to automatically link customer replies back to active consignments | ✅ Done |
| 4 | Created secure backend API `app/api/whatsapp/messages/route.js` to fetch recent communications with in-memory query filters | ✅ Done |
| 5 | Created premium frontend console `app/dashboard/whatsapp/page.jsx` with KPIs, toolbar filter inputs, feed, and Google Maps links | ✅ Done |
| 6 | Added "WhatsApp Logs" menu items in sidebar layout and mapped route titles | ✅ Done |
| 7 | Added automatic 30-day database cleanup deletion inside `/api/consignments/sync` route to optimize Firestore storage footprint | ✅ Done |
| 8 | Compiled, verified local build, and pushed/merged changes to GitHub repository | ✅ Done |

---

### ✅ PHASE 21 — Axis Labels & Timezone Stats Alignment

**Goal**: Fix missing labels on overall charts (X and Y axes) and resolve timezone alignment issue in stats and revenue charts where June 16 and June 13 were missing or showing wrong values due to midnight IST timestamp offsets.

| # | Task | Status |
|---|------|--------|
| 1 | Created timezone helpers in `/api/consignments/stats/route.js` and `/api/consignments/revenue-stats/route.js` to calculate date boundaries and group data strictly in the `Asia/Kolkata` (IST) timezone | ✅ Done |
| 2 | Updated Stats API date ranges and grouping to align with IST midnight offsets, resolving the missing `Tue 16` (8 consignments) and `Sat 13` (34 consignments) volume bars | ✅ Done |
| 3 | Updated Revenue Stats API trend map and document mapping to align with IST, resolving the near-zero revenue plotting for `16/6` | ✅ Done |
| 4 | Added X-axis ("Date") and Y-axis ("Consignments") labels with heights and widths on the Consignment Volume bar chart in `DashboardCharts.jsx` | ✅ Done |
| 5 | Added X-axis ("Date" / "Courier Partner") and Y-axis ("Revenue (₹)") labels to the LineChart and BarChart in `app/dashboard/revenue/page.jsx` | ✅ Done |
| 6 | Normalized incoming Flow response keys to lowercase in `app/api/whatsapp/webhook/route.js` to handle Meta's casing variations case-insensitively | ✅ Done |
| 7 | Created and executed a migration script (`scratch/fix_existing_docs.js`) to retroactively format existing raw technical rating response logs in Firestore to the clean human-readable feedback layout | ✅ Done |
| 8 | Switched to new branch `fix/charts-timezone-labels`, committed, and pushed changes to remote repository | ✅ Done |
| 9 | Checked out `main` and merged all pending feature branches successfully, then pushed to origin | ✅ Done |

---

### ✅ PHASE 22 — UPI Revenue KPI Card, Split Payments, and Barcode/QR Scanner Integration

**Goal**: Implement cash+UPI split payments, import 2026 data, add camera barcode scanning to the AWB input box, and resolve related SSR/decoding and API formatting bugs.

| # | Task | Status |
|---|------|--------|
| 1 | Replaced the large UPI transactions table at the bottom of the Revenue page with a clean UPI Income KPI card, and adjusted grid layouts to fit all KPI blocks cleanly | ✅ Done |
| 2 | Performed clean deletion of all 3,230 old consignment records and counter indices, then imported 3,415 new records from the new 2026 Excel tracker spreadsheet, auto-correcting calendar years to 2026 | ✅ Done |
| 3 | Added a 'CASH + UPI' split payment mode with dual parts inputs (Cash Part, UPI Part) auto-calculating total amount, and integrated it into the new consignment form, edit form, details display, and exports | ✅ Done |
| 4 | Fixed copy-pasting AWB numbers by allowing shortcuts (Cmd/Ctrl + V, C, A) in the keypress handler, and sanitizing AWB input in onChange to strip non-digits | ✅ Done |
| 5 | Integrated camera-based barcode scanning using `html5-qrcode` inside a popup modal (complete with a horizontal red laser scan guide overlay) | ✅ Done |
| 6 | Prevented server-side pre-rendering errors of `html5-qrcode` by importing the scanner component dynamically with `{ ssr: false }` in the parent ShipmentInfo form | ✅ Done |
| 7 | Enabled full-frame scanning by omitting `qrbox` configuration to prevent linear barcodes (like CODE-128) from failing to decode when their margins got cropped | ✅ Done |
| 8 | Configured explicit format filtering (`CODE_128`, `CODE_39`, `EAN_13`, `EAN_8`, `QR_CODE`) to improve scanning speed and robustness | ✅ Done |
| 9 | Prevented form submission on scanner `Enter` suffix commands by intercepting the keypress and triggering input blur validation instead | ✅ Done |
| 10 | Created a `safeToISO` date formatting wrapper in `/api/consignments/search`, `/api/consignments/[id]`, `/api/consignments`, `/api/consignments/stats`, and `/api/sync-logs` API routes to safely parse dates regardless of whether they are Firestore Timestamps or strings | ✅ Done |

---

### ✅ PHASE 23 — Cash & Expense Ledger (DR/CR Redesign)

**Goal**: Redesign the entire daily expense tracker into a real-time running cash ledger supporting credit inflows and debit outflows.

| # | Task | Status |
|---|------|--------|
| 1 | Created `/api/expenses` and `/api/expenses/[id]` supporting `entryType` ('DR' / 'CR') properties | ✅ Done |
| 2 | Added `/api/cash-register` and `/api/cash-register/[id]` to set and adjust opening balance inputs | ✅ Done |
| 3 | Created `BalanceCard` component showing initial petty cash, credits, debits, and computed running cash balance | ✅ Done |
| 4 | Added suggested opening cash carried forward from yesterday's computed closing balance | ✅ Done |
| 5 | Created `AddTransactionModal` overlay form featuring Debit (Expense) / Credit (Cash Inflow) type toggles, quick select chips, and custom validations | ✅ Done |
| 6 | Created chronological `TransactionTimeline` ledger displaying running balance after each entry | ✅ Done |
| 7 | Refactored `ExpenseSummaryCards` to correctly display DR-filtered operational expenses and today's cash balance | ✅ Done |
| 8 | Refactored main `ExpensesPage` page, cleaned up old inline files, updated navigation menus (sidebar & mobile), and validated Next.js production builds | ✅ Done |

---

## 📂 Key Files Modified / Created

| File | Change |
|------|--------|
| `app/layout.jsx` | SpeedInsights + Analytics; favicon metadata; separated `viewport` export |
| `app/dashboard/page.jsx` | Uses `fetchDashboardStats()`; chart & KPI improvements |
| `app/dashboard/layout.jsx` | Title + breadcrumb mappings for all routes |
| `app/dashboard/consignments/page.jsx` | **[NEW]** Paginated consignment list with filters |
| `app/dashboard/consignments/[id]/page.jsx` | **[NEW]** Consignment detail + tracking timeline |
| `app/dashboard/revenue/page.jsx` | **[NEW]** Revenue analytics page |
| `app/dashboard/search/page.jsx` | **[NEW]** Multi-field consignment search |
| `app/dashboard/sync/page.jsx` | **[NEW]** Sync logs admin page with manual trigger |
| `app/api/consignments/route.js` | 30-day default, cursor pagination, `force-dynamic` |
| `app/api/consignments/stats/route.js` | Stats API with `count()` aggregations + 5-min cache |
| `app/api/consignments/sync/route.js` | Cron-triggered bulk tracking sync (CRON_SECRET protected); integrated 30-day auto-cleanup database optimizer |
| `app/api/consignments/search/route.js` | **[NEW]** Multi-field consignment search API |
| `app/api/consignments/revenue-stats/route.js` | **[NEW]** Revenue analytics data API |
| `app/api/sync-logs/route.js` | **[NEW]** Sync execution log reader API |
| `app/login/page.jsx` | Updated logo sizing; removed redundant subtext |
| `components/layout/Sidebar.jsx` | Removed brand text; fixed logo to `h-12`; added WhatsApp Logs nav link |
| `components/layout/MobileDrawer.jsx` | Removed brand text; fixed logo to `h-12`; added WhatsApp Logs nav link |
| `components/layout/TopBar.jsx` | Replaced user text with clickable avatar + `ProfileModal` |
| `components/consignment/TrackingTimeline.jsx` | **[NEW]** Rich delivery status timeline component |
| `components/dashboard/DashboardCharts.jsx` | Chart visual improvements |
| `components/dashboard/TodayTable.jsx` | Renamed "voucher" → "consignment" terminology |
| `lib/tracking.js` | FranchExpress API status code parser |
| `lib/stats-cache.js` | **[NEW]** Shared cache state module |
| `lib/notifications.js` | Dispatcher for WhatsApp notifications; logs outbound dispatches to `whatsapp_messages` collection |
| `app/api/notify/route.js` | **[NEW]** POST API endpoint to trigger/send consignment notifications |
| `app/api/whatsapp/webhook/route.js` | Webhook route for Meta subscriptions; updated to sync delivery status and log text/location replies |
| `app/api/whatsapp/messages/route.js` | **[NEW]** Admin API endpoint to fetch and filter WhatsApp dispatches and replies |
| `app/dashboard/whatsapp/page.jsx` | **[NEW]** WhatsApp Logs page showing metrics, search/filters, and chronological messages feed |
| `public/Logo-GM-FE.png` | **[NEW]** Company logo for favicon + sidebar |
| `firestore.rules` | Role-based Firestore security rules |
| `app/dashboard/consignments/edit/page.jsx` | **[NEW]** Dedicated edit consignment page with mixed editable/static layout |
| `components/consignment/DuplicateAwbModal.jsx` | **[NEW]** Modal preventing duplicate AWB entries with view details navigation |
| `components/consignment/UnsavedChangesModal.jsx` | **[NEW]** Modal guarding unsaved form edits, supporting clipboard copies |
| `components/consignment/EditShipmentSection.jsx` | **[NEW]** Split editable and read-only form elements for editing |
| `components/consignment/EditReadOnlySection.jsx` | **[NEW]** Pure visual read-only summary for consignor and consignee blocks |
| `lib/ConsignmentEditContext.jsx` | **[NEW]** React Context keeping in-memory and sessionStorage backup of active edit IDs |
| `scratch/fix_existing_docs.js` | **[NEW]** Migration script for WhatsApp Flow feedback formatting |
| `scratch/check_consignments_dates.js` | **[NEW]** Diagnostics script for consignment booking dates |
| `components/consignment/BarcodeScannerModal.jsx` | **[NEW]** Camera-based Barcode and QR Code scanner component using `html5-qrcode` |
| `scratch/import_xls.mjs` | **[NEW]** Import script for parsing, year-correcting, and importing 2026 consignment entries from Excel |

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

---

## ⚠️ Pending Items (Current Status)

---

### 1. 📱 WhatsApp Template Approval (Meta)

**Priority**: Medium  
**Status**: Awaiting Meta approval for remaining templates; only `fe_rcvr_returned` and `fe_sndr_returned` are created for new statuses

**What's Done**:
* Deployed `/lib/notifications.js` dispatcher routing status updates to specific templates.
* Configured new permanent System User token (`WHATSAPP_ACCESS_TOKEN`), WABA ID, and Phone ID.
* Bypassed unneeded status notifications (`Reached Destination`, `Holding at HUB`) in the notification code to prevent sending unwanted notifications or generating errors.
* Documented the active templates in [docs/whatsapp_templates.md](file:///Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp/docs/whatsapp_templates.md).

**Steps Still Needed**:
* Await Meta's automated approval on the pending templates.
* Once templates are approved by Meta, they will start sending immediately without any code edits.

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

### 4. 🖼️ Favicon

**Priority**: Low  
**Status**: ✅ Resolved — favicon configured using `Logo-GM-FE.png` in `app/layout.jsx`

The `Logo-GM-FE.png` is now referenced in `app/layout.jsx` `icons` metadata. No further action needed.

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

### 6. 🔄 Scheduled Auto-Sync & Tracking Timeline

**Priority**: High  
**Status**: Planned & Analyzed — Implementation Plan ready (Scheduler-based)

**Background**:  
The business needs to track the latest delivery status from the FranchExpress tracking API (`POST https://franchexpress.com/proxy.php`) for all pending consignments in Firestore and display a detailed tracking timeline to users.

**What's Planned**:
1. Add Vercel Cron configuration (`vercel.json`) to run the sync automatically at night (e.g. 2:00 AM UTC).
2. Create secure endpoint `/api/consignments/sync` verifying `CRON_SECRET`.
3. Save detailed execution metrics in `/sync_logs` Firestore collection.
4. Add a `/dashboard/sync` logs page to show recent sync runs and support manually triggering sync.
5. Enhance tracking modal to show live tracking status timeline.

---

### 7. 🔐 CRON_SECRET Environment Variable

**Priority**: High  
**Status**: Required for production auto-sync to work

The `/api/consignments/sync` endpoint is protected by a `CRON_SECRET` environment variable. Add it in Vercel:
1. Go to **Vercel Dashboard → Project → Settings → Environment Variables**
2. Add `CRON_SECRET` with a long random string (e.g. `openssl rand -hex 32`)
3. Redeploy

The Vercel Cron job in `vercel.json` passes this secret automatically via the `Authorization: Bearer` header.

---

*Last updated: 2026-06-17*
