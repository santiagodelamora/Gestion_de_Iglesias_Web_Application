"use client";

import { Inbox, Lock, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

// Componentes básicos de interfaz compartidos por todos los módulos.

const unir = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Tarjeta({ className, ...p }: ComponentProps<"div">) {
  return <div className={unir("rounded-xl border border-piedra-200 bg-white", className)} {...p} />;
}

type Variante = "primario" | "secundario" | "peligro" | "fantasma";
const VARIANTES: Record<Variante, string> = {
  primario: "bg-marca-700 text-white hover:bg-marca-800",
  secundario: "border border-piedra-300 bg-white text-piedra-800 hover:border-piedra-400 hover:bg-piedra-50",
  peligro: "border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50",
  fantasma: "text-piedra-600 hover:bg-piedra-100 hover:text-piedra-900",
};

export function Boton({
  variante = "primario",
  className,
  ...p
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={unir(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTES[variante],
        className
      )}
      {...p}
    />
  );
}

// block: como inline dejarían bajo la línea el hueco de los descendentes
const campo =
  "block w-full rounded-lg border border-piedra-300 bg-white px-3 py-2 text-sm text-piedra-900 outline-none transition placeholder:text-piedra-400 hover:border-piedra-400 focus:border-marca-600 focus:ring-4 focus:ring-marca-600/15 disabled:bg-piedra-50 disabled:text-piedra-500";

export function Entrada({ className, ...p }: ComponentProps<"input">) {
  return <input className={unir(campo, className)} {...p} />;
}

export function AreaTexto({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={unir(campo, "min-h-24", className)} {...p} />;
}

export function Selector({ className, ...p }: ComponentProps<"select">) {
  return <select className={unir(campo, "cursor-pointer", className)} {...p} />;
}

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-piedra-700">{etiqueta}</span>
      {children}
    </label>
  );
}

type Tono = "gris" | "verde" | "rojo" | "ambar" | "marca" | "liston";
const TONOS: Record<Tono, string> = {
  gris: "bg-piedra-100 text-piedra-700 ring-piedra-500/15",
  verde: "bg-olivo-50 text-olivo-700 ring-olivo-600/20",
  rojo: "bg-red-50 text-red-700 ring-red-600/15",
  ambar: "bg-amber-50 text-amber-800 ring-amber-600/20",
  marca: "bg-marca-50 text-marca-700 ring-marca-600/15",
  liston: "bg-liston-50 text-liston-700 ring-liston-600/20",
};

export function Etiqueta({ tono = "gris", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={unir(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        TONOS[tono]
      )}
    >
      {children}
    </span>
  );
}

// Cinta con punta en V que cuelga del borde superior de su contenedor
// (que debe tener position: relative). Marca lo importante.
export function Liston({ className }: { className?: string }) {
  return <span aria-hidden className={unir("liston pointer-events-none absolute top-0 w-2.5 bg-liston-600", className ?? "left-5 h-6")} />;
}

export function Encabezado({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-titulo text-4xl font-medium leading-tight text-piedra-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-piedra-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Modal({
  titulo,
  abierto,
  alCerrar,
  children,
  pie,
}: {
  titulo: string;
  abierto: boolean;
  alCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}) {
  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex animate-aparecer items-center justify-center bg-piedra-950/45 p-4"
      onClick={alCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90vh] w-full max-w-lg animate-emerger overflow-y-auto rounded-xl bg-white shadow-2xl shadow-piedra-950/25"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-piedra-200 px-6 py-4">
          <h2 className="font-titulo text-[1.375rem] font-medium leading-tight text-piedra-900">{titulo}</h2>
          <button
            onClick={alCerrar}
            className="rounded-md p-1.5 text-piedra-400 transition hover:bg-piedra-100 hover:text-piedra-700"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {pie && <div className="flex justify-end gap-2 rounded-b-xl border-t border-piedra-200 bg-piedra-50 px-6 py-3.5">{pie}</div>}
      </div>
    </div>
  );
}

export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-marca-50/50 [&_tbody_tr:last-child_td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

export const th = "border-b border-piedra-200 px-4 py-2.5 text-xs font-semibold text-piedra-500";
export const td = "border-b border-piedra-100 px-4 py-3 text-piedra-700";

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <Inbox size={22} className="mb-2 text-piedra-300" />
      <p className="text-sm text-piedra-500">{children}</p>
    </div>
  );
}

export function SinAcceso() {
  return (
    <Tarjeta className="flex flex-col items-center p-12 text-center">
      <Lock size={22} className="mb-3 text-piedra-400" />
      <p className="font-titulo text-xl font-medium text-piedra-900">No tienes acceso a este módulo</p>
      <p className="mt-1 text-sm text-piedra-500">Tu rol no tiene permiso para ver esta información.</p>
    </Tarjeta>
  );
}

// Banda de cifras separadas por filetes, como los totales de un libro de registro.
// Las celdas crecen para llenar cada fila, así no quedan huecos con 4 o 5 cifras.
export function Indicadores({ children }: { children: ReactNode }) {
  return (
    <Tarjeta className="overflow-hidden">
      <dl className="-ml-px -mt-px flex flex-wrap">{children}</dl>
    </Tarjeta>
  );
}

export function Indicador({ titulo, valor, detalle }: { titulo: string; valor: ReactNode; detalle?: string }) {
  return (
    <div className="min-w-0 flex-1 basis-40 border-l border-t border-piedra-200 px-5 py-4">
      <dt className="text-sm text-piedra-600">{titulo}</dt>
      <dd className="mt-1 font-titulo text-4xl font-medium leading-none text-piedra-900 tabular-nums lining-nums">{valor}</dd>
      {detalle && <dd className="mt-2 text-xs text-piedra-500">{detalle}</dd>}
    </div>
  );
}
