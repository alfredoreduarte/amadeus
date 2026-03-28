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

    setTimeout(function () {
      hero.classList.add('hidden');
      terminal.classList.remove('hidden');
      helpToggle.classList.remove('hidden');

      print('> ' + firstCmd, 'command');
      if (firstResult && typeof firstResult === 'object' && firstResult.clear) {
        // skip
      } else if (firstResult) {
        print(firstResult, 'response');
      }
      print('', '');
      print('Escribe TRAINING para comenzar el curso interactivo.', 'system');

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
  //  POST-PAYMENT / POST-LOGIN HOOKS
  // ============================================================

  Auth._onPaymentConfirmed = function () {
    // Payment confirmed via polling — show terminal with success message
    if (!terminal.classList.contains('visible')) {
      // Still on hero — transition to terminal
      hero.classList.add('fade-out');
      setTimeout(function () {
        hero.classList.add('hidden');
        terminal.classList.remove('hidden');
        helpToggle.classList.remove('hidden');
        print('', '');
        print('Pago confirmado! Todos los ejercicios estan desbloqueados.', 'success');
        print('Escribe TRAINING para ver los ejercicios.', 'system');
        terminal.offsetHeight;
        terminal.classList.add('visible');
        input.focus();
      }, 500);
    } else {
      print('', '');
      print('Pago confirmado! Todos los ejercicios estan desbloqueados.', 'success');
      print('Escribe TRAINING para ver los ejercicios.', 'system');
    }
  };

  Auth._onPaymentTimeout = function () {
    if (!terminal.classList.contains('visible')) {
      hero.classList.add('fade-out');
      setTimeout(function () {
        hero.classList.add('hidden');
        terminal.classList.remove('hidden');
        helpToggle.classList.remove('hidden');
        print('', '');
        print('Tu pago fue recibido. Si los ejercicios no se desbloquean, recarga la pagina en unos segundos.', 'system');
        terminal.offsetHeight;
        terminal.classList.add('visible');
        input.focus();
      }, 500);
    } else {
      print('', '');
      print('Tu pago fue recibido. Si los ejercicios no se desbloquean, recarga la pagina en unos segundos.', 'system');
    }
  };

  // If returning from payment, show a loading message
  if (_postPayment) {
    hero.classList.add('fade-out');
    setTimeout(function () {
      hero.classList.add('hidden');
      terminal.classList.remove('hidden');
      helpToggle.classList.remove('hidden');
      print('Verificando tu pago...', 'system');
      terminal.offsetHeight;
      terminal.classList.add('visible');
    }, 500);
  }

  // If returning from magic link login
  if (_postLogin) {
    Auth.onReady(function (user) {
      if (user) {
        if (!terminal.classList.contains('visible')) {
          hero.classList.add('fade-out');
          setTimeout(function () {
            hero.classList.add('hidden');
            terminal.classList.remove('hidden');
            helpToggle.classList.remove('hidden');
            print('', '');
            print('Sesion iniciada. Bienvenido/a de vuelta!', 'success');
            if (user.paid) {
              print('Todos los ejercicios estan desbloqueados.', 'system');
            }
            print('Escribe TRAINING para ver los ejercicios.', 'system');
            terminal.offsetHeight;
            terminal.classList.add('visible');
            input.focus();
          }, 500);
        }
      }
    });
  }
});
