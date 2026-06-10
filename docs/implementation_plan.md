# FranchExpress ERP Courier Service - Implementation Plan

We are building a production-grade, highly-functional Mini ERP web application for a Courier Service called **FranchExpress ERP**. 

## User Review Required

> [!IMPORTANT]
> **Workspace Directory:** Since you do not currently have an active workspace set in the editor, we will initialize this project inside a new directory: `C:\Users\lucif\.gemini\antigravity-ide\scratch\franchexpress-erp`.
> 
> We strongly recommend setting `C:\Users\lucif\.gemini\antigravity-ide\scratch\franchexpress-erp` as your active workspace in the IDE once the files are generated to allow direct compilation and development.

> [!WARNING]
> **Firebase Configuration:** The application requires a standard Firebase Firebase Auth and Firestore setup. You will need to create a Firebase Project, enable Email/Password Authentication, create a Firestore Database in native mode, and obtain your Firebase Admin SDK service account key. The configuration values should be placed in your `.env.local` file.

> [!NOTE]
> All UI components will be responsive, light-theme only, complying with WCAG 2.1 AA accessibility guidelines, utilizing a custom color palette configured in `tailwind.config.js`.

## Open Questions
No major open questions. The requirements are fully detailed, specifying every single file to generate and their behaviors (including Indian currency formatting, SNO counter generation with Firestore transactions, CORS-safe tracking proxy, and pluggable notification logic).

## Proposed Changes

We will create a brand new Next.js 14 project structure inside `C:\Users\lucif\.gemini\antigravity-ide\scratch\franchexpress-erp`. The key components and file layout include:

### 1. Project Configuration & Metadata

* `[NEW]` [package.json](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/package.json): Defines all next.js, react, firebase, tailwind css, and helper dependencies.
* `[NEW]` [tailwind.config.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/tailwind.config.js): Custom colors (e.g. `fe-teal`, `fe-bg`, `fe-muted`, `fe-green`), typography and animations.
* `[NEW]` [next.config.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/next.config.js): Next.js configuration.
* `[NEW]` [vercel.json](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/vercel.json): Vercel-specific deployment configuration.
* `[NEW]` [firestore.rules](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/firestore.rules): Security rules restricting collections access based on user role (Admin vs Employee vs Delivery).
* `[NEW]` [firestore.indexes.json](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/firestore.indexes.json): Firestore index configuration for compound queries (e.g., filtering reports).
* `[NEW]` [.env.local.example](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/.env.local.example): Configuration template.
* `[NEW]` [middleware.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/middleware.js): Route guard protecting `/dashboard/*` path.

### 2. Core Service Utilities (`lib/`)

* `[NEW]` [firebase.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/firebase.js): Client SDK initialization.
* `[NEW]` [firebase-admin.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/firebase-admin.js): Server-side Admin SDK initialization using private keys from environment.
* `[NEW]` [auth-context.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/auth-context.jsx): React context capturing firebase auth state, fetching user profile roles from Firestore.
* `[NEW]` [notifications.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/notifications.js): Notification router routing alerts through Wati.io, Fast2SMS, Twilio, or none, based on config.
* `[NEW]` [export.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/export.js): Formats data and downloads CSV (via `papaparse`) and Excel (via `xlsx`) reports.
* `[NEW]` [tracking.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/tracking.js): Service querying the external FranchExpress endpoint or fallback tracker.
* `[NEW]` [utils.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/utils.js): SNO generators, date formatters, and Indian currency system formatters.

### 3. Custom Hooks (`hooks/`)

* `[NEW]` [useConsignments.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/hooks/useConsignments.js): CRUD hooks for consignment records.
* `[NEW]` [useAuth.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/hooks/useAuth.js): Helper wrapper for Auth context.
* `[NEW]` [useTracking.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/hooks/useTracking.js): Interface for tracking operations.
* `[NEW]` [useToast.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/hooks/useToast.js): Layout toast notification state.

### 4. Layout & UI Components (`components/`)

* **Base UI Elements:**
  * `[NEW]` [Button.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Button.jsx)
  * `[NEW]` [Input.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Input.jsx)
  * `[NEW]` [Select.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Select.jsx)
  * `[NEW]` [Badge.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Badge.jsx)
  * `[NEW]` [Card.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Card.jsx)
  * `[NEW]` [Modal.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Modal.jsx)
  * `[NEW]` [Toast.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Toast.jsx)
  * `[NEW]` [Spinner.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/ui/Spinner.jsx)
* **Shell Navigation Layout:**
  * `[NEW]` [Sidebar.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/layout/Sidebar.jsx)
  * `[NEW]` [TopBar.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/layout/TopBar.jsx)
  * `[NEW]` [MobileDrawer.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/layout/MobileDrawer.jsx)
* **Dashboard Widgets:**
  * `[NEW]` [KPICard.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/dashboard/KPICard.jsx)
  * `[NEW]` [DashboardCharts.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/dashboard/DashboardCharts.jsx)
  * `[NEW]` [TodayTable.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/dashboard/TodayTable.jsx)
  * `[NEW]` [PendingTable.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/dashboard/PendingTable.jsx)
* **Consignment Form Sub-Sections:**
  * `[NEW]` [ConsignmentForm.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/ConsignmentForm.jsx)
  * `[NEW]` [ShipmentSection.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/ShipmentSection.jsx)
  * `[NEW]` [PaymentSection.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/PaymentSection.jsx)
  * `[NEW]` [ConsignorSection.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/ConsignorSection.jsx)
  * `[NEW]` [ConsigneeSection.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/ConsigneeSection.jsx)
  * `[NEW]` [DeliverySection.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/DeliverySection.jsx)
  * `[NEW]` [TrackingTimeline.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/TrackingTimeline.jsx)
  * `[NEW]` [CopyButton.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/consignment/CopyButton.jsx)
* **Delivery View Card:**
  * `[NEW]` [DeliveryCard.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/delivery/DeliveryCard.jsx)
* **Reports Components:**
  * `[NEW]` [ReportsTable.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/reports/ReportsTable.jsx)
  * `[NEW]` [ReportsSummary.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/reports/ReportsSummary.jsx)
  * `[NEW]` [ExportButtons.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/components/reports/ExportButtons.jsx)

### 5. Next.js Routing Pages (`app/`)

* `[NEW]` [layout.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/layout.jsx): Font loader (Jakarta, Inter, JetBrains) and Global Toast/Auth wrapper.
* `[NEW]` [globals.css](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/globals.css): Tailwind CSS rules and custom theme base.
* `[NEW]` [page.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/page.jsx): Root redirection module to dashboard/login.
* `[NEW]` [login/page.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/login/page.jsx): Framer-motion animated login page.
* `[NEW]` [dashboard/layout.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/dashboard/layout.jsx): Main dashboard shell layout featuring topbar and sidebar navigation.
* `[NEW]` [dashboard/page.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/dashboard/page.jsx): Dashboard index (Charts, Tables, KPIs).
* `[NEW]` [dashboard/consignments/new/page.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/dashboard/consignments/new/page.jsx): New consignment form assembly.
* `[NEW]` [dashboard/delivery/page.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/dashboard/delivery/page.jsx): Delivery agent specialized card view.
* `[NEW]` [dashboard/reports/page.jsx](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/dashboard/reports/page.jsx): Report filters, table dashboard.

### 6. API Route Handlers (`app/api/`)

* `[NEW]` [app/api/consignments/route.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/api/consignments/route.js): REST list and create endpoints with verification.
* `[NEW]` [app/api/consignments/[id]/route.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/api/consignments/[id]/route.js): Single record GET/PUT/DELETE handler with role permissions.
* `[NEW]` [app/api/track/route.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/api/track/route.js): CORS-bypassing proxy sending requests to `franchexpress.com` or falling back to simulated timeline values.
* `[NEW]` [app/api/notify/route.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/app/api/notify/route.js): External SMS/WA trigger API.

### 7. Helper Documentation & Seed scripts

* `[NEW]` [scripts/seed.js](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/scripts/seed.js): Node.js script using Firebase Admin SDK to create demo users, seed 15 realistic Tamil Nadu consignments, and set counters.
* `[NEW]` [NOTIFICATIONS.md](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/NOTIFICATIONS.md): Setup recommendation.
* `[NEW]` [README.md](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/README.md): Detailed installation and setup guidelines.

---

## Verification Plan

### Automated Verification
Since the project relies on external environment variables (Firebase key setup), we will write a validation phase verifying compile safety.
* Run `npm run build` or `npx next info` to verify configuration files are set.
* We can use Node.js tests or script checks to confirm compilation is valid.

### Manual Verification
Upon generating the project:
1. Initialize dependencies using `npm install`.
2. Configure `.env.local` with real Firebase parameters.
3. Seed database using `node scripts/seed.js`.
4. Launch the local dev server using `npm run dev` and test:
   * Login using the admin credentials `admin@fe.com` / `Admin@123`.
   * Open the dashboard to see KPIs, Charts, and today's consignments.
   * Add a new consignment, test copying values, mock tracking, and notification trigger.
   * View the delivery page and test filter parameters on the reports screen.
   * Download Excel and CSV file outputs.
