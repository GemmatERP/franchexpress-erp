# FranchExpress ERP - Courier Service Management System

A production-grade, highly-functional Mini ERP web application designed specifically for Courier and Logistics businesses, using Next.js 14 App Router, Firebase, and Tailwind CSS.

---

## 🚀 Features

- **Role-Based Authentication**: Admin, Employee, and Delivery Agent workspace access.
- **Interactive KPI Dashboard**: Count-up animation widgets showing daily bookings, pending shipment queues, and delivered items.
- **Consignments Dashboard**: Count-based status groups (Transit & Pending, Out for Delivery, Holding at HUB, Delivered, Returned & Cancelled) with direct table filtering and multi-field search.
- **Consignment Details & Tracking Timeline**: Dedicated shipment page showing billing, weights, courier partner details, and a vertical live tracking history timeline (origin to destination, including POD signature rendering).
- **Printable Vouchers**: Clean print-media layout styling for A4 paper margins on Consignment Details.
- **Admin Revenue Dashboard**: Analytics showing Total Revenue, Average Booking Value, Cash/Credit/UPI splits, Daily Revenue Trends, and Courier Partner revenue shares with custom and preset date range filters.
- **WhatsApp Messaging Hub**: Interactive auditing console showing all outbound notification templates sent to senders/receivers (delivery status: sent ➔ delivered ➔ read) and inbound customer replies (text responses and GPS location shares).
- **Auto-Sync Scheduler**: Automated nightly Vercel Cron jobs fetching live transit logs from the official carrier API and pruning database records over 30 days old to reduce storage overhead.
- **Strict Compliance**: Light theme styling, 4.5:1 text color contrast, custom focus rings, and prefers-reduced-motion screen bindings.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Firebase Firestore (v10 Modular Client SDK) |
| Auth | Firebase Auth (Email/Password) |
| Server Operations | Firebase Admin SDK |
| Styling | Tailwind CSS v3 + CSS Variables |
| Animation | Framer Motion v11 |
| Icons | Lucide React |
| Charts | Recharts |
| CSV Export | PapaParse |
| Excel Export | SheetJS (xlsx) |

---

## 🔑 Role & Credentials Table

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@fe.com` | `Admin@123` | Full access + revenue reports + delete consignments |
| **Employee** | `employee@fe.com` | `Emp@123` | Register/edit consignments, view reports, read dashboard |
| **Delivery** | `delivery@fe.com` | `Del@123` | View assigned package deliveries, update route status |

---

## 📂 Project Directory Structure

```
franchexpress-erp/
├── app/
│   ├── layout.jsx                        ← Fonts, providers, edit context, global accessibility
│   ├── globals.css                       ← Tailwind & custom utility classes
│   ├── page.jsx                          ← Initial route index redirect
│   ├── login/
│   │   └── page.jsx                      ← Login page
│   ├── dashboard/
│   │   ├── layout.jsx                    ← Admin shell, navigation breadcrumbs
│   │   ├── page.jsx                      ← Operational dashboard index
│   │   ├── consignments/
│   │   │   ├── page.jsx                  ← Paginated consignment listing & tabs
│   │   │   ├── [id]/
│   │   │   │   └── page.jsx              ← Shipment details & tracking timeline
│   │   │   ├── edit/
│   │   │   │   └── page.jsx              ← Dedicated edit consignment form
│   │   │   └── new/
│   │   │       └── page.jsx              ← Collapsible new booking form
│   │   ├── delivery/
│   │   │   └── page.jsx                  ← Delivery agent queue
│   │   ├── reports/
│   │   │   └── page.jsx                  ← Advanced reports & Excel export
│   │   ├── revenue/
│   │   │   └── page.jsx                  ← Date-filtered revenue charts & metrics
│   │   ├── whatsapp/
│   │   │   └── page.jsx                  ← WhatsApp log auditer & conversation feed
│   │   └── sync/
│   │       └── page.jsx                  ← Cron job executions tracker
│   └── api/
│       ├── consignments/
│       │   ├── route.js                  ← GET (list) + POST (create) endpoints
│       │   ├── [id]/
│       │   │   └── route.js              ← GET + PUT + DELETE (by id)
│       │   ├── revenue-stats/
│       │   │   └── route.js              ← Revenue charts data aggregator
│       │   ├── search/
│       │   │   └── route.js              ← Multi-field query search API
│       │   └── stats/
│       │       └── route.js              ← Operational counters & charts API
│       ├── notify/
│       │   └── route.js                  ← SMS/WA dispatch router
│       ├── sync-logs/
│       │   └── route.js                  ← Cron sync runs reader API
│       └── whatsapp/
│           ├── messages/
│           │   └── route.js              ← WhatsApp logs fetcher & search API
│           └── webhook/
│               └── route.js              ← Meta webhook message/delivery status sync
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx                   ← Shell navigation sidebar
│   │   ├── TopBar.jsx                    ← Avatar, profile manager modal
│   │   └── MobileDrawer.jsx              ← Responsive slideout
│   ├── ui/
│   │   ├── Button.jsx                    ← Framer motion button variants
│   │   ├── Input.jsx                     ← Accessible inputs
│   │   ├── Select.jsx                    ← Accessible drop-down selectors
│   │   ├── Badge.jsx                     ← Color status tags
│   │   ├── Card.jsx                      ← Bordered panels
│   │   ├── Modal.jsx                     ← Focus-trapped dialog
│   │   ├── Toast.jsx                     ← Animated alert popups
│   │   └── Spinner.jsx                   ← SVG loading spinner
│   ├── dashboard/
│   │   ├── KPICard.jsx                   ← Metric summary card
│   │   ├── DashboardCharts.jsx           ← Main volume bar & status pie charts
│   │   ├── TodayTable.jsx                ← Today's consignment rows
│   │   └── PendingTable.jsx              ← Pending consignment rows
│   ├── consignment/
│   │   ├── ConsignmentForm.jsx           ← Form control binder
│   │   ├── ShipmentSection.jsx           ← Booking metadata
│   │   ├── PaymentSection.jsx            ← Charge details & Paid status
│   │   ├── ConsignorSection.jsx          ← Sender details
│   │   ├── ConsigneeSection.jsx          ← Recipient details
│   │   ├── DeliverySection.jsx           ← Routing status details
│   │   ├── TrackingTimeline.jsx          ← Progress logs
│   │   ├── DuplicateAwbModal.jsx         ← Prevent duplicate AWB dialog
│   │   ├── UnsavedChangesModal.jsx       ← Guard unsaved inputs modal
│   │   └── CopyButton.jsx                ← Copy text formatter
│   ├── delivery/
│   │   └── DeliveryCard.jsx              ← Contact cards for agents
│   └── reports/
│       ├── ReportsTable.jsx              ← Result rows
│       ├── ReportsSummary.jsx            ← Summary aggregators
│       └── ExportButtons.jsx             ← Download Excel/CSV triggers
├── lib/
│   ├── firebase.js                       ← Client SDK config
│   ├── firebase-admin.js                 ← Admin SDK config
│   ├── auth-context.jsx                  ← React Context state
│   ├── ConsignmentEditContext.jsx        ← React edit session Context
│   ├── notifications.js                  ← WhatsApp dispatch handler & logger
│   ├── stats-cache.js                    ← In-memory role & stats caching
│   ├── export.js                         ← File export tools
│   ├── tracking.js                       ← Live tracking parser
│   └── utils.js                          ← Formatters & validations
├── hooks/
│   ├── useConsignments.js                ← CRUD API binder
│   ├── useAuth.js                        ← Auth Context hook
│   ├── useTracking.js                    ← Track API hook
│   └── useToast.js                       ← Notification state provider
├── middleware.js                         ← Security route matcher
├── tailwind.config.js                    ← Colors & tokens
├── next.config.js                        ← Next config
├── vercel.json                           ← Vercel deployment & cron config
├── .env.local.example                    ← Environment values template
├── firestore.rules                       ← Firestore security definitions
├── firestore.indexes.json                ← Query indices configuration
└── package.json                          ← Package dependencies
```

---

## 🛠 Local Setup Instructions

### 1. Clone the project
```bash
git clone <repository-url> franchexpress-erp
cd franchexpress-erp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Firebase Console
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** Authentication:
   - Go to *Build > Authentication > Sign-in method*, enable *Email/Password*.
3. Enable **Cloud Firestore**:
   - Go to *Build > Firestore Database*, click *Create Database*. Set location and start in **Production Mode** or Test Mode.
4. Obtain Client SDK Configuration:
   - Click the gear icon next to "Project Overview" > *Project settings*.
   - Register a Web app, copy the `firebaseConfig` object and populate `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`.
5. Obtain Admin SDK Service Account:
   - Go to *Project settings > Service accounts*.
   - Select **Node.js**, click **Generate new private key**.
   - Copy the `project_id`, `client_email`, and `private_key` properties from the downloaded JSON, and write them as `FIREBASE_ADMIN_*` fields in `.env.local`.

### 4. Create local environment configuration
Copy `.env.local.example` to `.env.local` and paste your credentials:
```bash
cp .env.local.example .env.local
```
*(Make sure to format `FIREBASE_ADMIN_PRIVATE_KEY` by putting it inside double quotes and replacing all literal newlines with `\n` characters).*

### 5. Seed your database
Execute the seed script to create demo users and generate 15 realistic consignments:
```bash
node scripts/seed.js
```

### 6. Run local dev server
```bash
npm run dev
```
Open `http://localhost:3000` to interact with your ERP.

---

## 🚀 Deploy to Vercel

1. Push your code repository to GitHub/GitLab.
2. Link the project in [Vercel](https://vercel.com).
3. Add all environment variables listed in `.env.local` inside the Vercel Project Dashboard Settings.
4. Deploy. Vercel automatically reads `vercel.json` and compiles the Next.js bundle.

---

## ✉️ Notifications Configuration

For details about configuring SMS providers (Fast2SMS, Twilio) and WhatsApp Business API integrations, read the [NOTIFICATIONS.md](file:///Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp/NOTIFICATIONS.md) guide.
