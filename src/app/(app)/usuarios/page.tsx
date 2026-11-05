"use client";

import { Pencil, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useConfirmacion } from "@/components/confirmacion";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tabla, Tarjeta, td, th, Vacio } from "@/components/ui";
import { ROLES } from "@/lib/catalogos";
import { useIdioma } from "@/lib/i18n";
import { acceso } from "@/lib/permisos";
import type { DatosInvitacion } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import type { Miembro, Rol, Usuario } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

export default function Usuarios() {
  const { db, modo, usuario, repo, sedeId } = useDatos();
  const cargar = useCallback(() => repo.usuarios.listar(), [repo]);
  const { datos: usuarios, cargando, error, recargar } = useCarga<Usuario[]>(cargar, []);
  const [nuevo, setNuevo] = useState<DatosInvitacion | null>(null);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  const { confirmar } = useConfirmacion();
  const { t } = useIdioma();
  const tu = t.usuarios;

  const permiso = acceso(usuario!.rol, "usuarios");
  if (!permiso) return <SinAcceso />;
  const puedeEditar = permiso === "total";
  const nombreSede = (id: string | null) => db.sedes.find((s) => s.id === id)?.nombre ?? tu.sinSede;

  const ejecutar = async (accion: () => Promise<unknown>, alTerminar: () => void) => {
    setGuardando(true);
    const fallo = await intentar(accion);
    setGuardando(false);
    if (fallo) return setErrorForm(fallo);
    alTerminar();
    recargar();
  };

  const invitar = () => {
    if (!nuevo?.nombre.trim() || !nuevo.correo.trim()) return setErrorForm(tu.obligatorios);
    const correo = nuevo.correo;
    ejecutar(() => repo.usuarios.invitar(nuevo), () => {
      setNuevo(null);
      setAviso(modo === "demo" ? tu.creadoDemo : tu.invitacionEnviada(correo));
    });
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const { rol, sedeId: sede, activo, miembroId } = editando;
    // Bloquear una cuenta activa deja a la persona sin acceso: se confirma antes
    const estabaActiva = usuarios.find((u) => u.id === editando.id)?.activo;
    if (
      estabaActiva &&
      !activo &&
      !(await confirmar({
        titulo: tu.confirmarTitulo,
        mensaje: tu.confirmarMensaje(editando.nombre),
        accion: tu.bloquear,
      }))
    )
      return;
    ejecutar(() => repo.usuarios.editar(editando.id, { rol, sedeId: sede, activo, miembroId }), () => setEditando(null));
  };

  return (
    <>
      <Encabezado
        titulo={tu.titulo}
        descripcion={tu.descripcion}
        acciones={
          puedeEditar && (
            <Boton onClick={() => { setErrorForm(""); setNuevo({ nombre: "", correo: "", rol: "secretario", sedeId }); }}>
              <Plus size={16} /> {tu.invitar}
            </Boton>
          )
        }
      />
      {aviso && <p className="mb-4 rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">{aviso}</p>}
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Tarjeta>
        <Tabla>
          <thead>
            <tr><th className={th}>{t.comun.nombre}</th><th className={th}>{t.comun.correo}</th><th className={th}>{tu.rol}</th><th className={th}>{t.comun.sede}</th><th className={th}>{t.comun.estado}</th>{puedeEditar && <th className={th}></th>}</tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className={`${td} font-medium text-piedra-900`}>{u.nombre}</td>
                <td className={td}>{u.correo}</td>
                <td className={td}><Etiqueta tono="marca">{t.catalogos.roles[u.rol]}</Etiqueta></td>
                <td className={td}>{u.rol === "administrador" ? tu.todas : nombreSede(u.sedeId)}</td>
                <td className={td}>{u.activo ? <Etiqueta tono="verde">{t.comun.activo}</Etiqueta> : <Etiqueta tono="ambar">{tu.pendiente}</Etiqueta>}</td>
                {puedeEditar && (
                  <td className={`${td} text-right`}>
                    {u.id !== usuario!.id && (
                      <Boton variante="fantasma" aria-label={tu.editarA(u.nombre)} title={t.comun.editar} onClick={() => { setErrorForm(""); setEditando({ ...u, sedeId: u.sedeId ?? db.sedes[0]?.id ?? null }); }}><Pencil size={15} /></Boton>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Tabla>
        {cargando && <Vacio>{t.comun.cargando}</Vacio>}
      </Tarjeta>

      <Modal
        titulo={tu.invitar}
        abierto={!!nuevo}
        alCerrar={() => setNuevo(null)}
        pie={<><Boton variante="secundario" onClick={() => setNuevo(null)}>{t.comun.cancelar}</Boton><Boton cargando={guardando} onClick={invitar}>{tu.enviarInvitacion}</Boton></>}
      >
        {nuevo && (
          <>
            <Campo etiqueta={t.comun.nombre}><Entrada value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Campo>
            <Campo etiqueta={t.comun.correo}><Entrada type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} /></Campo>
            <SelectoresRolSede rol={nuevo.rol} sedeId={nuevo.sedeId} alCambiar={(rol, s) => setNuevo({ ...nuevo, rol, sedeId: s, miembroId: s === nuevo.sedeId ? nuevo.miembroId : undefined })} />
            <VinculoMiembro sedeId={nuevo.sedeId} miembroId={nuevo.miembroId} alCambiar={(miembroId) => setNuevo({ ...nuevo, miembroId })} />
            <p className="text-xs text-piedra-500">{tu.avisoInvitacion}</p>
            {errorForm && <p className="text-sm text-red-600">{errorForm}</p>}
          </>
        )}
      </Modal>

      <Modal
        titulo={tu.editarTitulo(editando?.nombre ?? "")}
        abierto={!!editando}
        alCerrar={() => setEditando(null)}
        pie={<><Boton variante="secundario" onClick={() => setEditando(null)}>{t.comun.cancelar}</Boton><Boton cargando={guardando} onClick={guardarEdicion}>{t.comun.guardar}</Boton></>}
      >
        {editando && (
          <>
            <SelectoresRolSede rol={editando.rol} sedeId={editando.sedeId ?? ""} alCambiar={(rol, s) => setEditando({ ...editando, rol, sedeId: s, miembroId: s === editando.sedeId ? editando.miembroId : undefined })} />
            <VinculoMiembro sedeId={editando.sedeId ?? ""} miembroId={editando.miembroId} alCambiar={(miembroId) => setEditando({ ...editando, miembroId })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editando.activo} onChange={(e) => setEditando({ ...editando, activo: e.target.checked })} />
              {tu.cuentaActiva}
            </label>
            {errorForm && <p className="text-sm text-red-600">{errorForm}</p>}
          </>
        )}
      </Modal>
    </>
  );
}

function SelectoresRolSede({ rol, sedeId, alCambiar }: { rol: Rol; sedeId: string; alCambiar: (rol: Rol, sedeId: string) => void }) {
  const { db } = useDatos();
  const { t } = useIdioma();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta={t.usuarios.rol}>
        <Selector value={rol} onChange={(e) => alCambiar(e.target.value as Rol, sedeId)}>
          {ROLES.map((r) => <option key={r} value={r}>{t.catalogos.roles[r]}</option>)}
        </Selector>
      </Campo>
      <Campo etiqueta={t.comun.sede}>
        <Selector value={sedeId} onChange={(e) => alCambiar(rol, e.target.value)}>
          {db.sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Selector>
      </Campo>
    </div>
  );
}

// Liga la cuenta con su registro de miembro. Lo necesitan el coordinador (para
// saber qué ministerio coordina) y el rol Miembro (para ver su propio registro).
function VinculoMiembro({ sedeId, miembroId, alCambiar }: { sedeId: string; miembroId?: string; alCambiar: (miembroId?: string) => void }) {
  const { repo } = useDatos();
  const cargar = useCallback(() => (sedeId ? repo.miembros.listar(sedeId) : Promise.resolve([])), [repo, sedeId]);
  const { datos: miembros } = useCarga<Miembro[]>(cargar, []);
  const { t } = useIdioma();
  return (
    <Campo etiqueta={t.usuarios.miembroVinculado}>
      <Selector value={miembroId ?? ""} onChange={(e) => alCambiar(e.target.value || undefined)}>
        <option value="">{t.comun.ninguno}</option>
        {miembros.filter((m) => m.activo || m.id === miembroId).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </Selector>
    </Campo>
  );
}
