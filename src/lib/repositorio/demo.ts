import type { BaseDatos } from "../datos-ejemplo";
import { nuevoId } from "../ids";
import type { Ministerio, Usuario } from "../types";
import type { Repositorio } from "./tipos";

// Implementación sobre los datos de demostración en memoria
export function repositorioDemo(
  leer: () => BaseDatos,
  actualizar: (cambio: (db: BaseDatos) => BaseDatos) => void,
  usuarioActual: () => Usuario | null
): Repositorio {
  const listo = () => Promise.resolve();
  const cambiarMinisterio = (id: string, cambio: (m: Ministerio) => Ministerio) => {
    actualizar((db) => ({ ...db, ministerios: db.ministerios.map((m) => (m.id === id ? cambio(m) : m)) }));
    return listo();
  };

  return {
    miembros: {
      listar: async (sedeId) => leer().miembros.filter((m) => m.sedeId === sedeId).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      crear: (sedeId, d) => {
        actualizar((db) => ({ ...db, miembros: [...db.miembros, { id: nuevoId("m"), sedeId, activo: true, ...d }] }));
        return listo();
      },
      editar: (id, d) => {
        actualizar((db) => ({ ...db, miembros: db.miembros.map((m) => (m.id === id ? { ...m, ...d } : m)) }));
        return listo();
      },
      cambiarEstado: (id, activo) => {
        actualizar((db) => ({ ...db, miembros: db.miembros.map((m) => (m.id === id ? { ...m, activo } : m)) }));
        return listo();
      },
    },
    sedes: {
      crear: (d) => {
        actualizar((db) => ({ ...db, sedes: [...db.sedes, { id: nuevoId("s"), activa: true, ...d }] }));
        return listo();
      },
      editar: (id, d) => {
        actualizar((db) => ({ ...db, sedes: db.sedes.map((s) => (s.id === id ? { ...s, ...d } : s)) }));
        return listo();
      },
    },
    usuarios: {
      listar: async () => leer().usuarios,
      invitar: ({ nombre, correo, rol, sedeId, miembroId }) => {
        actualizar((db) => ({
          ...db,
          usuarios: [...db.usuarios, { id: nuevoId("u"), nombre, correo, rol, sedeId, miembroId, activo: true }],
        }));
        return listo();
      },
      editar: (id, c) => {
        actualizar((db) => ({ ...db, usuarios: db.usuarios.map((u) => (u.id === id ? { ...u, ...c } : u)) }));
        return listo();
      },
      eliminar: (id) => {
        actualizar((db) => ({ ...db, usuarios: db.usuarios.filter((u) => u.id !== id) }));
        return listo();
      },
    },
    configuracion: {
      guardar: (c) => {
        actualizar((db) => ({ ...db, configuracion: c }));
        return listo();
      },
      // En demostración el logo se guarda como dirección temporal del navegador
      subirLogo: async (archivo) => URL.createObjectURL(archivo),
    },
    horarios: {
      listar: async (sedeId) => leer().horarios.filter((h) => h.sedeId === sedeId),
      crear: (sedeId, d) => {
        actualizar((db) => ({ ...db, horarios: [...db.horarios, { id: nuevoId("h"), sedeId, ...d }] }));
        return listo();
      },
      eliminar: (id) => {
        actualizar((db) => ({ ...db, horarios: db.horarios.filter((h) => h.id !== id) }));
        return listo();
      },
    },
    eventos: {
      listar: async (sedeId) => leer().eventos.filter((e) => e.sedeId === sedeId),
      crear: (sedeId, d) => {
        actualizar((db) => ({ ...db, eventos: [...db.eventos, { id: nuevoId("e"), sedeId, cancelado: false, ...d }] }));
        return listo();
      },
      editar: (id, d) => {
        actualizar((db) => ({ ...db, eventos: db.eventos.map((e) => (e.id === id ? { ...e, ...d } : e)) }));
        return listo();
      },
      cambiarCancelado: (id, cancelado) => {
        actualizar((db) => ({ ...db, eventos: db.eventos.map((e) => (e.id === id ? { ...e, cancelado } : e)) }));
        return listo();
      },
    },
    ministerios: {
      listar: async (sedeId) => leer().ministerios.filter((m) => m.sedeId === sedeId),
      crear: (sedeId, d) => {
        const integrantes = d.coordinadorId ? [d.coordinadorId] : [];
        actualizar((db) => ({ ...db, ministerios: [...db.ministerios, { id: nuevoId("min"), sedeId, integrantes, ...d }] }));
        return listo();
      },
      cambiarCoordinador: (id, coordinadorId) => cambiarMinisterio(id, (m) => ({ ...m, coordinadorId })),
      agregarIntegrante: (id, miembroId) => cambiarMinisterio(id, (m) => ({ ...m, integrantes: [...m.integrantes, miembroId] })),
      quitarIntegrante: (id, miembroId) =>
        cambiarMinisterio(id, (m) => ({ ...m, integrantes: m.integrantes.filter((x) => x !== miembroId) })),
    },
    asistencias: {
      listar: async (sedeId) => {
        const db = leer();
        const ids = new Set(db.eventos.filter((e) => e.sedeId === sedeId).map((e) => e.id));
        return db.asistencias.filter((a) => ids.has(a.eventoId));
      },
      guardar: (eventoId, registros) => {
        actualizar((db) => ({
          ...db,
          asistencias: [
            ...db.asistencias.filter((a) => !(a.eventoId === eventoId && registros.some((r) => r.miembroId === a.miembroId))),
            ...registros,
          ],
        }));
        return listo();
      },
    },
    anuncios: {
      listar: async (sedeId) => {
        const db = leer();
        return db.anuncios
          .filter((a) => a.sedeId === null || a.sedeId === sedeId)
          .map((a) => ({ ...a, autorNombre: db.usuarios.find((u) => u.id === a.autorId)?.nombre ?? a.autorNombre }));
      },
      crear: (d) => {
        const autor = usuarioActual();
        actualizar((db) => ({
          ...db,
          anuncios: [{ id: nuevoId("an"), autorId: autor?.id ?? "", autorNombre: autor?.nombre ?? "", ...d }, ...db.anuncios],
        }));
        return listo();
      },
      editar: (id, d) => {
        actualizar((db) => ({ ...db, anuncios: db.anuncios.map((a) => (a.id === id ? { ...a, ...d } : a)) }));
        return listo();
      },
      eliminar: (id) => {
        actualizar((db) => ({ ...db, anuncios: db.anuncios.filter((a) => a.id !== id) }));
        return listo();
      },
    },
    aportaciones: {
      listar: async (sedeId) => leer().aportaciones.filter((a) => a.sedeId === sedeId),
      crear: (sedeId, d) => {
        const registradoPor = usuarioActual()?.id ?? "";
        actualizar((db) => ({ ...db, aportaciones: [...db.aportaciones, { id: nuevoId("a"), sedeId, registradoPor, ...d }] }));
        return listo();
      },
      cambiarAnulada: (id, anulada) => {
        actualizar((db) => ({ ...db, aportaciones: db.aportaciones.map((a) => (a.id === id ? { ...a, anulada } : a)) }));
        return listo();
      },
    },
  };
}
