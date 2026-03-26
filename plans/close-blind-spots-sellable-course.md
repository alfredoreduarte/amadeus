# Close Blind Spots — Make the Amadeus Course Sellable

## Overview

Competitive analysis of Andrea's DTP Academy classroom training (Paraguay) reveals critical gaps in our course that would be immediately noticed by anyone comparing us to traditional training. The DTP class teaches a 9-step PNR creation workflow including SRDOCS (passport/APIS), SSR (special services), seat selection, and TKTL — none of which our course covers.

Our exercises are also all one-way bookings. Real bookings are almost always round-trip (Andrea's notes literally say "RT = IDA y VUELTA, OW = IDA").

## Problem Statement

A student completing our 5 exercises cannot:
1. Enter passport/APIS data (SRDOCS) — **mandatory for international travel**
2. Request special services (meals, wheelchair) — daily agency task
3. Select seats — always part of the real workflow
4. Set a ticketing time limit (TKTL) — taught in every real course
5. Book a round-trip — the most common booking type
6. Recover from mistakes — XE + rebook is what separates students from agents

The DTP Academy's 3-page PDF instructivo explicitly lists these as steps 3-5 of PNR creation. Any student who's seen traditional training will immediately spot these omissions.

## Competitive Intel Summary (from Andrea's class)

**DTP Academy PNR creation steps:**
1. AN (search flights)
2. SS (sell segment) + FXR pricing variants
3. NM (passenger name)
4. **SRDOCS** (passport/APIS — we don't teach this)
5. AP/SRCTCM (phone) + SRCTCE (email)
6. **TKTL** (time limit — we only teach TKOK)
7. RF (received from)
8. ER (save)

**Additional topics they cover that we don't:**
- SSR special services (VGML meals, WCHR wheelchair)
- SM seat selection
- Baggage brand codes (QP, SL, KM, KD)
- Booking status codes (HK, HL, DK, GK)
- Ticket status codes
- ERK (save + clean)
- IR (ignore keeping PNR active)

## Proposed Solution

### Commit 1: Expand the Simulator Engine

**amadeus.js — New commands:**
- `SRDOCS` — Parse and store passport/APIS data in PNR
- `SR{type}` — Special service requests (VGML, WCHR, CHLD, etc.)
- `TKTL{date}` — Time limit ticketing (alternative to TKOK)
- `SM` — Seat map display (mock)
- `ST/{seat}/P{n}` — Seat assignment
- `IR` — Ignore keeping PNR active
- Update `formatPNR()` to display SSR/DOCS/seats
- Update `buildElementList()` for XE compatibility
- Update `HE` help entries for all new commands
- Update `helpIndex()` with new command categories

**data.js — Missing airlines from DTP Academy PDF:**
- AR (Aerolineas Argentinas), AD (Azul), G3 (Gol), OB (Boliviana de Aviacion)
- PZ (LATAM Paraguay), ZP (Paranair), TP (TAP Portugal), UX (Air Europa)
- JA (JetSmart), SA (JetSmart — alt code from notes)

**data.js — Missing airports for Paraguay market:**
- ASU (Asuncion Silvio Pettirossi) — Andrea's home base
- VVI (Viru Viru, Santa Cruz, Bolivia) — seen in Andrea's notes
- LPB (La Paz El Alto, Bolivia)

**data.js — Missing return routes:**
- JFK-MIA (return for Exercise 2)
- LHR-JFK (return for Exercise 4)
- Add ASU-MAD, MAD-ASU routes (DTP Academy's exercise route)

**Rename:** `andreas-sources/` → `reference/`

### Commit 2: Expand the Training Course (5 → 8 exercises)

**New exercise structure:**

| # | Title | Commands Taught | Status |
|---|-------|-----------------|--------|
| 1 | Busqueda de vuelos | AN, FQD | FREE (unchanged) |
| 2 | Crear una reserva basica | AN, SS, NM, AP, TKOK, RF, ER | FREE (unchanged) |
| 3 | **Reserva ida y vuelta con documentos** | AN×2, SS×2, NM, **SRDOCS**, AP, **TKTL**, RF, ER | **PRO — NEW** |
| 4 | Reserva para multiples pasajeros | AN, SS3, NM2+NM1, AP, TKOK, RF, ER | PRO (was #3) |
| 5 | Clase ejecutiva y cotizacion | AN, SS(J), NM, APE, AP, TKOK, RF, ER, FXP | PRO (was #4) |
| 6 | **Servicios especiales y asientos** | RT, **SRVGML**, **SRWCHR**, **SM**, **ST**, ER | **PRO — NEW** |
| 7 | Tarifas y codigos | FQD, AN, AN/A, DAN | PRO (was #5) |
| 8 | **Modificaciones y recuperacion** | RT, **XE**, AN, SS, ER, *I | **PRO — NEW** |

**Key design decisions:**
- Exercise 3 (round-trip + SRDOCS) is the highest-impact addition — covers the two biggest blind spots at once
- Exercise 6 (SSR + seats) covers the daily agency workflow that DTP teaches explicitly
- Exercise 8 (modifications) teaches error recovery — what separates students from working agents
- FREE_LIMIT stays at 2 — exercises 1-2 prove the product works, 3-8 are the paywall value

### Commit 3: Only if needed for fixes

## Acceptance Criteria

- [ ] Student can complete a round-trip booking with passport data (SRDOCS)
- [ ] Student can request special meals and wheelchair service (SR)
- [ ] Student can view seat map and assign a seat (SM/ST)
- [ ] Student can set a ticketing time limit (TKTL)
- [ ] Student can cancel and rebook segments (XE + SS)
- [ ] All 8 exercises are completable end-to-end with validation
- [ ] Help system (HE) covers all new commands
- [ ] Airlines from DTP Academy PDF are in the simulator
- [ ] ASU/VVI/LPB airports are available
- [ ] No regression in existing exercises 1-5 (now 1-2, 4-5, 7)
