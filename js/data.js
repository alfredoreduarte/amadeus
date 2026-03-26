// ============================================================
// Mock data for the Amadeus Training Console Simulator
// ============================================================

var DATA = {

  // ---- Airlines ----
  airlines: {
    'AA': { name: 'AMERICAN AIRLINES',        country: 'US' },
    'UA': { name: 'UNITED AIRLINES',          country: 'US' },
    'DL': { name: 'DELTA AIR LINES',          country: 'US' },
    'B6': { name: 'JETBLUE AIRWAYS',          country: 'US' },
    'BA': { name: 'BRITISH AIRWAYS',          country: 'GB' },
    'IB': { name: 'IBERIA',                   country: 'ES' },
    'AF': { name: 'AIR FRANCE',               country: 'FR' },
    'LH': { name: 'LUFTHANSA',               country: 'DE' },
    'LX': { name: 'SWISS INTL AIR LINES',    country: 'CH' },
    'EK': { name: 'EMIRATES',                 country: 'AE' },
    'QR': { name: 'QATAR AIRWAYS',            country: 'QA' },
    'TK': { name: 'TURKISH AIRLINES',         country: 'TR' },
    'AV': { name: 'AVIANCA',                  country: 'CO' },
    'AM': { name: 'AEROMEXICO',               country: 'MX' },
    'LA': { name: 'LATAM AIRLINES',           country: 'CL' },
    'CM': { name: 'COPA AIRLINES',            country: 'PA' },
    'VS': { name: 'VIRGIN ATLANTIC',          country: 'GB' },
    'AC': { name: 'AIR CANADA',               country: 'CA' },
    'SK': { name: 'SCANDINAVIAN AIRLINES',    country: 'SE' },
    'AZ': { name: 'ITA AIRWAYS',              country: 'IT' },
  },

  // ---- Airports & cities ----
  airports: {
    'JFK': { name: 'JOHN F KENNEDY INTL',         city: 'NYC', country: 'US' },
    'LGA': { name: 'LA GUARDIA',                  city: 'NYC', country: 'US' },
    'EWR': { name: 'NEWARK LIBERTY INTL',          city: 'NYC', country: 'US' },
    'MIA': { name: 'MIAMI INTL',                   city: 'MIA', country: 'US' },
    'LAX': { name: 'LOS ANGELES INTL',             city: 'LAX', country: 'US' },
    'ORD': { name: 'CHICAGO O HARE INTL',          city: 'CHI', country: 'US' },
    'ATL': { name: 'HARTSFIELD JACKSON ATLANTA',   city: 'ATL', country: 'US' },
    'DFW': { name: 'DALLAS FORT WORTH INTL',       city: 'DFW', country: 'US' },
    'SFO': { name: 'SAN FRANCISCO INTL',           city: 'SFO', country: 'US' },
    'BOS': { name: 'BOSTON LOGAN INTL',             city: 'BOS', country: 'US' },
    'LHR': { name: 'LONDON HEATHROW',              city: 'LON', country: 'GB' },
    'LGW': { name: 'LONDON GATWICK',               city: 'LON', country: 'GB' },
    'CDG': { name: 'PARIS CHARLES DE GAULLE',      city: 'PAR', country: 'FR' },
    'MAD': { name: 'MADRID BARAJAS',               city: 'MAD', country: 'ES' },
    'BCN': { name: 'BARCELONA EL PRAT',            city: 'BCN', country: 'ES' },
    'FRA': { name: 'FRANKFURT MAIN',                city: 'FRA', country: 'DE' },
    'AMS': { name: 'AMSTERDAM SCHIPHOL',            city: 'AMS', country: 'NL' },
    'FCO': { name: 'ROME FIUMICINO',                city: 'ROM', country: 'IT' },
    'ZRH': { name: 'ZURICH',                        city: 'ZRH', country: 'CH' },
    'IST': { name: 'ISTANBUL AIRPORT',               city: 'IST', country: 'TR' },
    'DXB': { name: 'DUBAI INTL',                     city: 'DXB', country: 'AE' },
    'DOH': { name: 'DOHA HAMAD INTL',                city: 'DOH', country: 'QA' },
    'MEX': { name: 'MEXICO CITY BENITO JUAREZ',      city: 'MEX', country: 'MX' },
    'CUN': { name: 'CANCUN INTL',                    city: 'CUN', country: 'MX' },
    'BOG': { name: 'BOGOTA EL DORADO',               city: 'BOG', country: 'CO' },
    'GRU': { name: 'SAO PAULO GUARULHOS',            city: 'SAO', country: 'BR' },
    'GIG': { name: 'RIO DE JANEIRO GALEAO',          city: 'RIO', country: 'BR' },
    'EZE': { name: 'BUENOS AIRES EZEIZA',            city: 'BUE', country: 'AR' },
    'SCL': { name: 'SANTIAGO ARTURO MERINO',          city: 'SCL', country: 'CL' },
    'LIM': { name: 'LIMA JORGE CHAVEZ',               city: 'LIM', country: 'PE' },
    'PTY': { name: 'PANAMA CITY TOCUMEN',              city: 'PTY', country: 'PA' },
    'YYZ': { name: 'TORONTO PEARSON INTL',             city: 'YTO', country: 'CA' },
    'YUL': { name: 'MONTREAL TRUDEAU INTL',            city: 'YMQ', country: 'CA' },
  },

  // City codes → primary airport
  cities: {
    'NYC': { name: 'NEW YORK',         country: 'US', airports: ['JFK','LGA','EWR'] },
    'LON': { name: 'LONDON',           country: 'GB', airports: ['LHR','LGW'] },
    'PAR': { name: 'PARIS',            country: 'FR', airports: ['CDG'] },
    'CHI': { name: 'CHICAGO',          country: 'US', airports: ['ORD'] },
    'SAO': { name: 'SAO PAULO',        country: 'BR', airports: ['GRU'] },
    'RIO': { name: 'RIO DE JANEIRO',   country: 'BR', airports: ['GIG'] },
    'BUE': { name: 'BUENOS AIRES',     country: 'AR', airports: ['EZE'] },
    'ROM': { name: 'ROME',             country: 'IT', airports: ['FCO'] },
    'YTO': { name: 'TORONTO',          country: 'CA', airports: ['YYZ'] },
    'YMQ': { name: 'MONTREAL',         country: 'CA', airports: ['YUL'] },
  },

  // ---- Flight schedules ----
  // Each entry is a template; availability is generated per search.
  flights: [
    // --- MIA - JFK ---
    { al:'AA', fn:'100', from:'MIA', to:'JFK', dep:'0800', arr:'1100', dur:'3:00', eq:'738', classes:{J:9,C:9,D:5,Y:9,B:9,M:9,K:4} },
    { al:'AA', fn:'102', from:'MIA', to:'JFK', dep:'1400', arr:'1700', dur:'3:00', eq:'738', classes:{J:2,C:0,D:0,Y:9,B:9,M:7,K:2} },
    { al:'UA', fn:'201', from:'MIA', to:'JFK', dep:'0930', arr:'1230', dur:'3:00', eq:'319', classes:{J:4,C:4,D:0,Y:9,B:9,M:9,K:6} },
    { al:'DL', fn:'305', from:'MIA', to:'JFK', dep:'1100', arr:'1400', dur:'3:00', eq:'321', classes:{J:9,C:6,D:4,Y:9,B:9,M:8,K:5} },
    { al:'B6', fn:'601', from:'MIA', to:'JFK', dep:'0700', arr:'1000', dur:'3:00', eq:'320', classes:{J:0,C:0,D:0,Y:9,B:9,M:9,K:9} },

    // --- JFK - MIA ---
    { al:'AA', fn:'101', from:'JFK', to:'MIA', dep:'0900', arr:'1230', dur:'3:30', eq:'738', classes:{J:9,C:7,D:3,Y:9,B:9,M:9,K:5} },
    { al:'AA', fn:'103', from:'JFK', to:'MIA', dep:'1500', arr:'1830', dur:'3:30', eq:'738', classes:{J:5,C:3,D:0,Y:9,B:7,M:4,K:1} },
    { al:'UA', fn:'202', from:'JFK', to:'MIA', dep:'1030', arr:'1400', dur:'3:30', eq:'319', classes:{J:4,C:2,D:0,Y:9,B:9,M:8,K:4} },
    { al:'DL', fn:'306', from:'JFK', to:'MIA', dep:'1200', arr:'1530', dur:'3:30', eq:'321', classes:{J:7,C:5,D:2,Y:9,B:9,M:9,K:6} },

    // --- JFK - LHR ---
    { al:'BA', fn:'178', from:'JFK', to:'LHR', dep:'2100', arr:'0900', dur:'7:00', eq:'777', classes:{J:9,C:9,D:5,Y:9,B:9,M:7,K:3} },
    { al:'AA', fn:'100', from:'JFK', to:'LHR', dep:'1900', arr:'0700', dur:'7:00', eq:'77W', classes:{J:4,C:2,D:0,Y:9,B:9,M:9,K:6} },
    { al:'VS', fn:'10',  from:'JFK', to:'LHR', dep:'2000', arr:'0800', dur:'7:00', eq:'789', classes:{J:7,C:5,D:3,Y:9,B:9,M:8,K:4} },
    { al:'DL', fn:'1',   from:'JFK', to:'LHR', dep:'2200', arr:'1000', dur:'7:00', eq:'763', classes:{J:3,C:1,D:0,Y:9,B:7,M:5,K:2} },

    // --- LHR - JFK ---
    { al:'BA', fn:'177', from:'LHR', to:'JFK', dep:'1100', arr:'1400', dur:'8:00', eq:'777', classes:{J:9,C:8,D:6,Y:9,B:9,M:9,K:5} },
    { al:'AA', fn:'101', from:'LHR', to:'JFK', dep:'0900', arr:'1200', dur:'8:00', eq:'77W', classes:{J:5,C:3,D:1,Y:9,B:9,M:8,K:4} },
    { al:'VS', fn:'11',  from:'LHR', to:'JFK', dep:'1030', arr:'1330', dur:'8:00', eq:'789', classes:{J:6,C:4,D:2,Y:9,B:9,M:7,K:3} },

    // --- JFK - CDG ---
    { al:'AF', fn:'23',  from:'JFK', to:'CDG', dep:'1900', arr:'0830', dur:'7:30', eq:'77W', classes:{J:7,C:5,D:3,Y:9,B:9,M:9,K:5} },
    { al:'DL', fn:'264', from:'JFK', to:'CDG', dep:'2100', arr:'1030', dur:'7:30', eq:'763', classes:{J:4,C:2,D:0,Y:9,B:8,M:6,K:3} },

    // --- CDG - JFK ---
    { al:'AF', fn:'22',  from:'CDG', to:'JFK', dep:'1030', arr:'1300', dur:'8:30', eq:'77W', classes:{J:8,C:6,D:4,Y:9,B:9,M:9,K:6} },

    // --- JFK - FRA ---
    { al:'LH', fn:'403', from:'JFK', to:'FRA', dep:'1800', arr:'0800', dur:'8:00', eq:'748', classes:{J:9,C:7,D:5,Y:9,B:9,M:9,K:7} },
    { al:'UA', fn:'960', from:'JFK', to:'FRA', dep:'2000', arr:'1000', dur:'8:00', eq:'764', classes:{J:3,C:1,D:0,Y:9,B:7,M:5,K:2} },

    // --- FRA - JFK ---
    { al:'LH', fn:'404', from:'FRA', to:'JFK', dep:'1030', arr:'1330', dur:'9:00', eq:'748', classes:{J:8,C:6,D:4,Y:9,B:9,M:8,K:5} },

    // --- MIA - MAD ---
    { al:'IB', fn:'6124', from:'MIA', to:'MAD', dep:'2130', arr:'1130', dur:'9:00', eq:'332', classes:{J:6,C:4,D:2,Y:9,B:9,M:7,K:3} },
    { al:'AA', fn:'68',   from:'MIA', to:'MAD', dep:'1800', arr:'0800', dur:'9:00', eq:'77W', classes:{J:3,C:1,D:0,Y:9,B:8,M:6,K:2} },

    // --- MAD - MIA ---
    { al:'IB', fn:'6123', from:'MAD', to:'MIA', dep:'1230', arr:'1730', dur:'10:00', eq:'332', classes:{J:7,C:5,D:3,Y:9,B:9,M:8,K:4} },
    { al:'AA', fn:'67',   from:'MAD', to:'MIA', dep:'1030', arr:'1530', dur:'10:00', eq:'77W', classes:{J:4,C:2,D:0,Y:9,B:9,M:7,K:3} },

    // --- MIA - BOG ---
    { al:'AV', fn:'20',  from:'MIA', to:'BOG', dep:'0800', arr:'1130', dur:'3:30', eq:'320', classes:{J:5,C:3,D:1,Y:9,B:9,M:9,K:7} },
    { al:'AA', fn:'921', from:'MIA', to:'BOG', dep:'1000', arr:'1330', dur:'3:30', eq:'738', classes:{J:3,C:1,D:0,Y:9,B:9,M:8,K:5} },

    // --- BOG - MIA ---
    { al:'AV', fn:'21',  from:'BOG', to:'MIA', dep:'1300', arr:'1730', dur:'4:30', eq:'320', classes:{J:6,C:4,D:2,Y:9,B:9,M:9,K:6} },
    { al:'AA', fn:'920', from:'BOG', to:'MIA', dep:'1500', arr:'1930', dur:'4:30', eq:'738', classes:{J:4,C:2,D:0,Y:9,B:8,M:6,K:3} },

    // --- MIA - GRU ---
    { al:'LA', fn:'8051', from:'MIA', to:'GRU', dep:'2200', arr:'0730', dur:'8:30', eq:'789', classes:{J:7,C:5,D:3,Y:9,B:9,M:8,K:4} },
    { al:'AA', fn:'953',  from:'MIA', to:'GRU', dep:'2000', arr:'0530', dur:'8:30', eq:'77W', classes:{J:4,C:2,D:0,Y:9,B:7,M:5,K:2} },

    // --- GRU - MIA ---
    { al:'LA', fn:'8050', from:'GRU', to:'MIA', dep:'2100', arr:'0530', dur:'9:30', eq:'789', classes:{J:6,C:4,D:2,Y:9,B:9,M:7,K:3} },
    { al:'AA', fn:'952',  from:'GRU', to:'MIA', dep:'2300', arr:'0730', dur:'9:30', eq:'77W', classes:{J:3,C:1,D:0,Y:9,B:8,M:6,K:2} },

    // --- MIA - MEX ---
    { al:'AM', fn:'531', from:'MIA', to:'MEX', dep:'0900', arr:'1130', dur:'3:30', eq:'738', classes:{J:5,C:3,D:1,Y:9,B:9,M:9,K:6} },
    { al:'AA', fn:'2193',from:'MIA', to:'MEX', dep:'0730', arr:'1000', dur:'3:30', eq:'738', classes:{J:3,C:1,D:0,Y:9,B:9,M:7,K:4} },

    // --- MEX - MIA ---
    { al:'AM', fn:'530', from:'MEX', to:'MIA', dep:'1400', arr:'1930', dur:'3:30', eq:'738', classes:{J:4,C:2,D:0,Y:9,B:9,M:8,K:5} },

    // --- LAX - JFK ---
    { al:'AA', fn:'1',   from:'LAX', to:'JFK', dep:'0600', arr:'1430', dur:'5:30', eq:'321', classes:{J:9,C:7,D:4,Y:9,B:9,M:9,K:6} },
    { al:'UA', fn:'452', from:'LAX', to:'JFK', dep:'0800', arr:'1630', dur:'5:30', eq:'752', classes:{J:5,C:3,D:1,Y:9,B:9,M:8,K:4} },
    { al:'DL', fn:'472', from:'LAX', to:'JFK', dep:'0700', arr:'1530', dur:'5:30', eq:'739', classes:{J:6,C:4,D:2,Y:9,B:9,M:7,K:3} },

    // --- JFK - LAX ---
    { al:'AA', fn:'2',   from:'JFK', to:'LAX', dep:'0800', arr:'1130', dur:'6:30', eq:'321', classes:{J:8,C:6,D:3,Y:9,B:9,M:9,K:5} },
    { al:'UA', fn:'453', from:'JFK', to:'LAX', dep:'1000', arr:'1330', dur:'6:30', eq:'752', classes:{J:4,C:2,D:0,Y:9,B:8,M:6,K:3} },

    // --- ORD - LHR ---
    { al:'BA', fn:'296', from:'ORD', to:'LHR', dep:'1800', arr:'0800', dur:'8:00', eq:'777', classes:{J:9,C:7,D:5,Y:9,B:9,M:9,K:6} },
    { al:'AA', fn:'88',  from:'ORD', to:'LHR', dep:'1700', arr:'0700', dur:'8:00', eq:'789', classes:{J:5,C:3,D:1,Y:9,B:9,M:8,K:4} },
    { al:'UA', fn:'958', from:'ORD', to:'LHR', dep:'1900', arr:'0900', dur:'8:00', eq:'77W', classes:{J:4,C:2,D:0,Y:9,B:7,M:5,K:2} },

    // --- LHR - ORD ---
    { al:'BA', fn:'295', from:'LHR', to:'ORD', dep:'1030', arr:'1330', dur:'9:00', eq:'777', classes:{J:8,C:6,D:4,Y:9,B:9,M:9,K:5} },

    // --- JFK - DXB ---
    { al:'EK', fn:'202', from:'JFK', to:'DXB', dep:'2300', arr:'1900', dur:'13:00', eq:'388', classes:{J:9,C:9,D:7,Y:9,B:9,M:9,K:8} },

    // --- DXB - JFK ---
    { al:'EK', fn:'201', from:'DXB', to:'JFK', dep:'0800', arr:'1400', dur:'14:00', eq:'388', classes:{J:9,C:8,D:6,Y:9,B:9,M:9,K:7} },

    // --- MIA - PTY ---
    { al:'CM', fn:'440', from:'MIA', to:'PTY', dep:'0830', arr:'1130', dur:'3:00', eq:'738', classes:{J:6,C:4,D:2,Y:9,B:9,M:9,K:6} },
    { al:'AA', fn:'915', from:'MIA', to:'PTY', dep:'1100', arr:'1400', dur:'3:00', eq:'738', classes:{J:3,C:1,D:0,Y:9,B:9,M:7,K:4} },

    // --- PTY - MIA ---
    { al:'CM', fn:'441', from:'PTY', to:'MIA', dep:'1300', arr:'1700', dur:'4:00', eq:'738', classes:{J:5,C:3,D:1,Y:9,B:9,M:8,K:5} },

    // --- MIA - CUN ---
    { al:'AA', fn:'1477',from:'MIA', to:'CUN', dep:'0900', arr:'1100', dur:'2:00', eq:'738', classes:{J:4,C:2,D:0,Y:9,B:9,M:9,K:7} },
    { al:'AM', fn:'549', from:'MIA', to:'CUN', dep:'1130', arr:'1330', dur:'2:00', eq:'320', classes:{J:3,C:1,D:0,Y:9,B:9,M:8,K:5} },

    // --- CUN - MIA ---
    { al:'AA', fn:'1478',from:'CUN', to:'MIA', dep:'1400', arr:'1800', dur:'2:30', eq:'738', classes:{J:5,C:3,D:1,Y:9,B:9,M:9,K:6} },
  ],

  // ---- Fare data by route ----
  // Keyed as "ORIG-DEST"
  fares: {
    'MIA-JFK': [
      { al:'AA', basis:'YOW',      ow:250,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'BOW',      ow:180,  cls:'B', pen:50,  dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'R' },
      { al:'AA', basis:'MOW14AP',  ow:120,  cls:'M', pen:75,  dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
      { al:'AA', basis:'KOW21AP',  ow:89,   cls:'K', pen:100, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
      { al:'UA', basis:'YOW',      ow:245,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'UA', basis:'BOW',      ow:175,  cls:'B', pen:50,  dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'R' },
      { al:'DL', basis:'YOW',      ow:248,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'DL', basis:'MOW7AP',   ow:130,  cls:'M', pen:75,  dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'N' },
      { al:'B6', basis:'YOW',      ow:199,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'B6', basis:'KOW',      ow:79,   cls:'K', pen:100, dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
    ],
    'JFK-LHR': [
      { al:'BA', basis:'JOW',      ow:2800, cls:'J', pen:0,   dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'BA', basis:'YOW',      ow:450,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'BA', basis:'BOW14AP',  ow:320,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'14D', min:'3D', max:'1M',  ref:'R' },
      { al:'BA', basis:'MOW21AP',  ow:280,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
      { al:'AA', basis:'YOW',      ow:440,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'MOW14AP',  ow:295,  cls:'M', pen:125, dates:'01MAR-30JUN', ap:'14D', min:'5D', max:'1M',  ref:'N' },
      { al:'VS', basis:'YOW',      ow:430,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'VS', basis:'KOW21AP',  ow:260,  cls:'K', pen:175, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
    ],
    'MIA-MAD': [
      { al:'IB', basis:'JOW',      ow:3200, cls:'J', pen:0,   dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'IB', basis:'YOW',      ow:520,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'IB', basis:'BOW14AP',  ow:380,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'14D', min:'3D', max:'1M',  ref:'R' },
      { al:'IB', basis:'MOW21AP',  ow:310,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
      { al:'AA', basis:'YOW',      ow:510,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'MOW14AP',  ow:340,  cls:'M', pen:125, dates:'01MAR-30JUN', ap:'14D', min:'5D', max:'1M',  ref:'N' },
    ],
    'MIA-BOG': [
      { al:'AV', basis:'YOW',      ow:380,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AV', basis:'BOW7AP',   ow:260,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'R' },
      { al:'AV', basis:'MOW14AP',  ow:190,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
      { al:'AA', basis:'YOW',      ow:375,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'MOW14AP',  ow:210,  cls:'M', pen:125, dates:'01MAR-30JUN', ap:'14D', min:'5D', max:'1M',  ref:'N' },
    ],
    'MIA-GRU': [
      { al:'LA', basis:'JOW',      ow:3500, cls:'J', pen:0,   dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'LA', basis:'YOW',      ow:680,  cls:'Y', pen:75,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'LA', basis:'MOW14AP',  ow:420,  cls:'M', pen:175, dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
      { al:'AA', basis:'YOW',      ow:670,  cls:'Y', pen:75,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'MOW21AP',  ow:450,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
    ],
    'MIA-MEX': [
      { al:'AM', basis:'YOW',      ow:320,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AM', basis:'BOW7AP',   ow:220,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'R' },
      { al:'AM', basis:'MOW14AP',  ow:160,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
      { al:'AA', basis:'YOW',      ow:315,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'KOW21AP',  ow:140,  cls:'K', pen:175, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
    ],
    'JFK-CDG': [
      { al:'AF', basis:'JOW',      ow:3100, cls:'J', pen:0,   dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AF', basis:'YOW',      ow:460,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AF', basis:'BOW14AP',  ow:340,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'14D', min:'3D', max:'1M',  ref:'R' },
      { al:'AF', basis:'MOW21AP',  ow:290,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
      { al:'DL', basis:'YOW',      ow:455,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'DL', basis:'MOW14AP',  ow:310,  cls:'M', pen:125, dates:'01MAR-30JUN', ap:'14D', min:'5D', max:'1M',  ref:'N' },
    ],
    'JFK-FRA': [
      { al:'LH', basis:'JOW',      ow:3000, cls:'J', pen:0,   dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'LH', basis:'YOW',      ow:440,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'LH', basis:'BOW14AP',  ow:330,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'14D', min:'3D', max:'1M',  ref:'R' },
      { al:'LH', basis:'MOW21AP',  ow:275,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'21D', min:'7D', max:'1M',  ref:'N' },
      { al:'UA', basis:'YOW',      ow:435,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
    ],
    'LAX-JFK': [
      { al:'AA', basis:'YOW',      ow:280,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'BOW7AP',   ow:200,  cls:'B', pen:50,  dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'R' },
      { al:'AA', basis:'MOW14AP',  ow:150,  cls:'M', pen:75,  dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
      { al:'UA', basis:'YOW',      ow:275,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'DL', basis:'YOW',      ow:278,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'DL', basis:'MOW14AP',  ow:155,  cls:'M', pen:75,  dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
    ],
    'ORD-LHR': [
      { al:'BA', basis:'YOW',      ow:470,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'BA', basis:'BOW14AP',  ow:340,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'14D', min:'3D', max:'1M',  ref:'R' },
      { al:'AA', basis:'YOW',      ow:460,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'UA', basis:'YOW',      ow:455,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
    ],
    'MIA-PTY': [
      { al:'CM', basis:'YOW',      ow:350,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'CM', basis:'BOW7AP',   ow:240,  cls:'B', pen:100, dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'R' },
      { al:'CM', basis:'MOW14AP',  ow:180,  cls:'M', pen:150, dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
      { al:'AA', basis:'YOW',      ow:345,  cls:'Y', pen:50,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
    ],
    'JFK-DXB': [
      { al:'EK', basis:'FOW',      ow:8500, cls:'F', pen:0,   dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'EK', basis:'JOW',      ow:4200, cls:'J', pen:0,   dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'EK', basis:'YOW',      ow:780,  cls:'Y', pen:75,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'EK', basis:'MOW14AP',  ow:520,  cls:'M', pen:200, dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
      { al:'EK', basis:'KOW21AP',  ow:420,  cls:'K', pen:250, dates:'01MAR-30JUN', ap:'21D', min:'14D',max:'1M',  ref:'N' },
    ],
    'MIA-CUN': [
      { al:'AA', basis:'YOW',      ow:220,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AA', basis:'MOW7AP',   ow:130,  cls:'M', pen:75,  dates:'01MAR-30JUN', ap:'7D',  min:'3D', max:'1M',  ref:'N' },
      { al:'AM', basis:'YOW',      ow:215,  cls:'Y', pen:25,  dates:'01MAR-30JUN', ap:'',    min:'',   max:'12M', ref:'R' },
      { al:'AM', basis:'MOW14AP',  ow:120,  cls:'M', pen:75,  dates:'01MAR-30JUN', ap:'14D', min:'7D', max:'1M',  ref:'N' },
    ],
  },
};

// --- Data lookup helpers ---

/**
 * Given an airport or city code, return an array of airport codes.
 */
function resolveAirports(code) {
  code = code.toUpperCase();
  if (DATA.cities[code]) return DATA.cities[code].airports;
  if (DATA.airports[code]) return [code];
  return null;
}

/**
 * Look up fare data.  Tries "ORIG-DEST"; if the origin or dest is a
 * city code it also tries each underlying airport pair.
 */
function lookupFares(orig, dest) {
  var key = orig + '-' + dest;
  if (DATA.fares[key]) return DATA.fares[key];

  // Try resolving city → airport combos
  var oList = resolveAirports(orig) || [orig];
  var dList = resolveAirports(dest) || [dest];
  for (var i = 0; i < oList.length; i++) {
    for (var j = 0; j < dList.length; j++) {
      key = oList[i] + '-' + dList[j];
      if (DATA.fares[key]) return DATA.fares[key];
    }
  }
  return null;
}
