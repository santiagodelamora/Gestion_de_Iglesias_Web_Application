"use client";

import { Pencil, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tabla, Tarjeta, td, th, Vacio } from "@/components/ui";
import { nombreRol, ROLES } from "@/lib/catalogos";
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

  const permiso = acceso(usuario!.rol, "usuarios");
  if (!permiso) return <SinAcceso />;
  const puedeEditar = permiso === "total";
  const nombreSede = (id: string | null) => db.sedes.find((s) => s.id === id)?.nombre ?? "Sin sede";

  const ejecutar = async (accion: () => Promise<unknown>, alTerminar: () => void) => {
    setGuardando(true);
    const fallo = await intentar(accion);
    setGuardando(false);
    if (fallo) return setErrorForm(fallo);
    alTerminar();
    recargar();
  };

  const invitar = () => {
    if (!nuevo?.nombre.trim() || !nuevo.correo.trim()) return setErrorForm("Nombre y correo son obligatorios.");
    const correo = nuevo.correo;
    ejecutar(() => repo.usuarios.invitar(nuevo), () => {
      setNuevo(null);
      setAviso(modo === "demo" ? "Usuario creado (demostración)." : `Se envió la invitación a ${correo}.`);
    });
  };

  const guardarEdicion = () => {
    if (!editando) return;
    const { rol, sedeId: sede, activo, miembroId } = editando;
    ejecutar(() => repo.usuarios.editar(editando.id, { rol, sedeId: sede, activo, miembroId }), () => setEditando(null));
  };

  return (
    <>
      <Encabezado
        titulo="Usuarios del sistema"
        descripcion="Cuentas de acceso, su rol y su sede"
        acciones={
          puedeEditar && (
            <Boton onClick={() => { setErrorForm(""); setNuevo({ nombre: "", correo: "", rol: "secretario", sedeId }); }}>
              <Plus size={16} /> Invitar usuario
            </Boton>
          )
        }
      />
      {aviso && <p className="mb-4 rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">{aviso}</p>}
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Tarjeta>
        <Tabla>
          <thead>
            <tr><th className={th}>Nombre</th><th className={th}>Correo</th><th className={th}>Rol</th><th className={th}>Sede</th><th className={th}>Estado</th>{puedeEditar && <th className={th}></th>}</tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className={`${td} font-medium text-piedra-900`}>{u.nombre}</td>
                <td className={td}>{u.correo}</td>
                <td className={td}><Etiqueta tono="marca">{nombreRol(u.rol)}</Etiqueta></td>
                <td className={td}>{u.rol === "administrador" ? "Todas" : nombreSede(u.sedeId)}</td>
                <td className={td}>{u.activo ? <Etiqueta tono="verde">Activo</Etiqueta> : <Etiqueta tono="ambar">Pendiente o bloqueado</Etiqueta>}</td>
                {puedeEditar && (
                  <td className={`${td} text-right`}>
                    {u.id !== usuario!.id && (
                      <Boton variante="fantasma" aria-label="Editar" onClick={() => { setErrorForm(""); setEditando({ ...u, sedeId: u.sedeId ?? db.sedes[0]?.id ?? null }); }}><Pencil size={15} /></Boton>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Tabla>
        {cargando && <Vacio>Cargando…</Vacio>}
      </Tarjeta>

      <Modal
        titulo="Invitar usuario"
        abierto={!!nuevo}
        alCerrar={() => setNuevo(null)}
        pie={<><Boton variante="secundario" onClick={() => setNuevo(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={invitar}>Enviar invitación</Boton></>}
      >
        {nuevo && (
          <>
            <Campo etiqueta="Nombre"><Entrada value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="Correo"><Entrada type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} /></Campo>
            <SelectoresRolSede rol={nuevo.rol} sedeId={nuevo.sedeId} alCambiar={(rol, s) => setNuevo({ ...nuevo, rol, sedeId: s, miembroId: s === nuevo.sedeId ? nuevo.miembroId : undefined })} />
            <VinculoMiembro sedeId={nuevo.sedeId} miembroId={nuevo.miembroId} alCambiar={(miembroId) => setNuevo({ ...nuevo, miembroId })} />
            <p className="text-xs text-piedra-500">La persona recibirá un correo con un enlace para crear su contraseña.</p>
            {errorForm && <p className="text-sm text-red-600">{errorForm}</p>}
          </>
        )}
      </Modal>

      <Modal
        titulo={`Editar ${editando?.nombre ?? ""}`}
        abierto={!!editando}
        alCerrar={() => setEditando(null)}
        pie={<><Boton variante="secundario" onClick={() => setEditando(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={guardarEdicion}>Guardar</Boton></>}
      >
        {editando && (
          <>
            <SelectoresRolSede rol={editando.rol} sedeId={editando.sedeId ?? ""} alCambiar={(rol, s) => setEditando({ ...editando, rol, sedeId: s, miembroId: s === editando.sedeId ? editando.miembroId : undefined })} />
            <VinculoMiembro sedeId={editando.sedeId ?? ""} miembroId={editando.miembroId} alCambiar={(miembroId) => setEditando({ ...editando, miembroId })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editando.activo} onChange={(e) => setEditando({ ...editando, activo: e.target.checked })} />
              Cuenta activa (desmarca para bloquear el acceso)
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
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Rol">
        <Selector value={rol} onChange={(e) => alCambiar(e.target.value as Rol, sedeId)}>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </Selector>
      </Campo>
      <Campo etiqueta="Sede">
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
  return (
    <Campo etiqueta="Registro de miembro vinculado">
      <Selector value={miembroId ?? ""} onChange={(e) => alCambiar(e.target.value || undefined)}>
        <option value="">Ninguno</option>
        {miembros.filter((m) => m.activo || m.id === miembroId).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </Selector>
    </Campo>
  );
}
