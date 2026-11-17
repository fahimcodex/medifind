# MediFind — Medicine Availability and Pharmacy Locator

A web platform where patients search for medicines, see which nearby pharmacies have them in stock, and reserve them for pickup. Pharmacies manage their stock and process reservations from a dashboard.

> **Project positioning:** MediFind provides information and reservation support only. It does not diagnose illness, prescribe medicines, or replace professional medical advice. Availability can be out of date, so users should confirm with the pharmacy before traveling.

**Course:** CSE 416 — Software Project Design and Development, University of Information Technology and Sciences (UITS)
**Supervisor:** Dr. Mahfida Amjad Dipa, Assistant Professor, CSE
**Team:** Md. Fahim Hossain (0432320005101085), Sadman Shahriar Sadaf (0432320005101086) — Batch 54, Section 7B

| | |
|---|---|
| **Live demo** | https://medifind-murex-gamma.vercel.app/ |
| **UI design (Figma)** | [MediFind - UI Design](https://www.figma.com/design/XI8QnZA8vKRhIT9ZVYLxMd) |
| **UI prototype** | [Click-through prototype](https://www.figma.com/proto/XI8QnZA8vKRhIT9ZVYLxMd/MediFind---UI-Design?node-id=4-2&starting-point-node-id=4-2&scaling=min-zoom) |
| **UI documentation** | [`MediFind_UI_Design_README.md`](./MediFind_UI_Design_README.md) |

---

## Features

### Patients
- Register and log in with email and password.
- Search medicines by brand or generic name with partial matching, and filter by dosage form and category.
- See each pharmacy's stock status (in stock, low stock, out of stock), sorted by approximate distance.
- View pharmacies on an interactive map (Leaflet with OpenStreetMap tiles).
- See alternative brands that share the same generic name, strength and form (information only, not a recommendation).
- Reserve a medicine for pickup, then track the reservation in **My Reservations** (pending, confirmed, completed, rejected, cancelled, expired) and cancel it while it is pending or confirmed.

### Pharmacy users
- Dashboard with counts of pending reservations, low-stock items, batches expiring within 30 days, and pickups completed today.
- Reservation queue: confirm or reject new requests, and mark confirmed ones as completed when the patient picks up.
- Alerts for out-of-stock items, quantities at or below the low-stock threshold, and batches that expire soon.
- Inventory management with batches, quantities, expiry dates and low-stock thresholds (add and edit stock).

### Administrators
- The `admin` role exists in the database and has full access under the Row Level Security policies.
- An admin interface for approving pharmacies and managing the medicine catalog is **planned** (see [Limitations and future work](#limitations-and-future-work)).

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 with design tokens defined in `app/globals.css` (`@theme`) |
| Backend and database | Supabase (PostgreSQL, Auth, Row Level Security, SQL functions) |
| Maps | Leaflet and react-leaflet with OpenStreetMap tiles (attribution displayed) |
| Hosting | Vercel (Hobby plan) |
| Design | Figma |

There is no separate backend server. Server components and server actions in Next.js talk to Supabase directly, and business rules that must not be bypassed (reservation creation and status changes) run as SQL functions inside the database.

---

## Getting started

### Prerequisites
- Node.js 20 or newer and npm
- A free [Supabase](https://supabase.com) project

### 1. Install
```bash
git clone https://github.com/fahimcodex/medifind.git
cd medifind
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in the values from Supabase (**Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never commit `.env.local`, and never put a secret or `service_role` key in a `NEXT_PUBLIC_` variable.

### 3. Set up the database
In the Supabase **SQL Editor**, run these files **once, in this order**:

1. `supabase/schema.sql` — tables, signup trigger, Row Level Security policies
2. `supabase/seed.sql` — demo medicines, five Dhaka pharmacies and random stock
3. `supabase/reservations.sql` — reservation functions, expiry, tightened permissions

> `seed.sql` is not safe to run twice, because it would duplicate every pharmacy and medicine. To reset the demo data, delete the rows from `inventory`, `pharmacies` and `medicines` first.

In **Authentication → Providers → Email**, turn **Confirm email** off while developing so that you can sign up and log in immediately.

### 4. Run
```bash
npm run dev
```
Open http://localhost:3000.

### 5. Create demo accounts
Sign up through the app, then use the SQL Editor to set roles and link a pharmacy. Gmail ignores anything after a `+`, so `you+admin@gmail.com`, `you+patient@gmail.com` and `you+pharmacy@gmail.com` all reach one inbox but count as separate accounts.

| Account | How |
|---|---|
| Patient | Sign up with the **Patient** option |
| Pharmacy | Sign up with the **Pharmacy** option, then link the account to a seeded pharmacy (below) |
| Admin | Sign up, then promote the account (below) |

```sql
-- Make an account an admin
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'ADMIN_EMAIL');

-- Link a pharmacy account to a seeded pharmacy
update public.pharmacies
set owner_id = (select id from auth.users where email = 'PHARMACY_EMAIL')
where name = 'Health Plus Pharmacy';
```

Log out and back in after changing a role.

---

## How it works

### Pages
| Route | Who | Purpose |
|---|---|---|
| `/` | Everyone | Landing page with the search bar |
| `/login`, `/signup` | Everyone | Authentication with role selection |
| `/search` | Everyone | Search results with filters |
| `/medicines/[id]` | Everyone | Pharmacy availability, map and alternative brands |
| `/reserve` | Patients | Create a reservation |
| `/reservations` | Patients | Track and cancel reservations |
| `/pharmacy/dashboard` | Pharmacy users | Queue, alerts and inventory |

### Business rules
- **Stock status** is computed per pharmacy from batches that have not expired. It is *out of stock* at zero, *low stock* when the total is at or below the largest low-stock threshold, and *in stock* otherwise.
- **Distance** is the straight-line (haversine) distance from the user's location, with central Dhaka as the fallback when location access is denied.
- **Available quantity** for a new reservation is usable stock minus the quantity held by pending and confirmed reservations.
- **Reservation lifecycle:** `pending` → `confirmed` or `rejected` (pharmacy) → `completed` (pharmacy, on pickup). A patient can cancel while pending or confirmed. Reservations expire 24 hours after creation.
- **Stock is deducted when a reservation is completed**, taking the batches that expire first. Cancelled, rejected and expired reservations need no stock restore.
- **Expiry is lazy:** `expire_reservations()` runs whenever a reservation page loads, so no scheduler is needed.

### Security
- Supabase Auth handles passwords; the app never stores them.
- Row Level Security is enabled on every table. Patients see only their own reservations, pharmacy users manage only their own pharmacy's stock and queue, and the public sees only approved pharmacies.
- `profiles.role` cannot be edited by users, so nobody can promote themselves to admin.
- Only admins can change a pharmacy's approval status (database trigger).
- Reservations can be created and changed only through the SQL functions, which check role, ownership, stock and allowed status transitions.
- Secrets live in environment variables, and `.env.local` is git-ignored.

### Project structure
```
app/
  (auth)/login, (auth)/signup     authentication pages
  search/                         search results
  medicines/[id]/                 availability list and map
  reserve/                        reservation form
  reservations/                   patient reservation tracking
  pharmacy/dashboard/             pharmacy dashboard
  actions/reservations.ts         server actions that call the SQL functions
  globals.css                     Tailwind theme (colour tokens)
components/
  Navbar.tsx, landing/, auth/, search/, medicine/, map/, reserve/
lib/
  supabase/client.ts, server.ts   Supabase clients
  geo.ts                          distance helpers
  stock.ts                        stock status helpers
proxy.ts                          refreshes the auth session on each request
supabase/
  schema.sql, seed.sql, reservations.sql
```

---

## Limitations and future work

- **Admin interface:** approving pharmacies and managing the medicine catalog are planned but not yet built. Until then, pharmacy approval and catalog changes are made in the Supabase dashboard.
- **Pharmacy self-registration:** a new pharmacy account cannot yet create its own pharmacy profile. Demo pharmacies are seeded and linked to an account with SQL.
- **Notifications:** alerts for low stock, out-of-stock items and expiring batches appear on the pharmacy dashboard, and patients see status changes in My Reservations. There are no push, email or real-time notifications.
- **Stock data is entered manually** by pharmacies, so availability can be out of date. There is no integration with pharmacy systems.
- **Free-tier hosting** may have cold starts and usage limits. Supabase and Vercel quotas apply, and OpenStreetMap's tile usage policy applies to the map.
- A paid production deployment would need a revised cost analysis.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

---

Map data © OpenStreetMap contributors.