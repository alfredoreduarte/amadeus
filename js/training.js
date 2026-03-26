// ============================================================
// Modulo de Entrenamiento / Training Module
// Guided exercises in Spanish with real-world scenarios
// ============================================================

var Training = (function () {

  var active   = false;
  var exIdx    = -1;
  var stepIdx  = 0;

  var FREE_LIMIT = 2; // exercises 1-2 are free

  var SEP  = '════════════════════════════════════════════════════════';
  var LINE = '────────────────────────────────────────────────────────';
  var ACT  = '\x01'; // action marker — terminal.js renders these lines in yellow

  // ================================================================
  //  EXERCISES
  // ================================================================

  var exercises = [

    // ─── EJERCICIO 1 ─────────────────────────────────────────────
    {
      title: 'BUSQUEDA DE DISPONIBILIDAD DE VUELOS',
      scenario: [
        'Un cliente llama a la agencia y dice:',
        '"Buenos dias, necesito viajar de Miami a Nueva York',
        'el 20 de marzo. Que vuelos tienen disponibles',
        'y cuanto cuestan los boletos?"',
      ].join(' '),
      steps: [
        {
          instruction:
            'Para buscar vuelos usamos el comando AN.\n' +
            'Se escribe asi:\n\n' +
            '  AN + fecha + origen + destino\n' +
            '  AN   20MAR   MIA     JFK\n\n' +
            'Todo junto, sin espacios.\n\n' +
            ACT + 'Busque vuelos de Miami (MIA) a Nueva York (JFK) el 20 de marzo.',
          hint:
            'AN20MARMIAJFK\n\n' +
            '  AN = Availability (buscar vuelos)\n' +
            '  20MAR = 20 de marzo\n' +
            '  MIA = Miami (origen)\n' +
            '  JFK = Nueva York (destino)',
          validate: /^AN\d{2}[A-Z]{3}(MIA|NYC)(JFK|NYC|EWR|LGA)/,
          success:
            'Correcto! Veamos que significa cada parte.\n' +
            'Ejemplo de una linea de resultado:\n\n' +
            '  1 AA 100 J9 C9 D5 Y9 B9 M9 K4\n\n' +
            '  1 = numero de linea (para reservar)\n' +
            '  AA 100 = aerolinea y vuelo\n\n' +
            'Los codigos como J9, Y9, K4 son:\n' +
            '  letra = clase de servicio\n' +
            '  numero = asientos disponibles\n' +
            '    (9 = 9 o mas disponibles)\n\n' +
            'Clases de servicio:\n' +
            '  J, C, D = Ejecutiva (Business)\n' +
            '  Y, B, M = Economica\n' +
            '  K, Q, V = Economica con descuento\n\n' +
            'Al final de la linea vera:\n' +
            '  MIAJFK = ruta\n' +
            '  0800 1100 = salida y llegada\n' +
            '  E0/738 = tipo de avion\n' +
            '  3:00 = duracion del vuelo',
        },
        {
          instruction:
            'Ahora veamos las tarifas. El comando es FQD.\n' +
            'Se escribe asi:\n\n' +
            '  FQD + origen + destino + /D + fecha\n' +
            '  FQD   MIA      JFK     /D  20MAR\n\n' +
            ACT + 'Consulte las tarifas de MIA a JFK el 20 de marzo.',
          hint:
            'FQDMIAJFK/D20MAR\n\n' +
            '  FQD = Fare Quote Display\n' +
            '  /D = fecha de viaje',
          validate: /^FQD(MIA|NYC)(JFK|NYC)/,
          success:
            'Excelente! La pantalla de tarifas muestra:\n' +
            '  AL = Aerolinea\n' +
            '  OW = Precio solo ida\n' +
            '  PEN = Penalidad por cambio\n' +
            '  R = Reembolsable (R=Si, N=No)',
        },
      ],
      completion:
        'Ejercicio 1 completado!\n' +
        'Ya sabe buscar vuelos (AN) y consultar tarifas (FQD).\n' +
        'Estas son las consultas mas frecuentes en una agencia.\n\n' +
        ACT + 'Escriba TRAINING 2 para continuar con el siguiente ejercicio.',
    },

    // ─── EJERCICIO 2 ─────────────────────────────────────────────
    {
      title: 'CREAR UNA RESERVA COMPLETA (PNR)',
      scenario: [
        'Un cliente llama y dice:',
        '"Soy Carlos Gonzalez. Quiero reservar un vuelo de',
        'Miami a Nueva York para el 20 de marzo en clase',
        'economica. Mi telefono es 305 555 1234."',
      ].join(' '),
      steps: [
        {
          instruction:
            'Ya aprendio este comando en el ejercicio 1.\n' +
            'Recuerde: AN + fecha + origen + destino\n\n' +
            ACT + 'Busque vuelos de MIA a JFK el 20 de marzo.',
          hint: 'AN20MARMIAJFK',
          validate: /^AN\d{2}[A-Z]{3}(MIA|NYC)(JFK|NYC)/,
          success: 'Bien! Ahora elija un vuelo para el cliente.',
        },
        {
          instruction:
            'Para vender un asiento usamos SS.\n' +
            'Se escribe asi:\n\n' +
            '  SS + cantidad + clase + linea\n' +
            '  SS    1         Y       1\n\n' +
            '  Y = clase economica\n' +
            '  El numero de linea es el vuelo elegido.\n\n' +
            ACT + 'Venda 1 asiento en clase economica (Y), linea 1.',
          hint:
            'SS1Y1\n\n' +
            '  SS = Sell Segment\n' +
            '  1 = un asiento\n' +
            '  Y = economica\n' +
            '  1 = linea 1 de la lista',
          validate: /^SS\d[A-Z]\d/,
          success:
            'Segmento vendido! HK1 = 1 asiento confirmado.\n' +
            'Ahora debe agregar los datos del pasajero.',
        },
        {
          instruction:
            'Para agregar un pasajero usamos NM.\n' +
            'Se escribe asi:\n\n' +
            '  NM + cantidad + APELLIDO/NOMBRE TITULO\n' +
            '  NM   1         GONZALEZ/CARLOS MR\n\n' +
            'Titulos: MR, MRS, MS, MISS, MSTR.\n\n' +
            ACT + 'Agregue al pasajero Carlos Gonzalez.',
          hint:
            'NM1GONZALEZ/CARLOS MR\n\n' +
            '  NM = Name\n' +
            '  1 = un pasajero\n' +
            '  APELLIDO/NOMBRE TITULO',
          validate: /^NM\d.*GONZALEZ\/CARLOS/,
          success: 'Nombre registrado!',
        },
        {
          instruction:
            'Para agregar un telefono usamos AP.\n' +
            'Se escribe asi:\n\n' +
            '  AP + ciudad + numero\n' +
            '  AP   MIA     305 555 1234\n\n' +
            ACT + 'Agregue el telefono del cliente en Miami.',
          hint:
            'APMIA 305 555 1234\n\n' +
            '  AP = Add Phone',
          validate: /^AP[A-Z]{3}\s/,
          success: 'Contacto telefonico agregado!',
        },
        {
          instruction:
            'Toda reserva necesita un arreglo de\n' +
            'ticketing (emision de boleto).\n\n' +
            ACT + 'Escriba TKOK para establecer el ticketing.',
          hint: 'TKOK',
          validate: /^TKOK$/,
          success: 'Ticketing establecido!',
        },
        {
          instruction:
            'Debemos registrar quien creo la reserva.\n' +
            'Se escribe asi:\n\n' +
            '  RF + nombre del agente\n' +
            '  RF   AGENTE\n\n' +
            ACT + 'Registre quien hizo la reserva (RF + su nombre o AGENTE).',
          hint: 'RFAGENTE  (o su nombre, ej: RFCARLOS)',
          validate: /^RF\S/,
          success: 'Received from registrado!',
        },
        {
          instruction:
            'Para guardar la reserva usamos ER o ET.\n\n' +
            '  ER = guardar y mostrar el resultado\n' +
            '  ET = solo guardar\n\n' +
            ACT + 'Guarde la reserva y vea el PNR (escriba ER).',
          hint: 'ER',
          validate: /^E[TR]$/,
          success:
            'Reserva guardada!\n' +
            'El codigo de 6 letras es el LOCALIZADOR.\n' +
            'El cliente lo necesita para consultar\n' +
            'su reserva.',
        },
      ],
      completion:
        'Ejercicio 2 completado! Ha creado su primera reserva.\n\n' +
        'Los 5 elementos OBLIGATORIOS de un PNR son:\n' +
        '  1. Nombre del pasajero      (NM)\n' +
        '  2. Segmento de vuelo        (SS)\n' +
        '  3. Informacion de contacto  (AP)\n' +
        '  4. Arreglo de ticketing     (TKOK)\n' +
        '  5. Received From            (RF)\n\n' +
        'Sin estos 5 elementos, el sistema no permite guardar.\n\n' +
        ACT + 'Escriba TRAINING 3 para el siguiente ejercicio.',
    },

    // ─── EJERCICIO 3 ─────────────────────────────────────────────
    {
      title: 'RESERVA PARA MULTIPLES PASAJEROS',
      scenario: [
        'Una familia llama a la agencia:',
        '"Somos la familia Rodriguez. Mi esposa Maria,',
        'mi hijo Pablo de 10 anos y yo, Pedro, queremos',
        'viajar de Miami a Cancun el 25 de marzo.',
        'Somos 3 pasajeros."',
      ].join(' '),
      steps: [
        {
          instruction:
            'Recuerde: AN + fecha + origen + destino\n\n' +
            ACT + 'Busque vuelos de MIA a Cancun (CUN) el 25 de marzo.',
          hint: 'AN25MARMIACUN',
          validate: /^AN\d{2}[A-Z]{3}MIACUN/,
          success: 'Vuelos encontrados hacia Cancun!',
        },
        {
          instruction:
            'Son 3 pasajeros. El comando SS permite\n' +
            'indicar la cantidad:\n\n' +
            '  SS + cantidad + clase + linea\n' +
            '  SS    3         Y       1\n\n' +
            ACT + 'Venda 3 asientos en clase economica (Y), linea 1.',
          hint: 'SS3Y1',
          validate: /^SS3[A-Z]\d/,
          success:
            '3 asientos reservados! HK3 = 3 confirmados.\n' +
            'Ahora agregue los pasajeros.',
        },
        {
          instruction:
            'Puede agregar varios pasajeros en una\n' +
            'sola linea usando + para separarlos.\n\n' +
            'Los ninos (2-11 anos) llevan (CHD)\n' +
            'despues del titulo MSTR:\n\n' +
            '  NM2APELLIDO/NOMBRE MR+\n' +
            '     APELLIDO/NOMBRE MSTR(CHD)\n\n' +
            ACT + 'Agregue a Pedro (padre) y Pablo (10 anos) Rodriguez.',
          hint:
            'NM2RODRIGUEZ/PEDRO MR+RODRIGUEZ/PABLO MSTR(CHD)\n\n' +
            '  NM2 = dos pasajeros\n' +
            '  + = separador\n' +
            '  MSTR = titulo menor\n' +
            '  (CHD) = nino 2-11 anos',
          validate: /^NM\d/,
          success:
            'Padre e hijo registrados!\n' +
            '(CHD) es obligatorio para ninos\n' +
            'de 2 a 11 anos.',
        },
        {
          instruction:
            'Ahora agregue a la madre por separado.\n\n' +
            ACT + 'Agregue a Maria Rodriguez (NM1RODRIGUEZ/MARIA MRS).',
          hint: 'NM1RODRIGUEZ/MARIA MRS',
          validate: /^NM\d/,
          success: 'Los 3 pasajeros estan en la reserva.',
        },
        {
          instruction:
            'Recuerde: AP + ciudad + numero\n\n' +
            ACT + 'Agregue un telefono de contacto para la familia.',
          hint: 'APMIA 305 555 4567',
          validate: /^AP[A-Z]/,
          success: 'Contacto agregado!',
        },
        {
          instruction: ACT + 'Escriba TKOK para el ticketing.',
          hint: 'TKOK',
          validate: /^TKOK$/,
          success: 'Listo!',
        },
        {
          instruction: ACT + 'Registre quien hizo la reserva (RF + nombre).',
          hint: 'RFAGENTE',
          validate: /^RF\S/,
          success: 'Registrado!',
        },
        {
          instruction: ACT + 'Guarde la reserva y vea el PNR (escriba ER).',
          hint: 'ER',
          validate: /^ER$/,
          success:
            'Reserva familiar guardada!\n' +
            'Los 3 pasajeros aparecen numerados\n' +
            'y el segmento muestra HK3.',
        },
      ],
      completion:
        'Ejercicio 3 completado!\n\n' +
        'Puntos clave:\n' +
        '  - SS3 vende 3 asientos de una vez\n' +
        '  - Se puede agregar adulto + nino en una sola linea con +\n' +
        '  - (CHD) = nino de 2 a 11 anos (obligatorio)\n' +
        '  - (INF) = bebe menor de 2 anos\n' +
        '  - Titulos: MR, MRS, MS, MSTR (menor), MISS\n\n' +
        ACT + 'Escriba TRAINING 4 para continuar.',
    },

    // ─── EJERCICIO 4 ─────────────────────────────────────────────
    {
      title: 'RESERVA EN CLASE EJECUTIVA CON COTIZACION',
      scenario: [
        'Un ejecutivo llama y dice:',
        '"Soy Roberto Martinez, director de operaciones.',
        'Necesito volar de Nueva York a Londres el 15 de',
        'junio en clase ejecutiva. Mi correo electronico',
        'es rmartinez@empresa.com y mi telefono en Nueva',
        'York es 212 555 9876. Necesito saber el precio."',
      ].join(' '),
      steps: [
        {
          instruction:
            'Recuerde: AN + fecha + origen + destino\n\n' +
            ACT + 'Busque vuelos de JFK a Londres (LHR) el 15 de junio.',
          hint: 'AN15JUNJFKLHR',
          validate: /^AN\d{2}[A-Z]{3}(JFK|NYC)(LHR|LON)/,
          success:
            'Observe las clases de ejecutiva:\n' +
            '  J = Business Class\n' +
            '  C = Business Flexible\n' +
            '  D = Business Restringida',
        },
        {
          instruction:
            'Hasta ahora usamos clase Y (economica).\n' +
            'Para ejecutiva, use clase J:\n\n' +
            '  SS + cantidad + J + linea\n' +
            '  SS    1         J    1\n\n' +
            ACT + 'Venda 1 asiento en clase ejecutiva (J), linea 1.',
          hint:
            'SS1J1\n\n' +
            '  J = Business Class\n' +
            '  Tambien puede usar C o D.',
          validate: /^SS\d[JCD]\d/,
          success: 'Asiento en ejecutiva vendido!',
        },
        {
          instruction:
            'Recuerde: NM1 + APELLIDO/NOMBRE TITULO\n\n' +
            ACT + 'Agregue al pasajero Roberto Martinez.',
          hint: 'NM1MARTINEZ/ROBERTO MR',
          validate: /^NM\d.*MARTINEZ\/ROBERTO/,
          success: 'Nombre registrado!',
        },
        {
          instruction:
            'Para agregar un email usamos APE.\n' +
            'Se escribe asi:\n\n' +
            '  APE-correo@ejemplo.com\n\n' +
            ACT + 'Agregue el email: RMARTINEZ@EMPRESA.COM',
          hint:
            'APE-RMARTINEZ@EMPRESA.COM\n\n' +
            '  APE = Add Phone Email\n' +
            '  El guion (-) separa el comando del email',
          validate: /^APE/,
          success: 'Email registrado!',
        },
        {
          instruction:
            'Recuerde: AP + ciudad + numero\n\n' +
            ACT + 'Agregue el telefono del cliente en Nueva York.',
          hint: 'APNYC 212 555 9876',
          validate: /^AP[A-Z]{3}\s/,
          success: 'Telefono registrado!',
        },
        {
          instruction: ACT + 'Escriba TKOK para el ticketing.',
          hint: 'TKOK',
          validate: /^TKOK$/,
          success: 'Listo!',
        },
        {
          instruction: ACT + 'Registre quien hizo la reserva (RF + nombre).',
          hint: 'RFAGENTE',
          validate: /^RF\S/,
          success: 'Registrado!',
        },
        {
          instruction: ACT + 'Guarde la reserva y vea el PNR (escriba ER).',
          hint: 'ER',
          validate: /^ER$/,
          success: 'Reserva en clase ejecutiva guardada!',
        },
        {
          instruction:
            'Para cotizar el precio de una reserva\n' +
            'usamos el comando FXP (Fare eXpert Pricer).\n' +
            'Calcula tarifa + impuestos del PNR guardado.\n\n' +
            ACT + 'Cotice el precio total del PNR (escriba FXP).',
          hint: 'FXP',
          validate: /^FXP$/,
          success:
            'Cotizacion lista!\n' +
            '  FARE = tarifa base\n' +
            '  TAX = impuestos\n' +
            '  TOTAL = monto a pagar',
        },
      ],
      completion:
        'Ejercicio 4 completado!\n\n' +
        'Puntos clave:\n' +
        '  - Clase J/C/D = Ejecutiva (Business)\n' +
        '  - APE registra correo electronico\n' +
        '  - FXP cotiza el precio total del PNR\n' +
        '  - Un PNR puede tener multiples contactos (telefono + email)\n\n' +
        ACT + 'Escriba TRAINING 5 para continuar.',
    },

    // ─── EJERCICIO 5 ─────────────────────────────────────────────
    {
      title: 'CONSULTA Y COMPARACION DE TARIFAS',
      scenario: [
        'Un cliente llama sin fecha fija:',
        '"Quiero viajar de Miami a Bogota pero no tengo',
        'fecha definida. Me puede mostrar las tarifas',
        'disponibles? Prefiero volar con Avianca si es',
        'posible. A proposito, que aerolinea es AV?"',
      ].join(' '),
      steps: [
        {
          instruction:
            'Recuerde: FQD + ruta + /D + fecha\n\n' +
            ACT + 'Consulte las tarifas de MIA a Bogota (BOG) el 20 de marzo.',
          hint:
            'FQDMIABOG/D20MAR\n\n' +
            '  FQD = consultar tarifas\n' +
            '  MIABOG = ruta\n' +
            '  /D20MAR = fecha',
          validate: /^FQDMIABOG/,
          success:
            'Compare precios entre aerolineas.\n' +
            'Observe las diferencias en penalidades\n' +
            'y restricciones.',
        },
        {
          instruction:
            'Recuerde: AN + fecha + origen + destino\n\n' +
            ACT + 'Busque los vuelos disponibles de MIA a Bogota (BOG).',
          hint: 'AN20MARMIABOG',
          validate: /^AN\d{2}[A-Z]{3}MIABOG/,
          success:
            'Vea las aerolineas que operan esta ruta.',
        },
        {
          instruction:
            'Para filtrar vuelos por aerolinea,\n' +
            'agregue /A + codigo al final del AN:\n\n' +
            '  AN20MARMIABOG/AAV\n\n' +
            '  /A = filtro de aerolinea\n' +
            '  AV = codigo de Avianca\n\n' +
            ACT + 'Filtre los vuelos para ver solo Avianca (AV).',
          hint: 'AN20MARMIABOG/AAV',
          validate: /^AN\d{2}[A-Z]{3}MIABOG\/A?AV/,
          success:
            'Solo se muestran vuelos de Avianca!\n' +
            '/A es muy util cuando el cliente\n' +
            'prefiere una aerolinea.',
        },
        {
          instruction:
            'Para decodificar un codigo de aerolinea\n' +
            'usamos DAN:\n\n' +
            '  DAN + codigo\n' +
            '  DAN   AV\n\n' +
            ACT + 'El cliente pregunta que aerolinea es AV. Decodifiquelo.',
          hint:
            'DANAV\n\n' +
            '  DAN = Decode Airline',
          validate: /^DANAV$/,
          success:
            'AV = Avianca! DAN decodifica codigos\n' +
            'de aerolineas.',
        },
      ],
      completion:
        'Ejercicio 5 completado!\n\n' +
        'Puntos clave:\n' +
        '  - FQD muestra tarifas por ruta y fecha\n' +
        '  - /A{XX} filtra busquedas por aerolinea\n' +
        '  - DAN decodifica codigos de aerolineas\n' +
        '  - Compare tarifas para ofrecer opciones al cliente\n\n' +
        SEP + '\n\n' +
        'FELICITACIONES! Ha completado todos los ejercicios!\n\n' +
        'Resumen de comandos aprendidos:\n' +
        '  AN    Buscar vuelos         FQD   Consultar tarifas\n' +
        '  SS    Vender asientos       NM    Agregar nombre\n' +
        '  AP    Agregar telefono      APE   Agregar email\n' +
        '  TKOK  Ticketing             RF    Received from\n' +
        '  ET/ER Guardar reserva       RT    Recuperar PNR\n' +
        '  FXP   Cotizar precio        XE    Cancelar elemento\n' +
        '  DN    Decodificar ciudad    DAN   Decodificar aerolinea\n' +
        '  HE    Ayuda del sistema\n\n' +
        'Puede repetir cualquier ejercicio con TRAINING {N}\n' +
        'o practicar libremente con los comandos aprendidos.',
    },
  ];

  // ================================================================
  //  PAYWALL
  // ================================================================

  function isPaid() {
    try {
      return localStorage.getItem('ama_paid') === 'true';
    } catch (e) {
      return false;
    }
  }

  function isLocked(exerciseNum) {
    return exerciseNum > FREE_LIMIT && !isPaid();
  }

  // ================================================================
  //  FUNCTIONS
  // ================================================================

  // Short titles for the menu (mobile-friendly)
  var SHORT_TITLES = [
    'Busqueda de vuelos',
    'Crear una reserva',
    'Multiples pasajeros',
    'Clase ejecutiva y precio',
    'Tarifas y codigos',
  ];

  function showMenu() {
    var paid = isPaid();
    var lines = [
      '',
      'EJERCICIOS:',
      '',
    ];

    exercises.forEach(function (ex, i) {
      var num = i + 1;
      var tag = num <= FREE_LIMIT ? 'GRATIS' : (paid ? '' : 'PRO');
      var title = SHORT_TITLES[i] || ex.title;
      var line = ' ' + num + '. ' + title;
      if (tag) line += '  [' + tag + ']';
      lines.push(line);
    });

    if (!paid) {
      lines.push('');
      lines.push(LINE);
      lines.push('Ejercicios [PRO]: $3 USD.');
      lines.push(ACT + 'Escriba COMPRAR para desbloquear.');
    }

    lines.push('');
    lines.push(LINE);
    lines.push('AYUDA DURANTE EL EJERCICIO:');
    lines.push(' PISTA      - Ver pista');
    lines.push(' PASO       - Repetir paso');
    lines.push(' SIGUIENTE  - Saltar paso');

    lines.push('');
    lines.push(ACT + 'Escriba TRAINING 1 para comenzar.');
    lines.push('');

    return lines.join('\n');
  }

  function startExercise(n) {
    if (n < 1 || n > exercises.length) {
      return 'Ejercicio no valido. Escriba TRAINING para ver los disponibles.';
    }

    if (isLocked(n)) {
      return '__PAYWALL__';
    }

    active  = true;
    exIdx   = n - 1;
    stepIdx = 0;

    var ex = exercises[exIdx];
    var lines = [
      '',
      ' EJERCICIO ' + n + ': ' + ex.title,
      ' ' + SEP,
      '',
      ' Escenario:',
    ];

    ex.scenario.split('\n').forEach(function (l) {
      lines.push(' ' + l);
    });

    lines.push('');
    lines.push(' ' + LINE);
    lines.push(formatStep());

    return lines.join('\n');
  }

  function formatStep() {
    var ex   = exercises[exIdx];
    var step = ex.steps[stepIdx];
    var total = ex.steps.length;

    var lines = [
      '',
      ' Paso ' + (stepIdx + 1) + ' de ' + total,
      '',
    ];

    step.instruction.split('\n').forEach(function (l) {
      lines.push(' ' + l);
    });

    lines.push('');
    lines.push(' (PISTA si necesita ayuda)');
    lines.push('');

    return lines.join('\n');
  }

  function showHint() {
    if (!active) return 'No hay entrenamiento activo. Escriba TRAINING para comenzar.';

    var step = exercises[exIdx].steps[stepIdx];
    var lines = ['', ' PISTA:', ''];

    step.hint.split('\n').forEach(function (l) {
      lines.push('   ' + l);
    });

    lines.push('');
    return lines.join('\n');
  }

  function showStepAgain() {
    if (!active) return 'No hay entrenamiento activo.';
    return formatStep();
  }

  function skipStep() {
    if (!active) return 'No hay entrenamiento activo.';

    stepIdx++;

    if (stepIdx >= exercises[exIdx].steps.length) {
      var comp = exercises[exIdx].completion;
      active = false;
      var lines = ['', ' ' + LINE, ''];
      comp.split('\n').forEach(function (l) { lines.push(' ' + l); });
      lines.push('');
      return lines.join('\n');
    }

    return '\n Paso omitido.\n' + formatStep();
  }

  function exitTraining() {
    if (!active) return 'No hay entrenamiento activo.';
    active  = false;
    exIdx   = -1;
    stepIdx = 0;
    return '\n Entrenamiento finalizado.\n Escriba TRAINING para volver al menu.\n';
  }

  function checkStep(cmd) {
    if (!active) return null;

    var step = exercises[exIdx].steps[stepIdx];

    if (!step.validate.test(cmd)) return null;

    // Step matched — build success message
    var successLines = [''];
    step.success.split('\n').forEach(function (l) {
      successLines.push(' >> ' + l);
    });

    stepIdx++;

    // Build next part (next step or completion)
    var nextLines = [];
    if (stepIdx >= exercises[exIdx].steps.length) {
      // Exercise complete
      nextLines.push('');
      nextLines.push(' ' + LINE);
      nextLines.push('');
      exercises[exIdx].completion.split('\n').forEach(function (l) {
        nextLines.push(' ' + l);
      });
      nextLines.push('');
      active = false;
    } else {
      nextLines.push('');
      nextLines.push(' ' + LINE);
      nextLines.push(formatStep());
    }

    return {
      text: successLines.join('\n'),
      next: nextLines.join('\n'),
      type: 'training-success',
    };
  }

  // ================================================================
  //  PUBLIC API
  // ================================================================

  return {
    handleMeta: function (cmd) {
      cmd = cmd.toUpperCase().trim();

      if (cmd === 'TRAINING' || cmd === 'ENTRENAMIENTO') return showMenu();
      if (cmd === 'TRAINING SALIR' || cmd === 'TRAINING EXIT') return exitTraining();
      if (cmd === 'PISTA')      return showHint();
      if (cmd === 'PASO')       return showStepAgain();
      if (cmd === 'SIGUIENTE')  return skipStep();
      if (cmd === 'COMPRAR')    return '__PAYWALL__';

      var m = cmd.match(/^TRAINING\s+(\d+)$/);
      if (m) return startExercise(parseInt(m[1], 10));

      return 'Comando no reconocido. Escriba TRAINING para ver opciones.';
    },

    checkStep: function (cmd) {
      return checkStep(cmd);
    },

    isActive: function () {
      return active;
    },

    isPaid: function () {
      return isPaid();
    },
  };
})();
