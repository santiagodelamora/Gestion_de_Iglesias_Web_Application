"use client";

import { Check, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirmacion } from "@/components/confirmacion";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Selector, SinAcceso, Tabla, Tarjeta, td, th, Vacio } from "@/components/ui";
import { fechaCorta } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Asistencia as RegistroAsistencia, Evento, Miembro, Ministerio } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

interface Datos {
  eventos: Evento[];
  ministerios: Ministerio[];
  miembros: Miembro[];
  asistencias: RegistroAsistencia[];
}

export default function Asistencia() {
  const { usuario, repo, sedeId, hoy } = useDatos();
  const permiso = acceso(usuario!.rol, "asistencia");
  const cargar = useCallback(async (): Promise<Datos> => {
    if (!permiso) return { eventos: [], ministerios: [], miembros: [], asistencias: [] };
    const [eventos, ministerios, miembros, asistencias] = await Promise.all([
      repo.eventos.listar(sedeId),
      repo.ministerios.listar(sedeId),
      repo.miembros.listar(sedeId),
      repo.asistencias.listar(sedeId),
    ]);
    return { eventos, ministerios, miembros, asistencias };
  }, [repo, sedeId, permiso]);
  const { datos, cargando, error, recargar } = useCarga<Datos>(cargar, { eventos: [], ministerios: [], miembros: [], asistencias: [] });
  const { eventos, ministerios, miembros, asistencias } = datos;
  const misMinisterios = useMemo(
    () => ministerios.filter((m) => usuario!.miembroId && m.coordinadorId === usuario!.miembroId),
    [ministerios, usuario]
  );

  // El coordinador solo pasa lista en los eventos de su ministerio
  const elegibles = useMemo(() => {
    const ids = new Set(misMinisterios.map((m) => m.id));
    return eventos
      .filter((e) => e.fecha <= hoy && !e.cancelado)
      .filter((e) => permiso !== "ministerio" || (e.ministerioId && ids.has(e.ministerioId)))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [eventos, hoy, permiso, misMinisterios]);

  const [eventoId, setEventoId] = useState(elegibles[0]?.id ?? "");
  const [busqueda, setBusqueda] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
  const evento = elegibles.find((e) => e.id === eventoId) ?? elegibles[0];

  // Lista de convocados: integrantes del ministerio o todos los miembros activos
  const convocados = useMemo(() => {
    if (!evento) return [];
    const min = ministerios.find((m) => m.id === evento.ministerioId);
    const base = min ? miembros.filter((m) => min.integrantes.includes(m.id)) : miembros.filter((m) => m.activo);
    return base.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [evento, ministerios, miembros]);

  const [marcas, setMarcas] = useState<Record<string, boolean>>({});
  const [cargadoPara, setCargadoPara] = useState("");
  // Hay marcas que todavía no se guardan
  const [sinGuardar, setSinGuardar] = useState(false);
  const { confirmar } = useConfirmacion();
  if (evento && cargadoPara !== evento.id) {
    const previas = Object.fromEntries(
      asistencias.filter((a) => a.eventoId === evento.id).map((a) => [a.miembroId, a.presente])
    );
    setMarcas(previas);
    setCargadoPara(evento.id);
    setGuardado(false);
    setErrorGuardar("");
    setSinGuardar(false);
  }

  // Al recargar o cerrar la pestaña con marcas pendientes, el navegador pregunta antes
  useEffect(() => {
    if (!sinGuardar) return;
    const alSalir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [sinGuardar]);

  const historial = useMemo(
    () =>
      elegibles.slice(0, 12).map((e) => {
        const regs = asistencias.filter((a) => a.eventoId === e.id);
        const presentes = regs.filter((a) => a.presente).length;
        return { evento: e, presentes, total: regs.length };
      }),
    [elegibles, asistencias]
  );

  if (!permiso) return <SinAcceso />;

  const presentes = convocados.filter((m) => marcas[m.id]).length;
  const visibles = convocados.filter((m) => m.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  // Cualquier cambio deja la lista pendiente de guardar y retira el aviso de "guardada"
  const marcar = (cambios: Record<string, boolean>) => {
    setMarcas({ ...marcas, ...cambios });
    setSinGuardar(true);
    setGuardado(false);
  };

  // Cambiar de evento descarta las marcas sin guardar, así que se pregunta antes
  const elegirEvento = async (id: string) => {
    if (id === evento?.id) return;
    if (
      sinGuardar &&
      !(await confirmar({
        titulo: "Asistencia sin guardar",
        mensaje: "Marcaste asistencia que aún no guardas. Si cambias de evento, se perderán esas marcas.",
        accion: "Descartar y cambiar",
        cancelar: "Seguir pasando lista",
      }))
    )
      return;
    setEventoId(id);
  };

  const guardar = async () => {
    if (!evento) return;
    setGuardando(true);
    const fallo = await intentar(() =>
      repo.asistencias.guardar(
        evento.id,
        convocados.map((m) => ({ eventoId: evento.id, miembroId: m.id, presente: !!marcas[m.id] }))
      )
    );
    setGuardando(false);
    setErrorGuardar(fallo);
    setGuardado(!fallo);
    if (!fallo) setSinGuardar(false);
    recargar();
  };

  return (
    <>
      <Encabezado titulo="Control de asistencia" descripcion="Selecciona el evento y marca a los presentes" />
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Tarjeta className="lg:col-span-3">
          <div className="grid gap-3 border-b border-piedra-200 p-4 sm:grid-cols-2">
            <Campo etiqueta="Evento">
              <Selector value={evento?.id ?? ""} onChange={(e) => elegirEvento(e.target.value)}>
                {elegibles.map((e) => (
                  <option key={e.id} value={e.id}>{fechaCorta(e.fecha)} · {e.titulo}</option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Buscar">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-piedra-400" />
                <Entrada className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre" />
              </div>
            </Campo>
          </div>
          {evento ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <strong>{presentes}</strong> presentes · <strong>{convocados.length - presentes}</strong> ausentes
                </span>
                <div className="flex gap-2">
                  <Boton variante="secundario" onClick={() => marcar(Object.fromEntries(convocados.map((m) => [m.id, true])))}>Todos presentes</Boton>
                  <Boton cargando={guardando} onClick={guardar}>Guardar asistencia</Boton>
                </div>
              </div>
              {guardado && <p className="mx-4 mb-3 rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">Asistencia guardada.</p>}
              {errorGuardar && <p className="mx-4 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorGuardar}</p>}
              <ul className="max-h-[480px] divide-y divide-piedra-100 overflow-y-auto">
                {visibles.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm">{m.nombre}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => marcar({ [m.id]: true })}
                        aria-pressed={!!marcas[m.id]}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${marcas[m.id] ? "bg-marca-700 text-white" : "bg-piedra-100 text-piedra-600 hover:bg-piedra-200"}`}
                      >
                        <Check size={14} /> Presente
                      </button>
                      <button
                        onClick={() => marcar({ [m.id]: false })}
                        aria-pressed={!marcas[m.id]}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${!marcas[m.id] ? "bg-piedra-600 text-white" : "bg-piedra-100 text-piedra-600 hover:bg-piedra-200"}`}
                      >
                        <X size={14} /> Ausente
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : cargando ? (
            <Vacio>Cargando…</Vacio>
          ) : (
            <p className="p-6 text-sm text-piedra-500">No hay eventos disponibles para pasar lista.</p>
          )}
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <h2 className="border-b border-piedra-200 p-4 font-semibold">Historial reciente</h2>
          <Tabla>
            <thead>
              <tr><th className={th}>Evento</th><th className={th}>Presentes</th></tr>
            </thead>
            <tbody>
              {historial.map(({ evento: e, presentes: p, total }) => (
                <tr key={e.id} className="cursor-pointer hover:bg-piedra-50" onClick={() => elegirEvento(e.id)}>
                  <td className={td}>
                    <p className="font-medium text-piedra-900">{e.titulo}</p>
                    <p className="text-xs text-piedra-500">{fechaCorta(e.fecha)}</p>
                  </td>
                  <td className={td}>
                    {total ? <Etiqueta tono={p / total >= 0.7 ? "verde" : "ambar"}>{p} de {total}</Etiqueta> : <Etiqueta>Sin registro</Etiqueta>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </Tarjeta>
      </div>
    </>
  );
}
