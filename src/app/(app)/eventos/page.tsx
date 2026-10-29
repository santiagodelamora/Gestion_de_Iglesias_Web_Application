"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AreaTexto, Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tarjeta } from "@/components/ui";
import { TIPOS_EVENTO } from "@/lib/catalogos";
import { iso } from "@/lib/datos-ejemplo";
import { aFecha, fechaLarga, MESES } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Evento, Miembro, Ministerio, TipoEvento } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Form = Omit<Evento, "id" | "sedeId" | "cancelado">;

export default function Eventos() {
  const { usuario, repo, sedeId, hoy } = useDatos();
  const cargar = useCallback(async () => {
    const [eventos, ministerios, miembros] = await Promise.all([
      repo.eventos.listar(sedeId),
      // El rol Miembro no ve ministerios ni la lista de miembros
      usuario!.rol === "miembro" ? Promise.resolve([]) : repo.ministerios.listar(sedeId),
      usuario!.rol === "miembro" ? Promise.resolve([]) : repo.miembros.listar(sedeId),
    ]);
    return { eventos, ministerios, miembros };
  }, [repo, sedeId, usuario]);
  const { datos, error, recargar } = useCarga<{ eventos: Evento[]; ministerios: Ministerio[]; miembros: Miembro[] }>(
    cargar,
    { eventos: [], ministerios: [], miembros: [] }
  );
  const { eventos, ministerios, miembros } = datos;
  const misMinisterios = ministerios.filter((m) => usuario!.miembroId && m.coordinadorId === usuario!.miembroId);
  const [mes, setMes] = useState(() => hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState<Evento | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const permiso = acceso(usuario!.rol, "eventos");
  const idsMios = new Set(misMinisterios.map((m) => m.id));
  const puedeEditar = (e?: Evento) =>
    permiso === "total" || (permiso === "ministerio" && (!e || (!!e.ministerioId && idsMios.has(e.ministerioId))));

  const dias = useMemo(() => {
    const [a, m] = mes.split("-").map(Number);
    const primero = new Date(a, m - 1, 1);
    const inicio = new Date(primero);
    inicio.setDate(1 - primero.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return { fecha: iso(d), delMes: d.getMonth() === m - 1, dia: d.getDate() };
    });
  }, [mes]);

  if (!permiso) return <SinAcceso />;

  const moverMes = (delta: number) => {
    const d = aFecha(`${mes}-01`);
    d.setMonth(d.getMonth() + delta);
    setMes(iso(d).slice(0, 7));
  };

  const abrirNuevo = (fecha = hoy) => {
    setEditandoId(null);
    setErrorForm("");
    setForm({
      titulo: "",
      tipo: permiso === "ministerio" ? "Reunión de ministerio" : "Culto dominical",
      fecha,
      hora: "10:00",
      lugar: "Templo principal",
      descripcion: "",
      responsables: [],
      ministerioId: permiso === "ministerio" ? misMinisterios[0]?.id : undefined,
    });
  };

  const abrirEdicion = (e: Evento) => {
    setSeleccionado(null);
    setEditandoId(e.id);
    setErrorForm("");
    setForm({ titulo: e.titulo, tipo: e.tipo, fecha: e.fecha, hora: e.hora, lugar: e.lugar, descripcion: e.descripcion, responsables: e.responsables, ministerioId: e.ministerioId });
  };

  const guardar = async () => {
    if (!form) return;
    if (!form.titulo.trim()) return setErrorForm("El título es obligatorio.");
    if (!form.fecha || !form.hora) return setErrorForm("Indica la fecha y la hora.");
    setGuardando(true);
    const fallo = await intentar(() => (editandoId ? repo.eventos.editar(editandoId, form) : repo.eventos.crear(sedeId, form)));
    setGuardando(false);
    if (fallo) return setErrorForm(fallo);
    setForm(null);
    recargar();
  };

  // Los eventos no se borran: se cancelan y pueden reactivarse
  const alternarCancelado = async (e: Evento) => {
    const fallo = await intentar(() => repo.eventos.cambiarCancelado(e.id, !e.cancelado));
    setErrorAccion(fallo);
    if (!fallo) setSeleccionado({ ...e, cancelado: !e.cancelado });
    recargar();
  };

  const nombreMiembro = (id: string) => miembros.find((m) => m.id === id)?.nombre ?? "—";
  const [a, m] = mes.split("-").map(Number);
  const ministeriosElegibles = permiso === "ministerio" ? misMinisterios : ministerios;

  return (
    <>
      <Encabezado
        titulo="Eventos"
        descripcion="Cultos, reuniones y actividades de la sede"
        acciones={puedeEditar() && <Boton onClick={() => abrirNuevo()}><Plus size={16} /> Nuevo evento</Boton>}
      />
      {(error || errorAccion) && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error || errorAccion}</p>}
      <Tarjeta>
        <div className="flex items-center justify-between border-b border-piedra-200 p-4">
          <h2 className="font-titulo text-2xl font-medium capitalize">{MESES[m - 1]} {a}</h2>
          <div className="flex gap-1">
            <Boton variante="secundario" onClick={() => moverMes(-1)} aria-label="Mes anterior"><ChevronLeft size={16} /></Boton>
            <Boton variante="secundario" onClick={() => setMes(hoy.slice(0, 7))}>Hoy</Boton>
            <Boton variante="secundario" onClick={() => moverMes(1)} aria-label="Mes siguiente"><ChevronRight size={16} /></Boton>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-piedra-200 text-center text-xs font-semibold text-piedra-500">
          {/* Los domingos en carmín, como en los calendarios impresos */}
          {DIAS.map((d, i) => <div key={d} className={`py-2 ${i === 0 ? "text-liston-600" : ""}`}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((d, i) => {
            const delDia = eventos.filter((e) => e.fecha === d.fecha).sort((x, y) => x.hora.localeCompare(y.hora));
            return (
              <div
                key={d.fecha}
                className={`min-h-24 border-b border-r border-piedra-100 p-1.5 ${d.delMes ? "" : "bg-piedra-50/60 text-piedra-400"}`}
                onDoubleClick={() => puedeEditar() && abrirNuevo(d.fecha)}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                    d.fecha === hoy ? "bg-marca-700 font-semibold text-white" : i % 7 === 0 && d.delMes ? "font-semibold text-liston-600" : ""
                  }`}>
                  {d.dia}
                </span>
                <div className="mt-1 space-y-1">
                  {delDia.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSeleccionado(e)}
                      className={`block w-full truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] ${
                        e.cancelado ? "bg-piedra-100 text-piedra-400 line-through" : e.ministerioId ? "bg-olivo-50 text-olivo-800" : "bg-marca-50 text-marca-800"
                      }`}
                    >
                      {e.hora} {e.titulo}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Tarjeta>

      <Modal
        titulo={seleccionado?.titulo ?? ""}
        abierto={!!seleccionado}
        alCerrar={() => setSeleccionado(null)}
        pie={
          seleccionado && puedeEditar(seleccionado) && (
            <>
              <Boton variante={seleccionado.cancelado ? "secundario" : "peligro"} onClick={() => alternarCancelado(seleccionado)}>
                {seleccionado.cancelado ? "Reactivar evento" : "Cancelar evento"}
              </Boton>
              <Boton onClick={() => abrirEdicion(seleccionado)}>Editar</Boton>
            </>
          )
        }
      >
        {seleccionado && (
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Etiqueta tono="marca">{seleccionado.tipo}</Etiqueta>
              {seleccionado.cancelado && <Etiqueta tono="rojo">Cancelado</Etiqueta>}
            </div>
            <p ><strong>Fecha:</strong> {fechaLarga(seleccionado.fecha)}, {seleccionado.hora}</p>
            <p><strong>Lugar:</strong> {seleccionado.lugar}</p>
            {seleccionado.ministerioId && <p><strong>Ministerio:</strong> {ministerios.find((x) => x.id === seleccionado.ministerioId)?.nombre}</p>}
            {usuario!.rol !== "miembro" && (
              <p><strong>Responsables:</strong> {seleccionado.responsables.map(nombreMiembro).join(", ") || "Sin asignar"}</p>
            )}
            <p className="text-piedra-600">{seleccionado.descripcion}</p>
          </div>
        )}
      </Modal>

      <Modal
        titulo={editandoId ? "Editar evento" : "Nuevo evento"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={guardar}>Guardar</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Título"><Entrada value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Tipo">
                <Selector value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoEvento })}>
                  {TIPOS_EVENTO.map((t) => <option key={t}>{t}</option>)}
                </Selector>
              </Campo>
              <Campo etiqueta="Ministerio (opcional)">
                <Selector value={form.ministerioId ?? ""} onChange={(e) => setForm({ ...form, ministerioId: e.target.value || undefined })}>
                  {permiso !== "ministerio" && <option value="">Ninguno</option>}
                  {ministeriosElegibles.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </Selector>
              </Campo>
              <Campo etiqueta="Fecha"><Entrada type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Campo>
              <Campo etiqueta="Hora"><Entrada type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Campo>
            </div>
            <Campo etiqueta="Lugar"><Entrada value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} /></Campo>
            <Campo etiqueta="Responsables (Ctrl o Cmd para elegir varios)">
              <Selector
                multiple
                className="h-32"
                value={form.responsables}
                onChange={(e) => setForm({ ...form, responsables: [...e.target.selectedOptions].map((o) => o.value) })}
              >
                {miembros.filter((x) => x.activo).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </Selector>
            </Campo>
            <Campo etiqueta="Descripción"><AreaTexto value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></Campo>
            {errorForm && <p className="text-sm text-red-600">{errorForm}</p>}
          </>
        )}
      </Modal>
    </>
  );
}
