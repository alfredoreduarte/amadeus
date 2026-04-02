// ============================================================
// Terminal UI – hero decoder, effects, transition, terminal
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ---- DOM refs ----
  var hero           = document.getElementById('hero');
  var heroInput      = document.getElementById('hero-input');
  var heroWrapper    = document.getElementById('hero-input-wrapper');
  var decoder        = document.getElementById('decoder');
  var terminal       = document.getElementById('terminal');
  var output         = document.getElementById('output');
  var input          = document.getElementById('command-input');
  var helpPanel      = document.getElementById('help-panel');
  var helpToggle     = document.getElementById('help-toggle');
  var helpClose      = document.getElementById('help-close');
  var paywallOverlay = document.getElementById('paywall-overlay');
  var paywallClose   = document.getElementById('paywall-close');
  var paywallEmail   = document.getElementById('paywall-email');
  var paywallBuy     = document.getElementById('paywall-buy');
  var paywallEmailStep = document.getElementById('paywall-email-step');
  var paywallLoading = document.getElementById('paywall-loading');
  var paywallError   = document.getElementById('paywall-error');
  var paywallErrorText = document.getElementById('paywall-error-text');

  var loginOverlay   = document.getElementById('login-overlay');
  var loginClose     = document.getElementById('login-close');
  var loginEmail     = document.getElementById('login-email');
  var loginSend      = document.getElementById('login-send');
  var loginEmailStep = document.getElementById('login-email-step');
  var loginSent      = document.getElementById('login-sent');
  var loginError     = document.getElementById('login-error');
  var loginErrorText = document.getElementById('login-error-text');
  var heroLogin      = document.getElementById('hero-login');

  // Dashboard refs
  var dashboard      = document.getElementById('dashboard');
  var dashEmail      = document.getElementById('dash-email');
  var dashLogout     = document.getElementById('dash-logout');
  var dashExerciseList = document.getElementById('dash-board');
  var dashProgressCount = document.getElementById('dash-progress-count');
  var dashProgressLabel = document.getElementById('dash-progress-label');
  var dashProgressFill  = document.getElementById('dash-progress-fill');
  var dashContinue   = document.getElementById('dash-continue');
  var dashContinueLabel = document.getElementById('dash-continue-label');
  var dashOpen       = document.getElementById('dash-open');
  var dashNextExercise = -1;

  var landingContent = document.getElementById('landing-content');

  // Populate dynamic price from DATA.PRICE
  var priceDisplay = document.getElementById('paywall-price-display');
  if (priceDisplay) priceDisplay.innerHTML = '$' + DATA.PRICE + ' <span>USD</span>';
  // Landing page price elements
  var priceInlines = document.querySelectorAll('.lp-price-inline');
  for (var pi = 0; pi < priceInlines.length; pi++) {
    priceInlines[pi].textContent = '$' + DATA.PRICE + ' USD';
  }
  var priceValues = document.querySelectorAll('.lp-price-value');
  for (var pv = 0; pv < priceValues.length; pv++) {
    priceValues[pv].textContent = '$' + DATA.PRICE;
  }

  // Buy button in pricing section → show paywall
  var lpBuyBtn = document.getElementById('lp-buy-btn');
  if (lpBuyBtn) {
    lpBuyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showPaywall();
    });
  }

  // Scroll-to-top button
  var lpScrollTop = document.getElementById('lp-scroll-top');
  if (lpScrollTop) {
    lpScrollTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () {
        if (!('ontouchstart' in window)) heroInput.focus();
      }, 600);
    });
  }

  // Auto-focus hero input only on non-touch devices (avoids keyboard popup on mobile)
  if (!('ontouchstart' in window)) heroInput.focus();

  var history      = [];
  var historyIndex = -1;
  var trainingBuffer = null;    // for paginated training output
  var trainingNextStep = null;  // deferred next-step instruction
  var TRAINING_PAGE = 10;      // lines per page

  // ---- Decoder config ----
  var EXAMPLE = 'AN20MARMIAJFK';
  var SEGMENTS = [
    { start: 0,  end: 2,  id: 'action', color: '#4fc3f7' },
    { start: 2,  end: 4,  id: 'day',    color: '#69f0ae' },
    { start: 4,  end: 7,  id: 'month',  color: '#69f0ae' },
    { start: 7,  end: 10, id: 'origin', color: '#ffd740' },
    { start: 10, end: 13, id: 'dest',   color: '#ffd740' },
  ];

  var prevTyped = '';
  var decoderCommand = document.getElementById('decoder-command');

  // ---- Sync input width to command width ----
  function syncWidths() {
    var cmdW = decoderCommand.getBoundingClientRect().width;
    if (cmdW > 0) {
      heroWrapper.style.width = cmdW + 'px';
    }
  }
  syncWidths();
  window.addEventListener('resize', syncWidths);

  // ---- Geolocation-based hero personalization ----
  var GEO_ROUTES = {
    'PY': { origin: 'ASU', dest: 'MAD', originCity: 'Asunci\u00f3n',    destCity: 'Madrid' },
    'AR': { origin: 'EZE', dest: 'MIA', originCity: 'Buenos Aires',     destCity: 'Miami' },
    'BO': { origin: 'VVI', dest: 'MIA', originCity: 'Santa Cruz',       destCity: 'Miami' },
    'CO': { origin: 'BOG', dest: 'MIA', originCity: 'Bogot\u00e1',      destCity: 'Miami' },
    'BR': { origin: 'GRU', dest: 'MIA', originCity: 'S\u00e3o Paulo',   destCity: 'Miami' },
    'MX': { origin: 'MEX', dest: 'MIA', originCity: 'M\u00e9xico',      destCity: 'Miami' },
    'PE': { origin: 'LIM', dest: 'MIA', originCity: 'Lima',             destCity: 'Miami' },
    'CL': { origin: 'SCL', dest: 'MIA', originCity: 'Santiago',         destCity: 'Miami' },
    'PA': { origin: 'PTY', dest: 'MIA', originCity: 'Panam\u00e1',      destCity: 'Miami' },
    'ES': { origin: 'MAD', dest: 'MIA', originCity: 'Madrid',           destCity: 'Miami' },
  };

  function applyGeoRoute(route) {
    if (heroInput.value.length > 0) return; // user already typing
    EXAMPLE = 'AN20MAR' + route.origin + route.dest;
    var originSeg = decoderCommand.querySelector('[data-segment="origin"]');
    var destSeg   = decoderCommand.querySelector('[data-segment="dest"]');
    originSeg.querySelector('.seg-chars').textContent = route.origin;
    originSeg.querySelector('.seg-label').textContent = route.originCity;
    destSeg.querySelector('.seg-chars').textContent   = route.dest;
    destSeg.querySelector('.seg-label').textContent    = route.destCity;
    heroInput.placeholder = EXAMPLE;
    syncWidths();
    Training.setGeoRoute(route);
  }

  // Check sessionStorage cache first, then fetch from API
  var cachedCC = null;
  try { cachedCC = sessionStorage.getItem('geo_cc'); } catch (e) {}
  if (cachedCC && GEO_ROUTES[cachedCC]) {
    applyGeoRoute(GEO_ROUTES[cachedCC]);
  } else {
    fetch('https://get.geojs.io/v1/ip/country.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var cc = (data.country || '').trim().toUpperCase();
        try { sessionStorage.setItem('geo_cc', cc); } catch (e) {}
        if (GEO_ROUTES[cc]) applyGeoRoute(GEO_ROUTES[cc]);
      })
      .catch(function () {}); // silent fallback to default
  }

  // ---- Text measurement for sparkle positioning ----
  var _measureCtx = null;
  function measureText(text) {
    if (!_measureCtx) {
      var c = document.createElement('canvas');
      _measureCtx = c.getContext('2d');
    }
    _measureCtx.font = getComputedStyle(heroInput).font;
    return _measureCtx.measureText(text.toUpperCase()).width;
  }

  // ---- Post-payment / post-login detection ----
  var _postPayment = false;
  var _postLogin = false;
  (function checkUrlFlags() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) _postPayment = true;
    if (params.get('logged_in') === '1') _postLogin = true;
    // Strip query params
    if (_postPayment || _postLogin) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  })();

  // ============================================================
  //  SPARKLES
  // ============================================================

  function getSparkleOrigin() {
    var rect = heroWrapper.getBoundingClientRect();
    var promptEl = heroWrapper.querySelector('.hero-prompt');
    var promptWidth = promptEl ? promptEl.offsetWidth + 12 : 34;
    var textWidth = measureText(heroInput.value);
    return {
      x: rect.left + 20 + promptWidth + textWidth,
      y: rect.top + rect.height / 2,
    };
  }

  function spawnSparkles(color, count) {
    var origin = getSparkleOrigin();
    for (var i = 0; i < count; i++) {
      createSparkle(origin.x, origin.y, color);
    }
  }

  function createSparkle(x, y, color) {
    var el = document.createElement('div');
    el.className = 'sparkle';

    var size = 2 + Math.random() * 4;
    var dx = (Math.random() - 0.5) * 70;
    var dy = -(15 + Math.random() * 55);
    var dur = 350 + Math.random() * 350;

    el.style.cssText =
      'left:' + x + 'px;' +
      'top:' + y + 'px;' +
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'background:' + color + ';' +
      'box-shadow:0 0 ' + (size + 3) + 'px ' + color + ';' +
      '--sx:' + dx + 'px;' +
      '--sy:' + dy + 'px;' +
      '--dur:' + dur + 'ms;';

    document.body.appendChild(el);
    el.addEventListener('animationend', function () { el.remove(); });
  }

  // ============================================================
  //  QUAKE & ERROR SHAKE
  // ============================================================

  function triggerQuake() {
    heroWrapper.classList.remove('quake');
    void heroWrapper.offsetWidth;
    heroWrapper.classList.add('quake');
  }

  function triggerErrorShake() {
    heroWrapper.classList.remove('error-shake', 'error', 'quake');
    void heroWrapper.offsetWidth;
    heroWrapper.classList.add('error-shake', 'error');
    // Spawn a few red sparks
    spawnSparkles('#ff6b6b', 3);
    setTimeout(function () {
      heroWrapper.classList.remove('error-shake', 'error');
    }, 500);
  }

  // ============================================================
  //  SEGMENT POP & ERROR FLASH
  // ============================================================

  function triggerSegmentPop(segId) {
    var chars = document.querySelector('.seg[data-segment="' + segId + '"] .seg-chars');
    chars.classList.remove('seg-pop');
    void chars.offsetWidth;
    chars.classList.add('seg-pop');
  }

  function flashSegmentError(errorCharIndex) {
    for (var i = 0; i < SEGMENTS.length; i++) {
      var seg = SEGMENTS[i];
      if (errorCharIndex >= seg.start && errorCharIndex < seg.end) {
        var el = document.querySelector('.seg[data-segment="' + seg.id + '"]');
        el.classList.remove('seg-error');
        void el.offsetWidth;
        el.classList.add('seg-error');
        (function (target) {
          setTimeout(function () { target.classList.remove('seg-error'); }, 600);
        })(el);
        break;
      }
    }
  }

  function getSegmentColor(charIndex) {
    for (var i = 0; i < SEGMENTS.length; i++) {
      if (charIndex >= SEGMENTS[i].start && charIndex < SEGMENTS[i].end) {
        return SEGMENTS[i].color;
      }
    }
    return '#69f0ae';
  }

  // ============================================================
  //  DECODER — interactive highlight as user types
  // ============================================================

  function updateDecoder(typed) {
    typed = typed.toUpperCase();
    var len = typed.length;

    // Determine if typed string matches the example prefix
    var matching = true;
    var errorAt = -1;
    for (var i = 0; i < len && i < EXAMPLE.length; i++) {
      if (typed[i] !== EXAMPLE[i]) {
        matching = false;
        errorAt = i;
        break;
      }
    }

    // Enter/exit interactive mode
    if (len === 0) {
      decoder.classList.remove('interactive');
      SEGMENTS.forEach(function (seg) {
        var el = document.querySelector('.seg[data-segment="' + seg.id + '"]');
        el.classList.remove('seg-complete', 'seg-partial', 'seg-error');
      });
      heroWrapper.classList.remove('ready');
      return;
    }

    decoder.classList.add('interactive');

    SEGMENTS.forEach(function (seg) {
      var el = document.querySelector('.seg[data-segment="' + seg.id + '"]');
      el.classList.remove('seg-complete', 'seg-partial');

      if (!matching || len <= seg.start) return;

      if (len >= seg.end) {
        el.classList.add('seg-complete');
      } else {
        el.classList.add('seg-partial');
      }
    });

    // Ready state when full command typed
    if (matching && len >= EXAMPLE.length) {
      heroWrapper.classList.add('ready');
    } else {
      heroWrapper.classList.remove('ready');
    }
  }

  // ============================================================
  //  HERO INPUT — typing effects
  // ============================================================

  heroInput.addEventListener('input', function () {
    var typed = heroInput.value.toUpperCase();
    var len = typed.length;
    var prevLen = prevTyped.length;

    // Only trigger effects when a character was added
    if (len > prevLen) {
      // Check if current input matches example prefix
      var matching = true;
      var errorAt = -1;
      for (var i = 0; i < len && i < EXAMPLE.length; i++) {
        if (typed[i] !== EXAMPLE[i]) {
          matching = false;
          errorAt = i;
          break;
        }
      }

      if (matching && len <= EXAMPLE.length) {
        // ── CORRECT CHARACTER ──
        triggerQuake();
        spawnSparkles(getSegmentColor(len - 1), 5);

        // Check if a segment just completed
        for (var s = 0; s < SEGMENTS.length; s++) {
          if (len === SEGMENTS[s].end && prevLen < SEGMENTS[s].end) {
            triggerSegmentPop(SEGMENTS[s].id);
            // Extra sparkle burst on segment completion
            spawnSparkles(SEGMENTS[s].color, 4);
          }
        }

        // Full command completed — celebration burst
        if (len === EXAMPLE.length) {
          setTimeout(function () {
            spawnSparkles('#4fc3f7', 6);
            spawnSparkles('#69f0ae', 6);
            spawnSparkles('#ffd740', 6);
          }, 80);
        }
      } else if (!matching) {
        // ── ERROR CHARACTER ──
        triggerErrorShake();
        if (errorAt >= 0) flashSegmentError(errorAt);
      }
    }

    prevTyped = typed;
    updateDecoder(typed);
  });

  heroInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var raw = heroInput.value.trim();
      if (!raw) return;
      var cmd = raw.toUpperCase();
      var result = Amadeus.process(raw);
      transitionToTerminal(cmd, result);
    }
  });

  // ============================================================
  //  OUTPUT HELPERS
  // ============================================================

  function adaptSeparators(text) {
    // Measure actual character width using a hidden element
    var probe = document.createElement('pre');
    probe.style.cssText = 'position:absolute;visibility:hidden;font:inherit;padding:0;margin:0;';
    probe.textContent = 'M'.repeat(10);
    output.appendChild(probe);
    var charW = probe.offsetWidth / 10;
    output.removeChild(probe);
    // clientWidth excludes scrollbar; subtract training padding (border 3 + pad 12) + safety
    var avail = output.clientWidth - 20;
    var n = Math.max(16, Math.min(Math.floor(avail / charW), 56));
    return text.replace(/[─]{10,}/g, '─'.repeat(n))
               .replace(/[═]{10,}/g, '═'.repeat(n));
  }

  var ACTION_MARKER = '\x01';

  function print(text, cls) {
    if (cls === 'training' || cls === 'training-success') {
      text = adaptSeparators(text);
      if (text.indexOf(ACTION_MARKER) !== -1) {
        printMixed(text, cls);
        return;
      }
    }
    appendPre(text, cls);
  }

  function printMixed(text, defaultCls) {
    var lines = text.split('\n');
    var buf = [];
    var curCls = defaultCls;

    function flush() {
      if (!buf.length) return;
      appendPre(buf.join('\n'), curCls);
      buf = [];
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var isAction = line.indexOf(ACTION_MARKER) !== -1;
      var targetCls = isAction ? 'system' : defaultCls;

      if (targetCls !== curCls) {
        flush();
        curCls = targetCls;
      }
      buf.push(line.replace(ACTION_MARKER, ''));
    }
    flush();
  }

  function appendPre(text, cls) {
    var el = document.createElement('pre');
    el.className = cls || '';
    el.textContent = text;
    output.appendChild(el);
    output.scrollTop = output.scrollHeight;
  }

  function printPaged(text, cls) {
    var lines = text.split('\n');
    if (lines.length <= TRAINING_PAGE) {
      print(text, cls);
      trainingBuffer = null;
      return;
    }
    var page = lines.slice(0, TRAINING_PAGE).join('\n');
    var rest = lines.slice(TRAINING_PAGE).join('\n');
    print(page, cls);
    print('-- MD para continuar --', 'system');
    trainingBuffer = { text: rest, type: cls };
  }

  function clearScreen() {
    output.innerHTML = '';
  }

  // ============================================================
  //  PAYWALL MODAL
  // ============================================================

  function showPaywall() {
    // Reset modal state
    paywallEmailStep.classList.remove('hidden');
    paywallLoading.classList.add('hidden');
    paywallError.classList.add('hidden');
    paywallEmail.value = '';
    paywallOverlay.classList.remove('hidden');
    paywallOverlay.offsetHeight;
    paywallOverlay.classList.add('visible');
    paywallEmail.focus();
  }

  function hidePaywall() {
    paywallOverlay.classList.remove('visible');
    setTimeout(function () {
      paywallOverlay.classList.add('hidden');
    }, 300);
  }

  paywallClose.addEventListener('click', hidePaywall);

  paywallOverlay.addEventListener('click', function (e) {
    if (e.target === paywallOverlay) hidePaywall();
  });

  paywallBuy.addEventListener('click', function () {
    var email = paywallEmail.value.trim();
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      paywallError.classList.remove('hidden');
      paywallErrorText.textContent = 'Ingresa un email valido';
      return;
    }
    paywallEmailStep.classList.add('hidden');
    paywallError.classList.add('hidden');
    paywallLoading.classList.remove('hidden');

    Auth.createCheckout(email, function (result) {
      if (result.already_paid) {
        // User already paid — send magic link to verify email ownership
        Auth.requestMagicLink(result.email, function (mlResult) {
          hidePaywall();
          print('', '');
          if (mlResult.sent) {
            print('Ya tienes acceso con este email!', 'success');
            print('Te enviamos un enlace de acceso a ' + result.email, 'system');
            print('Revisa tu bandeja de entrada.', 'system');
          } else {
            print('Ya tienes acceso con este email.', 'success');
            print('Escribe LOGIN para iniciar sesion.', 'system');
          }
        });
        return;
      }
      if (result.error) {
        paywallLoading.classList.add('hidden');
        paywallEmailStep.classList.remove('hidden');
        paywallError.classList.remove('hidden');
        paywallErrorText.textContent = result.error;
      }
      // If successful, Auth.createCheckout redirects to Stripe — no callback needed
    });
  });

  paywallEmail.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') paywallBuy.click();
  });

  // ============================================================
  //  LOGIN MODAL
  // ============================================================

  function showLogin() {
    loginEmailStep.classList.remove('hidden');
    loginSent.classList.add('hidden');
    loginError.classList.add('hidden');
    loginEmail.value = '';
    loginOverlay.classList.remove('hidden');
    loginOverlay.offsetHeight;
    loginOverlay.classList.add('visible');
    loginEmail.focus();
  }

  function hideLogin() {
    loginOverlay.classList.remove('visible');
    setTimeout(function () {
      loginOverlay.classList.add('hidden');
    }, 300);
  }

  loginClose.addEventListener('click', hideLogin);

  loginOverlay.addEventListener('click', function (e) {
    if (e.target === loginOverlay) hideLogin();
  });

  loginSend.addEventListener('click', function () {
    var email = loginEmail.value.trim();
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      loginError.classList.remove('hidden');
      loginErrorText.textContent = 'Ingresa un email valido';
      return;
    }
    loginEmailStep.classList.add('hidden');
    loginError.classList.add('hidden');

    Auth.requestMagicLink(email, function (result) {
      if (result.sent) {
        loginSent.classList.remove('hidden');
      } else {
        loginEmailStep.classList.remove('hidden');
        loginError.classList.remove('hidden');
        loginErrorText.textContent = result.error;
      }
    });
  });

  loginEmail.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') loginSend.click();
  });

  // "Ya tengo acceso" link in hero
  heroLogin.addEventListener('click', function (e) {
    e.preventDefault();
    showLogin();
  });

  // ============================================================
  //  HERO → TERMINAL TRANSITION
  // ============================================================

  function transitionToTerminal(firstCmd, firstResult) {
    hero.classList.add('fade-out');
    if (landingContent) landingContent.classList.add('hidden');
    document.body.classList.add('scroll-locked');
    window.scrollTo(0, 0);

    setTimeout(function () {
      hero.classList.add('hidden');
      terminal.classList.remove('hidden');
      helpToggle.classList.remove('hidden');

      print('> ' + firstCmd, 'command');

      print('', '');
      print('Bien! Este sería el resultado arrojado por Amadeus:', 'system');

      if (firstResult && typeof firstResult === 'object' && firstResult.clear) {
        // skip
      } else if (firstResult) {
        print(firstResult, 'response');
      }
      print('', '');
      print('Para aprender a leerlo escribe TRAINING y comenzaremos el curso interactivo.', 'system');

      terminal.offsetHeight;
      terminal.classList.add('visible');
      input.focus();
    }, 500);
  }

  // ============================================================
  //  PROCESS COMMAND (terminal mode)
  // ============================================================

  function processCommand(raw) {
    var cmd = raw.toUpperCase();

    history.push(raw);
    historyIndex = history.length;

    // Push previous output above the fold so each command feels fresh
    if (cmd !== 'MD' && cmd !== 'MU' && cmd !== 'CLEAR' && output.children.length > 0) {
      var spacer = document.createElement('div');
      spacer.style.height = output.clientHeight + 'px';
      spacer.style.flexShrink = '0';
      output.appendChild(spacer);
    }

    print('> ' + cmd, 'command');

    // MD with pending training buffer — show next page
    if (cmd === 'MD' && trainingBuffer) {
      printPaged(trainingBuffer.text, trainingBuffer.type);
      // If buffer fully consumed, show deferred next step
      if (!trainingBuffer && trainingNextStep) {
        print(trainingNextStep.text, trainingNextStep.type);
        trainingNextStep = null;
      }
      return;
    }

    // Any other command clears the training buffer
    trainingBuffer = null;
    trainingNextStep = null;

    // Auth commands
    if (cmd === 'LOGIN') {
      showLogin();
      return;
    }

    if (cmd === 'CUENTA') {
      if (Auth.isLoggedIn()) {
        var u = Auth.user();
        print('', '');
        print('CUENTA: ' + u.email, 'system');
        print('Estado: ' + (u.paid ? 'PRO (acceso completo)' : 'Gratuito'), 'system');
      } else {
        print('', '');
        print('No has iniciado sesion.', 'system');
        print('Escribe LOGIN para acceder a tu cuenta.', 'system');
      }
      return;
    }

    if (cmd === 'LOGOUT') {
      Auth.logout(function () {
        print('', '');
        print('Sesion cerrada.', 'system');
      });
      return;
    }

    // Training meta-commands
    if (cmd === 'TRAINING' || cmd.startsWith('TRAINING ') ||
        cmd === 'ENTRENAMIENTO' ||
        cmd === 'PISTA' || cmd === 'PASO' || cmd === 'SIGUIENTE' ||
        cmd === 'COMPRAR') {
      var tResult = Training.handleMeta(cmd);
      if (tResult === '__PAYWALL__') {
        showPaywall();
      } else {
        print(tResult, 'training');
      }
    } else {
      var result = Amadeus.process(raw);

      if (result && typeof result === 'object' && result.clear) {
        clearScreen();
      } else if (result) {
        var style = 'response';
        var upper = result.toUpperCase();
        if (upper.startsWith('INVALID') || upper.startsWith('FORMAT:') ||
            upper.startsWith('NO ') || upper.startsWith('UNABLE') ||
            upper.startsWith('NEED ') || upper.startsWith('CHECK ') ||
            upper.indexOf('NOT FOUND') !== -1) {
          style = 'error';
        }
        print(result, style);
      }

      if (Training.isActive()) {
        var feedback = Training.checkStep(cmd);
        if (feedback) {
          printPaged(feedback.text, feedback.type);
          if (feedback.next) {
            if (!trainingBuffer) {
              // No pagination — show next step immediately
              print(feedback.next, feedback.type);
            } else {
              // Deferred until MD consumes the buffer
              trainingNextStep = { text: feedback.next, type: feedback.type };
            }
          }
        }
      }
    }
  }

  // ============================================================
  //  TERMINAL INPUT
  // ============================================================

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var raw = input.value.trim();
      if (!raw) return;
      processCommand(raw);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        input.value = '';
      }
    }
  });

  // ============================================================
  //  HELP PANEL
  // ============================================================

  helpToggle.addEventListener('click', function () {
    helpPanel.classList.toggle('open');
  });

  helpClose.addEventListener('click', function () {
    helpPanel.classList.remove('open');
  });

  // ============================================================
  //  FOCUS MANAGEMENT
  // ============================================================

  terminal.addEventListener('click', function (e) {
    if (e.target.closest('#help-panel')) return;
    input.focus();
  });

  // ============================================================
  //  DASHBOARD — for logged-in users
  // ============================================================

  // View transition helper (shared by all screen swaps)
  function switchView(from, to, animate) {
    // Hide landing content when leaving hero for terminal/dashboard
    if (from === hero && to !== hero && landingContent) {
      landingContent.classList.add('hidden');
      document.body.classList.add('scroll-locked');
      window.scrollTo(0, 0);
    }
    // Show landing content when returning to hero
    if (to === hero && landingContent) {
      landingContent.classList.remove('hidden');
      document.body.classList.remove('scroll-locked');
    }
    if (to === dashboard || to === terminal) {
      document.body.classList.add('scroll-locked');
    }

    if (animate) {
      from.classList.add('fade-out');
      setTimeout(function () {
        from.classList.add('hidden');
        from.classList.remove('fade-out');
        to.classList.remove('hidden');
        if (to === terminal) {
          helpToggle.classList.remove('hidden');
          terminal.offsetHeight;
          terminal.classList.add('visible');
          input.focus();
        }
      }, 500);
    } else {
      from.classList.add('hidden');
      from.classList.remove('fade-out');
      to.classList.remove('hidden');
      if (to === terminal) {
        helpToggle.classList.remove('hidden');
        terminal.offsetHeight;
        terminal.classList.add('visible');
        input.focus();
      }
    }
  }

  function populateDashboard(user) {
    // Ensure progress is restored before reading it
    if (user.progress) Training.restoreProgress(user.progress);

    var progress = Training.getProgressData();
    var completed = progress.completed;
    var paid = user.paid;

    dashEmail.textContent = user.email;
    dashProgressCount.textContent = completed.length;
    dashProgressLabel.textContent = 'de ' + progress.total + ' ejercicios completados';
    // Animate progress bar after a brief delay
    setTimeout(function () {
      dashProgressFill.style.width = ((completed.length / progress.total) * 100) + '%';
    }, 200);

    // Build exercise rows
    var frag = document.createDocumentFragment();
    for (var i = 0; i < progress.total; i++) {
      var num = i + 1;
      var done = completed.indexOf(num) !== -1;
      var free = num <= progress.freeLimit;
      var locked = !free && !paid;

      var row = document.createElement('div');
      row.className = 'dash-row' + (done ? ' done' : '') + (locked ? ' locked' : '');
      row.setAttribute('data-ex', num);

      var numEl = document.createElement('span');
      numEl.className = 'dash-row-num';
      numEl.textContent = num;

      var titleEl = document.createElement('span');
      titleEl.className = 'dash-row-title';
      titleEl.textContent = progress.titles[i];

      var tagEl = document.createElement('span');
      tagEl.className = 'dash-row-tag';
      if (done) {
        tagEl.classList.add('dash-tag-done');
        tagEl.textContent = 'COMPLETADO';
      } else if (locked) {
        tagEl.classList.add('dash-tag-locked');
        tagEl.textContent = 'PRO';
      } else if (free) {
        tagEl.classList.add('dash-tag-free');
        tagEl.textContent = 'GRATIS';
      } else {
        tagEl.classList.add('dash-tag-pro');
        tagEl.textContent = 'PRO';
      }

      row.appendChild(numEl);
      row.appendChild(titleEl);
      row.appendChild(tagEl);
      frag.appendChild(row);
    }
    dashExerciseList.innerHTML = '';
    dashExerciseList.appendChild(frag);

    // Find next uncompleted exercise for "Continue" button
    dashNextExercise = -1;
    for (var j = 0; j < progress.total; j++) {
      var n = j + 1;
      var isFree = n <= progress.freeLimit;
      if (completed.indexOf(n) === -1 && (isFree || paid)) {
        dashNextExercise = n;
        break;
      }
    }

    if (dashNextExercise > 0 && completed.length > 0) {
      dashContinue.classList.remove('hidden');
      dashContinueLabel.textContent = 'Continuar Ejercicio ' + dashNextExercise;
    } else {
      dashContinue.classList.add('hidden');
    }
  }

  function dashTransitionToTerminal(firstCmd, firstResult) {
    dashboard.classList.add('fade-out');
    document.body.classList.add('scroll-locked');
    setTimeout(function () {
      dashboard.classList.add('hidden');
      dashboard.classList.remove('fade-out');
      terminal.classList.remove('hidden');
      helpToggle.classList.remove('hidden');

      if (firstCmd) {
        print('> ' + firstCmd, 'command');
        if (firstResult) print(firstResult, 'training');
      } else {
        print('', '');
        print('Sesion iniciada. Bienvenido/a de vuelta!', 'success');
        print('Escribe TRAINING para ver los ejercicios.', 'system');
      }

      terminal.offsetHeight;
      terminal.classList.add('visible');
      input.focus();
    }, 500);
  }

  function dashTransitionToExercise(exNum) {
    var cmd = 'TRAINING ' + exNum;
    var result = Training.handleMeta(cmd);
    if (result === '__PAYWALL__') {
      showPaywall();
      return;
    }
    dashTransitionToTerminal(cmd, result);
  }

  // Exercise row click handler (registered once, uses event delegation)
  dashExerciseList.addEventListener('click', function (e) {
    var row = e.target.closest('.dash-row');
    if (!row || row.classList.contains('locked')) return;
    var exNum = parseInt(row.getAttribute('data-ex'), 10);
    dashTransitionToExercise(exNum);
  });

  // "Continuar" button
  dashContinue.addEventListener('click', function () {
    if (dashNextExercise > 0) dashTransitionToExercise(dashNextExercise);
  });

  // "Abrir Consola" button
  dashOpen.addEventListener('click', function () {
    dashTransitionToTerminal(null, null);
  });

  // Dashboard logout
  dashLogout.addEventListener('click', function () {
    Auth.logout(function () {
      switchView(dashboard, hero, true);
      if (!('ontouchstart' in window)) heroInput.focus();
    });
  });

  // ============================================================
  //  POST-PAYMENT / POST-LOGIN HOOKS
  // ============================================================

  Auth._onPaymentConfirmed = function () {
    var u = Auth.user();
    if (terminal.classList.contains('visible') && !_postPayment) {
      // Already using the terminal — just print confirmation
      print('', '');
      print('Pago confirmado! Todos los ejercicios estan desbloqueados.', 'success');
      print('Escribe TRAINING para ver los ejercicios.', 'system');
      return;
    }
    // All other cases: show dashboard
    populateDashboard(u);
    var hideTarget = _postPayment ? terminal : hero;
    switchView(hideTarget, dashboard, true);
  };

  Auth._onPaymentTimeout = function () {
    if (!terminal.classList.contains('visible')) {
      switchView(hero, terminal, true);
      print('', '');
      print('Tu pago fue recibido. Si los ejercicios no se desbloquean, recarga la pagina en unos segundos.', 'system');
    } else {
      print('', '');
      print('Tu pago fue recibido. Si los ejercicios no se desbloquean, recarga la pagina en unos segundos.', 'system');
    }
  };

  // If returning from payment, show a loading message
  if (_postPayment) {
    switchView(hero, terminal, true);
    // Print after transition completes
    setTimeout(function () {
      print('Verificando tu pago...', 'system');
    }, 550);
  }

  // Show dashboard for logged-in users (post-login or existing session)
  if (!_postPayment) {
    Auth.onReady(function (user) {
      if (!user) return;
      populateDashboard(user);
      if (_postLogin) {
        switchView(hero, dashboard, true);
      } else {
        hero.classList.add('hidden');
        if (landingContent) landingContent.classList.add('hidden');
        document.body.classList.add('scroll-locked');
        dashboard.classList.remove('hidden');
      }
    });
  }
});
