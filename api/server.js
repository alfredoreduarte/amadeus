var express = require('express');
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
var Stripe = require('stripe');
var { Resend } = require('resend');
var { stmts, findOrCreateUser, generateToken } = require('./db');

var app = express();
var PORT = process.env.PORT || 3000;
var SITE_URL = process.env.SITE_URL || 'https://amadeus.alfredo.re';
var COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Crash on startup if critical secrets are missing
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be set and at least 32 characters');
  process.exit(1);
}
var JWT_SECRET = process.env.JWT_SECRET;

var stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
var resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting store (in-memory, resets on restart)
var rateLimits = {};

function checkRateLimit(key, max, windowMs) {
  var now = Date.now();
  if (!rateLimits[key] || rateLimits[key].reset < now) {
    rateLimits[key] = { count: 1, reset: now + windowMs };
    return true;
  }
  rateLimits[key].count++;
  return rateLimits[key].count <= max;
}

// Clean up expired rate limit entries every 10 minutes
setInterval(function () {
  var now = Date.now();
  var keys = Object.keys(rateLimits);
  for (var i = 0; i < keys.length; i++) {
    if (rateLimits[keys[i]].reset < now) delete rateLimits[keys[i]];
  }
}, 10 * 60 * 1000);

// Middleware
app.use(cookieParser());

// Parse JSON for all routes EXCEPT the Stripe webhook (which needs raw body)
app.use(function (req, res, next) {
  if (req.path === '/api/stripe/webhook') return next();
  express.json()(req, res, next);
});

// Auth middleware — extracts user from JWT cookie, does NOT reject if missing
function authMiddleware(req, res, next) {
  var token = req.cookies.session;
  if (!token) { req.user = null; return next(); }
  try {
    var payload = jwt.verify(token, JWT_SECRET);
    req.user = stmts.findUserById.get(payload.userId);
  } catch (e) {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

var IS_PRODUCTION = process.env.NODE_ENV === 'production' || SITE_URL.indexOf('https') === 0;

function setSessionCookie(res, userId) {
  var token = jwt.sign({ userId: userId }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('session', token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'Lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

// ============================================================
//  POST /api/checkout
//  Creates user + Stripe Checkout Session, or instant-unlocks if already paid
// ============================================================
app.post('/api/checkout', function (req, res) {
  var email = (req.body.email || '').trim().toLowerCase();
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Email invalido' });
  }

  // Rate limit: 5 per email per hour, 20 per IP per hour
  var ip = req.headers['x-real-ip'] || req.ip;
  if (!checkRateLimit('co:' + email, 5, 3600000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta en una hora.' });
  }
  if (!checkRateLimit('coip:' + ip, 20, 3600000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta en una hora.' });
  }

  var user = findOrCreateUser(email);

  // Already paid — tell the frontend, but do NOT set a session cookie.
  // The user must authenticate via magic link to prove they own this email.
  // This prevents account takeover by anyone who knows a paid user's email.
  if (user.paid_at) {
    return res.json({ already_paid: true });
  }

  // Create Stripe Checkout Session
  stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Amadeus - Curso Completo' },
        unit_amount: 900, // $9.00
      },
      quantity: 1,
    }],
    mode: 'payment',
    customer_email: email,
    client_reference_id: String(user.id),
    success_url: SITE_URL + '/?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: SITE_URL + '/',
  }).then(function (session) {
    // Store the Stripe session ID so we can look up the user on return
    stmts.setStripeSession.run(session.id, user.id);
    res.json({ url: session.url });
  }).catch(function (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Error al crear sesion de pago' });
  });
});

// ============================================================
//  POST /api/stripe/webhook
//  Stripe sends checkout.session.completed here
// ============================================================
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), function (req, res) {
  var sig = req.headers['stripe-signature'];
  var event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Invalid signature');
  }

  if (event.type === 'checkout.session.completed') {
    var session = event.data.object;
    var userId = parseInt(session.client_reference_id, 10);
    if (userId) {
      // Idempotent: only mark paid if not already paid (preserves original timestamp)
      stmts.markPaid.run(session.customer || null, session.id, userId);
      console.log('User', userId, 'marked as paid via webhook');
    }
  }

  res.json({ received: true });
});

// ============================================================
//  GET /api/auth/session
//  Returns current user session. Supports ?stripe_session= for post-payment polling
// ============================================================
app.get('/api/auth/session', authMiddleware, function (req, res) {
  var stripeSessionId = req.query.stripe_session;

  // Post-payment polling: look up user by Stripe session ID
  if (stripeSessionId) {
    var user = stmts.findUserByStripeSession.get(stripeSessionId);
    if (!user) return res.json({ pending: true });
    if (!user.paid_at) return res.json({ pending: true });

    // Paid! Set session cookie and clear the stripe_session_id to prevent replay
    setSessionCookie(res, user.id);
    stmts.clearStripeSession.run(user.id);
    var progress = stmts.getProgress.get(user.id);
    return res.json({
      paid: true,
      email: user.email,
      progress: progress || null,
    });
  }

  // Normal session check
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  var progress = stmts.getProgress.get(req.user.id);
  res.json({
    email: req.user.email,
    paid: !!req.user.paid_at,
    progress: progress || null,
  });
});

// ============================================================
//  POST /api/auth/magic-link
//  Sends a magic link email for returning users
// ============================================================
app.post('/api/auth/magic-link', function (req, res) {
  var email = (req.body.email || '').trim().toLowerCase();
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Email invalido' });
  }

  // Rate limit: 3 per email per hour
  var ip = req.headers['x-real-ip'] || req.ip;
  if (!checkRateLimit('ml:' + email, 3, 3600000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta en una hora.' });
  }
  if (!checkRateLimit('ip:' + ip, 10, 3600000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta en una hora.' });
  }

  var user = findOrCreateUser(email);

  // Also check DB-level rate limit
  var recent = stmts.countRecentMagicLinks.get(user.id);
  if (recent.count >= 3) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta en una hora.' });
  }

  var token = generateToken();
  var expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
  stmts.createMagicLink.run(user.id, token, expiresAt);

  var link = SITE_URL + '/api/auth/verify?token=' + token;

  resend.emails.send({
    from: 'Amadeus Course <noreply@amadeus.alfredo.re>',
    to: email,
    subject: 'Tu acceso a Aprende Amadeus',
    html: [
      '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;">',
      '<h2 style="color:#4fc3f7;">Aprende Amadeus</h2>',
      '<p>Haz clic en el boton para acceder a tu cuenta:</p>',
      '<a href="' + link + '" style="display:inline-block;background:#4fc3f7;color:#0a0e27;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Acceder a mi cuenta</a>',
      '<p style="color:#888;font-size:13px;margin-top:20px;">Este enlace expira en 15 minutos. Si no solicitaste este acceso, ignora este email.</p>',
      '</div>',
    ].join(''),
  }).then(function () {
    res.json({ sent: true });
  }).catch(function (err) {
    console.error('Resend error:', err.message);
    res.status(500).json({ error: 'Error al enviar email' });
  });
});

// ============================================================
//  GET /api/auth/verify?token=xxx
//  Validates magic link token, sets session cookie, redirects
// ============================================================
app.get('/api/auth/verify', function (req, res) {
  var token = req.query.token;
  if (!token) return res.status(400).send('Token faltante');

  var link = stmts.findMagicLink.get(token);
  if (!link) {
    // Show a simple HTML page for expired/invalid links
    return res.status(400).send([
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Enlace expirado</title></head>',
      '<body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0e27;color:#e0e0e0;">',
      '<h2>Enlace expirado o invalido</h2>',
      '<p>Solicita un nuevo enlace desde el simulador.</p>',
      '<a href="' + SITE_URL + '" style="color:#4fc3f7;">Volver al simulador</a>',
      '</body></html>',
    ].join(''));
  }

  // Consume the token
  stmts.useMagicLink.run(link.id);

  // Set session cookie
  setSessionCookie(res, link.user_id);

  // Redirect to site
  res.redirect(SITE_URL + '/?logged_in=1');
});

// ============================================================
//  POST /api/auth/logout
// ============================================================
app.post('/api/auth/logout', function (req, res) {
  res.clearCookie('session', { path: '/' });
  res.json({ ok: true });
});

// ============================================================
//  POST /api/progress
// ============================================================
app.post('/api/progress', authMiddleware, requireAuth, function (req, res) {
  var exerciseIndex = req.body.exercise_index;
  var stepIndex = req.body.step_index;
  var exercisesCompleted = req.body.exercises_completed;

  // Validate types and ranges
  if (typeof exerciseIndex !== 'number' || exerciseIndex !== (exerciseIndex | 0) || exerciseIndex < -1 || exerciseIndex > 7) {
    return res.status(400).json({ error: 'Invalid progress data' });
  }
  if (typeof stepIndex !== 'number' || stepIndex !== (stepIndex | 0) || stepIndex < 0 || stepIndex > 20) {
    return res.status(400).json({ error: 'Invalid progress data' });
  }

  // Validate exercises_completed: must be array of integers 1-8
  var validCompleted = [];
  if (Array.isArray(exercisesCompleted)) {
    for (var i = 0; i < exercisesCompleted.length && i < 8; i++) {
      var n = exercisesCompleted[i];
      if (typeof n === 'number' && n >= 1 && n <= 8 && n === (n | 0)) {
        validCompleted.push(n);
      }
    }
  }

  stmts.upsertProgress.run(req.user.id, exerciseIndex, stepIndex, JSON.stringify(validCompleted));
  res.json({ ok: true });
});

// ============================================================
//  HEALTH CHECK
// ============================================================
app.get('/api/health', function (req, res) {
  res.json({ ok: true });
});

// ============================================================
//  START
// ============================================================
app.listen(PORT, function () {
  console.log('Amadeus API listening on port ' + PORT);
});
