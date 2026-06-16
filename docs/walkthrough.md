# Scheduled Auto-Sync + Tracking UI — Walkthrough

We have implemented the scheduled tracking synchronization feature using an external scheduler approach, along with a rich, premium tracking details timeline display inside the ERP.

## Key Changes Made

### 1. Unified Tracking Service
* **File**: `lib/tracking.js`
* **Changes**: Implemented `fetchLiveStatus(awb)` which makes a direct proxy call to the FranchExpress tracking endpoint, extracts raw API fields, and maps them to a structured JSON schema. The `trackAWB` function has been updated to use this live status helper, seamlessly falling back to deterministic simulated updates if the proxy API fails or returns invalid data.

### 2. Auto-Sync Backend API
* **File**: `app/api/consignments/sync/route.js`
* **Changes**: Added a `GET` endpoint. It authenticates requests either via an admin session token or by checking a query parameter `?secret=...` against the environment variable `SYNC_SECRET`. It queries all pending consignments in Firestore (within the last 60 days), queries their live tracking state sequentially with a 250ms delay, writes status/delivery date updates in batch, and logs the execution metrics in a new `/sync_logs` Firestore collection.

### 3. Sync History logs API
* **File**: `app/api/sync-logs/route.js`
* **Changes**: Added a `GET` route restricted to admin roles that retrieves the 30 most recent auto-sync runs.

### 4. Admin Dashboard Sync Panel
* **File**: `app/dashboard/sync/page.jsx`
* **Changes**: Designed a responsive page displaying summary metrics of the last sync run, a complete execution logs history table showing trigger source (manual vs cron), duration, and collapsible rows revealing detailed per-AWB change descriptions. Added a "Run Sync Now" button to manually override and trigger the API.

### 5. Navigation Links
* **Files**: `components/layout/Sidebar.jsx` and `components/layout/MobileDrawer.jsx`
* **Changes**: Added the "Sync Logs" option to the navigation menu, visible only to users with the `admin` role.
* **File**: `app/dashboard/layout.jsx`
* **Changes**: Configured title mapping to display "Scheduled Auto-Sync Logs" for the sync route.

### 6. Rich Tracking Timeline Component
* **File**: `components/consignment/TrackingTimeline.jsx`
* **Changes**: Replaced the previous timeline layout with a premium tracker featuring status badges, confirmation summaries, an origin/destination card, Proof of Delivery (POD) thumbnail with view details, and a vertical timeline using mapped Lucide icons.

---

## How to Test Locally

Before staging or committing any code, you can verify this setup locally.

### Step 1: Set up the Sync Secret Key
Add the following line to your local `.env.local` file:
```env
SYNC_SECRET=local_sync_secret_key_123
```

### Step 2: Start the Local Server
Navigate to the directory and run the dev server:
```bash
npm run dev
```

### Step 3: Test the Security & API Endpoint
Open a web browser or run an API testing tool (like curl or Postman) against the sync API:
* **Attempt unauthorized access** (should fail with `401 Unauthorized`):
  `http://localhost:3000/api/consignments/sync`
* **Attempt authorized access with secret** (should succeed and run the sync):
  `http://localhost:3000/api/consignments/sync?secret=local_sync_secret_key_123`

### Step 4: Login as Admin and Check the Dashboard Sync UI
1. Go to `http://localhost:3000/login`
2. Log in using Admin credentials:
   * **Email**: `admin@fe.com`
   * **Password**: `Admin@123`
3. Click on the new **Sync Logs** navigation item in the sidebar (or visit `http://localhost:3000/dashboard/sync`).
4. Click **Run Sync Now** to manually trigger the sync and witness the log table update in real time.
5. Click **View** on the log entry row to see exactly which AWBs changed status or why they were skipped.

### Step 5: Test the Rich Tracking Modal
1. Go to **Reports & Export** (or click on any consignment).
2. Click **Edit** or inspect details of any consignment.
3. Observe the upgraded **Tracking Details** card which now renders the detailed grid, status timeline, and signature/POD image (if marked as Delivered).
