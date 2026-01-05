import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Muestra {
  sampleId: string;
  location: string;
  zone: string;
  sampleType: string;
  collectionDate: string;
  parameters: {
    pH: number;
    temperature: number;
    conductivity: number;
    turbidity: number;
    dissolvedOxygen: number;
    heavyMetals: {
      lead: number;
      mercury: number;
      arsenic: number;
    };
    vocs: number;
    pm25: number;
    pm10: number;
    noiseLevel: number;
  };
  status: string;
  operator: string;
  labCode: string;
  notes: string;
}

interface RespuestaApi {
  items: Muestra[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const etiquetasEstado: Record<string, string> = {
  normal: "Normal",
  warning: "Advertencia",
  critical: "Crítico",
};

const etiquetasZona: Record<string, string> = {
  industrial: "Industrial",
  commercial: "Comercial",
  residential: "Residencial",
  rural: "Rural",
  urban: "Urbana",
  coastal: "Costera",
};

const etiquetasTipo: Record<string, string> = {
  air: "Aire",
  water: "Agua",
  soil: "Suelo",
  noise: "Ruido",
};

const operadoresDisponibles = [
  "Ana López",
  "Carlos Méndez",
  "María González",
  "Roberto Díaz",
];

const formatearFecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

function construirQuery(params: URLSearchParams): string {
  const nextParams = new URLSearchParams();
  params.forEach((value, key) => {
    if (value) {
      nextParams.set(key, value);
    }
  });
  return nextParams.toString();
}

function obtenerClaseIndicador(
  value: number,
  warningThreshold: number,
  criticalThreshold: number
) {
  if (value >= criticalThreshold) {
    return "indicator critical";
  }
  if (value >= warningThreshold) {
    return "indicator warning";
  }
  return "indicator normal";
}

export default function Aplicacion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [respuesta, setRespuesta] = useState<RespuestaApi | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");

  const filtros = useMemo(
    () => ({
      zone: searchParams.get("zone") ?? "",
      sampleType: searchParams.get("sampleType") ?? "",
      status: searchParams.get("status") ?? "",
      operator: searchParams.get("operator") ?? "",
      minDate: searchParams.get("minDate") ?? "",
      maxDate: searchParams.get("maxDate") ?? "",
    }),
    [searchParams]
  );

  useEffect(() => {
    async function cargarMuestras() {
      setCargando(true);
      setError(null);
      try {
        const query = construirQuery(searchParams);
        const respuestaHttp = await fetch(`${API_BASE}/api/samples?${query}`);
        if (!respuestaHttp.ok) {
          throw new Error("No se pudo cargar la información");
        }
        const data = (await respuestaHttp.json()) as RespuestaApi;
        setRespuesta(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    }
    cargarMuestras();
  }, [searchParams]);

  const actualizarFiltro = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const actualizarPagina = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const limpiarFiltros = () => {
    setSearchParams({ page: "1" });
  };

  const totalPages = respuesta?.totalPages ?? 1;
  const currentPage = respuesta?.page ?? page;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Monitoreo de muestras.</h1>
          <p className="subtitle">
              Observabilidad de condiciones ambientales.
          </p>
        </div>
        <div className="header-summary">
          <div>
            <span className="label">Muestras</span>
            <strong>{respuesta?.totalItems ?? "-"}</strong>
          </div>
          <div>
            <span className="label">Página</span>
            <strong>
              {currentPage} / {totalPages}
            </strong>
          </div>
        </div>
      </header>

      <section className="filters">
        <div className="filter-row">
          <label>
            Zona
            <select
              value={filtros.zone}
              onChange={(event) => actualizarFiltro("zone", event.target.value)}
            >
              <option value="">Todas</option>
              {Object.entries(etiquetasZona).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select
              value={filtros.sampleType}
              onChange={(event) =>
                actualizarFiltro("sampleType", event.target.value)
              }
            >
              <option value="">Todos</option>
              {Object.entries(etiquetasTipo).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              value={filtros.status}
              onChange={(event) => actualizarFiltro("status", event.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(etiquetasEstado).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Operador
            <select
              value={filtros.operator}
              onChange={(event) =>
                actualizarFiltro("operator", event.target.value)
              }
            >
              <option value="">Todos</option>
              {operadoresDisponibles.map((operador) => (
                <option key={operador} value={operador}>
                  {operador}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost" type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
        <div className="filter-row">
          <label>
            Desde
            <input
              type="date"
              value={filtros.minDate}
              onChange={(event) =>
                actualizarFiltro("minDate", event.target.value)
              }
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={filtros.maxDate}
              onChange={(event) =>
                actualizarFiltro("maxDate", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="table-section">
        {cargando && <div className="banner">Cargando información...</div>}
        {error && <div className="banner error">{error}</div>}
        {!cargando && respuesta?.items.length === 0 && (
          <div className="banner">No se encontraron muestras.</div>
        )}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th>ID</th>
                <th>Ubicación</th>
                <th>Zona</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Operador</th>
                <th>PM2.5</th>
                <th>Ruido</th>
              </tr>
            </thead>
            <tbody>
              {respuesta?.items.map((muestra) => (
                <tr key={muestra.sampleId}>
                  <td>
                    <span
                      className={`status-dot ${muestra.status}`}
                      aria-label={
                        etiquetasEstado[muestra.status] ?? muestra.status
                      }
                    ></span>
                  </td>
                  <td>
                    <strong>{muestra.sampleId}</strong>
                    <div className="muted">{muestra.labCode}</div>
                  </td>
                  <td>{muestra.location}</td>
                  <td>{etiquetasZona[muestra.zone] ?? muestra.zone}</td>
                  <td>{etiquetasTipo[muestra.sampleType] ?? muestra.sampleType}</td>
                  <td>{formatearFecha(muestra.collectionDate)}</td>
                  <td>
                    <span className={`badge ${muestra.status}`}>
                      {etiquetasEstado[muestra.status] ?? muestra.status}
                    </span>
                  </td>
                  <td>{muestra.operator}</td>
                  <td>
                    <span
                      className={obtenerClaseIndicador(
                        muestra.parameters.pm25,
                        25,
                        35
                      )}
                    >
                      {muestra.parameters.pm25.toFixed(1)} µg/m³
                    </span>
                  </td>
                  <td>
                    <span
                      className={obtenerClaseIndicador(
                        muestra.parameters.noiseLevel,
                        60,
                        70
                      )}
                    >
                      {muestra.parameters.noiseLevel.toFixed(1)} dB
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pagination">
        <button
          type="button"
          className="ghost"
          onClick={() => actualizarPagina(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
        >
          Anterior
        </button>
        <span>
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
        </span>
        <button
          type="button"
          className="ghost"
          onClick={() => actualizarPagina(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
        >
          Siguiente
        </button>
      </section>
    </div>
  );
}
