"use client";

import { useCallback, useEffect, useState } from "react";
import { textos } from "./i18n";

// fetch lanza TypeError cuando no hay respuesta del servidor (sin internet o
// servidor caído); su mensaje técnico no le dice nada a la persona.
const mensajeDe = (e: unknown, otro: string) => {
  if (e instanceof TypeError && /fetch|network|load failed/i.test(e.message)) return textos().errores.conexion;
  return e instanceof Error ? e.message : otro;
};

// Carga datos con una función asíncrona y permite volver a cargarlos tras un cambio
export function useCarga<T>(cargar: () => Promise<T>, inicial: T) {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    try {
      setDatos(await cargar());
      setError("");
    } catch (e) {
      setError(mensajeDe(e, textos().errores.cargarDatos));
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    setCargando(true);
    recargar();
  }, [recargar]);

  return { datos, cargando, error, recargar };
}

// Ejecuta una acción y devuelve el mensaje de error, si lo hubo
export async function intentar(accion: () => Promise<unknown>): Promise<string> {
  try {
    await accion();
    return "";
  } catch (e) {
    return mensajeDe(e, textos().errores.inesperado);
  }
}
