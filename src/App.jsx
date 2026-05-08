import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Download,
  FileText,
  Filter,
  Globe2,
  History,
  LayoutDashboard,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  MapPin,
  PackageCheck,
  PackageSearch,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  initialOrders,
  priorityMeta,
  priorityOptions,
  reportRows as baseReportRows,
  responsibleOptions,
  statusMeta,
  statusOptions as defaultStatusOptions,
  typeOptions,
} from "./data/mockData";
import { csvCatalogs, csvOrders, csvReportRows } from "./data/csvData";

const appInitialOrders = [...csvOrders, ...initialOrders];
const appReportRows = [...csvReportRows, ...baseReportRows];

const typeColors = {
  Exportación: "#d71920",
  Importación: "#007a78",
  "Local/Nacional": "#3f5f8f",
};

const chartPalette = ["#d71920", "#007a78", "#f2b705", "#5b6c9f", "#6f8f54", "#a05d3f"];

const emptyFilters = {
  type: "Todos",
  status: "Todos",
  priority: "Todos",
  country: "Todos",
  responsible: "Todos",
  from: "",
  to: "",
  securityCode: "",
  tracking: "",
};

const emptyReportFilters = {
  from: "",
  to: "",
  month: "Todos",
  year: "Todos",
  type: "Todos",
  country: "Todos",
  office: "Todos",
  status: "Todos",
  priority: "Todos",
  responsible: "Todos",
  tracking: "",
  deliveredOnly: false,
  incidentsOnly: false,
};

const roleOptions = [
  "Personal MIREX",
  "Operaciones Importadex / Flypack",
  "Administrador",
];

const userStatusOptions = ["Activo", "Pendiente", "Suspendido"];

const storageKeys = {
  users: "mirex-tracking-users",
  session: "mirex-tracking-session",
  catalogs: "mirex-tracking-catalogs",
};

const defaultNewOrderForm = {
  type: "Exportación",
  shipDate: "",
  consignor: "",
  recipient: "",
  country: "",
  office: "",
  destinationAddress: "",
  pickupAddress:
    "Ministerio de Relaciones Exteriores, Av. Independencia #752, Estancia San Gerónimo, Santo Domingo, República Dominicana",
  priority: "Normal",
  packages: "1 paquete",
  weight: "",
  content: "",
  securityCode: "",
  evidenceUrl: "",
  tracking: "",
  responsible: "Operaciones MIREX",
  status: "Nueva solicitud",
  internalComment: "",
};

const destinationSuggestions = [
  "Guadalupe",
  "Estados Unidos",
  "España",
  "Francia",
  "Panamá",
  "Colombia",
  "México",
  "Chile",
  "Argentina",
  "Italia",
  "Alemania",
  "República Dominicana",
];

const officeSuggestions = [
  "Embajada Dominicana en España",
  "Consulado General en Nueva York",
  "Consulado General en Guadalupe",
  "Embajada Dominicana en Francia",
  "Embajada Dominicana en Panamá",
  "Consulado General en Miami",
  "Embajada Dominicana en Colombia",
  "Embajada Dominicana en México",
  "Oficina Regional MIREX Santiago",
];

const defaultUsers = [
  {
    id: "USR-001",
    name: "Administrador Demo",
    email: "admin@mirex.local",
    password: "Admin2026!",
    role: "Administrador",
    institution: "Importadex / Flypack",
    status: "Activo",
    createdAt: "2026-05-08T08:00:00",
  },
  {
    id: "USR-002",
    name: "Operaciones MIREX",
    email: "operacionesmirex@importadex.do",
    password: "Mirex2026!",
    role: "Operaciones Importadex / Flypack",
    institution: "Importadex / Flypack",
    status: "Activo",
    createdAt: "2026-05-08T08:05:00",
  },
  {
    id: "USR-003",
    name: "Usuario MIREX Demo",
    email: "mirex.demo@mirex.gob.do",
    password: "Mirex2026!",
    role: "Personal MIREX",
    institution: "MIREX",
    status: "Activo",
    createdAt: "2026-05-08T08:10:00",
  },
];

const defaultCatalogs = {
  countries: Array.from(new Set([...destinationSuggestions, ...csvCatalogs.countries])).sort(),
  offices: Array.from(new Set([...officeSuggestions, ...csvCatalogs.offices])).sort(),
  statuses: Array.from(new Set([...defaultStatusOptions, ...csvCatalogs.statuses])).sort(),
};

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Frontend prototype: localStorage may be unavailable in private contexts.
  }
}

function stripPassword(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function mergeCatalogs(catalogs) {
  return {
    countries: Array.from(new Set([...(catalogs?.countries || []), ...defaultCatalogs.countries])).sort(),
    offices: Array.from(new Set([...(catalogs?.offices || []), ...defaultCatalogs.offices])).sort(),
    statuses: Array.from(new Set([...(catalogs?.statuses || []), ...defaultCatalogs.statuses])).sort(),
  };
}

function getLocalDateTimeValue(date = new Date()) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function formatDate(value, options = {}) {
  if (!value || value === "Por definir" || value === "Pendiente de resolución") return value || "No disponible";
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: options.dateOnly ? "medium" : "medium",
    timeStyle: options.dateOnly ? undefined : "short",
  }).format(new Date(value));
}

function getUnique(items, key) {
  return ["Todos", ...Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort()];
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function average(items, key) {
  if (!items.length) return 0;
  return items.reduce((total, item) => total + Number(item[key] || 0), 0) / items.length;
}

function buildMonthlySeries(rows) {
  const monthOrder = Array.from(new Set(rows.map((row) => row.monthKey))).sort();
  return monthOrder
    .map((monthKey) => {
      const monthRows = rows.filter((row) => row.monthKey === monthKey);
      if (!monthRows.length) return null;
      return {
        month: monthRows[0].month.slice(0, 3),
        monthKey,
        total: sum(monthRows, "requests"),
        importaciones: sum(
          monthRows.filter((row) => row.type === "Importación"),
          "requests",
        ),
        exportaciones: sum(
          monthRows.filter((row) => row.type === "Exportación"),
          "requests",
        ),
        entregadas: sum(monthRows, "delivered"),
        pendientes: sum(monthRows, "pending"),
        urgentes: sum(monthRows, "urgent"),
        incidencias: sum(monthRows, "incidents"),
        guiasGeneradas: sum(monthRows, "dhlGenerated"),
        guiasPendientes: sum(monthRows, "dhlPending"),
      };
    })
    .filter(Boolean);
}

function reportRowMatchesStatus(row, status) {
  if (status === "Todos") return true;
  if (status === "Entregado") return row.delivered > 0;
  if (status === "Incidencia") return row.incidents > 0;
  if (status === "Pendiente de guía DHL") return row.dhlPending > 0;
  if (status === "Guía DHL generada") return row.dhlGenerated > 0;
  if (["Nueva solicitud", "En revisión", "Recogido por DHL", "En tránsito", "En aduana", "En ruta de entrega"].includes(status)) {
    return row.pending > 0;
  }
  return status !== "Cancelado";
}

function reportRowMatchesPriority(row, priority) {
  if (priority === "Todos") return true;
  if (priority === "Urgente") return row.urgent > 0;
  if (priority === "Alta") return row.requests - row.urgent > 3;
  return row.requests - row.urgent > 0;
}

function groupRows(rows, key, limit = 8) {
  const grouped = rows.reduce((acc, item) => {
    const label = item[key];
    if (!acc[label]) {
      acc[label] = {
        name: label,
        solicitudes: 0,
        entregadas: 0,
        pendientes: 0,
        incidencias: 0,
        promedio: [],
      };
    }
    acc[label].solicitudes += item.requests;
    acc[label].entregadas += item.delivered;
    acc[label].pendientes += item.pending;
    acc[label].incidencias += item.incidents;
    acc[label].promedio.push(item.avgDeliveryDays);
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      ...item,
      promedioEntrega:
        item.promedio.reduce((total, value) => total + value, 0) / item.promedio.length,
    }))
    .sort((a, b) => b.solicitudes - a.solicitudes)
    .slice(0, limit);
}

function Badge({ children, tone = "muted", className = "" }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

function IconStat({ icon: Icon, label, value, detail, tone = "neutral" }) {
  return (
    <section className={`stat-card stat-${tone}`}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    </section>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder = "", required = false, type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="check-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function App() {
  const [users, setUsers] = useState(() => readStorage(storageKeys.users, defaultUsers));
  const [authUser, setAuthUser] = useState(() => readStorage(storageKeys.session, null));
  const [catalogs, setCatalogs] = useState(() =>
    mergeCatalogs(readStorage(storageKeys.catalogs, defaultCatalogs)),
  );
  const [orders, setOrders] = useState(appInitialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState(appInitialOrders[0].id);
  const [activeView, setActiveView] = useState("orders");
  const [filters, setFilters] = useState(emptyFilters);
  const [reportFilters, setReportFilters] = useState(emptyReportFilters);
  const [query, setQuery] = useState("");
  const [newComment, setNewComment] = useState("");
  const [trackingDraft, setTrackingDraft] = useState(appInitialOrders[0].tracking);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState(() => ({
    ...defaultNewOrderForm,
    shipDate: getLocalDateTimeValue(),
  }));
  const [authMode, setAuthMode] = useState("login");
  const [authMessage, setAuthMessage] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "admin@mirex.local",
    password: "Admin2026!",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    institution: "MIREX",
  });
  const [newCatalogItems, setNewCatalogItems] = useState({
    countries: "",
    offices: "",
    statuses: "",
  });

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];
  const role = authUser?.role || "Personal MIREX";
  const statusOptions = catalogs.statuses;
  const countryCatalog = catalogs.countries;
  const officeCatalog = catalogs.offices;
  const userCanMaintain = role === "Administrador";

  const countries = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set([...countryCatalog, ...orders.map((order) => order.country)])).filter(Boolean).sort(),
    ],
    [countryCatalog, orders],
  );
  const offices = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set([...officeCatalog, ...appReportRows.map((row) => row.office)])).filter(Boolean).sort(),
    ],
    [officeCatalog],
  );
  const reportCountries = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set([...countryCatalog, ...appReportRows.map((row) => row.country)])).filter(Boolean).sort(),
    ],
    [countryCatalog],
  );
  const reportYears = useMemo(() => getUnique(appReportRows, "year"), []);
  const reportMonths = useMemo(
    () => ["Todos", ...Array.from(new Set(appReportRows.map((row) => row.monthKey))).sort()],
    [],
  );

  useEffect(() => {
    writeStorage(storageKeys.users, users);
  }, [users]);

  useEffect(() => {
    writeStorage(storageKeys.catalogs, catalogs);
  }, [catalogs]);

  useEffect(() => {
    if (authUser) {
      writeStorage(storageKeys.session, authUser);
    } else {
      try {
        window.localStorage.removeItem(storageKeys.session);
      } catch {
        // Frontend prototype: localStorage may be unavailable in private contexts.
      }
    }
  }, [authUser]);

  useEffect(() => {
    if (activeView === "maintenance" && !userCanMaintain) {
      setActiveView("orders");
    }
  }, [activeView, userCanMaintain]);

  const metrics = useMemo(() => {
    const open = orders.filter(
      (order) => !["Entregado", "Cancelado"].includes(order.status),
    );
    const urgent = orders.filter((order) => order.priority === "Urgente");
    const delivered = orders.filter((order) => order.status === "Entregado");
    const incidents = orders.filter((order) => order.status === "Incidencia");
    const inTransit = orders.filter((order) =>
      ["Recogido por DHL", "En tránsito", "En aduana", "En ruta de entrega"].includes(order.status),
    );
    return {
      open: open.length,
      urgent: urgent.length,
      pendingDhl: orders.filter((order) => order.status === "Pendiente de guía DHL").length,
      inTransit: inTransit.length,
      delivered: delivered.length,
      incidents: incidents.length,
      avgDelivery: "3.7 días",
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const created = order.createdAt.slice(0, 10);
      const searchable = [
        order.id,
        order.securityCode,
        order.type,
        order.country,
        order.office,
        order.consignor,
        order.recipient,
        order.status,
        order.tracking,
        order.responsible,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (filters.type === "Todos" || order.type === filters.type) &&
        (filters.status === "Todos" || order.status === filters.status) &&
        (filters.priority === "Todos" || order.priority === filters.priority) &&
        (filters.country === "Todos" || order.country === filters.country) &&
        (filters.responsible === "Todos" || order.responsible === filters.responsible) &&
        (!filters.from || created >= filters.from) &&
        (!filters.to || created <= filters.to) &&
        (!filters.securityCode ||
          order.securityCode.toLowerCase().includes(filters.securityCode.toLowerCase())) &&
        (!filters.tracking ||
          order.tracking.toLowerCase().includes(filters.tracking.toLowerCase()))
      );
    });
  }, [filters, orders, query]);

  const filteredReports = useMemo(() => {
    return appReportRows.filter((row) => {
      return (
        (reportFilters.year === "Todos" || row.year === reportFilters.year) &&
        (reportFilters.month === "Todos" || row.monthKey === reportFilters.month) &&
        (reportFilters.type === "Todos" || row.type === reportFilters.type) &&
        (reportFilters.country === "Todos" || row.country === reportFilters.country) &&
        (reportFilters.office === "Todos" || row.office === reportFilters.office) &&
        reportRowMatchesStatus(row, reportFilters.status) &&
        reportRowMatchesPriority(row, reportFilters.priority) &&
        (reportFilters.responsible === "Todos" || row.responsible === reportFilters.responsible) &&
        (!reportFilters.from || row.lastUpdate >= reportFilters.from) &&
        (!reportFilters.to || row.lastUpdate <= reportFilters.to) &&
        (!reportFilters.deliveredOnly || row.delivered > 0) &&
        (!reportFilters.incidentsOnly || row.incidents > 0) &&
        (!reportFilters.tracking || String(row.dhlGenerated).includes(reportFilters.tracking))
      );
    });
  }, [reportFilters]);

  const monthlySeries = useMemo(() => buildMonthlySeries(filteredReports), [filteredReports]);
  const countryVolume = useMemo(() => groupRows(filteredReports, "country", 8), [filteredReports]);
  const officeVolume = useMemo(() => groupRows(filteredReports, "office", 8), [filteredReports]);
  const typeDistribution = useMemo(
    () =>
      typeOptions
        .map((type) => ({
          name: type,
          value: sum(
            filteredReports.filter((row) => row.type === type),
            "requests",
          ),
        }))
        .filter((item) => item.value > 0),
    [filteredReports],
  );
  const deliveryByType = useMemo(
    () =>
      ["Importación", "Exportación"]
        .map((type) => {
          const rows = filteredReports.filter((row) => row.type === type);
          return {
            name: type,
            promedio: Number(average(rows, "avgDeliveryDays").toFixed(1)),
          };
        })
        .filter((item) => item.promedio > 0),
    [filteredReports],
  );
  const statusDistribution = useMemo(
    () => [
      { name: "Entregadas", value: sum(filteredReports, "delivered"), color: "#27845b" },
      { name: "Pendientes", value: sum(filteredReports, "pending"), color: "#f2b705" },
      { name: "Incidencias", value: sum(filteredReports, "incidents"), color: "#d71920" },
    ],
    [filteredReports],
  );

  const reportKpis = useMemo(() => {
    const topCountry = groupRows(filteredReports, "country", 1)[0];
    const topOffice = groupRows(filteredReports, "office", 1)[0];
    const total = sum(filteredReports, "requests");
    const delivered = sum(filteredReports, "delivered");
    const pending = sum(filteredReports, "pending");
    const incidents = sum(filteredReports, "incidents");
    return {
      total,
      imports: sum(
        filteredReports.filter((row) => row.type === "Importación"),
        "requests",
      ),
      exports: sum(
        filteredReports.filter((row) => row.type === "Exportación"),
        "requests",
      ),
      topCountry: topCountry?.name || "Sin datos",
      topOffice: topOffice?.name || "Sin datos",
      delivered,
      pending,
      incidents,
      avg: `${average(filteredReports, "avgDeliveryDays").toFixed(1)} días`,
      compliance: total ? `${Math.round((delivered / total) * 100)}%` : "0%",
    };
  }, [filteredReports]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateReportFilter(key, value) {
    setReportFilters((current) => ({ ...current, [key]: value }));
  }

  function selectOrder(order) {
    setSelectedOrderId(order.id);
    setTrackingDraft(order.tracking);
    setLookupMessage("");
  }

  function updateOrderStatus(orderId, status) {
    const now = new Date().toISOString();
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              updatedAt: now,
              history: [
                ...order.history,
                {
                  date: now,
                  status,
                  source: "Usuario prototipo",
                  note: "Estado actualizado manualmente desde el dashboard.",
                },
              ],
            }
          : order,
      ),
    );
  }

  function saveTracking() {
    const now = new Date().toISOString();
    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              tracking: trackingDraft,
              updatedAt: now,
              status: trackingDraft && order.status === "Pendiente de guía DHL"
                ? "Guía DHL generada"
                : order.status,
              trackingInfo: {
                ...order.trackingInfo,
                currentStatus: trackingDraft
                  ? order.trackingInfo.currentStatus === "Sin guía generada"
                    ? "Guía DHL generada"
                    : order.trackingInfo.currentStatus
                  : "Sin guía generada",
              },
              history: [
                ...order.history,
                {
                  date: now,
                  status: "Tracking DHL actualizado",
                  source: "Operaciones MIREX",
                  note: trackingDraft || "Tracking eliminado",
                },
              ],
            }
          : order,
      ),
    );
  }

  function addComment() {
    if (!newComment.trim()) return;
    const now = new Date().toISOString();
    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              updatedAt: now,
              comments: [
                ...order.comments,
                {
                  author: role,
                  text: newComment.trim(),
                  date: now,
                },
              ],
              history: [
                ...order.history,
                {
                  date: now,
                  status: "Comentario interno agregado",
                  source: role,
                  note: newComment.trim(),
                },
              ],
            }
          : order,
      ),
    );
    setNewComment("");
  }

  function simulateDhlLookup() {
    // Integracion futura DHL API: reemplazar esta simulacion por consulta al endpoint de tracking DHL.
    const now = new Date().toISOString();
    const knownTracking = trackingDraft || selectedOrder.tracking;
    if (!knownTracking) {
      setLookupMessage("Agrega un número de guía para consultar el estado.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              tracking: knownTracking,
              updatedAt: now,
              trackingInfo: {
                currentStatus:
                  order.status === "Entregado" ? "Entregado" : "Actualizado desde DHL simulado",
                lastLocation:
                  order.status === "Entregado" ? order.country : "Centro DHL regional",
                eta:
                  order.status === "Entregado"
                    ? order.trackingInfo.eta
                    : "2026-05-10",
                events: [
                  {
                    date: now,
                    location:
                      order.status === "Entregado" ? order.country : "Centro DHL regional",
                    status: "Consulta manual ejecutada desde el prototipo",
                  },
                  ...order.trackingInfo.events,
                ],
              },
            }
          : order,
      ),
    );
    setLookupMessage(`Consulta simulada completada para ${knownTracking}.`);
  }

  function handleLogin(event) {
    event.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const user = users.find((item) => item.email.toLowerCase() === email);

    if (!user || user.password !== loginForm.password) {
      setAuthMessage("Correo o contraseña incorrectos.");
      return;
    }

    if (user.status !== "Activo") {
      setAuthMessage(`Tu usuario está ${user.status.toLowerCase()}. Contacta al administrador.`);
      return;
    }

    setAuthUser(stripPassword(user));
    setAuthMessage("");
    setActiveView("orders");
  }

  function handleRegister(event) {
    event.preventDefault();
    const email = registerForm.email.trim().toLowerCase();

    if (users.some((user) => user.email.toLowerCase() === email)) {
      setAuthMessage("Ya existe un usuario registrado con ese correo.");
      return;
    }

    const now = new Date().toISOString();
    const user = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      name: registerForm.name.trim(),
      email,
      password: registerForm.password,
      role: "Personal MIREX",
      institution: registerForm.institution.trim() || "MIREX",
      status: "Activo",
      createdAt: now,
    };

    setUsers((current) => [...current, user]);
    setAuthUser(stripPassword(user));
    setAuthMessage("");
    setActiveView("orders");
  }

  function logout() {
    setAuthUser(null);
    setAuthMode("login");
    setAuthMessage("");
  }

  function updateUser(userId, key, value) {
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, [key]: value } : user)),
    );
    if (authUser?.id === userId) {
      setAuthUser((current) => (current ? { ...current, [key]: value } : current));
    }
  }

  function removeUser(userId) {
    setUsers((current) => current.filter((user) => user.id !== userId));
  }

  function addCatalogItem(kind) {
    const value = newCatalogItems[kind].trim();
    if (!value) return;

    setCatalogs((current) => {
      if (current[kind].some((item) => item.toLowerCase() === value.toLowerCase())) {
        return current;
      }
      return {
        ...current,
        [kind]: [...current[kind], value].sort(),
      };
    });
    setNewCatalogItems((current) => ({ ...current, [kind]: "" }));
  }

  function removeCatalogItem(kind, value) {
    setCatalogs((current) => ({
      ...current,
      [kind]: current[kind].filter((item) => item !== value),
    }));
  }

  function updateCatalogDraft(kind, value) {
    setNewCatalogItems((current) => ({ ...current, [kind]: value }));
  }

  function openNewOrderModal() {
    setNewOrderForm({
      ...defaultNewOrderForm,
      shipDate: getLocalDateTimeValue(),
    });
    setIsNewOrderOpen(true);
  }

  function updateNewOrderForm(key, value) {
    setNewOrderForm((current) => ({ ...current, [key]: value }));
  }

  function createOrder(event) {
    event.preventDefault();
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const nextNumber =
      Math.max(
        0,
        ...orders.map((order) => Number(order.id.match(/(\d+)$/)?.[1] || 0)),
      ) + 1;
    const id = `MIREX-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
    const status = newOrderForm.tracking && newOrderForm.status === "Nueva solicitud"
      ? "Guía DHL generada"
      : newOrderForm.status;
    const shipDate = newOrderForm.shipDate
      ? new Date(newOrderForm.shipDate).toISOString()
      : now;

    const createdOrder = {
      id,
      securityCode: newOrderForm.securityCode.trim() || "Pendiente",
      type: newOrderForm.type,
      country: newOrderForm.country.trim(),
      office: newOrderForm.office.trim(),
      consignor: newOrderForm.consignor.trim(),
      recipient: newOrderForm.recipient.trim(),
      createdAt: now,
      shipDate,
      priority: newOrderForm.priority,
      status,
      tracking: newOrderForm.tracking.trim(),
      responsible: newOrderForm.responsible,
      updatedAt: now,
      destinationAddress: newOrderForm.destinationAddress.trim(),
      pickupAddress: newOrderForm.pickupAddress.trim(),
      packages: newOrderForm.packages.trim(),
      weight: newOrderForm.weight.trim() || "Por definir",
      content: newOrderForm.content.trim(),
      evidenceUrl: newOrderForm.evidenceUrl.trim() || "Pendiente de evidencia",
      comments: newOrderForm.internalComment.trim()
        ? [
            {
              author: role,
              text: newOrderForm.internalComment.trim(),
              date: now,
            },
          ]
        : [],
      history: [
        {
          date: now,
          status: "Solicitud creada",
          source: "Captura manual",
          note: "Orden creada desde el prototipo centralizado.",
        },
        {
          date: now,
          status: "Tarea generada en Asana",
          source: "Asana API preparada",
          note: "En producción se crearía o sincronizaría la tarea operativa.",
        },
        {
          date: now,
          status,
          source: role,
          note: "Estado inicial registrado desde Nueva orden.",
        },
      ],
      trackingInfo: {
        currentStatus: newOrderForm.tracking.trim()
          ? "Guía DHL generada"
          : status === "Pendiente de guía DHL"
            ? "Sin guía generada"
            : status,
        lastLocation: newOrderForm.pickupAddress.trim() || "MIREX Santo Domingo",
        eta: "Por definir",
        events: newOrderForm.tracking.trim()
          ? [
              {
                date: now,
                location: "Santo Domingo",
                status: "Información del envío recibida",
              },
            ]
          : [],
      },
    };

    setOrders((current) => [createdOrder, ...current]);
    setSelectedOrderId(id);
    setTrackingDraft(createdOrder.tracking);
    setLookupMessage("");
    setQuery("");
    setFilters(emptyFilters);
    setActiveView("orders");
    setIsNewOrderOpen(false);
  }

  if (!authUser) {
    return (
      <AuthScreen
        authMessage={authMessage}
        loginForm={loginForm}
        mode={authMode}
        registerForm={registerForm}
        onLogin={handleLogin}
        onLoginChange={(key, value) =>
          setLoginForm((current) => ({ ...current, [key]: value }))
        }
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthMessage("");
        }}
        onRegister={handleRegister}
        onRegisterChange={(key, value) =>
          setRegisterForm((current) => ({ ...current, [key]: value }))
        }
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">MI</div>
          <div>
            <strong>MIREX Tracking</strong>
            <span>Importadex / Flypack</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Navegación principal">
          <button
            className={activeView === "orders" ? "active" : ""}
            onClick={() => setActiveView("orders")}
          >
            <LayoutDashboard size={18} />
            Órdenes
          </button>
          <button
            className={activeView === "reports" ? "active" : ""}
            onClick={() => setActiveView("reports")}
          >
            <BarChart3 size={18} />
            Reportes
          </button>
          {userCanMaintain ? (
            <button
              className={activeView === "maintenance" ? "active" : ""}
              onClick={() => setActiveView("maintenance")}
            >
              <Settings size={18} />
              Mantenimiento
            </button>
          ) : null}
        </nav>

        <div className="role-panel">
          <span>Sesión activa</span>
          <strong>{authUser.name}</strong>
          <Badge tone={role === "Administrador" ? "indigo" : role === "Operaciones Importadex / Flypack" ? "teal" : "blue"}>
            {role}
          </Badge>
          <p>
            Acceso controlado por usuario para consultar, comentar, actualizar estados y mantener catálogos.
          </p>
          <button className="ghost-button full" onClick={logout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Sistema centralizado de trazabilidad</span>
            <h1>Seguimiento operativo MIREX</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" title="Subir evidencia">
              <Upload size={18} />
            </button>
            <button className="primary-action" onClick={openNewOrderModal}>
              <FileText size={18} />
              Nueva orden
            </button>
          </div>
        </header>

        {activeView === "orders" ? (
          <OrdersView
            countries={countries}
            filters={filters}
            filteredOrders={filteredOrders}
            metrics={metrics}
            orders={orders}
            query={query}
            selectedOrder={selectedOrder}
            trackingDraft={trackingDraft}
            lookupMessage={lookupMessage}
            newComment={newComment}
            onAddComment={addComment}
            onQueryChange={setQuery}
            onResetFilters={() => setFilters(emptyFilters)}
            onSaveTracking={saveTracking}
            onSelectOrder={selectOrder}
            onSetNewComment={setNewComment}
            onSetTrackingDraft={setTrackingDraft}
            onSimulateLookup={simulateDhlLookup}
            onUpdateFilter={updateFilter}
            onUpdateStatus={updateOrderStatus}
            statusOptions={statusOptions}
          />
        ) : activeView === "reports" ? (
          <ReportsView
            countryVolume={countryVolume}
            filteredReports={filteredReports}
            monthlySeries={monthlySeries}
            officeVolume={officeVolume}
            offices={offices}
            reportCountries={reportCountries}
            reportFilters={reportFilters}
            reportKpis={reportKpis}
            reportMonths={reportMonths}
            reportYears={reportYears}
            statusDistribution={statusDistribution}
            deliveryByType={deliveryByType}
            typeDistribution={typeDistribution}
            onReset={() => setReportFilters(emptyReportFilters)}
            onUpdateFilter={updateReportFilter}
            statusOptions={statusOptions}
          />
        ) : (
          <MaintenanceView
            catalogs={catalogs}
            currentUser={authUser}
            newCatalogItems={newCatalogItems}
            users={users}
            onAddCatalogItem={addCatalogItem}
            onCatalogDraftChange={updateCatalogDraft}
            onRemoveCatalogItem={removeCatalogItem}
            onRemoveUser={removeUser}
            onUpdateUser={updateUser}
          />
        )}
      </main>

      {isNewOrderOpen ? (
        <NewOrderModal
          form={newOrderForm}
          officeOptions={officeCatalog}
          statusOptions={statusOptions}
          countryOptions={countryCatalog}
          onChange={updateNewOrderForm}
          onClose={() => setIsNewOrderOpen(false)}
          onSubmit={createOrder}
        />
      ) : null}
    </div>
  );
}

function AuthScreen({
  authMessage,
  loginForm,
  mode,
  registerForm,
  onLogin,
  onLoginChange,
  onModeChange,
  onRegister,
  onRegisterChange,
}) {
  const demoAccounts = [
    {
      label: "Administrador",
      email: "admin@mirex.local",
      password: "Admin2026!",
    },
    {
      label: "Operaciones",
      email: "operacionesmirex@importadex.do",
      password: "Mirex2026!",
    },
    {
      label: "MIREX",
      email: "mirex.demo@mirex.gob.do",
      password: "Mirex2026!",
    },
  ];

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand-lockup">
          <div className="brand-mark">MI</div>
          <div>
            <strong>MIREX Tracking</strong>
            <span>Importadex / Flypack</span>
          </div>
        </div>
        <div>
          <span className="eyebrow">Acceso seguro de prototipo</span>
          <h1>Centro de trazabilidad para solicitudes oficiales</h1>
          <p>
            Inicia sesión para consultar órdenes, actualizar estados, revisar reportes y mantener usuarios o catálogos maestros.
          </p>
        </div>
        <div className="auth-feature-grid">
          <div>
            <LockKeyhole size={20} />
            <strong>Sesión controlada</strong>
            <span>Usuarios con rol operativo o administrativo.</span>
          </div>
          <div>
            <Users size={20} />
            <strong>Registro interno</strong>
            <span>Nuevos usuarios quedan disponibles para gestión.</span>
          </div>
          <div>
            <Database size={20} />
            <strong>Mantenimientos</strong>
            <span>Países, estados y oficinas editables.</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => onModeChange("login")}>
            <LockKeyhole size={16} />
            Iniciar sesión
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => onModeChange("register")}>
            <UserPlus size={16} />
            Registro
          </button>
        </div>

        {mode === "login" ? (
          <form className="auth-form" onSubmit={onLogin}>
            <h2>Inicio de sesión</h2>
            <TextField
              label="Correo"
              type="email"
              value={loginForm.email}
              required
              placeholder="usuario@mirex.gob.do"
              onChange={(value) => onLoginChange("email", value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              value={loginForm.password}
              required
              placeholder="Contraseña"
              onChange={(value) => onLoginChange("password", value)}
            />
            {authMessage ? <p className="auth-message">{authMessage}</p> : null}
            <button className="primary-action full" type="submit">
              <LockKeyhole size={18} />
              Entrar
            </button>
            <div className="demo-accounts">
              <span>Accesos demo</span>
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    onLoginChange("email", account.email);
                    onLoginChange("password", account.password);
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={onRegister}>
            <h2>Registro de usuario</h2>
            <TextField
              label="Nombre completo"
              value={registerForm.name}
              required
              placeholder="Nombre y apellido"
              onChange={(value) => onRegisterChange("name", value)}
            />
            <TextField
              label="Correo institucional"
              type="email"
              value={registerForm.email}
              required
              placeholder="usuario@mirex.gob.do"
              onChange={(value) => onRegisterChange("email", value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              value={registerForm.password}
              required
              placeholder="Mínimo 8 caracteres"
              onChange={(value) => onRegisterChange("password", value)}
            />
            <TextField
              label="Institución / área"
              value={registerForm.institution}
              required
              placeholder="MIREX, Importadex, Flypack..."
              onChange={(value) => onRegisterChange("institution", value)}
            />
            {authMessage ? <p className="auth-message">{authMessage}</p> : null}
            <button className="primary-action full" type="submit">
              <UserPlus size={18} />
              Crear usuario
            </button>
            <p className="auth-note">
              El rol inicial es Personal MIREX. Un administrador puede cambiarlo en Mantenimiento.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}

function MaintenanceView({
  catalogs,
  currentUser,
  newCatalogItems,
  users,
  onAddCatalogItem,
  onCatalogDraftChange,
  onRemoveCatalogItem,
  onRemoveUser,
  onUpdateUser,
}) {
  return (
    <section className="maintenance-view">
      <div className="report-hero">
        <div>
          <span className="eyebrow">Módulo administrativo</span>
          <h2>Mantenimiento del sistema</h2>
          <p>
            Gestiona usuarios registrados, roles, estados de acceso y catálogos usados por órdenes y reportes.
          </p>
        </div>
        <Badge tone="indigo">Solo administrador</Badge>
      </div>

      <section className="maintenance-grid">
        <IconStat icon={Users} label="Usuarios registrados" value={users.length} tone="neutral" />
        <IconStat icon={ShieldCheck} label="Usuarios activos" value={users.filter((user) => user.status === "Activo").length} tone="success" />
        <IconStat icon={Globe2} label="Países destino" value={catalogs.countries.length} tone="teal" />
        <IconStat icon={Database} label="Estados operativos" value={catalogs.statuses.length} tone="gold" />
      </section>

      <section className="maintenance-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Seguridad y roles</span>
            <h2>Usuarios registrados</h2>
          </div>
        </div>
        <div className="table-shell">
          <table className="orders-table users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Institución</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <span className="muted-cell">{user.id}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.institution}</td>
                  <td>
                    <select
                      className="status-select"
                      value={user.role}
                      onChange={(event) => onUpdateUser(user.id, "role", event.target.value)}
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={user.status}
                      onChange={(event) => onUpdateUser(user.id, "status", event.target.value)}
                      disabled={user.id === currentUser.id}
                    >
                      {userStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button
                      className="ghost-button"
                      disabled={user.id === currentUser.id}
                      onClick={() => onRemoveUser(user.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="catalog-grid">
        <CatalogManager
          icon={Globe2}
          items={catalogs.countries}
          label="País destino"
          pluralLabel="Países destino"
          value={newCatalogItems.countries}
          onAdd={() => onAddCatalogItem("countries")}
          onChange={(value) => onCatalogDraftChange("countries", value)}
          onRemove={(value) => onRemoveCatalogItem("countries", value)}
        />
        <CatalogManager
          icon={ShieldCheck}
          items={catalogs.statuses}
          label="Estado operativo"
          pluralLabel="Estados"
          value={newCatalogItems.statuses}
          onAdd={() => onAddCatalogItem("statuses")}
          onChange={(value) => onCatalogDraftChange("statuses", value)}
          onRemove={(value) => onRemoveCatalogItem("statuses", value)}
        />
        <CatalogManager
          icon={MapPin}
          items={catalogs.offices}
          label="Embajada / Consulado"
          pluralLabel="Embajadas y consulados"
          value={newCatalogItems.offices}
          onAdd={() => onAddCatalogItem("offices")}
          onChange={(value) => onCatalogDraftChange("offices", value)}
          onRemove={(value) => onRemoveCatalogItem("offices", value)}
        />
      </section>
    </section>
  );
}

function CatalogManager({ icon: Icon, items, label, pluralLabel, value, onAdd, onChange, onRemove }) {
  return (
    <article className="catalog-panel">
      <div className="catalog-heading">
        <div>
          <Icon size={18} />
          <h3>{pluralLabel}</h3>
        </div>
        <Badge tone="blue-soft">{items.length}</Badge>
      </div>
      <div className="catalog-add">
        <TextField
          label={`Agregar ${label}`}
          value={value}
          placeholder={label}
          onChange={onChange}
        />
        <button className="secondary-action" onClick={onAdd}>
          <Plus size={16} />
          Agregar
        </button>
      </div>
      <div className="catalog-list">
        {items.map((item) => (
          <span key={item} className="catalog-chip">
            {item}
            <button type="button" onClick={() => onRemove(item)} aria-label={`Eliminar ${item}`}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
    </article>
  );
}

function NewOrderModal({
  countryOptions,
  form,
  officeOptions,
  statusOptions,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="modal-backdrop">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="new-order-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Captura operativa</span>
            <h2 id="new-order-title">Nueva orden MIREX</h2>
            <p>
              Registra la solicitud y deja lista la trazabilidad inicial para operaciones.
            </p>
          </div>
          <button className="icon-button" type="button" title="Cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={onSubmit}>
          <datalist id="destination-suggestions">
            {countryOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <datalist id="office-suggestions">
            {officeOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          <div className="form-section">
            <h3>Solicitud</h3>
            <div className="form-grid">
              <SelectField
                label="Tipo de solicitud"
                value={form.type}
                options={typeOptions}
                onChange={(value) => onChange("type", value)}
              />
              <TextField
                label="Fecha de envío"
                type="datetime-local"
                value={form.shipDate}
                required
                onChange={(value) => onChange("shipDate", value)}
              />
              <SelectField
                label="Prioridad"
                value={form.priority}
                options={priorityOptions}
                onChange={(value) => onChange("priority", value)}
              />
              <SelectField
                label="Estado inicial"
                value={form.status}
                options={statusOptions}
                onChange={(value) => onChange("status", value)}
              />
              <SelectField
                label="Responsable"
                value={form.responsible}
                options={responsibleOptions}
                onChange={(value) => onChange("responsible", value)}
              />
              <TextField
                label="Código de seguridad"
                value={form.securityCode}
                placeholder="240794"
                onChange={(value) => onChange("securityCode", value)}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Partes y destino</h3>
            <div className="form-grid two-columns">
              <TextField
                label="Consignatario"
                value={form.consignor}
                required
                placeholder="Nombre, cargo y dependencia"
                onChange={(value) => onChange("consignor", value)}
              />
              <TextField
                label="Destinatario"
                value={form.recipient}
                required
                placeholder="Nombre, cargo y oficina"
                onChange={(value) => onChange("recipient", value)}
              />
              <label className="field">
                <span>País / destino</span>
                <input
                  required
                  list="destination-suggestions"
                  value={form.country}
                  placeholder="Guadalupe"
                  onChange={(event) => onChange("country", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Embajada / consulado / oficina</span>
                <input
                  required
                  list="office-suggestions"
                  value={form.office}
                  placeholder="Consulado General en Guadalupe"
                  onChange={(event) => onChange("office", event.target.value)}
                />
              </label>
              <label className="field span-2">
                <span>Dirección completa de destino</span>
                <textarea
                  required
                  value={form.destinationAddress}
                  placeholder="Dirección física, ciudad, código postal y país"
                  onChange={(event) => onChange("destinationAddress", event.target.value)}
                />
              </label>
              <label className="field span-2">
                <span>Dirección de recogida</span>
                <textarea
                  required
                  value={form.pickupAddress}
                  onChange={(event) => onChange("pickupAddress", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Paquete y evidencia</h3>
            <div className="form-grid">
              <TextField
                label="Cantidad de paquetes"
                value={form.packages}
                required
                placeholder="1 paquete"
                onChange={(value) => onChange("packages", value)}
              />
              <TextField
                label="Peso aproximado"
                value={form.weight}
                placeholder="0.60 libras"
                onChange={(value) => onChange("weight", value)}
              />
              <TextField
                label="Tracking DHL"
                value={form.tracking}
                placeholder="JD014600..."
                onChange={(value) => onChange("tracking", value)}
              />
              <TextField
                label="Evidencia / Google Drive"
                value={form.evidenceUrl}
                placeholder="https://drive.google.com/..."
                onChange={(value) => onChange("evidenceUrl", value)}
              />
              <label className="field span-2">
                <span>Contenido declarado</span>
                <textarea
                  required
                  value={form.content}
                  placeholder="Documentos oficiales, libretas de pasaporte, expedientes..."
                  onChange={(event) => onChange("content", event.target.value)}
                />
              </label>
              <label className="field span-2">
                <span>Comentario interno inicial</span>
                <textarea
                  value={form.internalComment}
                  placeholder="Validaciones, observaciones de recogida o instrucciones especiales"
                  onChange={(event) => onChange("internalComment", event.target.value)}
                />
              </label>
            </div>
          </div>

          <footer className="modal-footer">
            <button className="ghost-button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-action" type="submit">
              <FileText size={18} />
              Crear orden
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function OrdersView({
  countries,
  filters,
  filteredOrders,
  metrics,
  query,
  selectedOrder,
  statusOptions,
  trackingDraft,
  lookupMessage,
  newComment,
  onAddComment,
  onQueryChange,
  onResetFilters,
  onSaveTracking,
  onSelectOrder,
  onSetNewComment,
  onSetTrackingDraft,
  onSimulateLookup,
  onUpdateFilter,
  onUpdateStatus,
}) {
  return (
    <>
      <section className="stats-grid">
        <IconStat icon={PackageSearch} label="Solicitudes abiertas" value={metrics.open} tone="neutral" />
        <IconStat icon={AlertTriangle} label="Urgentes" value={metrics.urgent} tone="warning" />
        <IconStat icon={FileText} label="Pendientes guía DHL" value={metrics.pendingDhl} tone="gold" />
        <IconStat icon={Plane} label="En tránsito" value={metrics.inTransit} tone="teal" />
        <IconStat icon={PackageCheck} label="Entregadas" value={metrics.delivered} tone="success" />
        <IconStat icon={AlertTriangle} label="Incidencias" value={metrics.incidents} tone="danger" />
        <IconStat icon={Clock3} label="Tiempo promedio" value={metrics.avgDelivery} detail="últimos 30 días" tone="neutral" />
      </section>

      <section className="work-area">
        <div className="orders-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Operación diaria</span>
              <h2>Panel principal de órdenes</h2>
            </div>
            <button className="ghost-button" onClick={onResetFilters}>
              <Filter size={16} />
              Limpiar filtros
            </button>
          </div>

          <div className="search-row">
            <label className="search-field">
              <Search size={18} />
              <input
                value={query}
                placeholder="Buscar por orden, seguridad, destino, tracking, responsable..."
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </label>
          </div>

          <div className="filters-grid">
            <SelectField
              label="Tipo"
              value={filters.type}
              options={["Todos", ...typeOptions]}
              onChange={(value) => onUpdateFilter("type", value)}
            />
            <SelectField
              label="Estado"
              value={filters.status}
              options={["Todos", ...statusOptions]}
              onChange={(value) => onUpdateFilter("status", value)}
            />
            <SelectField
              label="Prioridad"
              value={filters.priority}
              options={["Todos", ...priorityOptions]}
              onChange={(value) => onUpdateFilter("priority", value)}
            />
            <SelectField
              label="País destino"
              value={filters.country}
              options={countries}
              onChange={(value) => onUpdateFilter("country", value)}
            />
            <SelectField
              label="Responsable"
              value={filters.responsible}
              options={["Todos", ...responsibleOptions]}
              onChange={(value) => onUpdateFilter("responsible", value)}
            />
            <TextField
              label="Desde"
              type="date"
              value={filters.from}
              onChange={(value) => onUpdateFilter("from", value)}
            />
            <TextField
              label="Hasta"
              type="date"
              value={filters.to}
              onChange={(value) => onUpdateFilter("to", value)}
            />
            <TextField
              label="Código seguridad"
              value={filters.securityCode}
              placeholder="240794"
              onChange={(value) => onUpdateFilter("securityCode", value)}
            />
            <TextField
              label="Tracking DHL"
              value={filters.tracking}
              placeholder="JD0146..."
              onChange={(value) => onUpdateFilter("tracking", value)}
            />
          </div>

          <div className="table-shell">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Número de orden</th>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>País / destino</th>
                  <th>Consignatario</th>
                  <th>Destinatario</th>
                  <th>Creación</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Tracking DHL</th>
                  <th>Responsable</th>
                  <th>Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={selectedOrder.id === order.id ? "selected-row" : ""}
                    onClick={() => onSelectOrder(order)}
                  >
                    <td>
                      <button className="order-link" onClick={() => onSelectOrder(order)}>
                        {order.id}
                        <ChevronRight size={15} />
                      </button>
                    </td>
                    <td>{order.securityCode || "-"}</td>
                    <td>
                      <Badge tone={order.type === "Exportación" ? "danger-soft" : order.type === "Importación" ? "teal-soft" : "blue-soft"}>
                        {order.type}
                      </Badge>
                    </td>
                    <td>
                      <strong>{order.country}</strong>
                      <span className="muted-cell">{order.office}</span>
                    </td>
                    <td>{order.consignor}</td>
                    <td>{order.recipient}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <Badge tone={priorityMeta[order.priority].tone}>{order.priority}</Badge>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(event) => onUpdateStatus(order.id, event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{order.tracking || "Pendiente"}</td>
                    <td>{order.responsible}</td>
                    <td>{formatDate(order.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <OrderDetail
          lookupMessage={lookupMessage}
          newComment={newComment}
          order={selectedOrder}
          statusOptions={statusOptions}
          trackingDraft={trackingDraft}
          onAddComment={onAddComment}
          onSaveTracking={onSaveTracking}
          onSetNewComment={onSetNewComment}
          onSetTrackingDraft={onSetTrackingDraft}
          onSimulateLookup={onSimulateLookup}
          onUpdateStatus={onUpdateStatus}
        />
      </section>
    </>
  );
}

function OrderDetail({
  lookupMessage,
  newComment,
  order,
  statusOptions,
  trackingDraft,
  onAddComment,
  onSaveTracking,
  onSetNewComment,
  onSetTrackingDraft,
  onSimulateLookup,
  onUpdateStatus,
}) {
  const progress = statusMeta[order.status]?.progress || 0;
  const dhlUrl = order.tracking
    ? `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${order.tracking}`
    : "https://www.dhl.com/global-en/home/tracking.html";

  return (
    <aside className="detail-panel" aria-label="Detalle de orden">
      <div className="detail-header">
        <div>
          <span className="eyebrow">Vista detalle</span>
          <h2>{order.id}</h2>
        </div>
        <Badge tone={statusMeta[order.status]?.tone || "muted"}>{order.status}</Badge>
      </div>

      <div className="progress-block">
        <div className="progress-label">
          <span>Progreso operativo</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="detail-actions">
        <SelectField
          label="Estado actual"
          value={order.status}
          options={statusOptions}
          onChange={(value) => onUpdateStatus(order.id, value)}
        />
        <TextField
          label="Guía DHL / tracking"
          value={trackingDraft}
          placeholder="JD014600..."
          onChange={onSetTrackingDraft}
        />
        <button className="primary-action full" onClick={onSaveTracking}>
          <ShieldCheck size={18} />
          Guardar tracking
        </button>
      </div>

      <div className="detail-section">
        <h3>
          <FileText size={18} />
          Información general
        </h3>
        <dl className="detail-list">
          <div>
            <dt>Tipo</dt>
            <dd>{order.type}</dd>
          </div>
          <div>
            <dt>Fecha de creación</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt>Fecha de envío</dt>
            <dd>{formatDate(order.shipDate)}</dd>
          </div>
          <div>
            <dt>Prioridad</dt>
            <dd>
              <Badge tone={priorityMeta[order.priority].tone}>{order.priority}</Badge>
            </dd>
          </div>
          <div>
            <dt>Cantidad de paquetes</dt>
            <dd>{order.packages}</dd>
          </div>
          <div>
            <dt>Peso</dt>
            <dd>{order.weight}</dd>
          </div>
          <div>
            <dt>Contenido declarado</dt>
            <dd>{order.content}</dd>
          </div>
          <div>
            <dt>Código de seguridad</dt>
            <dd>{order.securityCode}</dd>
          </div>
        </dl>
      </div>

      <div className="detail-section">
        <h3>
          <UserRound size={18} />
          Partes y direcciones
        </h3>
        <div className="info-stack">
          <InfoLine icon={UserRound} label="Consignatario" value={order.consignor} />
          <InfoLine icon={UserRound} label="Destinatario" value={order.recipient} />
          <InfoLine icon={MapPin} label="Destino" value={`${order.country} · ${order.office}`} />
          <InfoLine icon={MapPin} label="Dirección destino" value={order.destinationAddress} />
          <InfoLine icon={PackageSearch} label="Dirección recogida" value={order.pickupAddress} />
          <InfoLine icon={LinkIcon} label="Evidencia paquete sellado" value={order.evidenceUrl} />
          <InfoLine icon={UserRound} label="Responsable asignado" value={order.responsible} />
        </div>
      </div>

      <DhlTracking
        dhlUrl={dhlUrl}
        lookupMessage={lookupMessage}
        order={order}
        onSimulateLookup={onSimulateLookup}
      />

      <Timeline history={order.history} />

      <div className="detail-section">
        <h3>
          <History size={18} />
          Comentarios internos
        </h3>
        <div className="comments-list">
          {order.comments.length ? (
            order.comments.map((comment, index) => (
              <article key={`${comment.date}-${index}`} className="comment-item">
                <strong>{comment.author}</strong>
                <span>{formatDate(comment.date)}</span>
                <p>{comment.text}</p>
              </article>
            ))
          ) : (
            <p className="empty-note">No hay comentarios todavía.</p>
          )}
        </div>
        <div className="comment-box">
          <textarea
            value={newComment}
            placeholder="Agregar comentario o aclaración..."
            onChange={(event) => onSetNewComment(event.target.value)}
          />
          <button className="primary-action" onClick={onAddComment}>
            <FileText size={18} />
            Agregar
          </button>
        </div>
      </div>
    </aside>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="info-line">
      <Icon size={16} />
      <div>
        <span>{label}</span>
        <p>{value}</p>
      </div>
    </div>
  );
}

function DhlTracking({ dhlUrl, lookupMessage, order, onSimulateLookup }) {
  return (
    <div className="detail-section dhl-section">
      <h3>
        <Truck size={18} />
        Seguimiento DHL
      </h3>
      <div className="dhl-banner">
        <div>
          <span>Tracking actual</span>
          <strong>{order.tracking || "Pendiente de guía"}</strong>
        </div>
        <a href={dhlUrl} target="_blank" rel="noreferrer" className="ghost-button">
          <LinkIcon size={16} />
          Abrir DHL
        </a>
      </div>
      <button className="secondary-action full" onClick={onSimulateLookup}>
        <RefreshCw size={16} />
        Consultar estatus
      </button>
      {lookupMessage ? <p className="lookup-message">{lookupMessage}</p> : null}
      <div className="tracking-grid">
        <InfoLine icon={Truck} label="Estado actual" value={order.trackingInfo.currentStatus} />
        <InfoLine icon={MapPin} label="Última ubicación" value={order.trackingInfo.lastLocation} />
        <InfoLine icon={Calendar} label="Entrega estimada" value={formatDate(order.trackingInfo.eta, { dateOnly: true })} />
      </div>
      <div className="mini-events">
        <span>Eventos del tracking</span>
        {order.trackingInfo.events.length ? (
          order.trackingInfo.events.map((event, index) => (
            <div key={`${event.date}-${index}`} className="mini-event">
              <strong>{event.status}</strong>
              <p>{event.location} · {formatDate(event.date)}</p>
            </div>
          ))
        ) : (
          <p className="empty-note">Sin eventos DHL registrados todavía.</p>
        )}
      </div>
      <p className="integration-note">
        Preparado para consultar automáticamente DHL API y sincronizar eventos de tracking.
      </p>
    </div>
  );
}

function Timeline({ history }) {
  return (
    <div className="detail-section">
      <h3>
        <History size={18} />
        Línea de tiempo del envío
      </h3>
      <ol className="timeline">
        {history.map((event, index) => (
          <li key={`${event.date}-${index}`}>
            <span className="timeline-dot" />
            <div>
              <strong>{event.status}</strong>
              <p>{formatDate(event.date)} · {event.source}</p>
              {event.note ? <em>{event.note}</em> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReportsView({
  countryVolume,
  statusOptions,
  filteredReports,
  monthlySeries,
  officeVolume,
  offices,
  reportCountries,
  reportFilters,
  reportKpis,
  reportMonths,
  reportYears,
  statusDistribution,
  deliveryByType,
  typeDistribution,
  onReset,
  onUpdateFilter,
}) {
  return (
    <>
      <section className="report-hero">
        <div>
          <span className="eyebrow">Analítica ejecutiva-operativa</span>
          <h2>Reportes mensuales MIREX</h2>
          <p>
            Volumen, desempeño de entrega, destinos con mayor actividad, incidencias y control de guías DHL.
          </p>
        </div>
        <button className="primary-action">
          <Download size={18} />
          Exportar tabla
        </button>
      </section>

      <section className="report-filters">
        <TextField label="Desde" type="date" value={reportFilters.from} onChange={(value) => onUpdateFilter("from", value)} />
        <TextField label="Hasta" type="date" value={reportFilters.to} onChange={(value) => onUpdateFilter("to", value)} />
        <SelectField label="Mes" value={reportFilters.month} options={reportMonths} onChange={(value) => onUpdateFilter("month", value)} />
        <SelectField label="Año" value={reportFilters.year} options={reportYears} onChange={(value) => onUpdateFilter("year", value)} />
        <SelectField label="Tipo" value={reportFilters.type} options={["Todos", "Importación", "Exportación"]} onChange={(value) => onUpdateFilter("type", value)} />
        <SelectField label="País" value={reportFilters.country} options={reportCountries} onChange={(value) => onUpdateFilter("country", value)} />
        <SelectField label="Embajada / Consulado" value={reportFilters.office} options={offices} onChange={(value) => onUpdateFilter("office", value)} />
        <SelectField label="Estado operativo" value={reportFilters.status} options={["Todos", ...statusOptions]} onChange={(value) => onUpdateFilter("status", value)} />
        <SelectField label="Prioridad" value={reportFilters.priority} options={["Todos", ...priorityOptions]} onChange={(value) => onUpdateFilter("priority", value)} />
        <SelectField label="Responsable" value={reportFilters.responsible} options={["Todos", ...responsibleOptions]} onChange={(value) => onUpdateFilter("responsible", value)} />
        <TextField label="Tracking DHL" value={reportFilters.tracking} placeholder="Generadas..." onChange={(value) => onUpdateFilter("tracking", value)} />
        <CheckboxField label="Solo entregadas" checked={reportFilters.deliveredOnly} onChange={(value) => onUpdateFilter("deliveredOnly", value)} />
        <CheckboxField label="Con incidencia" checked={reportFilters.incidentsOnly} onChange={(value) => onUpdateFilter("incidentsOnly", value)} />
        <button className="ghost-button filter-reset" onClick={onReset}>
          <Filter size={16} />
          Limpiar
        </button>
      </section>

      <section className="executive-grid">
        <IconStat icon={FileText} label="Total solicitudes del mes" value={reportKpis.total} tone="neutral" />
        <IconStat icon={Globe2} label="Importaciones" value={reportKpis.imports} tone="teal" />
        <IconStat icon={Plane} label="Exportaciones" value={reportKpis.exports} tone="danger" />
        <IconStat icon={MapPin} label="País mayor volumen" value={reportKpis.topCountry} tone="gold" />
        <IconStat icon={BuildingIcon} label="Oficina mayor volumen" value={reportKpis.topOffice} tone="neutral" />
        <IconStat icon={CheckCircle2} label="Entregadas" value={reportKpis.delivered} tone="success" />
        <IconStat icon={Clock3} label="Pendientes" value={reportKpis.pending} tone="warning" />
        <IconStat icon={AlertTriangle} label="Incidencias" value={reportKpis.incidents} tone="danger" />
        <IconStat icon={Clock3} label="Tiempo promedio" value={reportKpis.avg} tone="teal" />
        <IconStat icon={ShieldCheck} label="Cumplimiento" value={reportKpis.compliance} tone="success" />
      </section>

      <section className="charts-grid">
        <ChartPanel title="Solicitudes por mes" subtitle="Volumen total mensual">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3f5f8f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Importación vs exportación" subtitle="Evolución comparativa mensual">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="importaciones" stroke={typeColors.Importación} strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="exportaciones" stroke={typeColors.Exportación} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Distribución por tipo" subtitle="Importaciones, exportaciones y locales">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={typeDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={4}
              >
                {typeDistribution.map((item, index) => (
                  <Cell key={item.name} fill={typeColors[item.name] || chartPalette[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend-row">
            {typeDistribution.map((item) => (
              <span key={item.name}>
                <i style={{ backgroundColor: typeColors[item.name] }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel title="Destinos con mayor volumen" subtitle="Ranking por país destino">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryVolume} layout="vertical" margin={{ left: 28 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={92} />
              <Tooltip />
              <Bar dataKey="solicitudes" fill="#007a78" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Embajadas y consulados" subtitle="Oficinas internacionales con mayor actividad">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={officeVolume} layout="vertical" margin={{ left: 64 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={144} />
              <Tooltip />
              <Bar dataKey="solicitudes" fill="#f2b705" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Incidencias por mes" subtitle="Alertas operativas mensuales">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="incidencias" fill="#b42318" radius={[4, 4, 0, 0]} />
              <Bar dataKey="urgentes" fill="#e0a100" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Entregadas vs pendientes" subtitle="Cierre operativo mensual">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="entregadas" stackId="delivery" fill="#27845b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendientes" stackId="delivery" fill="#f2b705" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Guías DHL" subtitle="Generadas vs pendientes de guía">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="guiasGeneradas" fill="#3f5f8f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="guiasPendientes" fill="#d71920" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Solicitudes por estado" subtitle="Entregadas, pendientes e incidencias">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
              >
                {statusDistribution.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend-row">
            {statusDistribution.map((item) => (
              <span key={item.name}>
                <i style={{ backgroundColor: item.color }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel title="Tiempo promedio por tipo" subtitle="Días promedio de entrega">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deliveryByType}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="promedio" fill="#007a78" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Tiempo promedio por país" subtitle="Destinos con mayor tiempo operativo">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryVolume} layout="vertical" margin={{ left: 28 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={92} />
              <Tooltip />
              <Bar dataKey="promedioEntrega" fill="#765aa8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="report-table-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Tabla exportable conceptualmente</span>
            <h2>Resumen por país / embajada / consulado</h2>
          </div>
          <Badge tone="blue-soft">{filteredReports.length} filas</Badge>
        </div>
        <div className="table-shell">
          <table className="orders-table report-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Tipo</th>
                <th>País destino</th>
                <th>Embajada / Consulado / Oficina</th>
                <th>Solicitudes</th>
                <th>Entregadas</th>
                <th>Pendientes</th>
                <th>Incidencia</th>
                <th>Tiempo promedio</th>
                <th>Guías DHL</th>
                <th>Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((row) => (
                <tr key={`${row.monthKey}-${row.type}-${row.country}-${row.office}`}>
                  <td>{row.month} {row.year}</td>
                  <td>
                    <Badge tone={row.type === "Exportación" ? "danger-soft" : "teal-soft"}>{row.type}</Badge>
                  </td>
                  <td>{row.country}</td>
                  <td>{row.office}</td>
                  <td>{row.requests}</td>
                  <td>{row.delivered}</td>
                  <td>{row.pending}</td>
                  <td>
                    <Badge tone={row.incidents ? "danger" : "success"}>
                      {row.incidents}
                    </Badge>
                  </td>
                  <td>{row.avgDeliveryDays.toFixed(1)} días</td>
                  <td>{row.dhlGenerated} gen. / {row.dhlPending} pend.</td>
                  <td>{formatDate(row.lastUpdate, { dateOnly: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="chart-panel">
      <div className="chart-heading">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      {children}
    </section>
  );
}

function BuildingIcon(props) {
  return <Globe2 {...props} />;
}

export default App;

// Integraciones futuras:
// Google Forms/Gmail: ingerir nuevas solicitudes y adjuntos desde el formulario/correo.
// Asana API: leer y sincronizar tareas existentes asignadas a operacionesmirex@importadex.do.
// DHL API: consultar tracking, eventos y prueba de entrega automaticamente.
// Google Drive: guardar evidencia del paquete sellado y documentos adjuntos.
// Base de datos interna: persistir ordenes, auditoria, roles y reportes historicos.
