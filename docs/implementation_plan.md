# Consignment Search Page — Implementation Plan

## Goal

1. **Global Search API**: Implement a new `GET` route `/api/consignments/search?q=QUERY` that performs parallel, index-friendly Firestore queries to find matches on AWB number, consignor/consignee name, consignor/consignee phone number, city, and state.
2. **Unified Search Dashboard Page**: Create a `/dashboard/search` page in the client dashboard with a large query input, responsive search results table, and integration with the edit/tracking actions.

---

## Part 1 — Database Search Strategy

Firestore does not support full-text search or multi-field OR queries natively. To provide a fast, index-friendly search across 3,218+ records without introducing external dependencies (like Algolia), we will run parallel queries in the backend and merge/de-duplicate results in memory.

### Query Routing Logic based on search input `q`:

1. **If `q` is numeric (phone number or AWB number)**:
   * Query 1: Exact match on `awbNumber == q`
   * Query 2: Exact match on `consigneePhone == q`
   * Query 3: Exact match on `consignorPhone == q`

2. **If `q` is alphabetic/text (names, city, state)**:
   To support case-insensitive prefix searching, we will run prefix range queries (`>= q` and `<= q + \uf8ff`) for:
   * Consignee Name
   * Consignor Name
   * Consignee City
   * Consignee State
   
   To handle capitalization mismatches, we will run these prefix queries using three normalized cases in parallel:
   * As-entered (e.g. `Avadi`)
   * Uppercase (e.g. `AVADI`)
   * Title-case (e.g. `Avadi`)

All matching documents will be merged, de-duplicated by their document ID, sorted by booking `date` (descending) in-memory, and limited to a maximum of 50 results for optimal performance.

---

## Part 2 — What We'll Build

### A. Search API Endpoint — `/app/api/consignments/search/route.js`
* **Method**: `GET`
* **Access**: Authenticated users only
* **Security**: Uses standard `authenticate(req)` token check
* **Returns**: Array of matched consignment objects

---

### B. Search Interface — `/app/dashboard/search/page.jsx`
* **URL**: `/dashboard/search`
* **Access**: Admins and Employees
* **UI Structure**:
  ```
  ┌──────────────────────────────────────────────────┐
  │  🔍 Find Consignment                             │
  │  Search by AWB, Name, Phone, City, or State      │
  ├──────────────────────────────────────────────────┤
  │  [ Search consignments... 🔍 ]                   │
  ├──────────────────────────────────────────────────┤
  │  Results (14 found)                              │
  │  AWB         SNO       Recipient     City    Status │
  │  48071025984 FE-0012   Ramesh K.     Avadi   Deliv. │
  │  ...                                             │
  └──────────────────────────────────────────────────┘
  ```
* Clicking on any row or status badge allows the user to open the tracking modal or go to the edit screen.

---

### C. Sidebar Navigation
* Add the **Search** link to both the desktop `Sidebar.jsx` and mobile `MobileDrawer.jsx` with the `Search` (Lucide) icon, visible to `admin` and `employee` roles.

---

## Part 3 — Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `app/api/consignments/search/route.js` | **NEW** | Search GET route handler with parallel queries |
| `app/dashboard/search/page.jsx` | **NEW** | Search UI page with query input and results table |
| `components/layout/Sidebar.jsx` | MODIFY | Add "Search" navigation item |
| `components/layout/MobileDrawer.jsx` | MODIFY | Add "Search" navigation item to mobile layout |
| `app/dashboard/layout.jsx` | MODIFY | Map title for `/dashboard/search` |

---

## Part 4 — Verification Plan

| Test | Expected |
|------|----------|
| Search for exact AWB number (e.g. `48071025984`) | Returns specific consignment document |
| Search for consignee phone number | Returns list of bookings for that customer |
| Search for city (e.g. `Avadi` or `AVADI` or `avadi`) | Returns all matching consignments bound to/from Avadi |
| Search for prefix string (e.g. `Ram`) | Returns consignments for consignee/consignor named Ramesh, Ramya, etc. |
| Click "Track" in search results | Opens the tracking modal showing live status |
