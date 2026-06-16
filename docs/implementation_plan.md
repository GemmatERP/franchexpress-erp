# Bulk Status Sync + Tracking UI — Implementation Plan (Revised)

## Goal

1. **Bulk Sync**: Query every pending consignment against the FranchExpress API and auto-update Firestore status
2. **Rich Tracking Modal**: Show the full tracking detail (matching the FranchExpress website layout) inside our ERP when a user clicks on any consignment

---

## Part 1 — API Response Field Analysis

### Full Response Structure
```json
{
  "status": "success",
  "data": {
    "dl_status":     "1",
    "dl_status_txt": "Delivered",
    "orgin":         "TNMAA-LCS",
    "dest":          "TNMAA-PA1",
    "consignment":   "MDox - 1 Nos",
    "frm_addr":      "<br>",
    "to_addr":       "<br>",
    "ud_for":        "",
    "bk_dtm":        "05-06-2026 1:40 AM",
    "delv_dtm":      "06-06-2026 10:26 PM",
    "pod_image":     "https://erpstcourier.com/img/pod/20260606/48071025984-pod.jpg",
    "tracking": [
      {
        "trans_dtm":  "2026-06-06 22:26:05",
        "trans_for":  "Delivered",
        "awb_colors": "success",
        "awb_icons":  "fa-check-square-o",
        "from":       "PARUTHUPATTU -1 BA, TN",
        "to":         "",
        "staff_area": ""
      }
    ]
  }
}
```

---

## Part 2 — Field → UI Element Mapping

This maps every API field to what it shows in the FranchExpress website UI (and what we'll mirror in our ERP).

### Header Section
| API Field | UI Label | Notes |
|-----------|----------|-------|
| `data.dl_status_txt` | **Main status badge** (e.g. "Delivered") | Big bold text, color based on status |
| `data.delv_dtm` | "Your order is Delivered on **{date}** at location: **{dest}**" | Only shown when `dl_status_txt === "Delivered"` |
| `data.dest` | Location in the delivery confirmation line | Combined with `delv_dtm` |

### Info Grid (the grey card)
| API Field | UI Label |
|-----------|----------|
| `data.orgin` | **Origin SRC** |
| `data.dest` | **Destination** |
| `data.consignment` | **Consignment** (e.g. "MDox - 1 Nos") |
| `data.bk_dtm` | **Book Date/Time** |
| `data.delv_dtm` | **Delivery Date/Time** (hidden if not yet delivered) |

### POD (Proof of Delivery) Image
| API Field | UI Label | Notes |
|-----------|----------|-------|
| `data.pod_image` | **POD Image** thumbnail + full-screen link | Only shown when delivered & URL is not empty |

### Tracking Timeline (vertical list)
Each entry in `data.tracking[]` maps to one timeline row:

| API Field | UI Element |
|-----------|-----------|
| `tracking[].trans_dtm` | **Date + Time** column (left side) |
| `tracking[].trans_for` | **Status text** (e.g. "Delivered", "Out for Delivery") |
| `tracking[].awb_colors` | **Dot/icon background color** (see color map below) |
| `tracking[].awb_icons` | **Icon** shown in the timeline dot (see icon map below) |
| `tracking[].from` | **Location line** below status text |
| `tracking[].to` | **Route arrow** → appended to location if not empty (e.g. "Chennai hub, TN → PARUTHUPATTU -1 BA, TN") |

---

## Part 3 — Color & Icon Mapping

### `awb_colors` → CSS / Tailwind Color
| API Value | Meaning | Our Color |
|-----------|---------|-----------|
| `success` | Delivered / Out for Delivery | `#14b8a6` (fe-teal / green) |
| `info` | In transit / forwarded | `#3b82f6` (blue) |
| `warning` | On hold / exception | `#f59e0b` (amber) |
| `danger` | Failed / returned | `#ef4444` (red) |

### `awb_icons` → Our SVG / Lucide Icon
| API Value | FontAwesome meaning | Our Lucide equivalent |
|-----------|--------------------|-----------------------|
| `fa-check-square-o` | Delivered | `CheckSquare` |
| `fa-file-text-o` | Out for Delivery / processed | `FileText` |
| `fa-truck` | In transit / forwarded | `Truck` |
| `fa-home` | Held at hub | `Home` |
| `fa-times-circle` | Returned / failed | `XCircle` |

---

## Part 4 — Internal Status Mapping (for Firestore updates)

| `dl_status_txt` from API | → Our `deliveryStatus` field | Also update |
|--------------------------|------------------------------|-------------|
| `Delivered` | `Delivered` | Set `deliveredDate` from `delv_dtm` |
| `Out for Delivery` | `Out of Delivery` | — |
| `Reached Destination` | `Reached Destination` | — |
| `Processed & Forwarded to Service Center` | `Transit` | — |
| `Holding…` / `Hold…` | `Holding at HUB` | — |
| `Returned` / `Return…` | `Returned` | — |
| API error / timeout / unknown | *(skip — no write)* | — |

---

## Part 5 — What We'll Build

---

### A. New API Route — `app/api/consignments/sync/route.js`

**POST** endpoint — Admin only.

**Request body:**
```json
{ "awbs": [{ "id": "firestore_doc_id", "awb": "48071025984" }] }
```

**Processing per AWB:**
1. Call `POST https://franchexpress.com/proxy.php` with `{ awb, captcha: "" }`
2. Parse `data.dl_status_txt`, `data.delv_dtm`, `data.orgin`, `data.dest`
3. Map to internal status
4. If status changed → add to Firestore `writeBatch()`
5. Return per-AWB result: `updated | skipped | failed`

**Response:**
```json
{
  "processed": 20,
  "updated": 14,
  "skipped": 5,
  "failed": 1,
  "details": [
    { "awb": "48071025984", "result": "updated", "oldStatus": "Transit", "newStatus": "Delivered" },
    { "awb": "48071025123", "result": "skipped", "reason": "status unchanged" },
    { "awb": "48071099999", "result": "failed",  "reason": "API timeout" }
  ]
}
```

---

### B. Enhanced `lib/tracking.js` — `fetchLiveStatus(awb)`

New exported function (separate from `trackAWB` which is for the public tracker):

```js
export async function fetchLiveStatus(awb) {
  // Returns: { statusTxt, deliveredAt, origin, dest, timeline } | null
}
```

---

### C. New Admin Page — `app/dashboard/sync/page.jsx`

**URL**: `/dashboard/sync`  
**Access**: Admin only (redirects others to `/dashboard`)

**UI Layout** (mirrors ERP style):

```
┌──────────────────────────────────────────────────┐
│  🔄 Bulk Status Sync                              │
│  Auto-fetch latest delivery status from FE API   │
├──────────────────────────────────────────────────┤
│  Sync last [ 60 ] days   [ ~842 pending ]        │
│                          [ Start Sync ▶ ]        │
├──────────────────────────────────────────────────┤
│  Progress  ████████████░░░░░  240 / 842          │
│  ✅ Updated: 178   ⏭ Skipped: 61   ❌ Failed: 3  │
├──────────────────────────────────────────────────┤
│  AWB           Old Status     New Status  Result  │
│  48071025984   Transit        Delivered   ✅       │
│  48071025123   Out of Del.    Out of Del. ⏭       │
│  48071099999   Transit        —           ❌       │
├──────────────────────────────────────────────────┤
│  [ ⬇ Download CSV Report ]                       │
└──────────────────────────────────────────────────┘
```

---

### D. Enhanced Tracking Modal in Consignment List

**Where**: Existing consignment list / detail view — "Track" button

**What changes**: Instead of the current simulated data, show a proper modal that mirrors the FranchExpress website layout:

```
┌──────────────────────────────────────────────────┐
│  AWB No: #48071025984          [ ✕ Close ]       │
│  ● Delivered                                     │
│  Delivered on 06-06-2026 10:26 PM · TNMAA-PA1   │
├──────────────────────────────────────────────────┤
│  Origin SRC  │ Destination │ Consignment          │
│  TNMAA-LCS   │ TNMAA-PA1  │ MDox - 1 Nos         │
│  Book Date/Time           │ Delivery Date/Time    │
│  05-06-2026 1:40 AM       │ 06-06-2026 10:26 PM   │
├──────────────────────────────────────────────────┤
│  [POD Image Thumbnail] → click to open full view │
├──────────────────────────────────────────────────┤
│  Tracking Timeline                               │
│  ─────────────────────────────────────────────  │
│  06 Jun 22:26  ✅  Delivered                     │
│                    PARUTHUPATTU -1 BA, TN        │
│  06 Jun 11:44  📄  Out for Delivery              │
│                    PARUTHUPATTU -1 BA, TN        │
│  05 Jun 13:52  📄  Out for Delivery              │
│                    PARUTHUPATTU -1 BA, TN        │
│  05 Jun 01:40  🚚  Processed & Forwarded         │
│                    Chennai hub → PARUTHUPATTU    │
└──────────────────────────────────────────────────┘
```

---

## Part 6 — Files to Create / Modify

| File | Action | What Changes |
|------|--------|--------------|
| `lib/tracking.js` | MODIFY | Add `fetchLiveStatus(awb)` for sync use |
| `app/api/consignments/sync/route.js` | NEW | Batch sync API route |
| `app/dashboard/sync/page.jsx` | NEW | Admin bulk sync UI page |
| `app/dashboard/layout.jsx` | MODIFY | Add "Sync" nav link (admin only) |
| `app/api/track/route.js` | MODIFY | Update to return structured JSON (not HTML-parsed) |
| Existing tracking modal/component | MODIFY | Render new rich tracking UI with timeline, info grid, POD image |

---

## Part 7 — Verification Plan

| Test | Expected |
|------|----------|
| Navigate to `/dashboard/sync` as Admin | Page loads with config panel |
| Navigate to `/dashboard/sync` as Employee | Redirected to `/dashboard` |
| Click "Start Sync" with 5-day window | Progress bar increments, results table fills |
| AWB with no tracking data | Appears as Failed, sync continues |
| Click "Track" on any consignment | Modal shows live data with timeline |
| POD image exists | Thumbnail shown, click opens full image |
| POD image missing | Section hidden cleanly |
| Download CSV | File downloads with correct columns |
