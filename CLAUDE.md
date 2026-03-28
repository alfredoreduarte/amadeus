# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Amadeus GDS training course website — a commercial product that teaches travel agents the Amadeus reservation system through interactive exercises in a browser-based terminal simulator. Features a landing page with a hero "AHA moment" input, 8 guided exercises (2 free, 6 behind a $9 Stripe paywall), and a full Amadeus command simulator. Targets the Latin American travel agent market (Spanish language, Paraguay/Bolivia/Argentina routes).

## Running

### Frontend only
No build step. Open `index.html` directly in a browser. All JavaScript is vanilla ES5 (no modules, no bundler, no framework). Auth features require the API to be running.

### Full stack (with API)
```bash
docker compose up --build
```
Frontend at http://localhost:8082, API at http://localhost:3001.

### API only (development)
```bash
cd api && cp .env.example .env  # fill in real keys
mkdir -p data
npm install
DB_PATH=./data node server.js
```

## Architecture

### Frontend

Five JS files loaded in order via `<script>` tags (order matters — each depends on the previous):

1. **`js/data.js`** — `DATA` global with mock airlines, airports, cities, flight schedules, and fare tables. All static, no backend.
2. **`js/amadeus.js`** — `Amadeus` IIFE exposing `process(input)` and `welcome()`. Command parser/router dispatching to handlers (AN, SS, NM, AP, FQD, FXP, ET/ER, RT, XE, DN, DAN, HE, SRDOCS, SR, TKTL, SM, ST, IR, etc.). Maintains session state: current PNR (with docs, ssrs, seats), stored PNRs (by 6-letter locator), last availability results, scroll position.
3. **`js/training.js`** — `Training` IIFE with 8 guided exercises in Spanish. Exercises 1-2 free, 3-8 locked behind paywall. Returns `'__PAYWALL__'` sentinel string when locked exercise is attempted or `COMPRAR` is typed; terminal.js catches this to show the paywall modal. Step validation uses regex. Uses `Auth.isPaid()` with `localStorage` fallback for unlock state. Tracks completed exercises and saves progress via `Auth.saveProgress()`.
4. **`js/auth.js`** — `Auth` IIFE managing authentication, Stripe checkout, magic links, and progress sync. Exposes `isPaid()`, `isLoggedIn()`, `user()`, `createCheckout()`, `requestMagicLink()`, `saveProgress()`, `loadProgress()`. Purchasing IS account creation (no email verification interruption). Magic links only for returning users with expired sessions.
5. **`js/terminal.js`** — DOM wiring. Handles: hero landing input → terminal transition (fade), command history (arrow keys), output rendering with CSS classes, help panel, paywall modal (with email input → Stripe Checkout), login modal (magic links), LOGIN/CUENTA/LOGOUT commands, post-payment polling, post-magic-link redirect handling.

### Backend (api/)

Node.js + Express API with SQLite database. Single `server.js` with 7 endpoints:

- `POST /api/checkout` — creates user + Stripe Checkout Session (or instant-unlocks if already paid)
- `POST /api/stripe/webhook` — Stripe webhook handler, marks user as paid
- `GET /api/auth/session` — returns current user session (supports `?stripe_session=` for post-payment polling)
- `POST /api/auth/magic-link` — sends magic link email for returning users
- `GET /api/auth/verify?token=xxx` — validates magic link, sets session cookie, redirects
- `GET /api/progress` — returns user's exercise progress
- `POST /api/progress` — saves exercise progress

Database: SQLite (`better-sqlite3`) with 3 tables: `users`, `magic_links`, `progress`. Stored in a Docker named volume at `/app/data/amadeus.db`.

## User Flow

1. Landing page: hero with large centered input box, user types first Amadeus command (AHA moment)
2. Hero fades out, terminal fades in with the command result + prompt to type `TRAINING`
3. Exercises 1-2 play freely; attempting exercise 3+ shows paywall modal
4. User enters email in paywall modal → Stripe Checkout Session → pays $9 → redirects back → webhook confirms → session cookie set → exercises unlocked (zero email interruption)
5. Returning users: session cookie lasts 30 days. If expired, magic link flow via LOGIN command or entering email at paywall (auto-detects already-paid users)

## Stripe Integration

Uses Stripe Checkout Sessions with server-side webhook verification. The API creates a Checkout Session, Stripe handles the payment page, and a webhook (`checkout.session.completed`) marks the user as paid in the database. Price: $9 USD one-time payment.

**Required env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (in `api/.env`).

**Webhook URL:** `https://amadeus.alfredo.re/api/stripe/webhook` (configure in Stripe Dashboard → Developers → Webhooks).

## Styling

`css/terminal.css` — dark terminal theme. Key CSS classes for output: `.command` (cyan), `.response` (gray), `.error` (red), `.success` (green), `.system` (yellow), `.training` (blue with left border), `.training-success` (green with left border). Hero section uses sans-serif fonts for headings; terminal uses monospace.

## Deployment

Production is at **https://amadeus.alfredo.re**, hosted on a DigitalOcean droplet (`root@159.223.121.11`). Two Docker containers: `web` (nginx:alpine, static files, port 8082) and `api` (node:20-alpine, Express + SQLite, port 3001). Behind host nginx reverse proxy with SSL via Let's Encrypt.

### Server layout

- **Project files:** `/root/websites/amadeus/`
- **Docker containers:** `amadeus-web-1` (port 8082 → 80), `amadeus-api-1` (port 3001 → 3000)
- **SQLite data:** Docker named volume `amadeus_api_data` → `/app/data/amadeus.db`
- **API env:** `/root/websites/amadeus/api/.env` (secrets, NOT in git)
- **Nginx config:** `/etc/nginx/sites-enabled/amadeus.alfredo.re.conf` (reverse proxy to 8082 + `/api/` to 3001)
- **SSL cert:** managed by Certbot, auto-renews

### Deploy current branch

Make sure you're on the branch you want to deploy, then run:

```bash
rsync -avz --delete --exclude='.git' --exclude='reference' --exclude='plans' --exclude='api/.env' --exclude='api/node_modules' --exclude='api/data' ./ root@159.223.121.11:/root/websites/amadeus/
ssh root@159.223.121.11 "cd /root/websites/amadeus && docker compose up -d --build"
```

The `--delete` flag removes files on the server that no longer exist locally. The excludes skip reference images, plans, secrets, and local dev data.

**First-time deploy:** copy `api/.env.example` to server as `api/.env` and fill in real keys before running docker compose.

### Host nginx config for API proxy

Add to `/etc/nginx/sites-enabled/amadeus.alfredo.re.conf`:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Verify

```bash
curl -s -o /dev/null -w '%{http_code}' https://amadeus.alfredo.re
curl -s -o /dev/null -w '%{http_code}' https://amadeus.alfredo.re/api/auth/session
```

Should return `200` and `401` respectively.

## Git Workflow

Never commit directly to `main`. Always create a feature branch, commit there, and open a PR.
