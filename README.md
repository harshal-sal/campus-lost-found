# Campus Lost and Found System (CampusFind)

**DBMS Lab Mini Project — Semester V (2026-27)**  
**Team:** Harshal Salunke (`24CE227`) · Diya Jambhale (`24CE220`)

A complete, responsive, frontend-only web portal for reporting lost items, logging found campus belongings, verifying ownership claims, and enforcing relational database integrity rules in browser `localStorage`.

---

## 1. Overview & Objectives

Students and faculty frequently lose or find personal belongings across campus buildings such as libraries, canteens, hostels, and parking areas. This application models a normalized relational database workflow entirely on the frontend so that every CRUD operation, foreign key reference, `RESTRICT` / `CASCADE` delete rule, and claim-approval state transition can be demonstrated and inspected live without requiring a backend server.

Key objectives:
- Isolate all persistence behind a clean data-access layer (`src/services/db.js`) with documented REST API equivalents (`GET`, `POST`, `PATCH`, `DELETE`).
- Enforce relational integrity rules (`PK`, `FK`, `UNIQUE`, `ENUM`, `RESTRICT`, `CASCADE`, non-future dates, quota error handling) inside the data layer rather than relying solely on UI checks.
- Support role-based access control (`student`, `faculty`, `admin`) and ownership verification across the full **Open → Claimed → Returned** lifecycle.

---

## 2. Features

- **Role-Based Authentication**: Student/Faculty registration, credential login, password visibility toggles, active session persistence (`campus_session` storing only `user_id`), and profile management.
- **Hero, Stats & Multi-Filter Browse**: Gradient hero with inline SVG artwork, prominent live search bar, dual report CTAs, animated count-up stats strip, skeleton loading cards, and filters by Category, Location, Type (`lost` / `found`), and Status (`Open` / `Claimed` / `Returned`).
- **Client-Side Photo Upload**: Drag-and-drop image picker with 5 MB & MIME validation, browser `<canvas>` compression (max 800px wide, JPEG 0.7), live preview, remove option, and colorful category gradient fallback SVG/icon tiles when no photo is attached.
- **Claim & Verification Workflow**:
  - Submit proof-of-ownership claims via a modal on `Open` `found` items (blocks self-claims and duplicate `Pending` claims).
  - Item owners review incoming claims: **Approve** sets claim to `Approved`, item to `Claimed`, and auto-rejects competing `Pending` claims; **Reject** leaves item `Open`.
  - Owners mark `Claimed` items as `Returned` (or mark their own `lost` items as recovered).
- **Admin Console**: Overview SVG donut/bar status chart, KPI stat cards, user role management, searchable item & claim moderation, category/location CRUD with `RESTRICT` enforcement, **Reset Demo Data**, and a read-only **Database Viewer** displaying raw tables with `PK`/`FK`/`UNIQUE` markers for DBMS viva inspection.

---

## 3. Tech Stack

- **Frontend**: React, Vite, React Router DOM v6 (`HashRouter`)
- **Styling & Icons**: Bootstrap 5.3 CSS, Bootstrap Icons, custom CSS variables (`:root`), Google Fonts (`Poppins` + `JetBrains Mono`)
- **Persistence**: Browser `localStorage` via `src/services/db.js` (zero backend, zero external DB)
- **Modals & Toasts**: Pure React components (no Bootstrap JS dependency)

---

## 4. Database Schema

### `campus_users` (`users`)
| Column | Type | Constraint |
| --- | --- | --- |
| `user_id` | Integer | **PK** (auto-increment) |
| `name` | String | NOT NULL |
| `email` | String | NOT NULL, **UNIQUE** (case-insensitive) |
| `password` | String | NOT NULL (min 6 chars, plain demo value) |
| `role` | Enum | `'student' \| 'faculty' \| 'admin'` |
| `created_at` | ISO String | Auto-generated |

### `campus_categories` (`categories`)
| Column | Type | Constraint |
| --- | --- | --- |
| `category_id` | Integer | **PK** (auto-increment) |
| `category_name` | String | NOT NULL, **UNIQUE** |

### `campus_locations` (`locations`)
| Column | Type | Constraint |
| --- | --- | --- |
| `location_id` | Integer | **PK** (auto-increment) |
| `location_name` | String | NOT NULL, **UNIQUE** |

### `campus_items` (`items`)
| Column | Type | Constraint |
| --- | --- | --- |
| `item_id` | Integer | **PK** (auto-increment) |
| `user_id` | Integer | **FK → `users(user_id)`** |
| `category_id` | Integer | **FK → `categories(category_id)`** |
| `location_id` | Integer | **FK → `locations(location_id)`** |
| `title` | String | NOT NULL |
| `description` | String | NOT NULL |
| `type` | Enum | `'lost' \| 'found'` |
| `date` | YYYY-MM-DD | NOT NULL, `date <= today` |
| `status` | Enum | `'Open' \| 'Claimed' \| 'Returned'` |
| `image` | String | Optional base64 JPEG data URL or `''` |
| `created_at` | ISO String | Auto-generated |

### `campus_claims` (`claims`)
| Column | Type | Constraint |
| --- | --- | --- |
| `claim_id` | Integer | **PK** (auto-increment) |
| `item_id` | Integer | **FK → `items(item_id)`** |
| `user_id` | Integer | **FK → `users(user_id)`** |
| `proof_description` | String | NOT NULL |
| `status` | Enum | `'Pending' \| 'Approved' \| 'Rejected'` |
| `created_at` | ISO String | Auto-generated |

Additional `localStorage` keys:
- `campus_session`: `{ user_id }` only (never stores passwords).
- `campus_meta`: `{ initialized, counters }` sequential auto-increment IDs (never reused after deletion).

---

## 5. Relationships & Referential Integrity

- **Users 1 : N Items** — `ON DELETE RESTRICT` (blocks deleting a user who owns items, displaying exact counts; admins cannot delete their own account).
- **Users 1 : N Claims** — `ON DELETE RESTRICT` (blocks deleting a user who has submitted claims, displaying exact counts).
- **Categories 1 : N Items** — `ON DELETE RESTRICT` (blocks deleting a category referenced by any item).
- **Locations 1 : N Items** — `ON DELETE RESTRICT` (blocks deleting a location referenced by any item).
- **Items 1 : N Claims** — `ON DELETE CASCADE` (deleting an item automatically deletes all claims referencing that `item_id`).

---

## 6. Folder Structure

```text
campus-lost-and-found/
├── index.html
├── package.json
├── vite.config.ts
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── services/
    │   └── db.js
    ├── utils/
    │   ├── auth.js
    │   ├── image.js
    │   └── validation.js
    ├── components/
    │   ├── AdminRoute.jsx
    │   ├── CategoryArt.jsx
    │   ├── ConfirmModal.jsx
    │   ├── EditItemModal.jsx
    │   ├── EmptyState.jsx
    │   ├── Footer.jsx
    │   ├── ImageUpload.jsx
    │   ├── ItemCard.jsx
    │   ├── Navbar.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── StatCard.jsx
    │   ├── StatusBadge.jsx
    │   ├── SvgArtwork.jsx
    │   └── Toast.jsx
    └── pages/
        ├── AdminDashboard.jsx
        ├── Home.jsx
        ├── ItemDetails.jsx
        ├── Login.jsx
        ├── MyClaims.jsx
        ├── MyItems.jsx
        ├── Profile.jsx
        └── Register.jsx
```

---

## 7. Setup & Running Locally

```bash
npm install
npm run dev
```

Open the local Vite dev server URL (port `3000`). All routes use `HashRouter` (`/#/...`) so page refreshes never return 404.

---

## 8. Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@campus.com` | `admin123` |
| **Student** | `student@campus.com` | `student123` |
| **Faculty** | `faculty@campus.com` | `faculty123` |

---

## 9. Page-to-Database Tables Mapping

| Page | `users` | `categories` | `locations` | `items` | `claims` | `session` |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Login** | Read | — | — | — | — | Write |
| **Register** | Write | — | — | — | — | — |
| **Home / Browse** | — | Read | Read | Read | Read (count) | Read |
| **Report Item** | — | Read | Read | Write | — | Read |
| **Item Details** | Read | Read | Read | Read / Update / Delete | Read / Write / Cascade | Read |
| **My Items** | — | Read | Read | Read / Update / Delete | Read / Cascade | Read |
| **My Claims** | Read | Read | — | Read / Update | Read / Update | Read |
| **Admin Dashboard** | Read / Update / Delete | CRUD | CRUD | Read / Update / Delete | Read / Update / Cascade | Read |
| **Profile** | Read / Update | — | — | Read (count) | Read (count) | Read |

---

## 10. Manual End-to-End Test Checklist

1. **Register**: Open `#/register`, register a new Student account (verify duplicate email and mismatched password validation).
2. **Login**: Log in with the newly registered account and confirm redirect to Home (`#/`).
3. **Report Found Item with Photo**: Go to **Report Item**, attach a photo (verify compression preview & non-future date validation), and confirm redirect to Item Details.
4. **Browse & Search**: Return to **Browse**, verify the photo card appears, search by title, and test Category/Location/Type/Status filters.
5. **Submit Claim (as another user)**: Logout, sign in as `student@campus.com`, open the new Found item, click **Submit Claim** to open the modal, submit proof, and verify duplicate Pending claims are blocked.
6. **Approve Claim (as owner)**: Logout, sign back in as the item owner, open **My Claims → Section B**, and click **Approve**. Confirm the claim becomes `Approved`, the item becomes `Claimed`, and competing `Pending` claims are auto-rejected.
7. **Mark as Returned**: Go to **My Items**, click **Mark as Returned** on the `Claimed` item, confirm status updates to `Returned`, and verify the item can no longer be edited.
8. **Persistence Check**: Refresh the browser and verify all changes persist in `localStorage`.
9. **Admin Checks**: Sign in as `admin@campus.com`, inspect the Overview SVG status chart, test `RESTRICT` delete on an active category/user, test `CASCADE` delete on an item with claims, inspect raw tables in **Database Viewer**, and test **Reset Demo Data**.

---

## 11. Limitations & Security Notice

- **Frontend-Only Simulation**: There is no backend server, real SQL engine, or network API. All database tables live in browser `localStorage` and are isolated per browser profile/device.
- **Plaintext Demo Passwords**: Passwords (such as `admin123` and `student123`) are stored as plain demo strings in `campus_users` to keep the project transparent in the Database Viewer.
- **Browser Storage Quota**: Photos are compressed and stored as base64 JPEG data URLs inside `localStorage`, which is limited to roughly **5 MB total** across all tables. Exceeding this limit triggers `"Storage full. Remove some item photos or reset demo data."`
- **Simulated Auth & Roles**: Authentication and role-based access guards run purely in client-side JavaScript and can be inspected or altered in browser DevTools. **This application is strictly for academic DBMS coursework demonstration and is NOT production-secure.**
