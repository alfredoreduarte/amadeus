# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Amadeus GDS training course website — a commercial product that teaches travel agents the Amadeus reservation system through interactive exercises in a browser-based terminal simulator. Features a landing page with a hero "AHA moment" input, 8 guided exercises (2 free, 6 behind a $3 Stripe paywall), and a full Amadeus command simulator. Targets the Latin American travel agent market (Spanish language, Paraguay/Bolivia/Argentina routes).

## Running

No build step. Open `index.html` directly in a browser. All JavaScript is vanilla ES5 (no modules, no bundler, no framework).

## Architecture

Four JS files loaded in order via `<script>` tags (order matters — each depends on the previous):

1. **`js/data.js`** — `DATA` global with mock airlines, airports, cities, flight schedules, and fare tables. All static, no backend.
2. **`js/amadeus.js`** — `Amadeus` IIFE exposing `process(input)` and `welcome()`. Command parser/router dispatching to handlers (AN, SS, NM, AP, FQD, FXP, ET/ER, RT, XE, DN, DAN, HE, SRDOCS, SR, TKTL, SM, ST, IR, etc.). Maintains session state: current PNR (with docs, ssrs, seats), stored PNRs (by 6-letter locator), last availability results, scroll position.
3. **`js/training.js`** — `Training` IIFE with 8 guided exercises in Spanish. Exercises 1-2 free, 3-8 locked behind paywall. Returns `'__PAYWALL__'` sentinel string when locked exercise is attempted or `COMPRAR` is typed; terminal.js catches this to show the paywall modal. Step validation uses regex. Uses `localStorage('ama_paid')` for unlock state.
4. **`js/terminal.js`** — DOM wiring. Handles: hero landing input → terminal transition (fade), command history (arrow keys), output rendering with CSS classes, help panel, paywall modal show/hide, and Stripe unlock redirect (`?unlocked=true` → sets localStorage).

## User Flow

1. Landing page: hero with large centered input box, user types first Amadeus command (AHA moment)
2. Hero fades out, terminal fades in with the command result + prompt to type `TRAINING`
3. Exercises 1-2 play freely; attempting exercise 3+ shows paywall modal
4. Stripe Payment Link redirects back with `?unlocked=true`, sets `localStorage('ama_paid')`, unlocks all exercises

## Stripe Integration

Currently uses a Stripe Payment Link (placeholder URL in `index.html` `#paywall-buy` href). After payment, Stripe redirects to `?unlocked=true`. No backend — unlock state is client-side only via localStorage. Replace `https://buy.stripe.com/REPLACE_WITH_YOUR_LINK` with the actual Stripe Payment Link.

## Styling

`css/terminal.css` — dark terminal theme. Key CSS classes for output: `.command` (cyan), `.response` (gray), `.error` (red), `.success` (green), `.system` (yellow), `.training` (blue with left border), `.training-success` (green with left border). Hero section uses sans-serif fonts for headings; terminal uses monospace.
