import { invitarUsuario } from "@/app/(app)/usuarios/acciones";
import { supabaseNavegador } from "../supabase/cliente";
import type { Anuncio, Aportacion, Asistencia, Evento, Horario, Miembro, Ministerio, Usuario } from "../types";
import type { DatosAnuncio, Repositorio } from "./tipos";

// Implementación sobre Supabase. Todas las consultas usan la sesión del
// usuario, así que las políticas RLS deciden qué filas puede leer o cambiar.

type FilaMiembro = {
  id: string;
  sede_id: string;
  nombre: string;
  telefono: string;
  correo: string;
  fecha_ingreso: string;
  activo: boolean;
};
type FilaUsuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Usuario["rol"];
  sede_id: string | null;
  miembro_id: string | null;
  activo: boolean;
};
type FilaHorario = { id: string; sede_id: string; dia: string; hora: string; tipo: string };
type FilaEvento = {
  id: string;
  sede_id: string;
  ministerio_id: string | null;
  titulo: string;
  tipo: Evento["tipo"];
  fecha: string;
  hora: string;
  lugar: string;
  descripcion: string;
  cancelado: boolean;
  evento_responsables: { miembro_id: string }[];
};
type FilaMinisterio = {
  id: string;
  sede_id: string;
  nombre: string;
  descripcion: string;
  coordinador_id: string | null;
  ministerio_integrantes: { miembro_id: string }[];
};
type FilaAportacion = {
  id: string;
  sede_id: string;
  fecha: string;
  monto: number | string; // numeric llega como texto
  concepto: Aportacion["concepto"];
  metodo: Aportacion["metodo"];
  miembro_id: string | null;
  registrado_por: string | null;
  anulada: boolean;
};
type FilaAsistencia = { evento_id: string; miembro_id: string; presente: boolean };
type FilaAnuncio = {
  id: string;
  sede_id: string | null;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  importante: boolean;
  autor_id: string | null;
  autor_nombre: string;
};

export const aMiembro = (f: FilaMiembro): Miembro => ({
  id: f.id,
  sedeId: f.sede_id,
  nombre: f.nombre,
  telefono: f.telefono,
  correo: f.correo,
  fechaIngreso: f.fecha_ingreso,
  activo: f.activo,
});

export const aUsuario = (f: FilaUsuario): Usuario => ({
  id: f.id,
  nombre: f.nombre,
  correo: f.correo,
  rol: f.rol,
  sedeId: f.sede_id,
  miembroId: f.miembro_id ?? undefined,
  activo: f.activo,
});

const aHorario = (f: FilaHorario): Horario => ({
  id: f.id,
  sedeId: f.sede_id,
  dia: f.dia,
  hora: f.hora.slice(0, 5),
  tipo: f.tipo,
});

const aEvento = (f: FilaEvento): Evento => ({
  id: f.id,
  sedeId: f.sede_id,
  ministerioId: f.ministerio_id ?? undefined,
  titulo: f.titulo,
  tipo: f.tipo,
  fecha: f.fecha,
  hora: f.hora.slice(0, 5),
  lugar: f.lugar,
  descripcion: f.descripcion,
  responsables: f.evento_responsables.map((r) => r.miembro_id),
  cancelado: f.cancelado,
});

const aMinisterio = (f: FilaMinisterio): Ministerio => ({
  id: f.id,
  sedeId: f.sede_id,
  nombre: f.nombre,
  descripcion: f.descripcion,
  coordinadorId: f.coordinador_id ?? undefined,
  integrantes: f.ministerio_integrantes.map((i) => i.miembro_id),
});

const aAnuncio = (f: FilaAnuncio): Anuncio => ({
  id: f.id,
  sedeId: f.sede_id,
  titulo: f.titulo,
  contenido: f.contenido,
  fechaPublicacion: f.fecha_publicacion,
  importante: f.importante,
  autorId: f.autor_id ?? "",
  autorNombre: f.autor_nombre,
});

const aAportacion = (f: FilaAportacion): Aportacion => ({
  id: f.id,
  sedeId: f.sede_id,
  fecha: f.fecha,
  monto: Number(f.monto),
  concepto: f.concepto,
  metodo: f.metodo,
  miembroId: f.miembro_id ?? undefined,
  registradoPor: f.registrado_por ?? "",
  anulada: f.anulada,
});

const ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Traduce los errores de Supabase y PostgreSQL más comunes a un mensaje que diga
// qué pasó y qué hacer. Los demás dejan el original en la consola.
function mensajeError(error: { message: string; code?: string }) {
  if (/fetch|network|load failed/i.test(error.message)) {
    return "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  }
  switch (error.code) {
    case "42501":
      return "No tienes permiso para realizar esta acción.";
    case "23505":
      return "Ya existe un registro con esos datos.";
    case "23503":
      return "No se puede completar porque el registro está ligado a otros datos.";
    case "23502":
    case "23514":
    case "22P02":
    case "22007":
    case "22008":
      return "Algún dato no tiene un formato válido. Revisa el formulario e inténtalo de nuevo.";
    case "PGRST301":
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
  }
  console.error(error);
  return "No se pudo completar la acción. Inténtalo de nuevo en unos minutos.";
}

// Convierte el error de Supabase en una excepción con mensaje en español
function revisar<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) throw new Error(mensajeError(r.error));
  return r.data;
}

export function repositorioSupabase(): Repositorio {
  const db = supabaseNavegador();

  return {
    miembros: {
      async listar(sedeId) {
        const filas = revisar(await db.from("miembros").select("*").eq("sede_id", sedeId).order("nombre"));
        return (filas as FilaMiembro[]).map(aMiembro);
      },
      async crear(sedeId, d) {
        revisar(
          await db.from("miembros").insert({
            sede_id: sedeId,
            nombre: d.nombre,
            telefono: d.telefono,
            correo: d.correo,
            fecha_ingreso: d.fechaIngreso,
          })
        );
      },
      async editar(id, d) {
        revisar(
          await db
            .from("miembros")
            .update({ nombre: d.nombre, telefono: d.telefono, correo: d.correo, fecha_ingreso: d.fechaIngreso })
            .eq("id", id)
        );
      },
      async cambiarEstado(id, activo) {
        revisar(await db.from("miembros").update({ activo }).eq("id", id));
      },
    },

    sedes: {
      async crear(d) {
        revisar(await db.from("sedes").insert(d));
      },
      async editar(id, d) {
        revisar(await db.from("sedes").update(d).eq("id", id));
      },
    },

    usuarios: {
      async listar() {
        const filas = revisar(await db.from("usuarios").select("*").order("nombre"));
        return (filas as FilaUsuario[]).map(aUsuario);
      },
      async invitar(datos) {
        const r = await invitarUsuario(datos);
        if (r.error) throw new Error(r.error);
      },
      async editar(id, c) {
        const cambios: Record<string, unknown> = {};
        if (c.rol !== undefined) cambios.rol = c.rol;
        if (c.sedeId !== undefined) cambios.sede_id = c.sedeId;
        if (c.activo !== undefined) cambios.activo = c.activo;
        if ("miembroId" in c) cambios.miembro_id = c.miembroId ?? null;
        revisar(await db.from("usuarios").update(cambios).eq("id", id));
      },
    },

    configuracion: {
      async guardar(c) {
        revisar(
          await db
            .from("configuracion_iglesia")
            .update({ nombre: c.nombre, lema: c.lema, logo_url: c.logoUrl ?? null })
            .eq("id", 1)
        );
      },
      async subirLogo(archivo) {
        const extension = archivo.name.split(".").pop()?.toLowerCase() || "png";
        const ruta = `logo-${Date.now()}.${extension}`;
        const { error } = await db.storage.from("logos").upload(ruta, archivo, { contentType: archivo.type });
        if (error) throw new Error(mensajeError(error));
        return db.storage.from("logos").getPublicUrl(ruta).data.publicUrl;
      },
    },

    horarios: {
      async listar(sedeId) {
        const filas = revisar(await db.from("horarios").select("*").eq("sede_id", sedeId));
        return (filas as FilaHorario[])
          .map(aHorario)
          .sort((a, b) => ORDEN_DIAS.indexOf(a.dia) - ORDEN_DIAS.indexOf(b.dia) || a.hora.localeCompare(b.hora));
      },
      async crear(sedeId, d) {
        revisar(await db.from("horarios").insert({ sede_id: sedeId, ...d }));
      },
      async eliminar(id) {
        revisar(await db.from("horarios").delete().eq("id", id));
      },
    },

    eventos: {
      async listar(sedeId) {
        const filas = revisar(
          await db.from("eventos").select("*, evento_responsables(miembro_id)").eq("sede_id", sedeId).order("fecha")
        );
        return (filas as FilaEvento[]).map(aEvento);
      },
      async crear(sedeId, d) {
        const fila = revisar(
          await db
            .from("eventos")
            .insert({
              sede_id: sedeId,
              ministerio_id: d.ministerioId ?? null,
              titulo: d.titulo,
              tipo: d.tipo,
              fecha: d.fecha,
              hora: d.hora,
              lugar: d.lugar,
              descripcion: d.descripcion,
            })
            .select("id")
            .single()
        );
        await fijarResponsables((fila as { id: string }).id, d.responsables);
      },
      async editar(id, d) {
        revisar(
          await db
            .from("eventos")
            .update({
              ministerio_id: d.ministerioId ?? null,
              titulo: d.titulo,
              tipo: d.tipo,
              fecha: d.fecha,
              hora: d.hora,
              lugar: d.lugar,
              descripcion: d.descripcion,
            })
            .eq("id", id)
        );
        await fijarResponsables(id, d.responsables);
      },
      async cambiarCancelado(id, cancelado) {
        revisar(await db.from("eventos").update({ cancelado }).eq("id", id));
      },
    },

    ministerios: {
      async listar(sedeId) {
        const filas = revisar(
          await db.from("ministerios").select("*, ministerio_integrantes(miembro_id)").eq("sede_id", sedeId).order("nombre")
        );
        return (filas as FilaMinisterio[]).map(aMinisterio);
      },
      async crear(sedeId, d) {
        const fila = revisar(
          await db
            .from("ministerios")
            .insert({ sede_id: sedeId, nombre: d.nombre, descripcion: d.descripcion, coordinador_id: d.coordinadorId ?? null })
            .select("id")
            .single()
        );
        // El coordinador también es integrante
        if (d.coordinadorId) {
          revisar(
            await db.from("ministerio_integrantes").insert({ ministerio_id: (fila as { id: string }).id, miembro_id: d.coordinadorId })
          );
        }
      },
      async cambiarCoordinador(id, miembroId) {
        revisar(await db.from("ministerios").update({ coordinador_id: miembroId ?? null }).eq("id", id));
      },
      async agregarIntegrante(id, miembroId) {
        revisar(await db.from("ministerio_integrantes").insert({ ministerio_id: id, miembro_id: miembroId }));
      },
      async quitarIntegrante(id, miembroId) {
        revisar(await db.from("ministerio_integrantes").delete().eq("ministerio_id", id).eq("miembro_id", miembroId));
      },
    },

    asistencias: {
      async listar(sedeId) {
        const filas = revisar(
          await db.from("asistencias").select("evento_id, miembro_id, presente, eventos!inner(sede_id)").eq("eventos.sede_id", sedeId)
        );
        return (filas as unknown as FilaAsistencia[]).map(
          (f): Asistencia => ({ eventoId: f.evento_id, miembroId: f.miembro_id, presente: f.presente })
        );
      },
      async guardar(eventoId, registros) {
        if (registros.length === 0) return;
        revisar(
          await db.from("asistencias").upsert(
            registros.map((r) => ({ evento_id: eventoId, miembro_id: r.miembroId, presente: r.presente })),
            { onConflict: "evento_id,miembro_id" }
          )
        );
      },
    },

    anuncios: {
      async listar(sedeId) {
        const filas = revisar(
          await db
            .from("anuncios")
            .select("*")
            .or(`sede_id.is.null,sede_id.eq.${sedeId}`)
            .order("fecha_publicacion", { ascending: false })
        );
        return (filas as FilaAnuncio[]).map(aAnuncio);
      },
      async crear(d) {
        revisar(await db.from("anuncios").insert(filaAnuncio(d)));
      },
      async editar(id, d) {
        revisar(await db.from("anuncios").update(filaAnuncio(d)).eq("id", id));
      },
      async eliminar(id) {
        revisar(await db.from("anuncios").delete().eq("id", id));
      },
    },

    aportaciones: {
      async listar(sedeId) {
        const filas = revisar(await db.from("aportaciones").select("*").eq("sede_id", sedeId).order("fecha"));
        return (filas as FilaAportacion[]).map(aAportacion);
      },
      async crear(sedeId, d) {
        revisar(
          await db.from("aportaciones").insert({
            sede_id: sedeId,
            fecha: d.fecha,
            monto: d.monto,
            concepto: d.concepto,
            metodo: d.metodo,
            miembro_id: d.miembroId ?? null,
          })
        );
      },
      async cambiarAnulada(id, anulada) {
        revisar(await db.from("aportaciones").update({ anulada }).eq("id", id));
      },
    },
  };

  // Reemplaza la lista de responsables de un evento
  async function fijarResponsables(eventoId: string, responsables: string[]) {
    revisar(await db.from("evento_responsables").delete().eq("evento_id", eventoId));
    if (responsables.length) {
      revisar(
        await db.from("evento_responsables").insert(responsables.map((miembro_id) => ({ evento_id: eventoId, miembro_id })))
      );
    }
  }
}

const filaAnuncio = (d: DatosAnuncio) => ({
  sede_id: d.sedeId,
  titulo: d.titulo,
  contenido: d.contenido,
  fecha_publicacion: d.fechaPublicacion,
  importante: d.importante,
});
