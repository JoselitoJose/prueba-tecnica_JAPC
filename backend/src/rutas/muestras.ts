import { Router } from "express";
import { cargarMuestras } from "../servicios/cargar-muestras.js";
import type { Muestra } from "../modelos/muestra.js";

const router = Router();

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

function filtrarPorFecha(muestras: Muestra[], minDate?: string, maxDate?: string): Muestra[] {
  let resultado = muestras;

  if (minDate) {
    const fechaMin = new Date(minDate);
    if (!Number.isNaN(fechaMin.getTime())) {
      resultado = resultado.filter((m) => new Date(m.collectionDate) >= fechaMin);
    }
  }

  if (maxDate) {
    const fechaMax = new Date(maxDate);
    if (!Number.isNaN(fechaMax.getTime())) {
      resultado = resultado.filter((m) => new Date(m.collectionDate) <= fechaMax);
    }
  }

  return resultado;
}

router.get("/samples", async (req, res) => {
  try {
    const muestras = await cargarMuestras();

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

    const paginaSolicitada = Math.max(Number(page) || 1, 1);
    const tamanioPagina = Math.min(Math.max(Number(pageSize) || 10, 1), 50);

    let filtradas = muestras;

    if (typeof zone === "string" && zone) {
      if (!zonasValidas.has(zone)) {
        return res.status(400).json({ message: "Zona inválida" });
      }
      filtradas = filtradas.filter((m) => m.zone === zone);
    }

    if (typeof sampleType === "string" && sampleType) {
      if (!tiposValidos.has(sampleType)) {
        return res.status(400).json({ message: "Tipo de muestra inválido" });
      }
      filtradas = filtradas.filter((m) => m.sampleType === sampleType);
    }

    if (typeof status === "string" && status) {
      if (!estadosValidos.has(status)) {
        return res.status(400).json({ message: "Estado inválido" });
      }
      filtradas = filtradas.filter((m) => m.status === status);
    }

    if (typeof operator === "string" && operator) {
      filtradas = filtradas.filter((m) => m.operator === operator);
    }

    if (typeof minDate === "string" || typeof maxDate === "string") {
      filtradas = filtrarPorFecha(
        filtradas,
        typeof minDate === "string" ? minDate : undefined,
        typeof maxDate === "string" ? maxDate : undefined
      );
    }

    const totalItems = filtradas.length;
    const totalPages = Math.max(Math.ceil(totalItems / tamanioPagina), 1);
    const paginaSegura = Math.min(paginaSolicitada, totalPages);
    const inicio = (paginaSegura - 1) * tamanioPagina;

    const items = filtradas.slice(inicio, inicio + tamanioPagina);

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
