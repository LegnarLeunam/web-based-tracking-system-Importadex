import { readFileSync, writeFileSync } from "node:fs";

const csvPath = new URL("../Datos/Formulario MIREX.csv", import.meta.url);
const outputPath = new URL("../src/data/csvData.js", import.meta.url);

const source = readFileSync(csvPath, "utf8");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function slugDate(value) {
  const match = value.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (!match) return "2025-01-01T12:00:00";
  const [, year, month, day] = match;
  const time = value.match(/(\d{1,2}):(\d{2})/) || ["", "12", "00"];
  return `${year}-${month}-${day}T${time[1].padStart(2, "0")}:${time[2]}:00`;
}

function normalizeType(value, destination) {
  const clean = value.trim().toLowerCase();
  if (clean.includes("import")) return "Importación";
  if (clean.includes("export")) return "Exportación";
  if (destination.toLowerCase().includes("república dominicana")) return "Local/Nacional";
  return "Local/Nacional";
}

function normalizePriority(value) {
  const clean = value.trim().toLowerCase();
  if (clean.includes("urgente") && !clean.includes("no urgente")) return "Urgente";
  if (clean.includes("alta")) return "Alta";
  return "Normal";
}

function inferCountry(destination, address, type) {
  const source = `${destination} ${address}`.toLowerCase();
  const countries = [
    ["Estados Unidos", ["estados unidos", "washington", "new york", "miami", "boston"]],
    ["España", ["españa", "madrid", "tenerife", "islas canarias"]],
    ["Francia", ["francia", "paris", "parís"]],
    ["Guadalupe", ["guadalupe", "guadeloupe", "abymes"]],
    ["Panamá", ["panamá", "panama"]],
    ["Colombia", ["colombia", "bogotá", "bogota"]],
    ["México", ["méxico", "mexico"]],
    ["Chile", ["chile"]],
    ["Argentina", ["argentina"]],
    ["Italia", ["italia", "roma"]],
    ["Alemania", ["alemania", "frankfurt", "berlin", "berlín"]],
    ["Haití", ["haití", "haiti"]],
    ["Costa Rica", ["costa rica", "san josé", "san jose"]],
    ["Japón", ["japón", "japon", "tokio"]],
    ["Grecia", ["grecia", "atenas"]],
    ["Paraguay", ["paraguay", "asunción", "asuncion"]],
    ["Austria", ["austria", "vienna", "viena"]],
    ["Sudáfrica", ["sudáfrica", "sudafrica", "south africa", "pretoria"]],
    ["Aruba", ["aruba", "oranjestad"]],
    ["Brasil", ["brasil", "são paulo", "sao paulo"]],
    ["Perú", ["perú", "peru", "lima"]],
    ["Cuba", ["cuba", "habana"]],
    ["Bélgica", ["bélgica", "belgica", "amberes", "berchem"]],
    ["Israel", ["israel", "tel aviv"]],
    ["Trinidad y Tobago", ["trinidad", "tobago", "puerto españa"]],
    ["Hong Kong", ["hong kong"]],
    ["República Checa", ["república checa", "republica checa", "praga"]],
    ["Antigua y Barbuda", ["antigua", "barbuda"]],
    ["República Dominicana", ["santiago", "san isidro", "santo domingo", "república dominicana"]],
  ];

  const found = countries.find(([, aliases]) => aliases.some((alias) => source.includes(alias)));
  if (found) return found[0];
  if (type === "Local/Nacional") return "República Dominicana";

  const parts = destination.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) || destination.trim() || "No especificado";
}

function inferOffice(destination, recipient, country, type) {
  const source = `${destination} ${recipient}`;
  const officeMatch = source.match(/((Embajada|Consulado|Misión|Mision|Oficina)[^.,\n-]{8,90})/i);
  if (officeMatch) {
    const office = officeMatch[1].replace(/\s+/g, " ").trim();
    const noisy = office.includes("@") || office.includes(":") || office.length < 12;
    if (!noisy) return office;
  }
  if (type === "Local/Nacional") return `Oficina MIREX ${country === "República Dominicana" ? "Nacional" : country}`;
  if (source.toLowerCase().includes("cónsul") || source.toLowerCase().includes("consul")) {
    return `Consulado General en ${country}`;
  }
  return `Embajada Dominicana en ${country}`;
}

function statusForIndex(index, tracking) {
  const statuses = [
    "Nueva solicitud",
    "En revisión",
    "Pendiente de guía DHL",
    "Guía DHL generada",
    "Recogido por DHL",
    "En tránsito",
    "En aduana",
    "En ruta de entrega",
    "Entregado",
    "Incidencia",
  ];
  if (!tracking && index % 4 === 0) return "Pendiente de guía DHL";
  return statuses[index % statuses.length];
}

function monthName(monthKey) {
  const [, month] = monthKey.split("-");
  return [
    "",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ][Number(month)];
}

const [headers, ...lines] = parseCsv(source);
const records = lines.map((line) =>
  Object.fromEntries(headers.map((header, index) => [header, line[index] || ""])),
);

const orders = records.map((record, index) => {
  const type = normalizeType(record["Tipo de solicitud"], record.Destino);
  const createdAt = slugDate(record.Timestamp);
  const shipDate = slugDate(record["Fecha de Envío"] || record.Timestamp);
  const priority = normalizePriority(record.Prioridad);
  const country = inferCountry(record.Destino, record["Dirección de recogida"], type);
  const office = inferOffice(record.Destino, record["Información de Destinatario"], country, type);
  const securityCode = record["Código de seguridad"].trim() || `CSV-${String(index + 1).padStart(4, "0")}`;
  const hasTracking = securityCode && securityCode !== "-" && !securityCode.startsWith("CSV-") && index % 3 !== 0;
  const tracking = hasTracking ? `CSV-DHL-${securityCode.replace(/\s+/g, "")}` : "";
  const status = statusForIndex(index, tracking);
  const responsible = ["Operaciones MIREX", "Hilary Garcia", "Genesis de la Rosa", "Manuel Herrera"][index % 4];
  const packageCount = record["Cantidad de Paquetes"].trim() || "1 paquete";
  const weight = record["Peso del Paquete"].trim() || "Por definir";
  const content = record["Contenido del Paquete"].trim() || "Documentos oficiales";

  return {
    id: `MIREX-CSV-${String(index + 1).padStart(4, "0")}`,
    securityCode,
    type,
    country,
    office,
    consignor: record["Información de Consignatario"].trim() || "No especificado",
    recipient: record["Información de Destinatario"].trim() || "No especificado",
    createdAt,
    shipDate,
    priority,
    status,
    tracking,
    responsible,
    updatedAt: createdAt,
    destinationAddress: record.Destino.trim() || country,
    pickupAddress: record["Dirección de recogida"].trim() || "MIREX Santo Domingo",
    packages: packageCount,
    weight,
    content,
    evidenceUrl: record["Agregar imagen del paquete sellado"].trim() || "Pendiente de evidencia",
    comments: [
      {
        author: "Carga CSV",
        text: "Registro importado desde Formulario MIREX.csv para pruebas de filtros y reportes.",
        date: createdAt,
      },
    ],
    history: [
      {
        date: createdAt,
        status: "Solicitud creada",
        source: "Google Forms CSV",
        note: `Importada desde la fila ${index + 2} del formulario.`,
      },
      {
        date: createdAt,
        status: "Tarea generada en Asana",
        source: "Asana",
        note: "Evento simulado para pruebas de trazabilidad.",
      },
      {
        date: createdAt,
        status,
        source: responsible,
        note: "Estado de prueba asignado para validar filtros.",
      },
    ],
    trackingInfo: {
      currentStatus: tracking ? status : "Sin guía generada",
      lastLocation: country,
      eta: "Por definir",
      events: tracking
        ? [
            {
              date: createdAt,
              location: country,
              status: "Evento DHL simulado desde carga CSV",
            },
          ]
        : [],
    },
  };
});

const reportMap = new Map();
orders.forEach((order) => {
  const monthKey = order.createdAt.slice(0, 7);
  const key = `${monthKey}|${order.type}|${order.country}|${order.office}`;
  if (!reportMap.has(key)) {
    reportMap.set(key, {
      month: monthName(monthKey),
      monthKey,
      year: monthKey.slice(0, 4),
      type: order.type,
      country: order.country,
      office: order.office,
      requests: 0,
      delivered: 0,
      pending: 0,
      incidents: 0,
      urgent: 0,
      avgDeliveryDays: 0,
      dhlGenerated: 0,
      dhlPending: 0,
      compliance: 0,
      responsible: order.responsible,
      lastUpdate: order.updatedAt.slice(0, 10),
    });
  }

  const row = reportMap.get(key);
  row.requests += 1;
  row.delivered += order.status === "Entregado" ? 1 : 0;
  row.pending += !["Entregado", "Cancelado", "Incidencia"].includes(order.status) ? 1 : 0;
  row.incidents += order.status === "Incidencia" ? 1 : 0;
  row.urgent += order.priority === "Urgente" ? 1 : 0;
  row.dhlGenerated += order.tracking ? 1 : 0;
  row.dhlPending += order.tracking ? 0 : 1;
  row.lastUpdate = row.lastUpdate > order.updatedAt.slice(0, 10) ? row.lastUpdate : order.updatedAt.slice(0, 10);
});

const reportRows = Array.from(reportMap.values()).map((row, index) => ({
  ...row,
  avgDeliveryDays: Number((2.4 + (index % 7) * 0.45).toFixed(1)),
  compliance: row.requests ? Math.round((row.delivered / row.requests) * 100) : 0,
}));

const catalogs = {
  countries: Array.from(new Set(orders.map((order) => order.country))).filter(Boolean).sort(),
  offices: Array.from(new Set(orders.map((order) => order.office))).filter(Boolean).sort(),
  statuses: Array.from(new Set(orders.map((order) => order.status))).filter(Boolean).sort(),
};

const content = `// Generated from Datos/Formulario MIREX.csv for local demo testing.\n// Do not edit by hand; run npm run generate:csv-data after updating the CSV.\n\nexport const csvOrders = ${JSON.stringify(orders, null, 2)};\n\nexport const csvReportRows = ${JSON.stringify(reportRows, null, 2)};\n\nexport const csvCatalogs = ${JSON.stringify(catalogs, null, 2)};\n`;

writeFileSync(outputPath, content);
console.log(`Generated ${orders.length} orders and ${reportRows.length} report rows.`);
