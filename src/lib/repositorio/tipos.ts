import type {
  Anuncio,
  Aportacion,
  Asistencia,
  ConfiguracionIglesia,
  Evento,
  Horario,
  Miembro,
  Ministerio,
  Rol,
  Sede,
  Usuario,
} from "../types";

// Operaciones de datos de todos los módulos. Hay dos implementaciones: una
// sobre los datos de demostración y otra sobre Supabase.

export type DatosMiembro = Pick<Miembro, "nombre" | "telefono" | "correo" | "fechaIngreso">;
export type DatosSede = Pick<Sede, "nombre" | "direccion" | "telefono" | "correo">;
export type DatosHorario = Pick<Horario, "dia" | "hora" | "tipo">;
export interface DatosInvitacion {
  nombre: string;
  correo: string;
  rol: Rol;
  sedeId: string;
  miembroId?: string;
}
export type CambiosUsuario = Partial<Pick<Usuario, "rol" | "sedeId" | "activo" | "miembroId">>;
export type DatosEvento = Omit<Evento, "id" | "sedeId" | "cancelado">;
export type DatosMinisterio = Pick<Ministerio, "nombre" | "descripcion" | "coordinadorId">;
export type DatosAnuncio = Pick<Anuncio, "titulo" | "contenido" | "fechaPublicacion" | "importante" | "sedeId">;
export type DatosAportacion = Pick<Aportacion, "fecha" | "monto" | "concepto" | "metodo" | "miembroId">;

export interface Repositorio {
  miembros: {
    listar(sedeId: string): Promise<Miembro[]>;
    crear(sedeId: string, datos: DatosMiembro): Promise<void>;
    editar(id: string, datos: DatosMiembro): Promise<void>;
    cambiarEstado(id: string, activo: boolean): Promise<void>;
  };
  sedes: {
    crear(datos: DatosSede): Promise<void>;
    editar(id: string, datos: DatosSede): Promise<void>;
  };
  usuarios: {
    listar(): Promise<Usuario[]>;
    invitar(datos: DatosInvitacion): Promise<void>;
    editar(id: string, cambios: CambiosUsuario): Promise<void>;
    eliminar(id: string): Promise<void>;
  };
  configuracion: {
    guardar(datos: ConfiguracionIglesia): Promise<void>;
    subirLogo(archivo: File): Promise<string>;
  };
  horarios: {
    listar(sedeId: string): Promise<Horario[]>;
    crear(sedeId: string, datos: DatosHorario): Promise<void>;
    eliminar(id: string): Promise<void>;
  };
  eventos: {
    listar(sedeId: string): Promise<Evento[]>;
    crear(sedeId: string, datos: DatosEvento): Promise<void>;
    editar(id: string, datos: DatosEvento): Promise<void>;
    cambiarCancelado(id: string, cancelado: boolean): Promise<void>;
  };
  ministerios: {
    listar(sedeId: string): Promise<Ministerio[]>;
    crear(sedeId: string, datos: DatosMinisterio): Promise<void>;
    cambiarCoordinador(id: string, miembroId: string | undefined): Promise<void>;
    agregarIntegrante(id: string, miembroId: string): Promise<void>;
    quitarIntegrante(id: string, miembroId: string): Promise<void>;
  };
  asistencias: {
    // Solo las de eventos que el usuario puede gestionar
    listar(sedeId: string): Promise<Asistencia[]>;
    guardar(eventoId: string, registros: Asistencia[]): Promise<void>;
  };
  anuncios: {
    // Los de la sede y los dirigidos a todas las sedes
    listar(sedeId: string): Promise<Anuncio[]>;
    crear(datos: DatosAnuncio): Promise<void>;
    editar(id: string, datos: DatosAnuncio): Promise<void>;
    eliminar(id: string): Promise<void>;
  };
  aportaciones: {
    // Solo administrador, pastor y tesorero las pueden leer
    listar(sedeId: string): Promise<Aportacion[]>;
    crear(sedeId: string, datos: DatosAportacion): Promise<void>;
    cambiarAnulada(id: string, anulada: boolean): Promise<void>;
  };
}
