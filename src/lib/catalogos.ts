import type { ConceptoAportacion, MetodoPago, Rol, TipoEvento } from "./types";

// Valores tal como se guardan en la base de datos. Lo que se muestra de cada uno
// sale del diccionario del idioma activo (t.catalogos).

export const CONCEPTOS: ConceptoAportacion[] = [
  "Diezmo",
  "Ofrenda",
  "Primicias",
  "Donativo especial",
  "Misiones",
  "Construcción",
  "Otro",
];

export const METODOS: MetodoPago[] = [
  "Efectivo",
  "Transferencia SPEI",
  "Tarjeta",
  "Depósito bancario",
  "Cheque",
];

export const TIPOS_EVENTO: TipoEvento[] = [
  "Culto dominical",
  "Culto de oración",
  "Estudio bíblico",
  "Reunión de ministerio",
  "Reunión administrativa",
  "Actividad especial",
  "Evangelismo",
];

export const ROLES: Rol[] = ["administrador", "pastor", "secretario", "tesorero", "coordinador", "miembro"];
