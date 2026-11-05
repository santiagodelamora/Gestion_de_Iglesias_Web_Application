"use client";

import { Languages, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useConfirmacion } from "@/components/confirmacion";
import { Logo } from "@/components/logo";
import { Boton, Campo, Encabezado, Entrada, Selector, SinAcceso, Tarjeta } from "@/components/ui";
import { IDIOMAS, textos, useIdioma, type Idioma } from "@/lib/i18n";
import { acceso } from "@/lib/permisos";
import type { DatosSede } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import type { Horario } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

// Valores que se guardan; lo que se muestra sale de t.catalogos.dias
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Configuracion() {
  const { db, usuario, repo, recargar, sedeId } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId)!;
  const cargarHorarios = useCallback(() => repo.horarios.listar(sedeId), [repo, sedeId]);
  const { datos: horarios, recargar: recargarHorarios } = useCarga<Horario[]>(cargarHorarios, []);

  const [general, setGeneral] = useState(db.configuracion);
  const [contacto, setContacto] = useState<DatosSede & { id: string }>(sede);
  const [nuevo, setNuevo] = useState({ dia: "Domingo", hora: "18:00", tipo: "" });
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  const { confirmar, notificar } = useConfirmacion();
  const { idioma, t, cambiarIdioma } = useIdioma();
  const tcf = t.configuracion;
  const dia = (d: string) => t.catalogos.dias[d] ?? d;
  if (contacto.id !== sede.id) setContacto(sede);

  const permiso = acceso(usuario!.rol, "configuracion");
  if (!permiso) return <SinAcceso />;
  const soloLectura = permiso !== "total";

  const avisar = (fallo: string, exito: string) => setMensaje(fallo ? { ok: false, texto: fallo } : { ok: true, texto: exito });

  const guardar = async () => {
    const { id, ...datosSede } = contacto;
    setGuardando(true);
    const fallo = await intentar(async () => {
      await repo.configuracion.guardar(general);
      await repo.sedes.editar(id, { ...datosSede, nombre: sede.nombre });
      await recargar();
    });
    setGuardando(false);
    avisar(fallo, tcf.guardados);
  };

  const subirLogo = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return avisar(tcf.logoNoImagen, "");
    if (f.size > 2 * 1024 * 1024) return avisar(tcf.logoPesado, "");
    setSubiendo(true);
    const fallo = await intentar(async () => {
      const logoUrl = await repo.configuracion.subirLogo(f);
      const nueva = { ...general, logoUrl };
      await repo.configuracion.guardar(nueva);
      setGeneral(nueva);
      await recargar();
    });
    setSubiendo(false);
    avisar(fallo, tcf.logoActualizado);
  };

  const agregarHorario = async () => {
    if (!nuevo.tipo.trim()) return;
    const fallo = await intentar(() => repo.horarios.crear(sedeId, nuevo));
    if (fallo) return avisar(fallo, "");
    setNuevo({ ...nuevo, tipo: "" });
    recargarHorarios();
  };

  // El horario se borra de verdad, así que se confirma antes
  const quitarHorario = async (h: Horario) => {
    const seguro = await confirmar({
      titulo: tcf.quitarHorario,
      mensaje: tcf.confirmarMensaje(`${dia(h.dia)} · ${h.hora} · ${h.tipo}`),
      accion: t.comun.quitar,
    });
    if (!seguro) return;
    const fallo = await intentar(() => repo.horarios.eliminar(h.id));
    if (fallo) return avisar(fallo, "");
    notificar(tcf.horarioQuitado);
    recargarHorarios();
  };

  // El idioma es una preferencia personal: se aplica al momento, sin "Guardar
  // cambios", y no depende del permiso sobre la configuración de la iglesia.
  // El aviso se escribe ya en el idioma nuevo.
  const elegirIdioma = (nuevo: Idioma) => {
    cambiarIdioma(nuevo);
    setMensaje(null);
    notificar(textos().configuracion.idiomaCambiado);
  };

  return (
    <>
      <Encabezado
        titulo={tcf.titulo}
        descripcion={tcf.descripcion}
        acciones={!soloLectura && <Boton cargando={guardando} onClick={guardar}>{tcf.guardarCambios}</Boton>}
      />
      {/* Fuera del fieldset: quien solo consulta la configuración también elige su idioma */}
      <Tarjeta className="mb-4 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Languages size={16} className="text-piedra-500" aria-hidden="true" /> {tcf.idioma}
          </h2>
          <p className="mt-1 text-sm text-piedra-600">{tcf.idiomaDescripcion}</p>
        </div>
        <label className="w-full sm:w-56">
          <span className="sr-only">{tcf.idiomaCampo}</span>
          <Selector value={idioma} onChange={(e) => elegirIdioma(e.target.value as Idioma)}>
            {IDIOMAS.map((i) => (
              <option key={i.id} value={i.id} lang={i.id}>{i.nombre}</option>
            ))}
          </Selector>
        </label>
      </Tarjeta>
      {mensaje && (
        <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${mensaje.ok ? "bg-olivo-50 text-olivo-700" : "bg-red-50 text-red-700"}`}>{mensaje.texto}</p>
      )}
      <fieldset disabled={soloLectura} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta className="space-y-4 p-5">
          <h2 className="font-semibold">{tcf.iglesia}</h2>
          <div className="flex items-center gap-4">
            <Logo url={general.logoUrl} tamano={64} />
            <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={(e) => subirLogo(e.target.files?.[0])} />
            {!soloLectura && (
              <Boton variante="secundario" type="button" disabled={subiendo} onClick={() => archivo.current?.click()}>
                <Upload size={16} /> {subiendo ? tcf.subiendo : tcf.cambiarLogo}
              </Boton>
            )}
          </div>
          <Campo etiqueta={tcf.nombreIglesia}><Entrada value={general.nombre} onChange={(e) => setGeneral({ ...general, nombre: e.target.value })} /></Campo>
          <Campo etiqueta={tcf.lema}><Entrada value={general.lema} onChange={(e) => setGeneral({ ...general, lema: e.target.value })} /></Campo>
        </Tarjeta>

        <Tarjeta className="space-y-4 p-5">
          <h2 className="font-semibold">{tcf.contacto(sede.nombre)}</h2>
          <Campo etiqueta={t.comun.direccion}><Entrada value={contacto.direccion} onChange={(e) => setContacto({ ...contacto, direccion: e.target.value })} /></Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta={t.comun.telefono}><Entrada value={contacto.telefono} onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })} /></Campo>
            <Campo etiqueta={t.comun.correo}><Entrada value={contacto.correo} onChange={(e) => setContacto({ ...contacto, correo: e.target.value })} /></Campo>
          </div>
        </Tarjeta>

        <Tarjeta className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">{tcf.horarios(sede.nombre)}</h2>
          <ul className="divide-y divide-piedra-100 rounded-lg border border-piedra-200">
            {horarios.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span><strong>{dia(h.dia)}</strong> · {h.hora} · {h.tipo}</span>
                {!soloLectura && (
                  <button type="button" aria-label={tcf.quitarHorario} title={tcf.quitarHorario} className="text-piedra-400 hover:text-red-600" onClick={() => quitarHorario(h)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
            {horarios.length === 0 && <li className="px-3 py-2 text-sm text-piedra-500">{tcf.sinHorarios}</li>}
          </ul>
          {!soloLectura && (
            <div className="mt-3 grid gap-2 sm:grid-cols-[140px_120px_1fr_auto]">
              <Selector value={nuevo.dia} onChange={(e) => setNuevo({ ...nuevo, dia: e.target.value })}>
                {DIAS.map((d) => <option key={d} value={d}>{dia(d)}</option>)}
              </Selector>
              <Entrada type="time" value={nuevo.hora} onChange={(e) => setNuevo({ ...nuevo, hora: e.target.value })} />
              <Entrada placeholder={tcf.tipoReunion} value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })} />
              {/* Sin tipo de reunión no hay horario que agregar */}
              <Boton type="button" disabled={!nuevo.tipo.trim()} onClick={agregarHorario}><Plus size={16} /> {t.comun.agregar}</Boton>
            </div>
          )}
        </Tarjeta>
      </fieldset>
    </>
  );
}
