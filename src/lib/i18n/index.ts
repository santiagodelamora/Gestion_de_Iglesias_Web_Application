import { useSyncExternalStore } from "react";
import { DICCIONARIOS, esIdioma, type Idioma } from "./diccionarios";

export { IDIOMAS, type Idioma, type Textos } from "./diccionarios";

// Idioma de la interfaz. Es una preferencia de cada navegador (localStorage),
// no de la iglesia: cada persona elige el suyo en Configuración.
//
// Los componentes lo leen con useIdioma() y se vuelven a pintar al cambiarlo.
// El código fuera de React (mensajes de error del repositorio, exportación a
// PDF, formato de fechas) usa textos() e idiomaActual() en el momento en que se
// ejecuta.

const CLAVE = "gi-idioma";
const oyentes = new Set<() => void>();

const leerGuardado = (): Idioma => {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return esIdioma(guardado) ? guardado : "es";
  } catch {
    // almacenamiento no disponible
    return "es";
  }
};

let actual: Idioma = typeof window === "undefined" ? "es" : leerGuardado();

export const idiomaActual = () => actual;
export const textos = () => DICCIONARIOS[actual];

export function cambiarIdioma(idioma: Idioma) {
  if (idioma === actual) return;
  actual = idioma;
  try {
    localStorage.setItem(CLAVE, idioma);
  } catch {
    // almacenamiento no disponible: el cambio dura hasta recargar
  }
  oyentes.forEach((avisar) => avisar());
}

const suscribir = (avisar: () => void) => {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
};

// En el servidor y al hidratar se usa español, igual que el HTML generado;
// justo después React pasa al idioma guardado.
export function useIdioma() {
  const idioma = useSyncExternalStore(suscribir, idiomaActual, () => "es" as Idioma);
  return { idioma, t: DICCIONARIOS[idioma], cambiarIdioma };
}
