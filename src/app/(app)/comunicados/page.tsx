"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { AreaTexto, Boton, Campo, Encabezado, Entrada, Etiqueta, Liston, Modal, Selector, SinAcceso, Tarjeta, Vacio } from "@/components/ui";
import { fechaLarga } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import type { DatosAnuncio } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import type { Anuncio } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

export default function Comunicados() {
  const { db, usuario, repo, sedeId, hoy } = useDatos();
  const cargar = useCallback(() => repo.anuncios.listar(sedeId), [repo, sedeId]);
  const { datos: anuncios, cargando, error, recargar } = useCarga<Anuncio[]>(cargar, []);
  const [form, setForm] = useState<DatosAnuncio | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const permiso = acceso(usuario!.rol, "comunicados");
  if (!permiso) return <SinAcceso />;
  const puedeEditar = permiso === "total";

  // Quien solo consulta ve los anuncios ya publicados
  const lista = [...anuncios]
    .filter((a) => puedeEditar || a.fechaPublicacion <= hoy)
    .sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion));
  // Pastor y secretario solo administran los anuncios de su sede
  const administra = (a: Anuncio) => puedeEditar && (usuario!.rol === "administrador" || a.sedeId === usuario!.sedeId);

  const abrir = (datos: DatosAnuncio, id: string | null) => {
    setEditandoId(id);
    setErrorForm("");
    setForm(datos);
  };

  const guardar = async () => {
    if (!form) return;
    if (!form.titulo.trim()) return setErrorForm("El título es obligatorio.");
    setGuardando(true);
    const fallo = await intentar(() => (editandoId ? repo.anuncios.editar(editandoId, form) : repo.anuncios.crear(form)));
    setGuardando(false);
    if (fallo) return setErrorForm(fallo);
    setForm(null);
    recargar();
  };

  const eliminar = async (id: string) => {
    setErrorAccion(await intentar(() => repo.anuncios.eliminar(id)));
    recargar();
  };

  return (
    <>
      <Encabezado
        titulo="Comunicados y anuncios"
        descripcion="Los miembros ven estos avisos al iniciar sesión"
        acciones={
          puedeEditar && (
            <Boton onClick={() => abrir({ titulo: "", contenido: "", fechaPublicacion: hoy, importante: false, sedeId }, null)}>
              <Plus size={16} /> Nuevo anuncio
            </Boton>
          )
        }
      />
      {(error || errorAccion) && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error || errorAccion}</p>}
      <div className="space-y-3">
        {cargando && <Vacio>Cargando…</Vacio>}
        {!cargando && lista.length === 0 && <Tarjeta><Vacio>No hay anuncios publicados.</Vacio></Tarjeta>}
        {lista.map((a) => (
          <Tarjeta key={a.id} className="relative p-5">
            {a.importante && <Liston className="left-5 h-4" />}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{a.titulo}</h2>
                  {a.importante && <Etiqueta tono="liston">Importante</Etiqueta>}
                  {a.sedeId === null && <Etiqueta tono="marca">Todas las sedes</Etiqueta>}
                  {a.fechaPublicacion > hoy && <Etiqueta>Programado</Etiqueta>}
                </div>
                <p className="mt-1 text-xs text-piedra-500">{fechaLarga(a.fechaPublicacion)}{a.autorNombre && ` · ${a.autorNombre}`}</p>
              </div>
              {administra(a) && (
                <div className="flex gap-1">
                  <Boton variante="fantasma" aria-label="Editar" onClick={() => abrir({ titulo: a.titulo, contenido: a.contenido, fechaPublicacion: a.fechaPublicacion, importante: a.importante, sedeId: a.sedeId }, a.id)}>
                    <Pencil size={15} />
                  </Boton>
                  <Boton variante="fantasma" aria-label="Eliminar" className="hover:text-red-600" onClick={() => eliminar(a.id)}>
                    <Trash2 size={15} />
                  </Boton>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-piedra-700">{a.contenido}</p>
          </Tarjeta>
        ))}
      </div>

      <Modal
        titulo={editandoId ? "Editar anuncio" : "Nuevo anuncio"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={guardar}>Publicar</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Título"><Entrada value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Campo>
            <Campo etiqueta="Contenido"><AreaTexto value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha de publicación">
                <Entrada type="date" value={form.fechaPublicacion} onChange={(e) => setForm({ ...form, fechaPublicacion: e.target.value })} />
              </Campo>
              <Campo etiqueta="Dirigido a">
                <Selector
                  disabled={usuario!.rol !== "administrador"}
                  value={form.sedeId ?? "todas"}
                  onChange={(e) => setForm({ ...form, sedeId: e.target.value === "todas" ? null : e.target.value })}
                >
                  {db.sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  <option value="todas">Todas las sedes</option>
                </Selector>
              </Campo>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.importante} onChange={(e) => setForm({ ...form, importante: e.target.checked })} />
              Marcar como aviso importante
            </label>
            {errorForm && <p className="text-sm text-red-600">{errorForm}</p>}
          </>
        )}
      </Modal>
    </>
  );
}
