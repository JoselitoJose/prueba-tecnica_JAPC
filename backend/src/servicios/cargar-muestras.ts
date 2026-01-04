import { readFile, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { Muestra } from "../modelos/muestra.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cache: Muestra[] | null = null;

async function existe(ruta: string): Promise<boolean> {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}



async function resolverRutaDatos(): Promise<string> {
  // Opcion 1: variable de entorno
  // DATA_FILE=C:\...\prueba-tecnica_JAPC\data\environmental-samples.json
  if (process.env.DATA_FILE && (await existe(process.env.DATA_FILE))) {
    return process.env.DATA_FILE;
  }

  // Opcion 2: ejecutar npm desde backend
  const desdeBackend = path.resolve(process.cwd(), "..", "data", "environmental-samples.json");
  if (await existe(desdeBackend)) return desdeBackend;

  // Opcion 3: ejecutar desde la raiz del repo/proyecto
  const desdeRaiz = path.resolve(process.cwd(), "data", "environmental-samples.json");
  if (await existe(desdeRaiz)) return desdeRaiz;

  // Opcion 4: resolver por ubicacion del fichero
  const raizProyecto = path.resolve(__dirname, "..", "..", "..");
  const porModulo = path.join(raizProyecto, "data", "environmental-samples.json");
  if (await existe(porModulo)) return porModulo;

  // Si no aparece, devolvemos la ruta "esperada" para ver el error
  return desdeBackend;
}

function extraerArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;

  const obj = parsed as any;
  const candidato = obj?.items ?? obj?.samples ?? obj?.data;
  if (Array.isArray(candidato)) return candidato;

  throw new Error("Formato JSON inesperado: se esperaba un array o un objeto con items/samples/data.");
}

export async function cargarMuestras(): Promise<Muestra[]> {
  if (cache) return cache;

  const archivoDatos = await resolverRutaDatos();
  const contenido = await readFile(archivoDatos, "utf-8");

  const parsed: unknown = JSON.parse(contenido);
  const items = extraerArray(parsed);

  cache = items as Muestra[];
  return cache;
}
