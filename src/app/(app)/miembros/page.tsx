"use client";

import { Pencil, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useConfirmacion } from "@/components/confirmacion";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tabla, Tarjeta, td, th, Vacio } from "@/components/ui";
import { fechaCorta } from "@/lib/formato";
import { useIdioma } from "@/lib/i18n";
import { acceso } from "@/lib/permisos";
import type { DatosMiembro } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import type { Miembro } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

type Filtro = "todos" | "activos" | "inactivos";
const vacio: DatosMiembro = { nombre: "", telefono: "", correo: "", fechaIngreso: "" };

export default function Miembros() {
  const { usuario, repo, sedeId, db, hoy } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId);
  const cargar = useCallback(() => repo.miembros.listar(sedeId), [repo, sedeId]);
  const { datos: miembros, cargando, error, recargar } = useCarga<Miembro[]>(cargar, []);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [editando, setEditando] = useState<Miembro | "nuevo" | null>(null);
  const [form, setForm] = useState(vacio);
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const { confirmar, notificar } = useConfirmacion();
  const { t } = useIdioma();
  const tm = t.miembros;

  const permiso = acceso(usuario!.rol, "miembros");
  const puedeEditar = permiso === "total";

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return miembros
      .filter((m) => (filtro === "todos" ? true : filtro === "activos" ? m.activo : !m.activo))
      .filter((m) => !q || m.nombre.toLowerCase().includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [miembros, busqueda, filtro]);

  if (!permiso || permiso === "perfil") return <SinAcceso />;

  const abrir = (m: Miembro | "nuevo") => {
    setEditando(m);
    setErrorForm("");
    setForm(m === "nuevo" ? { ...vacio, fechaIngreso: hoy } : { nombre: m.nombre, telefono: m.telefono, correo: m.correo, fechaIngreso: m.fechaIngreso });
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return setErrorForm(t.comun.nombreObligatorio);
    setGuardando(true);
    const fallo = await intentar(() =>
      editando === "nuevo" ? repo.miembros.crear(sedeId, form) : repo.miembros.editar((editando as Miembro).id, form)
    );
    setGuardando(false);
    if (fallo) return setErrorForm(fallo);
    setEditando(null);
    recargar();
  };

  // Baja lógica: el registro se conserva y puede reactivarse. Desactivar se
  // confirma antes porque el miembro sale de la lista de activos.
  const alternarEstado = async (m: Miembro) => {
    if (
      m.activo &&
      !(await confirmar({
        titulo: tm.confirmarTitulo,
        mensaje: tm.confirmarMensaje(m.nombre),
        accion: tm.desactivar,
      }))
    )
      return;
    setProcesandoId(m.id);
    const fallo = await intentar(() => repo.miembros.cambiarEstado(m.id, !m.activo));
    setProcesandoId(null);
    setErrorAccion(fallo);
    if (!fallo) notificar(m.activo ? tm.desactivado(m.nombre) : tm.reactivado(m.nombre));
    recargar();
  };

  return (
    <>
      <Encabezado
        titulo={tm.titulo}
        descripcion={tm.descripcion(miembros.filter((m) => m.activo).length, sede?.nombre ?? "")}
        acciones={puedeEditar && <Boton onClick={() => abrir("nuevo")}><Plus size={16} /> {tm.nuevo}</Boton>}
      />
      <Tarjeta>
        <div className="flex flex-wrap gap-3 border-b border-piedra-200 p-4">
          <div className="relative min-w-60 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-piedra-400" />
            <Entrada className="pl-9" placeholder={tm.buscar} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <Selector className="max-w-40" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
            <option value="activos">{tm.filtros.activos}</option>
            <option value="inactivos">{tm.filtros.inactivos}</option>
            <option value="todos">{tm.filtros.todos}</option>
          </Selector>
        </div>
        {errorAccion && <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorAccion}</p>}
        {error && <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Tabla>
          <thead>
            <tr>
              <th className={th}>{t.comun.nombre}</th>
              <th className={th}>{t.comun.telefono}</th>
              <th className={th}>{t.comun.correo}</th>
              <th className={th}>{tm.ingreso}</th>
              <th className={th}>{t.comun.estado}</th>
              {puedeEditar && <th className={th}></th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id} className="hover:bg-piedra-50">
                <td className={`${td} font-medium text-piedra-900`}>{m.nombre}</td>
                <td className={`${td} whitespace-nowrap`}>{m.telefono}</td>
                <td className={td}>{m.correo}</td>
                <td className={td}>{fechaCorta(m.fechaIngreso)}</td>
                <td className={td}>{m.activo ? <Etiqueta tono="verde">{t.comun.activo}</Etiqueta> : <Etiqueta>{t.comun.inactivo}</Etiqueta>}</td>
                {puedeEditar && (
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Boton variante="fantasma" onClick={() => abrir(m)} aria-label={tm.editarA(m.nombre)} title={t.comun.editar}><Pencil size={15} /></Boton>
                    <Boton
                      variante={m.activo ? "peligro" : "secundario"}
                      className="ml-1 py-1"
                      cargando={procesandoId === m.id}
                      onClick={() => alternarEstado(m)}
                    >
                      {m.activo ? tm.desactivar : tm.reactivar}
                    </Boton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Tabla>
        {cargando ? <Vacio>{t.comun.cargando}</Vacio> : lista.length === 0 && <Vacio>{tm.sinResultados}</Vacio>}
      </Tarjeta>

      <Modal
        titulo={editando === "nuevo" ? tm.nuevo : tm.editarTitulo}
        abierto={!!editando}
        alCerrar={() => setEditando(null)}
        pie={<><Boton variante="secundario" onClick={() => setEditando(null)}>{t.comun.cancelar}</Boton><Boton cargando={guardando} onClick={guardar}>{t.comun.guardar}</Boton></>}
      >
        <Campo etiqueta={t.comun.nombreCompleto}><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t.comun.telefono}><Entrada value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Campo>
          <Campo etiqueta={tm.fechaIngreso}><Entrada type="date" value={form.fechaIngreso} onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })} /></Campo>
        </div>
        <Campo etiqueta={t.comun.correoElectronico}><Entrada type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></Campo>
        {errorForm && <p className="text-sm text-red-600">{errorForm}</p>}
      </Modal>
    </>
  );
}
