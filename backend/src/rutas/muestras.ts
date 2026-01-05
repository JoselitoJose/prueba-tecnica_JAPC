import { Router } from "express";
import { cargarMuestras } from "../servicios/cargar-muestras.js";
import type { Muestra } from "../modelos/muestra.js";

// Router de express para agrupar las rutas relacionadas con los samples
const router = Router();

// Listas para validar filtros y evitar valores inesperados
const zonasValidas = new Set([
  "industrial",
  "commercial",
  "residential",
  "rural",
  "urban",
  "coastal",
]);

const tiposValidos = new Set(["air", "water", "soil", "noise"]);
const estadosValidos = new Set(["normal", "warning", "critical"]);

/*
 Filtra un array de muestras por rango de fechas:
    + Si minDate o maxDate no son fechas válidas, se ignoran.
    + collectionDate se compara como Date.
 */
function filtrarPorFecha(muestras: Muestra[], minDate?: string, maxDate?: string): Muestra[] {
  let resultado = muestras;

  // Filtro por fecha mínima 
  if (minDate) {
    const fechaMin = new Date(minDate);
    if (!Number.isNaN(fechaMin.getTime())) {
      resultado = resultado.filter((m) => new Date(m.collectionDate) >= fechaMin);
    }
  }

  // Filtro por fecha máxima 
  if (maxDate) {
    const fechaMax = new Date(maxDate);
    if (!Number.isNaN(fechaMax.getTime())) {
      resultado = resultado.filter((m) => new Date(m.collectionDate) <= fechaMax);
    }
  }

  return resultado;
}



/*
  GET /samples
  Devuelve una lista paginada de muestras con filtros opcionales.
*/

router.get("/samples", async (req, res) => {
  try {
    // Carga inicial del dataset (desde JSON, con cache en el servicio)
    const muestras = await cargarMuestras();

    // Extraigo el query params con valores por defecto
    const {
      page = "1",
      pageSize = "10",
      zone,
      sampleType,
      status,
      operator,
      minDate,
      maxDate,
    } = req.query;

    // Normalizo la paginación donde:
      // - page mínimo 1
      // - pageSize entre 1 y 50
    const paginaSolicitada = Math.max(Number(page) || 1, 1);
    const tamanioPagina = Math.min(Math.max(Number(pageSize) || 10, 1), 50);

    
    let filtradas = muestras;

    // Filtro por zona (validación + filtro exacto)
    if (typeof zone === "string" && zone) {
      if (!zonasValidas.has(zone)) {
        return res.status(400).json({ message: "Zona inválida" });
      }
      filtradas = filtradas.filter((m) => m.zone === zone);
    }

    // Filtro por tipo de muestra (validación + filtro exacto)
    if (typeof sampleType === "string" && sampleType) {
      if (!tiposValidos.has(sampleType)) {
        return res.status(400).json({ message: "Tipo de muestra inválido" });
      }
      filtradas = filtradas.filter((m) => m.sampleType === sampleType);
    }

    // Filtro por estado (validación + filtro exacto)
    if (typeof status === "string" && status) {
      if (!estadosValidos.has(status)) {
        return res.status(400).json({ message: "Estado inválido" });
      }
      filtradas = filtradas.filter((m) => m.status === status);
    }

    // Filtro por operador
    if (typeof operator === "string" && operator) {
      filtradas = filtradas.filter((m) => m.operator === operator);
    }

    // Filtro por rango de fechas (si al menos uno viene como string)
    if (typeof minDate === "string" || typeof maxDate === "string") {
      filtradas = filtrarPorFecha(
        filtradas,
        typeof minDate === "string" ? minDate : undefined,
        typeof maxDate === "string" ? maxDate : undefined
      );
    }

    // Cálculo de paginación en base al resultado filtrado
    const totalItems = filtradas.length;
    const totalPages = Math.max(Math.ceil(totalItems / tamanioPagina), 1);

    // Evito pedir una página fuera de rango (por ejemplo page=999)
    const paginaSegura = Math.min(paginaSolicitada, totalPages);

    // Índice de inicio para el slice 
    const inicio = (paginaSegura - 1) * tamanioPagina;

    // Items de la página actual
    const items = filtradas.slice(inicio, inicio + tamanioPagina);

    // Respuesta con metadata útil para el frontend
    return res.json({
      page: paginaSegura,
      pageSize: tamanioPagina,
      totalItems,
      totalPages,
      items,
    });
  } catch {
    
    return res.status(500).json({ message: "Error al cargar las muestras" });
  }
});

export default router;
