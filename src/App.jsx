import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Filter,
  Globe2,
  History,
  LayoutDashboard,
  Link as LinkIcon,
  MapPin,
  PackageCheck,
  PackageSearch,
  Plane,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  Upload,
  UserRound,
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
  reportRows,
  responsibleOptions,
  statusMeta,
  statusOptions,
  typeOptions,
} from "./data/mockData";

const monthOrder = [
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
];

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
        urgentes: sum(monthRows, "urgent"),
        incidencias: sum(monthRows, "incidents"),
      };
    })
    .filter(Boolean);
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

function TextField({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
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
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0].id);
  const [activeView, setActiveView] = useState("orders");
  const [filters, setFilters] = useState(emptyFilters);
  const [reportFilters, setReportFilters] = useState(emptyReportFilters);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Operaciones Importadex / Flypack");
  const [newComment, setNewComment] = useState("");
  const [trackingDraft, setTrackingDraft] = useState(initialOrders[0].tracking);
  const [lookupMessage, setLookupMessage] = useState("");

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];

  const countries = useMemo(() => getUnique(orders, "country"), [orders]);
  const offices = useMemo(() => getUnique(reportRows, "office"), []);
  const reportCountries = useMemo(() => getUnique(reportRows, "country"), []);
  const reportYears = useMemo(() => getUnique(reportRows, "year"), []);
  const reportMonths = useMemo(
    () => ["Todos", ...Array.from(new Set(reportRows.map((row) => row.monthKey))).sort()],
    [],
  );

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
    return reportRows.filter((row) => {
      return (
        (reportFilters.year === "Todos" || row.year === reportFilters.year) &&
        (reportFilters.month === "Todos" || row.monthKey === reportFilters.month) &&
        (reportFilters.type === "Todos" || row.type === reportFilters.type) &&
        (reportFilters.country === "Todos" || row.country === reportFilters.country) &&
        (reportFilters.office === "Todos" || row.office === reportFilters.office) &&
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
        </nav>

        <div className="role-panel">
          <span>Rol activo</span>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option>Personal MIREX</option>
            <option>Operaciones Importadex / Flypack</option>
            <option>Administrador</option>
          </select>
          <p>
            Acceso contextual para consultar, comentar, actualizar estados y preparar cierre operativo.
          </p>
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
            <button className="primary-action">
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
          />
        ) : (
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
            typeDistribution={typeDistribution}
            onReset={() => setReportFilters(emptyReportFilters)}
            onUpdateFilter={updateReportFilter}
          />
        )}
      </main>
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
  filteredReports,
  monthlySeries,
  officeVolume,
  offices,
  reportCountries,
  reportFilters,
  reportKpis,
  reportMonths,
  reportYears,
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
