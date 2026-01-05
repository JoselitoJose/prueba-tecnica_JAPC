import { readFile } from "fs/promises";
import path from "path";
import type { Muestra } from "../modelos/muestra.js";

let cache: Muestra[] | null = null;

const DEFAULT_DATA_FILE = path.resolve(
  process.cwd(),
  "..",
  "data",
  "environmental-samples.json"
);

const DATA_FILE = process.env.DATA_FILE ?? DEFAULT_DATA_FILE;

export async function cargarMuestras(): Promise<Muestra[]> {
  if (cache) return cache;

  const contenido = await readFile(DATA_FILE, "utf-8");
  const parsed: unknown = JSON.parse(contenido);

  if (!Array.isArray(parsed)) {
    throw new Error("El JSON de muestras no tiene el formato esperado (array).");
  }

  cache = parsed as Muestra[];
  return cache;
}
