// ============================================================
// Auth Module — session, checkout, magic links, progress sync
// ============================================================

var Auth = (function () {

  var _user = null;       // { email, paid, progress }
  var _ready = false;     // true once initial session check completes
  var _readyCbs = [];     // callbacks waiting for ready state
  var _savePending = null; // debounce timer for progress save

  // ============================================================
  //  INTERNAL HELPERS
  // ============================================================

  function api(method, path, body, cb) {
    var opts = { method: method, credentials: 'same-origin' };
    if (body) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    fetch('/api' + path, opts)
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (r) { cb(null, r.data, r.status); })
      .catch(function (err) { cb(err, null, 0); });
  }

  function setReady(userData) {
    _user = userData;
    _ready = true;
    if (_user && _user.paid) {
      try { localStorage.setItem('ama_paid', 'true'); } catch (e) {}
    }
    for (var i = 0; i < _readyCbs.length; i++) _readyCbs[i](_user);
    _readyCbs = [];
  }

  // ============================================================
  //  INIT — check session on page load
  // ============================================================

  function init() {
    var params = new URLSearchParams(window.location.search);

    // Post-payment polling: ?session_id=cs_xxx
    var sessionId = params.get('session_id');
    if (sessionId) {
      window.history.replaceState({}, '', window.location.pathname);
      pollPayment(sessionId);
      return;
    }

    // Post-magic-link: ?logged_in=1
    if (params.get('logged_in') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Normal session check
    api('GET', '/auth/session', null, function (err, data, status) {
      if (err || status === 401) {
        setReady(null);
      } else {
        setReady({ email: data.email, paid: data.paid, progress: data.progress });
      }
    });
  }

  // ============================================================
  //  POST-PAYMENT POLLING
  // ============================================================

  function pollPayment(stripeSessionId) {
    var attempts = 0;
    var maxAttempts = 15; // 15 x 2s = 30s

    function poll() {
      api('GET', '/auth/session?stripe_session=' + encodeURIComponent(stripeSessionId), null, function (err, data, status) {
        if (!err && data && data.paid) {
          setReady({ email: data.email, paid: true, progress: data.progress });
          if (typeof Auth._onPaymentConfirmed === 'function') Auth._onPaymentConfirmed();
          return;
        }
        attempts++;
        if (attempts >= maxAttempts) {
          // Give up polling — webhook will eventually arrive
          setReady(null);
          if (typeof Auth._onPaymentTimeout === 'function') Auth._onPaymentTimeout();
          return;
        }
        setTimeout(poll, 2000);
      });
    }
    poll();
  }

  // ============================================================
  //  PUBLIC API
  // ============================================================

  function isPaid() {
    if (_user && _user.paid) return true;
    // Fallback to localStorage when API is unreachable or not yet ready
    try { return localStorage.getItem('ama_paid') === 'true'; } catch (e) { return false; }
  }

  function isLoggedIn() {
    return !!_user;
  }

  function user() {
    return _user;
  }

  function isReady() {
    return _ready;
  }

  function onReady(cb) {
    if (_ready) { cb(_user); return; }
    _readyCbs.push(cb);
  }

  // ---- Purchase flow ----
  function createCheckout(email, cb) {
    api('POST', '/checkout', { email: email }, function (err, data, status) {
      if (err) return cb({ error: 'Servicio temporalmente no disponible' });
      if (status === 429) return cb({ error: data.error });
      if (data.already_paid) {
        // User already paid — send them a magic link to prove they own this email
        return cb({ already_paid: true, email: email });
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        cb({ error: data.error || 'Error al crear sesion de pago' });
      }
    });
  }

  // ---- Magic link flow (returning users only) ----
  function requestMagicLink(email, cb) {
    api('POST', '/auth/magic-link', { email: email }, function (err, data, status) {
      if (err) return cb({ error: 'Servicio temporalmente no disponible' });
      if (status === 429) return cb({ error: data.error });
      if (data.sent) return cb({ sent: true });
      cb({ error: data.error || 'Error al enviar email' });
    });
  }

  // ---- Logout ----
  function logout(cb) {
    api('POST', '/auth/logout', null, function () {
      _user = null;
      try { localStorage.removeItem('ama_paid'); } catch (e) {}
      if (cb) cb();
    });
  }

  // ---- Progress sync ----
  var _lastProgressData = null;

  function saveProgress(data) {
    if (!_user) return;
    _lastProgressData = data;
    // Debounce: save 3 seconds after last call
    if (_savePending) clearTimeout(_savePending);
    _savePending = setTimeout(function () {
      _flushProgress();
    }, 3000);
  }

  function _flushProgress() {
    if (!_lastProgressData) return;
    var data = _lastProgressData;
    _lastProgressData = null;
    _savePending = null;
    api('POST', '/progress', data, function () {});
  }

  // Flush pending progress on tab close/navigate away
  window.addEventListener('beforeunload', function () {
    if (_lastProgressData && _user) {
      var blob = new Blob([JSON.stringify(_lastProgressData)], { type: 'application/json' });
      navigator.sendBeacon('/api/progress', blob);
      _lastProgressData = null;
    }
  });

  // Progress is loaded inline from GET /api/auth/session — no separate endpoint needed

  // ---- Start ----
  init();

  return {
    isPaid: isPaid,
    isLoggedIn: isLoggedIn,
    user: user,
    onReady: onReady,
    createCheckout: createCheckout,
    requestMagicLink: requestMagicLink,
    logout: logout,
    saveProgress: saveProgress,
    // Hooks for terminal.js to set:
    _onPaymentConfirmed: null,
    _onPaymentTimeout: null,
  };

})();
