import { en } from "./en";
import { es, type Textos } from "./es";

// Sin hooks ni navegador: lo puede importar también el código del servidor
// (por ejemplo, la acción que envía invitaciones).

export type Idioma = "es" | "en";
export type { Textos };

export const DICCIONARIOS: Record<Idioma, Textos> = { es, en };

// Cada idioma se nombra en su propia lengua, para que se reconozca aunque no se
// entienda el idioma que está activo
export const IDIOMAS: { id: Idioma; nombre: string }[] = [
  { id: "es", nombre: "Español" },
  { id: "en", nombre: "English" },
];

export const esIdioma = (valor: unknown): valor is Idioma => valor === "es" || valor === "en";
