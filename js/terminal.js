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

  // ---- Check for Stripe unlock redirect ----
  (function checkUnlock() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('unlocked') === 'true') {
      try { localStorage.setItem('ama_paid', 'true'); } catch (e) {}
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
    paywallOverlay.classList.remove('hidden');
    paywallOverlay.offsetHeight;
    paywallOverlay.classList.add('visible');
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
});
