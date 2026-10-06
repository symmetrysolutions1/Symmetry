export type EudrSource = {
  name: string;
  role: string;
  mode: "histórica" | "estimada" | "operativa";
  href: string;
};

export type MaritimeCorridor = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  context: string;
  mode: "histórica" | "estimada" | "operativa";
  path: string;
  originPoint: [number, number];
  destinationPoint: [number, number];
  mapPath: [number, number][];
};

export type CopernicusServiceCentre = {
  id: string;
  label: string;
  service: string;
  operator: string;
  status: "operativo" | "mirror regional" | "en desarrollo" | "intención";
  center: [number, number];
  aliases: string[];
  className: string;
  source: string;
};

export type CommercialPort = {
  id: string;
  rank: number;
  name: string;
  country: string;
  throughputTeu: number;
  center: [number, number];
  mapOffset?: [number, number];
};

export const commercialPorts: CommercialPort[] = [
  { id: "santos", rank: 1, name: "Santos", country: "Brasil", throughputTeu: 5484829, center: [-46.32, -23.96] },
  { id: "manzanillo-mx", rank: 2, name: "Manzanillo", country: "México", throughputTeu: 3924501, center: [-104.32, 19.05] },
  { id: "cartagena", rank: 3, name: "Bahía de Cartagena", country: "Colombia", throughputTeu: 3701044, center: [-75.52, 10.4] },
  { id: "callao", rank: 4, name: "El Callao", country: "Perú", throughputTeu: 3074530, center: [-77.15, -12.05] },
  { id: "mit-panama", rank: 5, name: "Manzanillo International Terminal (MIT)", country: "Panamá", throughputTeu: 2712653, center: [-79.88, 9.36], mapOffset: [-17, -14] },
  { id: "balboa", rank: 6, name: "Balboa", country: "Panamá", throughputTeu: 2629435, center: [-79.57, 8.95], mapOffset: [17, -14] },
  { id: "kingston", rank: 7, name: "Kingston", country: "Jamaica", throughputTeu: 2520438, center: [-76.8, 17.97] },
  { id: "lazaro-cardenas", rank: 8, name: "Lázaro Cárdenas", country: "México", throughputTeu: 2406980, center: [-102.2, 17.95] },
  { id: "san-antonio", rank: 9, name: "San Antonio", country: "Chile", throughputTeu: 1814488, center: [-71.62, -33.59] },
  { id: "colon-cct", rank: 10, name: "Colón Container Terminal (CCT)", country: "Panamá", throughputTeu: 1575475, center: [-79.88, 9.38], mapOffset: [-17, 14] },
  { id: "limon", rank: 11, name: "Limón + APM Terminals", country: "Costa Rica", throughputTeu: 1494357, center: [-83.03, 10] },
  { id: "caucedo", rank: 12, name: "Caucedo", country: "República Dominicana", throughputTeu: 1469119, center: [-69.63, 18.42] },
  { id: "buenaventura", rank: 13, name: "Buenaventura", country: "Colombia", throughputTeu: 1398409, center: [-77.02, 3.89] },
  { id: "rodman", rank: 14, name: "Rodman (PSA)", country: "Panamá", throughputTeu: 1384250, center: [-79.58, 8.95], mapOffset: [17, 14] },
  { id: "paranagua", rank: 15, name: "Paranaguá", country: "Brasil", throughputTeu: 1312782, center: [-48.5, -25.52] },
];

export const maritimeCorridors: MaritimeCorridor[] = [
  {
    id: "caribbean-north-europe",
    name: "Caribe → Norte de Europa",
    origin: "Cartagena / Santa Marta",
    destination: "Rotterdam / Antwerp",
    context: "Corredor agregado de comercio Atlántico",
    mode: "estimada",
    path: "M 214 238 C 300 186, 352 182, 446 154 C 542 126, 622 110, 735 88",
    originPoint: [214, 238],
    destinationPoint: [735, 88],
    mapPath: [[-74.8, 10.4], [-68, 13], [-55, 20], [-40, 27], [-25, 35], [-10, 43], [4.5, 51.9]],
  },
  {
    id: "atlantic-south-europe",
    name: "Atlántico Sur → Europa",
    origin: "Santos / Paranaguá",
    destination: "Algeciras / Valencia",
    context: "Corredor agregado de comercio Atlántico",
    mode: "histórica",
    path: "M 292 424 C 370 360, 430 316, 510 278 C 585 242, 657 204, 770 154",
    originPoint: [292, 424],
    destinationPoint: [770, 154],
    mapPath: [[-46.3, -23.96], [-40, -18], [-25, -5], [-10, 15], [0, 30], [-5, 36], [-0.4, 36.1]],
  },
  {
    id: "buenaventura-long-beach",
    name: "Pacífico colombiano → Costa Oeste",
    origin: "Buenaventura",
    destination: "Long Beach / Los Ángeles",
    context: "Corredor agregado del Pacífico oriental",
    mode: "estimada",
    path: "M 214 238 C 300 210, 380 196, 500 164 C 610 136, 690 110, 735 88",
    originPoint: [214, 238],
    destinationPoint: [735, 88],
    mapPath: [[-77, 3.9], [-82, 8], [-95, 15], [-108, 25], [-118.2, 33.7]],
  },
  {
    id: "guayaquil-north-europe",
    name: "Guayaquil → Norte de Europa",
    origin: "Guayaquil",
    destination: "Rotterdam / Antwerp",
    context: "Corredor agregado del Pacífico y Atlántico",
    mode: "estimada",
    path: "M 230 270 C 320 228, 410 188, 500 156 C 600 122, 685 100, 735 88",
    originPoint: [230, 270],
    destinationPoint: [735, 88],
    mapPath: [[-79.9, -2.2], [-82, 5], [-78, 11], [-68, 16], [-55, 25], [-35, 37], [4.5, 51.9]],
  },
  {
    id: "callao-valencia",
    name: "Callao → Mediterráneo occidental",
    origin: "Callao",
    destination: "Valencia / Algeciras",
    context: "Corredor agregado transpacífico y Atlántico",
    mode: "histórica",
    path: "M 246 292 C 330 258, 420 218, 510 178 C 600 140, 680 118, 770 154",
    originPoint: [246, 292],
    destinationPoint: [770, 154],
    mapPath: [[-77.15, -12.05], [-82, -8], [-85, 0], [-80, 10], [-68, 18], [-50, 27], [-20, 35], [-0.4, 36.1]],
  },
  {
    id: "san-antonio-rotterdam",
    name: "San Antonio → Rotterdam",
    origin: "San Antonio",
    destination: "Rotterdam",
    context: "Corredor agregado del Pacífico y Atlántico Sur",
    mode: "histórica",
    path: "M 260 330 C 350 286, 430 236, 510 192 C 600 146, 680 108, 735 88",
    originPoint: [260, 330],
    destinationPoint: [735, 88],
    mapPath: [[-71.6, -33.6], [-75, -25], [-70, -15], [-55, -5], [-35, 10], [-20, 30], [-10, 43], [4.5, 51.9]],
  },
  {
    id: "buenos-aires-antwerp",
    name: "Buenos Aires → Amberes",
    origin: "Buenos Aires",
    destination: "Amberes",
    context: "Corredor agregado del Atlántico Sur",
    mode: "histórica",
    path: "M 275 360 C 360 324, 440 284, 520 236 C 600 188, 680 132, 735 88",
    originPoint: [275, 360],
    destinationPoint: [735, 88],
    mapPath: [[-58.45, -34.6], [-52, -35], [-42, -30], [-30, -18], [-20, 0], [-12, 25], [-5, 40], [2.5, 51.2]],
  },
  {
    id: "montevideo-antwerp",
    name: "Montevideo → Amberes",
    origin: "Montevideo",
    destination: "Amberes",
    context: "Corredor agregado del Atlántico Sur",
    mode: "estimada",
    path: "M 282 368 C 370 330, 450 288, 530 240 C 620 188, 690 130, 735 88",
    originPoint: [282, 368],
    destinationPoint: [735, 88],
    mapPath: [[-56.2, -34.9], [-50, -32], [-40, -22], [-28, -10], [-18, 10], [-10, 30], [2.5, 51.2]],
  },
  {
    id: "manzanillo-panama-algeciras",
    name: "Manzanillo → Algeciras",
    origin: "Manzanillo, Colón",
    destination: "Algeciras",
    context: "Corredor agregado del Caribe y Mediterráneo",
    mode: "estimada",
    path: "M 225 245 C 320 208, 410 184, 500 158 C 600 132, 690 118, 770 154",
    originPoint: [225, 245],
    destinationPoint: [770, 154],
    mapPath: [[-79.7, 9.4], [-74, 13], [-65, 18], [-52, 25], [-35, 34], [-15, 40], [-0.4, 36.1]],
  },
  {
    id: "veracruz-hamburg",
    name: "Veracruz → Hamburgo",
    origin: "Veracruz",
    destination: "Hamburgo",
    context: "Corredor agregado del Golfo de México y Atlántico Norte",
    mode: "histórica",
    path: "M 205 205 C 300 180, 390 164, 490 142 C 590 120, 675 102, 760 82",
    originPoint: [205, 205],
    destinationPoint: [760, 82],
    mapPath: [[-96.1, 19.2], [-90, 22], [-82, 24], [-70, 25], [-55, 31], [-35, 40], [-10, 48], [9.9, 53.5]],
  },
  {
    id: "lazaro-cardenas-long-beach",
    name: "Lázaro Cárdenas → Long Beach",
    origin: "Lázaro Cárdenas",
    destination: "Long Beach",
    context: "Corredor agregado del Pacífico norte",
    mode: "estimada",
    path: "M 190 220 C 300 198, 410 174, 520 150 C 620 126, 700 104, 760 88",
    originPoint: [190, 220],
    destinationPoint: [760, 88],
    mapPath: [[-102.2, 17.9], [-112, 20], [-125, 25], [-118.2, 33.7]],
  },
  {
    id: "puerto-quetzal-los-angeles",
    name: "Puerto Quetzal → Los Ángeles",
    origin: "Puerto Quetzal",
    destination: "Los Ángeles",
    context: "Corredor agregado del Pacífico oriental",
    mode: "estimada",
    path: "M 208 248 C 300 220, 400 194, 510 166 C 610 140, 700 110, 760 88",
    originPoint: [208, 248],
    destinationPoint: [760, 88],
    mapPath: [[-90.8, 13.9], [-98, 16], [-108, 22], [-118.2, 33.7]],
  },
  {
    id: "limon-rotterdam",
    name: "Limón → Rotterdam",
    origin: "Limón",
    destination: "Rotterdam",
    context: "Corredor agregado del Caribe y Atlántico Norte",
    mode: "histórica",
    path: "M 220 230 C 320 194, 420 170, 520 142 C 620 116, 700 98, 735 88",
    originPoint: [220, 230],
    destinationPoint: [735, 88],
    mapPath: [[-83, 10], [-75, 13], [-65, 20], [-50, 28], [-30, 37], [-10, 44], [4.5, 51.9]],
  },
  {
    id: "puerto-cortes-antwerp",
    name: "Puerto Cortés → Amberes",
    origin: "Puerto Cortés",
    destination: "Amberes",
    context: "Corredor agregado del Caribe y Atlántico Norte",
    mode: "estimada",
    path: "M 212 220 C 310 188, 410 168, 510 140 C 620 112, 700 98, 735 88",
    originPoint: [212, 220],
    destinationPoint: [735, 88],
    mapPath: [[-87.95, 15.8], [-80, 18], [-68, 25], [-50, 32], [-30, 39], [-10, 45], [2.5, 51.2]],
  },
  {
    id: "caucedo-rotterdam",
    name: "Caucedo → Rotterdam",
    origin: "Caucedo",
    destination: "Rotterdam",
    context: "Corredor agregado del Caribe y Atlántico Norte",
    mode: "histórica",
    path: "M 235 214 C 330 182, 420 158, 520 136 C 620 112, 700 96, 735 88",
    originPoint: [235, 214],
    destinationPoint: [735, 88],
    mapPath: [[-69.6, 18.4], [-60, 22], [-48, 29], [-30, 38], [-10, 45], [4.5, 51.9]],
  },
];

// City-level references to Copernicus Sentinel regional access and analysis sites.
// Status is intentionally explicit: this is not a live station or a complete partner network.
export const copernicusServiceCentres: CopernicusServiceCentre[] = [
  {
    id: "udechile-santiago",
    label: "Santiago",
    service: "Mirror regional Sentinel",
    operator: "Universidad de Chile · CMM",
    status: "mirror regional",
    center: [-70.6693, -33.4489],
    aliases: ["santiago", "chile", "udechile", "datos copernicus chile"],
    className: "centreMirror",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "aig-panama",
    label: "Ciudad de Panamá",
    service: "Centro regional LAC",
    operator: "AIG · Panamá",
    status: "en desarrollo",
    center: [-79.5199, 8.9824],
    aliases: ["panama", "panamá", "ciudad de panama", "aig"],
    className: "centreDevelopment",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "ideam-bogota",
    label: "Bogotá",
    service: "Mirror regional LAC",
    operator: "IDEAM · Colombia",
    status: "intención",
    center: [-74.0721, 4.711],
    aliases: ["bogota", "bogotá", "ideam", "colombia"],
    className: "centrePlanned",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "cicos-brazzaville",
    label: "Brazzaville",
    service: "Centro regional Cuenca del Congo",
    operator: "CICOS · África Central",
    status: "operativo",
    center: [15.2663, -4.2634],
    aliases: ["brazzaville", "cicos", "congo", "cuenca del congo"],
    className: "centreOperational",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "oss-tunis",
    label: "Túnez",
    service: "Centro regional Norte de África",
    operator: "OSS · Sahara y Sahel",
    status: "mirror regional",
    center: [10.1815, 36.8065],
    aliases: ["tunez", "túnez", "tunis", "oss", "sahara y sahel"],
    className: "centreMirror",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "lsa-luxembourg",
    label: "Luxemburgo",
    service: "LSA Data Centre",
    operator: "Luxembourg Space Agency",
    status: "operativo",
    center: [6.1319, 49.6116],
    aliases: ["luxemburgo", "luxembourg", "lsa data centre"],
    className: "centreOperational",
    source: "https://sentinels.copernicus.eu/documents/d/sentinel/executive-sumary_workshop21_2024",
  },
  {
    id: "isro-bengaluru",
    label: "Bengaluru",
    service: "Mirror regional Sentinel",
    operator: "ISRO · India",
    status: "mirror regional",
    center: [77.5946, 12.9716],
    aliases: ["bengaluru", "bangalore", "india", "isro"],
    className: "centreMirror",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "meti-tokyo",
    label: "Tokio",
    service: "Tellus · acceso regional",
    operator: "METI · Japón",
    status: "operativo",
    center: [139.6917, 35.6895],
    aliases: ["tokio", "tokyo", "japon", "japón", "meti", "tellus"],
    className: "centreOperational",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "nasrda-abuja",
    label: "Abuya",
    service: "Centro regional África Occidental",
    operator: "NASRDA · Nigeria",
    status: "en desarrollo",
    center: [7.4951, 9.0579],
    aliases: ["abuya", "abuja", "nigeria", "nasrda"],
    className: "centreDevelopment",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
  {
    id: "philsa-manila",
    label: "Manila",
    service: "Centro regional Filipinas y ASEAN",
    operator: "PhilSA · Filipinas",
    status: "en desarrollo",
    center: [120.9842, 14.5995],
    aliases: ["manila", "filipinas", "philippines", "philsa", "asean"],
    className: "centreDevelopment",
    source: "https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners",
  },
];

export const maritimeSources: EudrSource[] = [
  {
    name: "EMODnet Human Activities",
    role: "Densidad y rutas agregadas en aguas europeas.",
    mode: "histórica",
    href: "https://emodnet-humanactivities.eu/",
  },
  {
    name: "World Bank · Global Shipping Traffic Density",
    role: "Densidad global derivada de AIS para contexto marítimo.",
    mode: "histórica",
    href: "https://datacatalog.worldbank.org/search/dataset/0037580/global-shipping-traffic-density",
  },
  {
    name: "MarineCadastre / NOAA AIS",
    role: "AIS descargable para aguas de Estados Unidos.",
    mode: "histórica",
    href: "https://marinecadastre.gov/ais/",
  },
  {
    name: "MarineTraffic · VesselFinder · Spire",
    role: "Opciones comerciales para AIS operativo, sujetas a integración y licencia.",
    mode: "operativa",
    href: "https://servicedocs.marinetraffic.com/",
  },
  {
    name: "Searoutes",
    role: "Rutas calculadas entre puertos, distancias y emisiones.",
    mode: "estimada",
    href: "https://developer.searoutes.com/reference/introduction",
  },
];
