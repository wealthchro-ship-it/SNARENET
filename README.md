# SnareNet

A professional, zero-budget scam reporting and investigation platform. People report suspected
scams and fraudulent transactions; an authorized investigation team reviews the information,
examines available digital trails, and communicates with the person who filed the report.

Built to run entirely on free tiers: **Vercel** (frontend), **Render** (backend), and
**MongoDB Atlas** (database). No paid APIs, no paid storage, no paid authentication.

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Local installation](#local-installation)
5. [MongoDB Atlas setup](#mongodb-atlas-setup)
6. [Environment variables](#environment-variables)
7. [Admin setup](#admin-setup)
8. [Development commands](#development-commands)
9. [Deploy: frontend to Vercel](#deploy-frontend-to-vercel)
10. [Deploy: backend to Render](#deploy-backend-to-render)
11. [Troubleshooting](#troubleshooting)
12. [Security considerations](#security-considerations)
13. [Free-tier limitations](#free-tier-limitations)

---

## Features

**Public site**

- Professional dark landing page (hero, trust/disclaimer, How It Works, What We Investigate,
  Why Reporting Details Matter, Reviews, FAQ, track-your-case, final CTA).
- Themed images on the hero, Evidence & Trails and final CTA sections — each is a public URL the
  admin can change from **Settings → Images** (live previews + one-click reset to default).
- 3D interactions and animations: mouse-tracked 3D tilt cards with a moving glare, scroll-reveal
  staggering, floating status chips, animated grid, typewriter headline pill, traveling scan
  highlight, pulsing live dots, a scroll progress bar and a back-to-top button — all respecting
  `prefers-reduced-motion`.
- Detailed 6-step reporting wizard: Your Information → Incident → Scammer → Transaction →
  Evidence → Consent.
- Animated report-success screen with an expanding radar ring.
- Case ID generation (`SCR-YYYY-XXXXXX`) and confirmation page.
- Public case-status lookup that reveals **only** the status — never private data.
- Dynamic branding from the database: organization name, logo, favicon, colors, hero text,
  disclaimer, footer and contact details update **without a rebuild**.

**Admin panel**

- Secure login (bcrypt hashing, JWT in an HTTP-only cookie).
- Dashboard with live counts from MongoDB (no fake statistics).
- Case management: search, filter, sort, pagination, status changes, investigator assignment,
  internal notes (add/edit/delete), archive, and confirmed permanent deletion.
- Excel export (ExcelJS) of the full safe case dataset.
- Review management: add, edit, delete, approve/unapprove, feature/unfeature.
- Settings: organization, branding, colors, and public content, with live previews.
- Image uploads from a phone or computer: logo, favicon and all landing images can be uploaded as
  files (or pasted as public URLs). Images are stored in MongoDB and served by the API; replaced
  images are removed automatically. Max 5 MB per file, image types only.
- Login details: the admin can change their own email and/or password from **Settings → Login
  Details**, confirmed with the current password.
- Email notifications (SMTP): configure any SMTP provider in **Settings → Email Notifications**.
  Reporters then automatically receive the Case ID / tracking code the moment they submit, and a
  notification for every later update on their case (status changes and case notes). Includes a
  **Send Test Email** button. You can also opt to run the platform without email entirely.

---

## Architecture

One repository, two applications:

```
snarenet/
├── client/                 # React + Vite SPA (deploys to Vercel)
│   └── src/
│       ├── components/     # Logo, StatusBadge, Stars, Spinner
│       ├── pages/          # public/  +  admin/
│       ├── layouts/        # PublicLayout, AdminLayout
│       ├── services/       # api, auth, settings, export
│       ├── hooks/          # useSettings (branding), useAuth
│       ├── utils/          # seo (title/favicon/colors), format
│       ├── styles/         # global.css (design system)
│       ├── App.jsx         # routes + context providers
│       └── main.jsx
├── server/                 # Express API (deploys to Render)
│   ├── controllers/        # auth, reports, reviews, settings, export
│   ├── middleware/         # auth (JWT), rate limits, sanitize, errors
│   ├── models/             # Report, Admin, Review, Settings
│   ├── routes/             # auth, reports, reviews, settings, admin
│   ├── services/           # excelService, settingsService
│   ├── utils/              # caseId, validators, asyncHandler
│   ├── scripts/            # createAdmin, seedSettings
│   └── server.js
└── README.md
```

Data flow: the SPA talks only to the API (`VITE_API_URL`). The API talks only to MongoDB.
No database credentials ever reach the browser.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, React Router 6, plain CSS |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas (Mongoose) |
| Auth | bcrypt + JWT (HTTP-only cookie) |
| Security | helmet, cors, express-rate-limit, express-validator, input sanitization |
| Export | ExcelJS |

---

## Local installation

Requirements: Node.js 18+ (tested on 22), npm, and a MongoDB instance
(local `mongod` or MongoDB Atlas free cluster).

```bash
# 1. Clone / enter the project
cd snarenet

# 2. Backend
cd server
cp .env.example .env          # then edit with your values
npm install
npm run seed-settings         # creates default SnareNet settings (run once)
npm run create-admin          # creates the first admin (env-driven)
npm run dev                   # API on http://localhost:5000

# 3. Frontend (in a second terminal)
cd ../client
cp .env.example .env          # set VITE_API_URL
npm install
npm run dev                   # app on http://localhost:5173
```

Open http://localhost:5173. Login at http://localhost:5173/admin/login.

---

## MongoDB Atlas setup

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Add a database user with read/write privileges.
3. Network access → allow access from anywhere (`0.0.0.0/0`) or your server IPs.
4. Copy the connection string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/snarenet`.
5. Put it in `server/.env` as `MONGODB_URI`.
6. Run `npm run seed-settings` and `npm run create-admin` once.

---

## Environment variables

**`server/.env`**

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/snarenet
JWT_SECRET=<long random string>            # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
NODE_ENV=development                        # set 'production' on Render
JWT_COOKIE_NAME=snarenet_token
ADMIN_EMAIL=admin@snarenet.org              # used only by `npm run create-admin`
ADMIN_PASSWORD=<strong password>            # used only by `npm run create-admin`
CLIENT_URL=http://localhost:5173            # production: https://your-app.vercel.app (no trailing slash)
PUBLIC_BASE_URL=                            # optional: public API URL used for uploaded-image links (defaults to request host)
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000          # production: https://your-api.onrender.com
```

> Never commit `.env` files. Both applications ship `.gitignore` rules that exclude them.

---

## Admin setup

There is **no public registration**. An admin is created through a script:

```bash
cd server
ADMIN_EMAIL=admin@yourorg.org \
ADMIN_PASSWORD='a-strong-password' \
npm run create-admin
```

The password is hashed with bcrypt before storage. Set these variables in your Render
environment and run the script once (locally or against the production database).

---

## Development commands

```bash
# Backend
cd server && npm run dev        # nodemon auto-reload
cd server && npm start          # production start
cd server && npm run create-admin
cd server && npm run seed-settings

# Frontend
cd client && npm run dev
cd client && npm run build
cd client && npm run preview     # serve the production build locally
```

---

## Deploy: frontend to Vercel

1. Push the repository to GitHub (the `client` and `server` folders go together).
2. In Vercel, **Add New Project** → import the repo.
3. Root directory: `client`.
4. Framework preset: **Vite** (build `npm run build`, output `dist`).
5. Environment variable: `VITE_API_URL=https://your-api.onrender.com`.
6. Deploy. Vercel serves the SPA; client-side routing works out of the box.

## Deploy: backend to Render

1. In Render, **New** → **Web Service** → connect the same repo.
2. Root directory: `server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Environment variables:

   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | long random string |
   | `NODE_ENV` | `production` (enables secure cookies + generic errors) |
   | `CLIENT_URL` | `https://your-app.vercel.app` |
   | `PUBLIC_BASE_URL` | `https://your-api.onrender.com` (absolute URL used for uploaded images) |
   | `ADMIN_EMAIL` | first admin email (used by create-admin) |
   | `ADMIN_PASSWORD` | first admin password (used by create-admin) |

5. `NODE_ENV=production` makes cookies `Secure` and hides stack traces.
6. Run the admin + settings seed scripts once against the production database:

```bash
# run from your machine with production env values set
ADMIN_EMAIL=... ADMIN_PASSWORD=... MONGODB_URI=... node server/scripts/createAdmin.js
MONGODB_URI=... node server/scripts/seedSettings.js
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Missing required environment variables` | Set `MONGODB_URI` and `JWT_SECRET` in `server/.env`. |
| Login returns `Too many login attempts` | Login is rate limited to 10 per 15 minutes. Wait and retry. |
| `MongoNetworkError` / connection timeouts | Add `0.0.0.0/0` to Atlas network access. |
| Frontend can't reach the API (CORS) | Set `CLIENT_URL` to the exact frontend origin (no trailing slash). |
| Favicon/logo don't load | The URL must be publicly accessible and served with a proper image `Content-Type`. |
| Uploaded images don't appear | Uploads are stored in MongoDB and served from `/api/uploads/:id`; in production set `PUBLIC_BASE_URL` to your API origin so stored links work. |
| Report submission blocked | The public report endpoint is limited to 10 submissions/hour per IP. |
| Changed settings don't appear | The site caches settings for ~5 minutes in the browser. Refresh or wait. |
| Reports submit but no emails arrive | Email is optional and off by default. Open **Settings → Email Notifications** in the admin panel, enter your SMTP details and press **Send Test Email**. Common issues: blocked port (Gmail needs an App password; hosts often allow 587/465 only, and Render Vercel-style providers may share IPs that SMTP providers reject). |

---

## Security considerations

- Passwords are hashed with bcrypt (10 salt rounds). Plain passwords are never stored.
- Authentication uses a signed JWT delivered in an **HTTP-only, SameSite cookie**; the cookie is
  `Secure` in production.
- All admin APIs require an authenticated session; unauthenticated requests get a generic 401.
- Input is sanitized server-side: HTML tags are escaped before storage, so stored reports and
  reviews can never inject markup (MongoDB stores plain text; React renders it as text).
- Validation via `express-validator` on every entry point.
- Rate limits protect login (10/15 min), report submission (10/hour), public APIs, and admin APIs.
- No database URI, JWT secret, or API key ever reaches the frontend bundle (verified in CI/build).
- Generic auth error messages — the API never reveals whether an email exists.
- Malformed/oversized JSON is rejected with a clean 400; stack traces only appear in development.
- Public case lookup returns only `caseId`, `status`, and submission time — never victim contact
  details, bank or wallet data, scammer information, notes, or investigator info.
- Case deletion is two-stage: cases are *archived* (CLOSED → ARCHIVED), and permanent deletion
  requires typing the exact Case ID.
- SMTP passwords are stored encrypted-at-rest solely in your own database and are **never returned
  to the browser** — the admin API returns only a mask, and the public settings endpoint omits all
  SMTP fields entirely. Email is optional: SMTP must be configured before any outgoing mail is sent.

## Free-tier limitations

- Mongo Atlas free (M0) limits: 512 MB storage, no index on `$text` search beyond three indexes
  configured here, and shared clusters can pause when idle — first request may be slow.
- Render free web services spin down after ~15 minutes of inactivity; the first request after
  idle briefly sleeps. A free `cron` service can ping `/api/health` to keep it warm.
- Vercel serverless functions have a size/time limit; this SPA is a static build, so only the
  free tier is needed.
- No file uploads are implemented intentionally — evidence is described and linked via public
  URLs to stay within the database budget. Ask reporters not to send binaries.
- Email/SMS notifications are out of scope (no free-tier mail provider in the requirements);
  case updates are read in the panel or by the case-status lookup.

---

## Disclaimer

SnareNet does not guarantee recovery of lost funds. Every case depends on the available
evidence, transaction trails, cooperation from relevant platforms or institutions, and
applicable laws. Reporters are told to never submit passwords, OTPs, PINs, banking login
credentials, crypto seed phrases or private keys.