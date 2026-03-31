// ============================================================
// Modulo de Entrenamiento / Training Module
// Guided exercises in Spanish with real-world scenarios
// ============================================================

var Training = (function () {

  var active   = false;
  var exIdx    = -1;
  var stepIdx  = 0;
  var completedExercises = [];

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
            'Correcto! Cada linea muestra un vuelo:\n' +
            '  AA 100 = aerolinea y numero de vuelo\n' +
            '  J9 Y9 K4 = clases y asientos disponibles\n' +
            '  MIAJFK = ruta, 0800 1100 = horarios',
        },
        {
          instruction:
            'Sobre los codigos de clase:\n' +
            '  J, C, D = Ejecutiva (Business)\n' +
            '  Y, B, M = Economica\n' +
            '  K, Q, V = Economica con descuento\n' +
            '  El numero = asientos (9 = 9 o mas)\n\n' +
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

    // ─── EJERCICIO 3 (NEW) ──────────────────────────────────────
    {
      title: 'RESERVA IDA Y VUELTA CON DOCUMENTOS',
      scenario: [
        'Un pasajero llama a la agencia:',
        '"Soy Ana Lopez, necesito volar de Miami a Madrid',
        'el 15 de junio y regresar el 30 de junio.',
        'Mi pasaporte paraguayo es R694535,',
        'fecha de nacimiento 28 de junio de 1988.',
        'Mi telefono es 305 555 7890."',
      ].join(' '),
      steps: [
        {
          instruction:
            'Una reserva IDA Y VUELTA requiere dos\n' +
            'busquedas: una para la ida y otra para\n' +
            'la vuelta. Empecemos con la ida.\n\n' +
            ACT + 'Busque vuelos de MIA a Madrid (MAD) el 15 de junio.',
          hint: 'AN15JUNMIAMAD',
          validate: /^AN\d{2}[A-Z]{3}MIAMAD/,
          success: 'Vuelos de ida encontrados!',
        },
        {
          instruction:
            'Seleccione un vuelo para la ida.\n' +
            'Recuerde: SS + cantidad + clase + linea\n\n' +
            ACT + 'Venda 1 asiento en economica para la ida.',
          hint: 'SS1Y1',
          validate: /^SS\d[A-Z]\d/,
          success:
            'Segmento de IDA vendido!\n' +
            'Ahora busque vuelos para el REGRESO.',
        },
        {
          instruction:
            'Ahora busque vuelos para el regreso.\n' +
            'Misma ruta pero invertida: MAD a MIA.\n\n' +
            ACT + 'Busque vuelos de Madrid (MAD) a MIA el 30 de junio.',
          hint: 'AN30JUNMADMIA',
          validate: /^AN\d{2}[A-Z]{3}MADMIA/,
          success: 'Vuelos de regreso encontrados!',
        },
        {
          instruction:
            ACT + 'Venda 1 asiento en economica para el regreso.',
          hint: 'SS1Y1',
          validate: /^SS\d[A-Z]\d/,
          success:
            'Segmento de VUELTA vendido!\n' +
            'El PNR ahora tiene 2 segmentos:\n' +
            '  1. MIA-MAD (ida)\n' +
            '  2. MAD-MIA (vuelta)\n' +
            'Ahora agregue la pasajera.',
        },
        {
          instruction:
            ACT + 'Agregue a Ana Lopez (NM1LOPEZ/ANA MRS).',
          hint: 'NM1LOPEZ/ANA MRS',
          validate: /^NM\d.*LOPEZ\/ANA/,
          success: 'Nombre registrado!',
        },
        {
          instruction:
            'Para vuelos INTERNACIONALES es obligatorio\n' +
            'cargar los datos del pasaporte (APIS).\n' +
            'El comando es SRDOCS. Se escribe asi:\n\n' +
            '  SRDOCS YY HK1-P-{PAIS}-{PASAPORTE}-\n' +
            '  {NACIONALIDAD}-{NACIMIENTO}-{SEXO}-\n' +
            '  {VENCIMIENTO}-{APELLIDO}-{NOMBRE}/P{N}\n\n' +
            '  P = Pasaporte\n' +
            '  PAIS/NACIONALIDAD = codigo de 3 letras\n' +
            '  NACIMIENTO = formato DDMMMYY (ej: 28JUN88)\n' +
            '  SEXO = M o F\n' +
            '  /P1 = pasajero numero 1\n\n' +
            ACT + 'Cargue el pasaporte de Ana Lopez (PRY, R694535, 28JUN88, F).',
          hint:
            'SRDOCS YY HK1-P-PRY-R694535-PRY-28JUN88-F-24JUN30-LOPEZ-ANA/P1\n\n' +
            '  PRY = Paraguay\n' +
            '  R694535 = numero de pasaporte\n' +
            '  28JUN88 = fecha de nacimiento\n' +
            '  F = femenino\n' +
            '  24JUN30 = vencimiento del pasaporte',
          validate: /^SRDOCS/,
          success:
            'Documento cargado!\n' +
            'Sin SRDOCS, la aerolinea puede rechazar\n' +
            'el embarque en vuelos internacionales.',
        },
        {
          instruction:
            'Recuerde: AP + ciudad + numero\n\n' +
            ACT + 'Agregue el telefono de la pasajera en Miami.',
          hint: 'APMIA 305 555 7890',
          validate: /^AP[A-Z]{3}\s/,
          success: 'Contacto agregado!',
        },
        {
          instruction:
            'Para este viaje el boleto debe emitirse\n' +
            'antes del 25 de mayo. En vez de TKOK\n' +
            '(emision inmediata), usamos TKTL:\n\n' +
            '  TKTL + fecha limite\n' +
            '  TKTL   25MAY\n\n' +
            ACT + 'Establezca la fecha limite de emision (TKTL25MAY).',
          hint:
            'TKTL25MAY\n\n' +
            '  TKTL = Ticketing Time Limit\n' +
            '  25MAY = fecha limite para emitir',
          validate: /^TKTL/,
          success:
            'Ticketing con fecha limite!\n' +
            '  TKOK = emision inmediata\n' +
            '  TKTL = fecha limite para emitir',
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
            'Reserva ida y vuelta guardada!\n' +
            'Observe los 2 segmentos y los datos\n' +
            'del pasaporte en el PNR.',
        },
      ],
      completion:
        'Ejercicio 3 completado!\n\n' +
        'Puntos clave:\n' +
        '  - IDA Y VUELTA = dos busquedas (AN) + dos ventas (SS)\n' +
        '  - SRDOCS es OBLIGATORIO para vuelos internacionales\n' +
        '  - TKTL establece fecha limite de emision de boleto\n' +
        '  - TKOK = emision inmediata, TKTL = con fecha limite\n\n' +
        ACT + 'Escriba TRAINING 4 para continuar.',
    },

    // ─── EJERCICIO 4 (was 3) ──────────────────────────────────────
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
        'Ejercicio 4 completado!\n\n' +
        'Puntos clave:\n' +
        '  - SS3 vende 3 asientos de una vez\n' +
        '  - Se puede agregar adulto + nino en una sola linea con +\n' +
        '  - (CHD) = nino de 2 a 11 anos (obligatorio)\n' +
        '  - (INF) = bebe menor de 2 anos\n' +
        '  - Titulos: MR, MRS, MS, MSTR (menor), MISS\n\n' +
        ACT + 'Escriba TRAINING 5 para continuar.',
    },

    // ─── EJERCICIO 5 (was 4) ──────────────────────────────────────
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
        'Ejercicio 5 completado!\n\n' +
        'Puntos clave:\n' +
        '  - Clase J/C/D = Ejecutiva (Business)\n' +
        '  - APE registra correo electronico\n' +
        '  - FXP cotiza el precio total del PNR\n' +
        '  - Un PNR puede tener multiples contactos (telefono + email)\n\n' +
        ACT + 'Escriba TRAINING 6 para continuar.',
    },

    // ─── EJERCICIO 6 (NEW) ──────────────────────────────────────
    {
      title: 'SERVICIOS ESPECIALES Y ASIENTOS',
      scenario: [
        'Una pasajera llama a la agencia:',
        '"Tengo una reserva de Miami a Madrid.',
        'Soy vegetariana y necesito comida especial.',
        'Tambien me gustaria elegir un asiento',
        'de ventanilla si es posible."',
      ].join(' '),
      steps: [
        {
          instruction:
            'Primero necesitamos crear una reserva\n' +
            'para poder agregar servicios. Busque\n' +
            'vuelos de MIA a MAD para el 20 de junio.\n\n' +
            ACT + 'Busque vuelos de MIA a Madrid (MAD) el 20 de junio.',
          hint: 'AN20JUNMIAMAD',
          validate: /^AN\d{2}[A-Z]{3}MIAMAD/,
          success: 'Vuelos encontrados!',
        },
        {
          instruction: ACT + 'Venda 1 asiento en economica.',
          hint: 'SS1Y1',
          validate: /^SS\d[A-Z]\d/,
          success: 'Segmento vendido!',
        },
        {
          instruction: ACT + 'Agregue a la pasajera: NM1MARTINEZ/LUCIA MRS',
          hint: 'NM1MARTINEZ/LUCIA MRS',
          validate: /^NM\d/,
          success: 'Nombre registrado!',
        },
        {
          instruction:
            'Para solicitar COMIDA ESPECIAL usamos SR\n' +
            'seguido del codigo de comida:\n\n' +
            '  SRVGML = Vegetariana\n' +
            '  SRAVML = Vegetariana asiatica\n' +
            '  SRKSML = Kosher\n' +
            '  SRDBML = Diabetica\n' +
            '  SRCHML = Menu infantil\n\n' +
            'La aerolinea confirma o rechaza el pedido.\n\n' +
            ACT + 'Solicite comida vegetariana (SRVGML).',
          hint:
            'SRVGML\n\n' +
            '  SR = Service Request\n' +
            '  VGML = Vegetarian Meal',
          validate: /^SRVGML/,
          success:
            'Comida vegetariana solicitada!\n' +
            'El sistema muestra SSR VGML YY HK1.\n' +
            'HK1 = confirmado para 1 pasajero.',
        },
        {
          instruction:
            'Otro servicio muy comun es la SILLA\n' +
            'DE RUEDAS. Los codigos son:\n\n' +
            '  SRWCHR = hasta la puerta del avion\n' +
            '  SRWCHC = hasta el asiento\n' +
            '  SRWCHS = puede subir escaleras\n\n' +
            'No lo necesitamos ahora, pero aprendalo.\n' +
            'Veamos ahora la seleccion de asientos.\n\n' +
            'Para ver el MAPA DE ASIENTOS usamos SM.\n\n' +
            ACT + 'Vea el mapa de asientos (escriba SM).',
          hint:
            'SM\n\n' +
            '  SM = Seat Map\n' +
            '  SM2 = mapa del segmento 2',
          validate: /^SM/,
          success:
            'Mapa de asientos!\n' +
            '  . = asiento disponible\n' +
            '  X = asiento ocupado\n' +
            '  A y F = ventanilla\n' +
            '  C y D = pasillo',
        },
        {
          instruction:
            'Para ASIGNAR un asiento usamos ST:\n\n' +
            '  ST / asiento / P + pasajero\n' +
            '  ST /  12A    / P    1\n\n' +
            '  12 = fila, A = columna (ventanilla)\n' +
            '  P1 = pasajero 1\n\n' +
            ACT + 'Asigne el asiento 12A a la pasajera (ventanilla).',
          hint:
            'ST/12A/P1\n\n' +
            '  12A = fila 12, columna A\n' +
            '  /P1 = pasajero 1',
          validate: /^ST\//,
          success: 'Asiento 12A asignado!',
        },
        {
          instruction:
            'Complete la reserva con los datos\n' +
            'restantes. Agregue un telefono.\n\n' +
            ACT + 'Agregue el telefono (APMIA + numero).',
          hint: 'APMIA 305 555 3456',
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
          instruction: ACT + 'Guarde la reserva con ER.',
          hint: 'ER',
          validate: /^ER$/,
          success:
            'Reserva guardada con servicios especiales\n' +
            'y asiento asignado!',
        },
      ],
      completion:
        'Ejercicio 6 completado!\n\n' +
        'Puntos clave:\n' +
        '  - SRVGML solicita comida vegetariana\n' +
        '  - SRWCHR solicita silla de ruedas\n' +
        '  - SM muestra el mapa de asientos\n' +
        '  - ST/12A/P1 asigna asiento al pasajero\n' +
        '  - La aerolinea confirma o rechaza los SSR\n\n' +
        ACT + 'Escriba TRAINING 7 para continuar.',
    },

    // ─── EJERCICIO 7 (was 5) ──────────────────────────────────────
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
        'Ejercicio 7 completado!\n\n' +
        'Puntos clave:\n' +
        '  - FQD muestra tarifas por ruta y fecha\n' +
        '  - /A{XX} filtra busquedas por aerolinea\n' +
        '  - DAN decodifica codigos de aerolineas\n' +
        '  - Compare tarifas para ofrecer opciones al cliente\n\n' +
        ACT + 'Escriba TRAINING 8 para el ultimo ejercicio.',
    },

    // ─── EJERCICIO 8 (NEW) ──────────────────────────────────────
    {
      title: 'MODIFICACIONES Y RECUPERACION',
      scenario: [
        'Un cliente llama preocupado:',
        '"Tengo una reserva de Miami a Madrid pero',
        'necesito cambiar la fecha de ida del 15 de',
        'junio al 20 de junio. Es posible?"',
      ].join(' '),
      steps: [
        {
          instruction:
            'Primero creemos una reserva para practicar.\n' +
            'Busque vuelos MIA a MAD para el 15 de junio.\n\n' +
            ACT + 'Busque vuelos de MIA a MAD el 15 de junio.',
          hint: 'AN15JUNMIAMAD',
          validate: /^AN\d{2}[A-Z]{3}MIAMAD/,
          success: 'Vuelos encontrados!',
        },
        {
          instruction: ACT + 'Venda 1 asiento en economica.',
          hint: 'SS1Y1',
          validate: /^SS\d[A-Z]\d/,
          success: 'Segmento vendido!',
        },
        {
          instruction: ACT + 'Agregue al pasajero: NM1REYES/CARLOS MR',
          hint: 'NM1REYES/CARLOS MR',
          validate: /^NM\d/,
          success: 'Registrado!',
        },
        {
          instruction:
            'Complete los datos obligatorios rapidamente.\n\n' +
            ACT + 'Agregue telefono, TKOK, RF y guarde con ER.',
          hint:
            'APMIA 305 555 0000\n' +
            'luego TKOK\n' +
            'luego RFAGENTE\n' +
            'luego ER',
          validate: /^AP[A-Z]/,
          success: 'Telefono agregado! Siga con TKOK.',
        },
        {
          instruction: ACT + 'Escriba TKOK.',
          hint: 'TKOK',
          validate: /^TKOK$/,
          success: 'Ahora RF.',
        },
        {
          instruction: ACT + 'Registre received from (RF + nombre).',
          hint: 'RFAGENTE',
          validate: /^RF\S/,
          success: 'Ahora guarde con ER.',
        },
        {
          instruction: ACT + 'Guarde la reserva con ER.',
          hint: 'ER',
          validate: /^ER$/,
          success:
            'Reserva guardada! Ahora practiquemos\n' +
            'la MODIFICACION del itinerario.',
        },
        {
          instruction:
            'El cliente quiere cambiar la fecha.\n' +
            'Para ELIMINAR un segmento usamos XE:\n\n' +
            '  XE + numero de elemento\n\n' +
            'El segmento de vuelo es el elemento que\n' +
            'aparece despues de los nombres en el PNR.\n' +
            'Mire el PNR: si tiene 1 nombre (elemento 1),\n' +
            'el vuelo es el elemento 2.\n\n' +
            ACT + 'Cancele el segmento de vuelo (XE2).',
          hint:
            'XE2\n\n' +
            '  XE = Cancel Element\n' +
            '  2 = numero del segmento de vuelo',
          validate: /^XE\d/,
          success:
            'Segmento cancelado!\n' +
            'Ahora busque la nueva fecha.',
        },
        {
          instruction:
            ACT + 'Busque vuelos de MIA a MAD para el 20 de junio.',
          hint: 'AN20JUNMIAMAD',
          validate: /^AN\d{2}[A-Z]{3}MIAMAD/,
          success: 'Nuevos vuelos encontrados!',
        },
        {
          instruction:
            ACT + 'Venda 1 asiento en el nuevo vuelo.',
          hint: 'SS1Y1',
          validate: /^SS\d[A-Z]\d/,
          success:
            'Nuevo segmento vendido!\n' +
            'El PNR ahora tiene la nueva fecha.',
        },
        {
          instruction:
            'Despues de modificar siempre hay que\n' +
            'guardar los cambios con RF + ER.\n\n' +
            ACT + 'Registre la modificacion (RF + nombre).',
          hint: 'RFAGENTE',
          validate: /^RF\S/,
          success: 'Registrado!',
        },
        {
          instruction: ACT + 'Guarde los cambios con ER.',
          hint: 'ER',
          validate: /^ER$/,
          success:
            'Modificacion guardada!\n' +
            'El PNR ahora muestra el vuelo del 20 de junio.',
        },
      ],
      completion:
        'Ejercicio 8 completado!\n\n' +
        'Puntos clave:\n' +
        '  - XE{N} cancela un elemento por su numero\n' +
        '  - Para cambiar fecha: XE (cancelar) + AN (buscar) + SS (vender)\n' +
        '  - Siempre RF + ER despues de modificar\n' +
        '  - Use *I para ver solo el itinerario\n' +
        '  - Use RT para ver el PNR completo\n\n' +
        SEP + '\n\n' +
        'FELICITACIONES! Ha completado todos los ejercicios!\n\n' +
        'Resumen de comandos aprendidos:\n' +
        '  AN     Buscar vuelos         FQD    Consultar tarifas\n' +
        '  SS     Vender asientos       NM     Agregar nombre\n' +
        '  AP     Agregar telefono      APE    Agregar email\n' +
        '  TKOK   Ticketing inmediato   TKTL   Ticketing con limite\n' +
        '  RF     Received from         ET/ER  Guardar reserva\n' +
        '  RT     Recuperar PNR         FXP    Cotizar precio\n' +
        '  SRDOCS Datos de pasaporte    SR     Servicios especiales\n' +
        '  SM     Mapa de asientos      ST     Asignar asiento\n' +
        '  XE     Cancelar elemento     DN     Decodificar ciudad\n' +
        '  DAN    Decodificar aerolinea HE     Ayuda del sistema\n\n' +
        'Puede repetir cualquier ejercicio con TRAINING {N}\n' +
        'o practicar libremente con los comandos aprendidos.',
    },
  ];

  // ================================================================
  //  PAYWALL
  // ================================================================

  function isPaid() {
    // Use Auth module if available, fall back to localStorage
    if (typeof Auth !== 'undefined') return Auth.isPaid();
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
    'Ida y vuelta con documentos',
    'Multiples pasajeros',
    'Clase ejecutiva y precio',
    'Servicios especiales y asientos',
    'Tarifas y codigos',
    'Modificaciones y recuperacion',
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
      var done = completedExercises.indexOf(num) !== -1;
      var tag = num <= FREE_LIMIT ? 'GRATIS' : (paid ? '' : 'PRO');
      var title = SHORT_TITLES[i] || ex.title;
      var line = ' ' + num + '. ' + (done ? '* ' : '  ') + title;
      if (tag) line += '  [' + tag + ']';
      lines.push(line);
    });

    if (!paid) {
      lines.push('');
      lines.push(LINE);
      lines.push('Ejercicios [PRO]: $9 USD.');
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
      var exerciseNum = exIdx + 1;
      if (completedExercises.indexOf(exerciseNum) === -1) {
        completedExercises.push(exerciseNum);
      }
      nextLines.push('');
      nextLines.push(' ' + LINE);
      nextLines.push('');
      exercises[exIdx].completion.split('\n').forEach(function (l) {
        nextLines.push(' ' + l);
      });
      nextLines.push('');
      active = false;
      // Save progress — exercise completed
      if (typeof Auth !== 'undefined') {
        Auth.saveProgress({
          exercise_index: -1,
          step_index: 0,
          exercises_completed: completedExercises,
        });
      }
    } else {
      nextLines.push('');
      nextLines.push(' ' + LINE);
      nextLines.push(formatStep());
      // Save progress — step completed
      if (typeof Auth !== 'undefined') {
        Auth.saveProgress({
          exercise_index: exIdx,
          step_index: stepIdx,
          exercises_completed: completedExercises,
        });
      }
    }

    return {
      text: successLines.join('\n'),
      next: nextLines.join('\n'),
      type: 'training-success',
    };
  }

  // ================================================================
  //  PROGRESS RESTORE
  // ================================================================

  function restoreProgress(data) {
    if (!data) return;
    try {
      var completed = JSON.parse(data.exercises_completed || '[]');
      if (Array.isArray(completed)) completedExercises = completed;
    } catch (e) {}
  }

  // Load progress from server on auth ready
  if (typeof Auth !== 'undefined') {
    Auth.onReady(function (user) {
      if (!user || !user.progress) return;
      restoreProgress(user.progress);
    });
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

    getProgressData: function () {
      return {
        titles: SHORT_TITLES.slice(),
        completed: completedExercises.slice(),
        total: exercises.length,
        freeLimit: FREE_LIMIT,
      };
    },

    restoreProgress: restoreProgress,
  };
})();
