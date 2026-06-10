# FranchExpress ERP - Courier Service Management System

A production-grade, highly-functional Mini ERP web application designed specifically for Courier and Logistics businesses, using Next.js 14 App Router, Firebase, and Tailwind CSS.

---

## 🚀 Features

- **Role-Based Authentication**: Admin, Employee, and Delivery Agent workspace access.
- **Interactive KPI Dashboard**: Count-up animation widgets showing revenue (Indian currency formatting), daily bookings, and pending shipment queues.
- **Analytics Charts**: Visualizations for daily package counts, status allocations, and 14-day revenue trajectories (Recharts).
- **Interactive Consignment Booking**: Full form with 5 collapsible panels, keyboard accessibility, Indian format validations, and custom "Copy All" formatted clipboard sharing.
- **Live AWB Tracking Proxy**: Server-side proxy handling CORS-safe requests to tracking timelines.
- **Pluggable Notifications**: Dispatch alerts via Fast2SMS, Twilio, or WhatsApp Business (Wati.io) API clients.
- **Delivery agent dashboard**: Mobile-friendly queue displaying contacts (Tel/WA click buttons), package dimensions, and direct status updates.
- **BI Reports & Horizontal exports**: Filters for dates, payment options, and carriers. Download current listings instantly as Excel (SheetJS) or CSV (PapaParse).
- **Strict Compliance**: Light theme styling, 4.5:1 text color contrast, focus indicators, and prefers-reduced-motion screen bindings.

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
| **Admin** | `admin@fe.com` | `Admin@123` | Full access + delete consignments |
| **Employee** | `employee@fe.com` | `Emp@123` | Register/edit consignments, view reports, read dashboard |
| **Delivery** | `delivery@fe.com` | `Del@123` | View assigned package deliveries, update route status |

---

## 📂 Project Directory Structure

```
franchexpress-erp/
├── app/
│   ├── layout.jsx                        ← Fonts, providers, global accessibility
│   ├── globals.css                       ← Tailwind & custom utility classes
│   ├── page.jsx                          ← Initial route index redirect
│   ├── login/
│   │   └── page.jsx                      ← Login page
│   ├── dashboard/
│   │   ├── layout.jsx                    ← Admin shell, navigation breadcrumbs
│   │   ├── page.jsx                      ← Dashboard index
│   │   ├── consignments/
│   │   │   └── new/
│   │   │       └── page.jsx              ← New consignment form
│   │   ├── delivery/
│   │   │   └── page.jsx                  ← Delivery agent dashboard
│   │   └── reports/
│   │       └── page.jsx                  ← Advanced reports search
│   └── api/
│       ├── consignments/
│       │   └── route.js                  ← GET (list) + POST (create) endpoints
│       ├── consignments/[id]/
│       │   └── route.js                  ← GET + PUT + DELETE (by id)
│       ├── track/
│       │   └── route.js                  ← CORS-safe AWB proxy
│       └── notify/
│           └── route.js                  ← SMS/WA dispatch router
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx                   ← Shell navigation sidebar
│   │   ├── TopBar.jsx                    ← Shell header
│   │   └── MobileDrawer.jsx              ← Shell mobile slideout
│   ├── ui/
│   │   ├── Button.jsx                    ← Framer motion button variants
│   │   ├── Input.jsx                     ← Accessible inputs
│   │   ├── Select.jsx                    ← Accessible drop-down selectors
│   │   ├── Badge.jsx                     ← Status color-badge chips
│   │   ├── Card.jsx                      ← Bordered panels
│   │   ├── Modal.jsx                     ← Focus-trapped accessible dialog
│   │   ├── Toast.jsx                     ← Animated alert popups
│   │   └── Spinner.jsx                   ← SVG loading spinner
│   ├── dashboard/
│   │   ├── KPICard.jsx                   ← Count-up KPI metric card
│   │   ├── DashboardCharts.jsx           ← Bar, line, and pie recharts
│   │   ├── TodayTable.jsx                ← Today's consignment rows
│   │   └── PendingTable.jsx              ← Pending consignment rows
│   ├── consignment/
│   │   ├── ConsignmentForm.jsx           ← Form control binder
│   │   ├── ShipmentSection.jsx           ← Voucher & Courier partner info
│   │   ├── PaymentSection.jsx            ← Charge details & Paid status
│   │   ├── ConsignorSection.jsx          ← Sender details
│   │   ├── ConsigneeSection.jsx          ← Recipient details
│   │   ├── DeliverySection.jsx           ← Routing status details
│   │   ├── TrackingTimeline.jsx          ← Progress logs
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
│   ├── notifications.js                  ← Pluggable dispatch clients
│   ├── export.js                         ← File export tools
│   ├── tracking.js                       ← Proxy parsing
│   └── utils.js                          ← Formatters & validations
├── hooks/
│   ├── useConsignments.js                ← CRUD API binder
│   ├── useAuth.js                        ← Auth Context hook
│   ├── useTracking.js                    ← Track API hook
│   └── useToast.js                       ← Notification state provider
├── middleware.js                         ← Security route matcher
├── tailwind.config.js                    ← Colors & tokens
├── next.config.js                        ← Next config
├── vercel.json                           ← Vercel deployment parameters
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

For details about configuring SMS providers (Fast2SMS, Twilio) and WhatsApp Business API integrations, read the [NOTIFICATIONS.md](file:///C:/Users/lucif/.gemini/antigravity-ide/scratch/franchexpress-erp/NOTIFICATIONS.md) guide.
