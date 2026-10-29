"use client";

import { useCallback } from "react";
import { Semana } from "@/components/semana";
import { Encabezado, Etiqueta, Liston, Tarjeta } from "@/components/ui";
import { fechaLarga } from "@/lib/formato";
import { useDatos } from "@/lib/store";
import type { Anuncio, Evento, Horario } from "@/lib/types";
import { useCarga } from "@/lib/usar-carga";

// Portal del rol Miembro: solo lectura de anuncios y eventos de su sede
export default function Inicio() {
  const { usuario, repo, db, sedeId, hoy } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId);
  const cargar = useCallback(async () => {
    const [anuncios, eventos, horarios] = await Promise.all([
      repo.anuncios.listar(sedeId),
      repo.eventos.listar(sedeId),
      repo.horarios.listar(sedeId),
    ]);
    return { anuncios, eventos, horarios };
  }, [repo, sedeId]);
  const { datos, error } = useCarga<{ anuncios: Anuncio[]; eventos: Evento[]; horarios: Horario[] }>(cargar, {
    anuncios: [],
    eventos: [],
    horarios: [],
  });
  const { anuncios, eventos, horarios } = datos;

  const avisos = anuncios
    .filter((a) => a.fechaPublicacion <= hoy)
    .sort((a, b) => Number(b.importante) - Number(a.importante) || b.fechaPublicacion.localeCompare(a.fechaPublicacion));

  return (
    <>
      <Encabezado titulo={`Bienvenido, ${usuario!.nombre.split(" ")[0]}`} descripcion={sede ? `${sede.nombre}, ${sede.direccion}` : undefined} />
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Semana eventos={eventos} hoy={hoy} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <h2 className="font-titulo text-xl font-medium">Anuncios</h2>
          {avisos.length === 0 && <p className="text-sm text-piedra-500">No hay anuncios por ahora.</p>}
          {avisos.map((a) => (
            <Tarjeta key={a.id} className="relative p-5">
              {a.importante && <Liston className="right-5 h-8" />}
              <div className="flex flex-wrap items-center gap-2 pr-6">
                <h3 className="font-semibold">{a.titulo}</h3>
                {a.importante && <Etiqueta tono="liston">Importante</Etiqueta>}
              </div>
              <p className="mt-0.5 text-xs text-piedra-500">{fechaLarga(a.fechaPublicacion)}</p>
              <p className="mt-2 text-piedra-700">{a.contenido}</p>
            </Tarjeta>
          ))}
        </section>
        <section>
          <h2 className="mb-3 font-titulo text-xl font-medium">Horarios de reunión</h2>
          <Tarjeta>
            <ul className="divide-y divide-piedra-100">
              {horarios.length === 0 && <li className="p-4 text-sm text-piedra-500">La sede aún no registra horarios.</li>}
              {horarios.map((h) => (
                <li key={h.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
                  <span>
                    <span className="block font-semibold text-piedra-800">{h.dia}</span>
                    <span className="text-sm text-piedra-500">{h.tipo}</span>
                  </span>
                  <span className="font-titulo text-xl font-medium tabular-nums lining-nums text-piedra-900">{h.hora}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </section>
      </div>
    </>
  );
}
