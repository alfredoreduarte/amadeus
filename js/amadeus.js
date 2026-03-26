// ============================================================
// Amadeus Command Engine
// Parses cryptic commands and returns formatted responses.
// ============================================================

var Amadeus = (function () {

  // ---- Constants ----
  var MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var DAYS   = ['SU','MO','TU','WE','TH','FR','SA'];
  var CLASS_ORDER = ['F','A','J','C','D','I','Y','B','M','H','K','Q','V'];

  // ---- Session state ----
  var currentPNR   = null;   // PNR being built / modified
  var lastAvail    = null;   // last AN result rows (for SS)
  var storedPNRs   = {};     // locator → PNR
  var lastLong     = null;   // last long response for MD/MU
  var scrollPos    = 0;
  var PAGE_SIZE    = 22;

  // ---- Date helpers ----

  function parseDate(s) {
    // "20MAR" → Date or null
    if (!s || s.length < 5) return null;
    var day = parseInt(s.substring(0, 2), 10);
    var mon = MONTHS.indexOf(s.substring(2, 5).toUpperCase());
    if (mon === -1 || isNaN(day) || day < 1 || day > 31) return null;
    var yr = new Date().getFullYear();
    return new Date(yr, mon, day);
  }

  function fmtDate(d) {
    return String(d.getDate()).padStart(2, '0') + MONTHS[d.getMonth()];
  }

  function dayOfWeek(d) {
    return DAYS[d.getDay()];
  }

  function todayStr() {
    return fmtDate(new Date());
  }

  // ---- Formatting helpers ----

  function pad(s, n) { return String(s).padEnd(n); }
  function rpad(s, n) { return String(s).padStart(n); }

  function generateLocator() {
    var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var r = '';
    for (var i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * 26));
    return r;
  }

  function makeNewPNR() {
    return {
      locator: null,
      names: [],
      segments: [],
      phones: [],
      emails: [],
      docs: [],      // SRDOCS passport data
      ssrs: [],      // SR special service requests
      seats: [],     // seat assignments
      ticketing: null,
      receivedFrom: null,
      remarks: [],
      pricing: null,
    };
  }

  function ensurePNR() {
    if (!currentPNR) currentPNR = makeNewPNR();
    return currentPNR;
  }

  // ---- Main router ----

  function process(input) {
    var cmd = input.trim().toUpperCase();
    if (!cmd) return '';
    lastLong = null;
    scrollPos = 0;

    // Exact / prefix matching
    if (cmd === 'CLEAR')                                return { text: '', clear: true };
    if (cmd === 'MD')                                   return handleMD();
    if (cmd === 'MU')                                   return handleMU();
    if (cmd === 'IG')                                   return handleIG();
    if (cmd === 'XI')                                   return handleXI();
    if (cmd === 'TKOK')                                 return handleTKOK();
    if (cmd === 'ET' || cmd === 'ER')                   return handleET(cmd);
    if (cmd === 'FXP' || cmd === 'FXX')                 return handleFXP(cmd);
    if (cmd === 'RT' || cmd === '*R' || cmd === '*A')   return handleRT('');
    if (cmd === '*I')                                   return handleDisplayItinerary();
    if (cmd === '*P')                                   return handleDisplayPassengers();
    if (cmd.startsWith('TTP'))                          return handleTTP();
    if (cmd.startsWith('AN'))                           return handleAN(cmd.substring(2));
    if (cmd.startsWith('FQD'))                          return handleFQD(cmd.substring(3));
    if (cmd.startsWith('SS'))                           return handleSS(cmd.substring(2));
    if (cmd.match(/^NM\d/))                             return handleNM(cmd);
    if (cmd.startsWith('APE-') || cmd.startsWith('APE ')) return handleAPE(cmd.substring(3).replace(/^[-\s]+/,''));
    if (cmd.startsWith('AP'))                           return handleAP(cmd.substring(2));
    if (cmd.startsWith('RF'))                           return handleRF(cmd.substring(2));
    if (cmd.match(/^RT[A-Z]/))                          return handleRT(cmd.substring(2));
    if (cmd.startsWith('XE'))                           return handleXE(cmd.substring(2));
    if (cmd.startsWith('DAN'))                          return handleDAN(cmd.substring(3));
    if (cmd.match(/^DN[A-Z]/))                          return handleDN(cmd.substring(2));
    if (cmd.startsWith('HE'))                           return handleHE(cmd.substring(2).trim());
    if (cmd === 'IR')                                   return handleIR();
    if (cmd.startsWith('SRDOCS'))                       return handleSRDOCS(cmd);
    if (cmd.startsWith('SRFOID'))                       return handleSRFOID(cmd);
    if (cmd.match(/^SR[A-Z]{4}/))                       return handleSR(cmd);
    if (cmd.match(/^TKTL/))                             return handleTKTL(cmd.substring(4));
    if (cmd.match(/^SM\d?$/))                           return handleSM(cmd);
    if (cmd.match(/^ST\//))                             return handleST(cmd);

    return 'INVALID';
  }

  // ============================================================
  //  AN – Availability
  // ============================================================

  function handleAN(args) {
    // AN20MARMIAJFK  or AN20MARMIAJFK/AAA
    args = args.replace(/\s+/g, '');
    var m = args.match(/^(\d{2}[A-Z]{3})([A-Z]{3})([A-Z]{3})(?:\/A?([A-Z]{2}))?$/);
    if (!m) return 'FORMAT: AN{DDMMM}{ORIG}{DEST}  e.g. AN20MARMIAJFK';

    var dateStr  = m[1];
    var orig     = m[2];
    var dest     = m[3];
    var alFilter = m[4] || null;

    var dt = parseDate(dateStr);
    if (!dt) return 'INVALID DATE';

    var origApts = resolveAirports(orig);
    var destApts = resolveAirports(dest);
    if (!origApts) return 'INVALID CITY/AIRPORT - ' + orig;
    if (!destApts) return 'INVALID CITY/AIRPORT - ' + dest;

    // Find matching flights
    var results = [];
    DATA.flights.forEach(function (f) {
      if (origApts.indexOf(f.from) === -1) return;
      if (destApts.indexOf(f.to) === -1) return;
      if (alFilter && f.al !== alFilter) return;
      results.push(f);
    });

    if (results.length === 0) return 'NO FLIGHTS FOUND  ' + orig + '-' + dest;

    // Sort by departure time
    results.sort(function (a, b) { return a.dep.localeCompare(b.dep); });

    // Store for SS
    lastAvail = results;

    // Format output
    var header = '** AMADEUS AVAILABILITY - AN **  ' + dayOfWeek(dt) + ' ' + dateStr + '\n';
    var lines = [];
    results.forEach(function (f, idx) {
      var num    = rpad(idx + 1, 2);
      var flight = pad(f.al, 2) + ' ' + rpad(f.fn, 4);

      // Build class string – show available classes from this flight
      var clsStr = '';
      CLASS_ORDER.forEach(function (c) {
        if (f.classes[c] !== undefined) {
          clsStr += c + f.classes[c] + ' ';
        }
      });
      clsStr = pad(clsStr.trim(), 28);

      var route  = f.from + f.to;
      var dep    = f.dep;
      var arrStr = f.arr;
      if (parseInt(f.arr, 10) < parseInt(f.dep, 10)) arrStr += '+1';
      var eq = 'E0/' + f.eq;

      lines.push(' ' + num + '  ' + flight + ' ' + clsStr + ' ' + route + ' ' + dep + ' ' + pad(arrStr, 6) + ' ' + pad(eq, 7) + ' ' + f.dur);
    });

    var out = header + lines.join('\n');
    return out;
  }

  // ============================================================
  //  FQD – Fare Quote Display
  // ============================================================

  function handleFQD(args) {
    args = args.replace(/\s+/g, '');
    // FQDMIAJFK or FQDMIAJFK/D20MAR or FQDMIAJFK/D20MAR/AAA
    var m = args.match(/^([A-Z]{3})([A-Z]{3})(?:\/D(\d{2}[A-Z]{3}))?(?:\/A?([A-Z]{2}))?$/);
    if (!m) return 'FORMAT: FQD{ORIG}{DEST}/D{DDMMM}  e.g. FQDMIAJFK/D20MAR';

    var orig     = m[1];
    var dest     = m[2];
    var dateStr  = m[3] || todayStr();
    var alFilter = m[4] || null;

    var fares = lookupFares(orig, dest);
    if (!fares) return 'NO FARES FOUND  ' + orig + '-' + dest;

    if (alFilter) {
      fares = fares.filter(function (f) { return f.al === alFilter; });
      if (fares.length === 0) return 'NO FARES FOUND  ' + orig + '-' + dest + '/' + alFilter;
    }

    var header = 'FQD ' + orig + ' ' + dest + ' /D' + dateStr + '\n';
    header += ' ROE 1.000000                       USD\n';
    header += '  AL FARE BASIS    OW       RT     B PEN  DATES/DAYS    AP  MIN MAX  R\n';

    var lines = [];
    fares.forEach(function (f, i) {
      var num   = rpad(i + 1, 2);
      var al    = pad(f.al, 2);
      var basis = pad(f.basis, 12);
      var ow    = rpad(f.ow.toFixed(2), 9);
      var rt    = rpad('', 7);  // OW fares only
      var cls   = f.cls;
      var pen   = rpad(f.pen, 4);
      var dates = pad(f.dates, 13);
      var ap    = pad(f.ap || '', 4);
      var mn    = pad(f.min || '-', 3);
      var mx    = pad(f.max, 4);
      var ref   = f.ref;
      lines.push(' ' + num + ' ' + al + ' ' + basis + ' ' + ow + ' ' + rt + cls + ' ' + pen + ' ' + dates + ap + ' ' + mn + ' ' + mx + ' ' + ref);
    });

    var out = header + lines.join('\n');
    return maybePagedResponse(out);
  }

  // ============================================================
  //  SS – Sell Segment
  // ============================================================

  function handleSS(args) {
    // SS1Y1  → qty=1, class=Y, line=1
    var m = args.match(/^(\d)([A-Z])(\d+)$/);
    if (!m) return 'FORMAT: SS{QTY}{CLASS}{LINE}  e.g. SS1Y1';

    var qty   = parseInt(m[1], 10);
    var cls   = m[2];
    var line  = parseInt(m[3], 10);

    if (!lastAvail) return 'NEED AVAILABILITY DISPLAY FIRST';
    if (line < 1 || line > lastAvail.length) return 'INVALID LINE NUMBER';

    var flight = lastAvail[line - 1];
    var avail  = flight.classes[cls];
    if (avail === undefined) return 'INVALID CLASS - ' + cls;
    if (avail < qty) return 'UNABLE - CLASS NOT AVAILABLE';

    // Reduce mock availability
    flight.classes[cls] = Math.max(0, avail - qty);

    var pnr = ensurePNR();

    pnr.segments.push({
      al: flight.al,
      fn: flight.fn,
      cls: cls,
      date: null,  // will use current search context
      from: flight.from,
      to: flight.to,
      dep: flight.dep,
      arr: flight.arr,
      status: 'HK',
      qty: qty,
      eq: flight.eq,
    });

    // Display confirmation
    var seg = pnr.segments[pnr.segments.length - 1];
    var arrStr = seg.arr;
    if (parseInt(seg.arr, 10) < parseInt(seg.dep, 10)) arrStr += '+1';

    return ' ' + pnr.segments.length + '  ' +
      pad(seg.al, 2) + ' ' + rpad(seg.fn, 4) + ' ' +
      seg.cls + ' ' + (seg.date || '     ') + ' ' +
      seg.from + seg.to + ' ' + seg.status + seg.qty + '  ' +
      seg.dep + ' ' + arrStr + '  *1A/E*';
  }

  // ============================================================
  //  NM – Name
  // ============================================================

  function handleNM(cmd) {
    // NM1SMITH/JOHN MR  or  NM2SMITH/JANE MRS+DOE/JOHN MR
    var m = cmd.match(/^NM(\d)(.+)$/);
    if (!m) return 'FORMAT: NM1LASTNAME/FIRSTNAME TITLE';
    var count = parseInt(m[1], 10);
    var rest  = m[2].trim();

    // Could have + separated names for multi-pax
    var parts = rest.split('+');
    var pnr = ensurePNR();

    for (var i = 0; i < parts.length; i++) {
      var nameRaw = parts[i].trim();
      if (!nameRaw || nameRaw.indexOf('/') === -1) return 'FORMAT: NM1LASTNAME/FIRSTNAME TITLE';
      pnr.names.push(nameRaw);
    }

    // Return confirmation
    var lines = [];
    pnr.names.forEach(function (n, idx) {
      lines.push('  ' + (idx + 1) + '.' + n);
    });
    return lines.join('\n');
  }

  // ============================================================
  //  AP – Phone
  // ============================================================

  function handleAP(args) {
    args = args.trim();
    if (!args) return 'FORMAT: AP{CITY} {PHONE}  e.g. APNYC 212 555 1234';
    ensurePNR().phones.push(args);
    return 'AP-' + args;
  }

  // ============================================================
  //  APE – Email
  // ============================================================

  function handleAPE(email) {
    email = email.trim();
    if (!email) return 'FORMAT: APE-EMAIL@ADDRESS.COM';
    ensurePNR().emails.push(email);
    return 'APE-' + email;
  }

  // ============================================================
  //  TKOK – Ticketing
  // ============================================================

  function handleTKOK() {
    ensurePNR().ticketing = 'OK' + todayStr();
    return 'TK OK' + todayStr();
  }

  // ============================================================
  //  TKTL – Ticketing Time Limit
  // ============================================================

  function handleTKTL(args) {
    args = args.trim();
    if (!args) return 'FORMAT: TKTL{DDMMM}  e.g. TKTL25MAR';
    var dt = parseDate(args);
    if (!dt) return 'INVALID DATE';
    ensurePNR().ticketing = 'TL' + args;
    return 'TK TL/' + args;
  }

  // ============================================================
  //  SRDOCS – Passport/APIS data
  // ============================================================

  function handleSRDOCS(cmd) {
    // SRDOCS YY HK1-P-ESP-12345678-ESP-28JUN88-F-24JUN30-GARCIA-ANA/P1
    // or simplified: SRDOCS-P-ESP-12345678-ESP-28JUN88-F-24JUN30-GARCIA-ANA
    if (!currentPNR) return 'NO PNR';
    if (currentPNR.names.length === 0) return 'NEED NAME FIRST - NM1...';

    // Accept both formal and simplified formats
    var raw = cmd.replace(/^SRDOCS\s*/i, '').replace(/^YY\s*HK\d[-\s]*/i, '');
    if (!raw || raw.length < 10) return 'FORMAT: SRDOCS YY HK1-P-{COUNTRY}-{PASSPORT}-{NATIONALITY}-{DOB}-{GENDER}-{EXPIRY}-{LASTNAME}-{FIRSTNAME}/P{N}';

    var paxMatch = raw.match(/\/P(\d+)\s*$/);
    var paxNum = paxMatch ? parseInt(paxMatch[1], 10) : 1;

    if (paxNum < 1 || paxNum > currentPNR.names.length) return 'INVALID PASSENGER NUMBER';

    var docData = raw.replace(/\/P\d+\s*$/, '');
    ensurePNR().docs.push({
      data: docData,
      pax: paxNum,
    });

    return 'SSR DOCS YY HK1 ' + docData + '/P' + paxNum;
  }

  // ============================================================
  //  SRFOID – Passenger ID
  // ============================================================

  function handleSRFOID(cmd) {
    if (!currentPNR) return 'NO PNR';
    var raw = cmd.replace(/^SRFOID[-\s]*/i, '');
    if (!raw) return 'FORMAT: SRFOID-{IDTYPE}{NUMBER}{COUNTRY}/P{N}';

    var paxMatch = raw.match(/\/P(\d+)\s*$/);
    var paxNum = paxMatch ? parseInt(paxMatch[1], 10) : 1;

    ensurePNR().docs.push({
      data: 'FOID-' + raw.replace(/\/P\d+\s*$/, ''),
      pax: paxNum,
    });

    return 'SSR FOID YY HK1 ' + raw;
  }

  // ============================================================
  //  SR – Special Service Request
  // ============================================================

  function handleSR(cmd) {
    if (!currentPNR) return 'NO PNR';

    // SRVGML, SRWCHR, SRPETC, etc.
    var type = cmd.substring(2, 6);
    var rest = cmd.substring(6).trim();
    var paxNum = 0; // 0 = all passengers

    var paxMatch = rest.match(/\/P(\d+)/);
    if (paxMatch) paxNum = parseInt(paxMatch[1], 10);

    var validTypes = {
      'VGML': 'VEGETARIAN MEAL',
      'AVML': 'ASIAN VEGETARIAN MEAL',
      'KSML': 'KOSHER MEAL',
      'DBML': 'DIABETIC MEAL',
      'BLML': 'BLAND MEAL',
      'MOML': 'MUSLIM MEAL',
      'CHML': 'CHILD MEAL',
      'BBML': 'BABY MEAL',
      'WCHR': 'WHEELCHAIR - R FOR RAMP',
      'WCHC': 'WHEELCHAIR - C FOR CABIN SEAT',
      'WCHS': 'WHEELCHAIR - S FOR STEPS',
      'PETC': 'PET IN CABIN',
      'BIKE': 'BICYCLE',
      'UMNR': 'UNACCOMPANIED MINOR',
      'MAAS': 'MEET AND ASSIST',
    };

    var desc = validTypes[type];
    if (!desc) return 'UNKNOWN SSR TYPE: ' + type + '\nCommon types: VGML WCHR AVML KSML DBML PETC UMNR';

    ensurePNR().ssrs.push({
      type: type,
      desc: desc,
      pax: paxNum,
    });

    var paxStr = paxNum > 0 ? '/P' + paxNum : '';
    return 'SSR ' + type + ' YY HK1 ' + desc + paxStr;
  }

  // ============================================================
  //  SM – Seat Map
  // ============================================================

  function handleSM(cmd) {
    if (!currentPNR) return 'NO PNR';
    if (currentPNR.segments.length === 0) return 'NO ITINERARY';

    var segNum = cmd.length > 2 ? parseInt(cmd.substring(2), 10) : 1;
    if (segNum < 1 || segNum > currentPNR.segments.length) return 'INVALID SEGMENT';

    var seg = currentPNR.segments[segNum - 1];
    // Generate a simple mock seat map
    var lines = [
      'SEAT MAP  ' + seg.al + ' ' + seg.fn + '  ' + seg.from + seg.to + '  ' + seg.eq,
      '',
      '     A   B   C       D   E   F',
    ];

    for (var row = 1; row <= 30; row++) {
      var seats = [];
      var cols = ['A','B','C','','D','E','F'];
      for (var c = 0; c < cols.length; c++) {
        if (cols[c] === '') { seats.push('   '); continue; }
        // Random availability based on row
        if (row <= 4) {
          // Business class rows
          seats.push(Math.random() > 0.3 ? ' . ' : ' X ');
        } else {
          seats.push(Math.random() > 0.2 ? ' . ' : ' X ');
        }
      }
      var rowStr = rpad(row, 3);
      lines.push('  ' + rowStr + seats.join(''));
      if (row === 4) lines.push('  ---  -   -   -       -   -   -');
    }

    lines.push('');
    lines.push('. = AVAILABLE   X = OCCUPIED');
    lines.push('');
    lines.push('To assign: ST/{SEAT}/P{PAX}  e.g. ST/12A/P1');

    return lines.join('\n');
  }

  // ============================================================
  //  ST – Seat Assignment
  // ============================================================

  function handleST(cmd) {
    if (!currentPNR) return 'NO PNR';
    if (currentPNR.segments.length === 0) return 'NO ITINERARY';

    // ST/12A/P1 or ST/12A/P1/S1
    var m = cmd.match(/^ST\/(\d{1,2}[A-F])(?:\/P(\d+))?(?:\/S(\d+))?$/);
    if (!m) return 'FORMAT: ST/{SEAT}/P{PAX}  e.g. ST/12A/P1';

    var seat = m[1];
    var paxNum = m[2] ? parseInt(m[2], 10) : 1;
    var segNum = m[3] ? parseInt(m[3], 10) : 0; // 0 = all segments

    if (paxNum > currentPNR.names.length) return 'INVALID PASSENGER NUMBER';

    ensurePNR().seats.push({
      seat: seat,
      pax: paxNum,
      seg: segNum,
    });

    return 'SEAT ' + seat + ' ASSIGNED TO PASSENGER ' + paxNum;
  }

  // ============================================================
  //  IR – Ignore and Retrieve (keep PNR active)
  // ============================================================

  function handleIR() {
    if (!currentPNR) return 'NO PNR TO IGNORE';
    if (currentPNR.locator && storedPNRs[currentPNR.locator]) {
      currentPNR = JSON.parse(JSON.stringify(storedPNRs[currentPNR.locator]));
      return 'IG - RESTORED SAVED VERSION\n' + formatPNR(currentPNR);
    }
    return 'IG - NO SAVED VERSION TO RESTORE';
  }

  // ============================================================
  //  RF – Received From
  // ============================================================

  function handleRF(name) {
    name = name.trim();
    if (!name) return 'FORMAT: RF{NAME}';
    ensurePNR().receivedFrom = name;
    return 'RF-' + name;
  }

  // ============================================================
  //  ET/ER – End Transaction
  // ============================================================

  function handleET(cmd) {
    if (!currentPNR) return 'NO PNR';

    // Validate mandatory fields
    var missing = [];
    if (currentPNR.names.length === 0) missing.push('NEED NAME - NM1...');
    if (currentPNR.segments.length === 0) missing.push('NEED ITINERARY - SS...');
    if (currentPNR.phones.length === 0 && currentPNR.emails.length === 0) missing.push('NEED CONTACT - AP...');
    if (!currentPNR.ticketing) missing.push('NEED TICKETING - TKOK');
    if (!currentPNR.receivedFrom) missing.push('NEED RECEIVED FROM - RF...');

    if (missing.length > 0) {
      return 'CHECK MANDATORY FIELDS\n' + missing.join('\n');
    }

    // Save PNR
    if (!currentPNR.locator) {
      currentPNR.locator = generateLocator();
    }
    currentPNR.savedDate = todayStr();
    storedPNRs[currentPNR.locator] = JSON.parse(JSON.stringify(currentPNR));

    if (cmd === 'ER') {
      // End and retrieve – show PNR
      return formatPNR(currentPNR);
    } else {
      // End transaction – just confirm
      var loc = currentPNR.locator;
      currentPNR = null;
      return 'OK  ' + loc;
    }
  }

  // ============================================================
  //  RT – Retrieve
  // ============================================================

  function handleRT(locator) {
    locator = locator.trim();

    if (!locator) {
      if (!currentPNR) return 'NO PNR';
      return formatPNR(currentPNR);
    }

    if (storedPNRs[locator]) {
      currentPNR = JSON.parse(JSON.stringify(storedPNRs[locator]));
      return formatPNR(currentPNR);
    }

    return 'RECORD LOCATOR NOT FOUND - ' + locator;
  }

  // ============================================================
  //  IG – Ignore (cancel current work)
  // ============================================================

  function handleIG() {
    if (!currentPNR) return 'NO PNR TO IGNORE';
    currentPNR = null;
    lastAvail = null;
    return 'IG';
  }

  // ============================================================
  //  XI – Cancel itinerary
  // ============================================================

  function handleXI() {
    if (!currentPNR) return 'NO PNR';
    if (currentPNR.segments.length === 0) return 'NO ITINERARY';
    currentPNR.segments = [];
    currentPNR.pricing = null;
    return 'ITINERARY CANCELLED';
  }

  // ============================================================
  //  XE – Cancel element
  // ============================================================

  function handleXE(args) {
    if (!currentPNR) return 'NO PNR';
    args = args.trim();

    // XE5 or XE5-7
    var m = args.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return 'FORMAT: XE{N} or XE{N}-{M}';

    var from = parseInt(m[1], 10);
    var to   = m[2] ? parseInt(m[2], 10) : from;

    var elements = buildElementList(currentPNR);
    if (from < 1 || to > elements.length || from > to) return 'INVALID ELEMENT NUMBER';

    // Remove elements (in reverse order to preserve indices)
    for (var i = to; i >= from; i--) {
      var el = elements[i - 1];
      if (el.type === 'name')    currentPNR.names.splice(el.idx, 1);
      if (el.type === 'segment') currentPNR.segments.splice(el.idx, 1);
      if (el.type === 'phone')   currentPNR.phones.splice(el.idx, 1);
      if (el.type === 'email')   currentPNR.emails.splice(el.idx, 1);
      if (el.type === 'doc')     currentPNR.docs.splice(el.idx, 1);
      if (el.type === 'ssr')     currentPNR.ssrs.splice(el.idx, 1);
      if (el.type === 'seat')    currentPNR.seats.splice(el.idx, 1);
      if (el.type === 'tk')      currentPNR.ticketing = null;
      if (el.type === 'rf')      currentPNR.receivedFrom = null;
    }

    return 'ELEMENT(S) CANCELLED';
  }

  // ============================================================
  //  FXP – Price PNR / FXX – Cancel pricing
  // ============================================================

  function handleFXP(cmd) {
    if (cmd === 'FXX') {
      if (!currentPNR || !currentPNR.pricing) return 'NO PRICING TO CANCEL';
      currentPNR.pricing = null;
      return 'PRICING CANCELLED';
    }

    if (!currentPNR) return 'NO PNR';
    if (currentPNR.segments.length === 0) return 'NEED ITINERARY';

    // Generate mock pricing based on segment fares
    var total = 0;
    var lines = ['FXP\n'];
    lines.push('  PSGR   TYPE   FQ-BK  IT   FARE    TAX   TOTAL');

    currentPNR.segments.forEach(function (seg, i) {
      var key = seg.from + '-' + seg.to;
      var fares = lookupFares(seg.from, seg.to);
      var fare = 0;
      var basis = seg.cls + 'OW';

      if (fares) {
        // Find matching fare for class
        var match = fares.find(function (f) { return f.cls === seg.cls; });
        if (match) {
          fare = match.ow;
          basis = match.basis;
        } else {
          // Default fallback
          fare = 250;
        }
      } else {
        fare = 300;
      }

      var tax = Math.round(fare * 0.15 * 100) / 100;
      var segTotal = fare + tax;

      total += segTotal * seg.qty;

      for (var p = 0; p < currentPNR.names.length; p++) {
        lines.push('  ' + rpad(p + 1, 3) + '    ADT    ' + pad(basis, 8) + rpad(i + 1, 2) + '  ' +
          rpad(fare.toFixed(2), 9) + rpad(tax.toFixed(2), 8) + rpad(segTotal.toFixed(2), 9));
      }
    });

    lines.push('');
    lines.push('  TOTAL PRICE  USD ' + total.toFixed(2));

    currentPNR.pricing = total.toFixed(2);
    return lines.join('\n');
  }

  // ============================================================
  //  TTP – Ticket issuance (simulated)
  // ============================================================

  function handleTTP() {
    if (!currentPNR) return 'NO PNR';
    if (!currentPNR.locator) return 'SAVE PNR FIRST - ET/ER';
    if (!currentPNR.pricing) return 'PRICE PNR FIRST - FXP';

    var lines = ['OK ETICKET'];
    currentPNR.names.forEach(function (n, i) {
      var tktNum = '125-' + String(Math.floor(Math.random() * 9000000000) + 1000000000);
      lines.push('  ' + (i + 1) + '. ' + n + '  TKT: ' + tktNum);
    });
    return lines.join('\n');
  }

  // ============================================================
  //  DN – Decode city/airport
  // ============================================================

  function handleDN(code) {
    code = code.trim().toUpperCase();
    if (!code) return 'FORMAT: DN{CODE}  e.g. DNNYC';

    var info = DATA.airports[code];
    if (info) {
      return code + '  ' + info.name + '\n' +
             '     CITY: ' + info.city + '  COUNTRY: ' + info.country;
    }

    var cityInfo = DATA.cities[code];
    if (cityInfo) {
      var lines = [code + '  ' + cityInfo.name + '  ' + cityInfo.country];
      lines.push('  AIRPORTS:');
      cityInfo.airports.forEach(function (apt) {
        var a = DATA.airports[apt];
        lines.push('    ' + apt + '  ' + (a ? a.name : ''));
      });
      return lines.join('\n');
    }

    return 'CITY/AIRPORT NOT FOUND - ' + code;
  }

  // ============================================================
  //  DAN – Decode airline
  // ============================================================

  function handleDAN(code) {
    code = code.trim().toUpperCase();
    if (!code) return 'FORMAT: DAN{CODE}  e.g. DANAA';

    var al = DATA.airlines[code];
    if (al) {
      return code + '  ' + al.name + '\n' +
             '     COUNTRY: ' + al.country;
    }
    return 'AIRLINE NOT FOUND - ' + code;
  }

  // ============================================================
  //  HE – Help
  // ============================================================

  function handleHE(topic) {
    topic = topic.toUpperCase().trim();

    var helpTexts = {
      '': helpIndex(),
      'ALL': helpIndex(),
      'AN': [
        'AN - AVAILABILITY DISPLAY',
        '=========================',
        '',
        'Format:  AN{DDMMM}{ORIG}{DEST}',
        '',
        'Examples:',
        '  AN20MARMIAJFK      Availability MIA to JFK on 20 March',
        '  AN15JUNJFKLHR      Availability JFK to LHR on 15 June',
        '  AN20MARMIAJFK/AAA  Filter American Airlines only',
        '',
        'City codes (e.g. NYC) or airport codes (e.g. JFK) accepted.',
      ].join('\n'),

      'SS': [
        'SS - SELL SEGMENT',
        '=================',
        '',
        'Format:  SS{QTY}{CLASS}{LINE}',
        '',
        'Examples:',
        '  SS1Y1    Sell 1 seat in Y class from line 1 of availability',
        '  SS2M3    Sell 2 seats in M class from line 3',
        '',
        'Must display availability (AN) first.',
      ].join('\n'),

      'NM': [
        'NM - NAME ELEMENT',
        '==================',
        '',
        'Format:  NM{COUNT}{LASTNAME/FIRSTNAME TITLE}',
        '',
        'Examples:',
        '  NM1SMITH/JOHN MR            One adult',
        '  NM2SMITH/JOHN MR+SMITH/JANE MRS   Two adults',
        '',
        'Children (2-11 years) and Infants (under 2):',
        '  NM1DOE/JOHNNY MSTR(CHD)     Child passenger',
        '  NM1DOE/JANE MISS(INF)       Infant passenger',
        '  NM2DOE/JOHN MR+DOE/JOHNNY MSTR(CHD)  Adult + child',
        '',
        'Titles: MR, MRS, MS, MSTR (child), MISS',
        'Types:  (CHD) = child 2-11,  (INF) = infant under 2',
      ].join('\n'),

      'AP': [
        'AP - CONTACT PHONE',
        '===================',
        '',
        'Format:  AP{CITY} {PHONE}',
        '',
        'Examples:',
        '  APNYC 212 555 1234',
        '  APMIA 305 555 6789',
        '',
        'APE - CONTACT EMAIL',
        'Format:  APE-{EMAIL}',
        'Example: APE-USER@EMAIL.COM',
      ].join('\n'),

      'ET': [
        'ET/ER - END TRANSACTION',
        '=======================',
        '',
        'ET   End Transaction (saves PNR, shows locator)',
        'ER   End and Retrieve (saves PNR, shows full PNR)',
        '',
        'Mandatory fields before saving:',
        '  - Name (NM)',
        '  - Itinerary segment (SS)',
        '  - Contact (AP or APE)',
        '  - Ticketing (TKOK)',
        '  - Received From (RF)',
      ].join('\n'),

      'ER': null, // alias

      'RT': [
        'RT - RETRIEVE PNR',
        '==================',
        '',
        'RT         Display current PNR',
        'RTABCDEF   Retrieve by record locator',
        '*R         Same as RT (redisplay)',
        '*A         Display all elements',
        '*I         Display itinerary only',
        '*P         Display passenger names only',
      ].join('\n'),

      'FQD': [
        'FQD - FARE QUOTE DISPLAY',
        '========================',
        '',
        'Format:  FQD{ORIG}{DEST}/D{DDMMM}',
        '',
        'Examples:',
        '  FQDMIAJFK/D20MAR       Fares MIA-JFK on 20 March',
        '  FQDJFKLHR/D15JUN/ABA   Fares JFK-LHR, BA only',
        '',
        'Columns: AL=Airline, B=Class, PEN=Change penalty,',
        '         AP=Advance Purchase, MIN/MAX=Stay, R=Refundable',
      ].join('\n'),

      'FXP': [
        'FXP / FXX - PRICE PNR',
        '=====================',
        '',
        'FXP   Price current PNR itinerary',
        'FXX   Cancel pricing',
        '',
        'PNR must have at least one segment.',
      ].join('\n'),

      'TTP': [
        'TTP - ISSUE TICKET',
        '===================',
        '',
        'TTP   Issue e-ticket for current PNR',
        '',
        'PNR must be saved (ET/ER) and priced (FXP) first.',
      ].join('\n'),

      'IG': [
        'IG - IGNORE',
        '===========',
        '',
        'Cancels all unsaved changes and clears workspace.',
      ].join('\n'),

      'DN': [
        'DN - DECODE CITY/AIRPORT',
        '========================',
        '',
        'Examples:',
        '  DNNYC    Decode city code NYC',
        '  DNJFK    Decode airport code JFK',
        '  DNMIA    Decode airport code MIA',
      ].join('\n'),

      'DAN': [
        'DAN - DECODE AIRLINE',
        '====================',
        '',
        'Examples:',
        '  DANAA    American Airlines',
        '  DANBA    British Airways',
        '  DANEK    Emirates',
      ].join('\n'),

      'XI': [
        'XI - CANCEL ITINERARY',
        '=====================',
        '',
        'Removes all flight segments from current PNR.',
      ].join('\n'),

      'XE': [
        'XE - CANCEL ELEMENT',
        '====================',
        '',
        'Examples:',
        '  XE5      Cancel element 5',
        '  XE3-5    Cancel elements 3 through 5',
      ].join('\n'),

      'TKOK': [
        'TKOK - TICKETING ARRANGEMENT',
        '============================',
        '',
        'Sets ticketing arrangement to OK.',
        'Required before saving PNR.',
      ].join('\n'),

      'RF': [
        'RF - RECEIVED FROM',
        '===================',
        '',
        'Format:  RF{NAME}',
        'Example: RFAGENT',
        '',
        'Records who created/modified the PNR. Required before saving.',
      ].join('\n'),

      'SRDOCS': [
        'SRDOCS - PASSPORT / APIS DATA',
        '==============================',
        '',
        'Format:  SRDOCS YY HK1-P-{COUNTRY}-{PASSPORT}-{NATIONALITY}-{DOB}-{GENDER}-{EXPIRY}-{LASTNAME}-{FIRSTNAME}/P{N}',
        '',
        'Examples:',
        '  SRDOCS YY HK1-P-ESP-AB123456-ESP-15MAR85-M-20JAN30-GARCIA-PEDRO/P1',
        '  SRDOCS YY HK1-P-PRY-1234567-PRY-28JUN88-F-24JUN30-LOPEZ-ANA/P2',
        '',
        'Fields:  P=Passport, Country, Doc Number, Nationality,',
        '         DOB (DDMMMYY), Gender (M/F), Expiry (DDMMMYY),',
        '         Lastname, Firstname, /P = passenger number',
        '',
        'Required for all international travel (APIS data).',
      ].join('\n'),

      'SR': [
        'SR - SPECIAL SERVICE REQUEST',
        '============================',
        '',
        'Format:  SR{TYPE}  or  SR{TYPE}/P{N}',
        '',
        'Meal requests:',
        '  SRVGML   Vegetarian        SRAVML   Asian vegetarian',
        '  SRKSML   Kosher            SRDBML   Diabetic',
        '  SRCHML   Child meal        SRBBML   Baby meal',
        '',
        'Assistance:',
        '  SRWCHR   Wheelchair (ramp) SRWCHC   Wheelchair (cabin)',
        '  SRMAAS   Meet and assist   SRUMNR   Unaccompanied minor',
        '',
        'Other:',
        '  SRPETC   Pet in cabin      SRBIKE   Bicycle',
      ].join('\n'),

      'TKTL': [
        'TKTL - TICKETING TIME LIMIT',
        '===========================',
        '',
        'Format:  TKTL{DDMMM}',
        'Example: TKTL25MAR',
        '',
        'Sets a deadline for ticket issuance.',
        'Alternative to TKOK (immediate ticketing).',
      ].join('\n'),

      'SM': [
        'SM - SEAT MAP',
        '==============',
        '',
        'SM     Show seat map for segment 1',
        'SM2    Show seat map for segment 2',
        '',
        '. = Available   X = Occupied',
        'Use ST to assign seats after viewing the map.',
      ].join('\n'),

      'ST': [
        'ST - SEAT ASSIGNMENT',
        '====================',
        '',
        'Format:  ST/{SEAT}/P{PAX}',
        'Example: ST/12A/P1',
        '',
        'Assigns seat 12A to passenger 1.',
        'View SM first to see available seats.',
      ].join('\n'),

      'IR': [
        'IR - IGNORE AND RESTORE',
        '========================',
        '',
        'Discards unsaved changes and restores the last saved version.',
        'Unlike IG, keeps the PNR active for further editing.',
      ].join('\n'),
    };

    // Handle aliases
    if (topic === 'ER') topic = 'ET';
    if (topic === 'FXX') topic = 'FXP';

    if (helpTexts[topic] !== undefined && helpTexts[topic] !== null) {
      return helpTexts[topic];
    }

    return 'NO HELP AVAILABLE FOR: ' + topic + '\nType HEALL for list of commands.';
  }

  function helpIndex() {
    return [
      'AMADEUS COMMAND REFERENCE',
      '========================',
      '',
      'AVAILABILITY & FARES',
      '  AN   Availability           FQD  Fare display',
      '  FXP  Price PNR              FXX  Cancel pricing',
      '',
      'BOOKING',
      '  SS   Sell segment            NM   Add passenger name',
      '  AP   Add phone contact       APE  Add email contact',
      '  TKOK Ticketing arrangement   RF   Received from',
      '',
      'PASSENGER DATA',
      '  SRDOCS  Passport/APIS data    SR     Special service request',
      '  SRFOID  Passenger ID          TKTL   Ticketing time limit',
      '',
      'PNR MANAGEMENT',
      '  ET   End transaction         ER   End & retrieve',
      '  RT   Retrieve PNR            IG   Ignore/cancel',
      '  TTP  Issue ticket',
      '',
      'MODIFICATIONS',
      '  XI   Cancel all segments     XE   Cancel element',
      '',
      'SEATS',
      '  SM   Seat map display        ST     Assign seat',
      '',
      'DISPLAY',
      '  *R   Redisplay PNR           *I   Itinerary only',
      '  *P   Passengers only',
      '',
      'INFORMATION',
      '  DN   Decode city/airport     DAN  Decode airline',
      '  HE   Help on command',
      '',
      'Type HE {CMD} for details.  e.g. HE AN',
    ].join('\n');
  }

  // ============================================================
  //  Display helpers (*I, *P)
  // ============================================================

  function handleDisplayItinerary() {
    if (!currentPNR) return 'NO PNR';
    if (currentPNR.segments.length === 0) return 'NO ITINERARY';
    var lines = [];
    currentPNR.segments.forEach(function (seg, i) {
      lines.push(formatSegmentLine(seg, i));
    });
    return lines.join('\n');
  }

  function handleDisplayPassengers() {
    if (!currentPNR) return 'NO PNR';
    if (currentPNR.names.length === 0) return 'NO NAMES';
    var lines = [];
    currentPNR.names.forEach(function (n, i) {
      lines.push('  ' + (i + 1) + '.' + n);
    });
    return lines.join('\n');
  }

  // ============================================================
  //  MD / MU – scroll (simplified for web)
  // ============================================================

  function handleMD() {
    return 'END OF DISPLAY';
  }
  function handleMU() {
    return 'TOP OF DISPLAY';
  }

  // ============================================================
  //  PNR formatting
  // ============================================================

  function formatPNR(pnr) {
    var lines = [];

    // Header
    lines.push('--- TST RLR MSC ---');
    var loc = pnr.locator || '......';
    lines.push('RP/SIM1A0100/SIM1A0100                 ' + (pnr.savedDate || todayStr()) + '   ' + loc);

    // Names
    pnr.names.forEach(function (n, i) {
      lines.push('  ' + (i + 1) + '.' + n);
    });

    var elNum = pnr.names.length;

    // Segments
    pnr.segments.forEach(function (seg, i) {
      elNum++;
      lines.push(formatSegmentLine(seg, elNum - 1));
    });

    // Phones
    pnr.phones.forEach(function (p) {
      elNum++;
      lines.push('  ' + elNum + ' AP ' + p);
    });

    // Emails
    pnr.emails.forEach(function (e) {
      elNum++;
      lines.push('  ' + elNum + ' APE-' + e);
    });

    // DOCS
    pnr.docs.forEach(function (d) {
      elNum++;
      lines.push('  ' + elNum + ' SSR DOCS YY HK1 ' + d.data + '/P' + d.pax);
    });

    // SSRs
    pnr.ssrs.forEach(function (s) {
      elNum++;
      var paxStr = s.pax > 0 ? '/P' + s.pax : '';
      lines.push('  ' + elNum + ' SSR ' + s.type + ' YY HK1 ' + s.desc + paxStr);
    });

    // Seats
    pnr.seats.forEach(function (s) {
      elNum++;
      lines.push('  ' + elNum + ' SEAT ' + s.seat + ' P' + s.pax);
    });

    // Ticketing
    if (pnr.ticketing) {
      elNum++;
      lines.push('  ' + elNum + ' TK ' + pnr.ticketing);
    }

    // Received from
    if (pnr.receivedFrom) {
      elNum++;
      lines.push('  ' + elNum + ' RF ' + pnr.receivedFrom);
    }

    return lines.join('\n');
  }

  function formatSegmentLine(seg, idx) {
    var arrStr = seg.arr;
    if (parseInt(seg.arr, 10) < parseInt(seg.dep, 10)) arrStr += '+1';
    return '  ' + (idx + 1) + '  ' +
      pad(seg.al, 2) + ' ' + rpad(seg.fn, 4) + ' ' +
      seg.cls + ' ' + (seg.date || '     ') + ' ' +
      seg.from + seg.to + ' ' + seg.status + seg.qty + '   ' +
      seg.dep + ' ' + arrStr + '  *1A/E*';
  }

  // Ordered list of PNR elements (used by XE)
  function buildElementList(pnr) {
    var list = [];
    pnr.names.forEach(function (_, i)    { list.push({ type: 'name', idx: i }); });
    pnr.segments.forEach(function (_, i) { list.push({ type: 'segment', idx: i }); });
    pnr.phones.forEach(function (_, i)   { list.push({ type: 'phone', idx: i }); });
    pnr.emails.forEach(function (_, i)   { list.push({ type: 'email', idx: i }); });
    pnr.docs.forEach(function (_, i)   { list.push({ type: 'doc', idx: i }); });
    pnr.ssrs.forEach(function (_, i)   { list.push({ type: 'ssr', idx: i }); });
    pnr.seats.forEach(function (_, i)  { list.push({ type: 'seat', idx: i }); });
    if (pnr.ticketing)    list.push({ type: 'tk', idx: 0 });
    if (pnr.receivedFrom) list.push({ type: 'rf', idx: 0 });
    return list;
  }

  function maybePagedResponse(text) {
    // For web, just return the full text
    return text;
  }

  // ---- Welcome message ----
  function welcome() {
    return [
      '',
      ' AMADEUS TRAINING CONSOLE',
      ' ========================',
      '',
      ' Welcome to the Amadeus GDS Training Simulator.',
      ' Practice cryptic commands in a safe environment.',
      ' No real reservations are made.',
      '',
      ' Type HEALL for a list of commands.',
      ' Type TRAINING to start guided exercises (en espanol).',
      ' Click the ? button for a quick reference card.',
      '',
      ' SAMPLE WORKFLOW:',
      '   AN20MARMIAJFK          Search flights',
      '   SS1Y1                  Sell 1 seat, Y class, line 1',
      '   NM1SMITH/JOHN MR      Add passenger',
      '   APNYC 212 555 1234    Add phone',
      '   TKOK                   Set ticketing',
      '   RFAGENT                Received from',
      '   ER                     Save & display PNR',
      '',
      ' Ready.',
      '',
    ].join('\n');
  }

  // ---- Public API ----
  return {
    process: process,
    welcome: welcome,
  };
})();
