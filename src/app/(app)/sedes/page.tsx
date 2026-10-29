"use client";

import { Building2, Mail, MapPin, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, SinAcceso, Tarjeta } from "@/components/ui";
import { acceso } from "@/lib/permisos";
import type { DatosSede } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import { intentar } from "@/lib/usar-carga";

export default function Sedes() {
  const { db, modo, usuario, repo, recargar, sedeId, cambiarSede } = useDatos();
  const [form, setForm] = useState<DatosSede | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!acceso(usuario!.rol, "sedes")) return <SinAcceso />;

  const abrir = (id: string | null, datos: DatosSede) => {
    setEditandoId(id);
    setForm(datos);
    setError("");
  };

  const guardar = async () => {
    if (!form?.nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    const fallo = await intentar(() => (editandoId ? repo.sedes.editar(editandoId, form) : repo.sedes.crear(form)));
    if (!fallo) await recargar();
    setGuardando(false);
    if (fallo) return setError(fallo);
    setForm(null);
  };

  return (
    <>
      <Encabezado
        titulo="Sedes"
        descripcion="Cada sede tiene sus propios miembros, eventos, ministerios y finanzas"
        acciones={<Boton onClick={() => abrir(null, { nombre: "", direccion: "", telefono: "", correo: "" })}><Plus size={16} /> Nueva sede</Boton>}
      />
      {db.sedes.length === 0 && (
        <Tarjeta className="p-8 text-center text-sm text-piedra-600">Aún no hay sedes. Registra la primera para empezar.</Tarjeta>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {db.sedes.map((s) => (
          <Tarjeta key={s.id} className={`p-5 ${s.id === sedeId ? "ring-2 ring-marca-200" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-marca-50 p-2 text-marca-700 ring-1 ring-inset ring-marca-600/15"><Building2 size={18} /></span>
                <h2 className="font-semibold">{s.nombre}</h2>
              </div>
              {s.activa ? <Etiqueta tono="verde">Activa</Etiqueta> : <Etiqueta>Inactiva</Etiqueta>}
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-piedra-600">
              <li className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0" /> {s.direccion || "Sin dirección"}</li>
              <li className="flex gap-2"><Phone size={15} className="mt-0.5" /> {s.telefono || "—"}</li>
              <li className="flex gap-2"><Mail size={15} className="mt-0.5" /> {s.correo || "—"}</li>
            </ul>
            {modo === "demo" && (
              <p className="mt-3 text-xs text-piedra-500">
                {db.miembros.filter((m) => m.sedeId === s.id && m.activo).length} miembros activos ·{" "}
                {db.ministerios.filter((m) => m.sedeId === s.id).length} ministerios
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <Boton variante="secundario" disabled={s.id === sedeId} onClick={() => cambiarSede(s.id)}>
                {s.id === sedeId ? "Sede activa" : "Trabajar en esta sede"}
              </Boton>
              <Boton variante="fantasma" onClick={() => abrir(s.id, { nombre: s.nombre, direccion: s.direccion, telefono: s.telefono, correo: s.correo })}>Editar</Boton>
            </div>
          </Tarjeta>
        ))}
      </div>

      <Modal
        titulo={editandoId ? "Editar sede" : "Nueva sede"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={guardar}>Guardar</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Nombre"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="Dirección"><Entrada value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Teléfono"><Entrada value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Campo>
              <Campo etiqueta="Correo"><Entrada type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></Campo>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </>
        )}
      </Modal>
    </>
  );
}
