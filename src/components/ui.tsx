"use client";

import { Eye, EyeOff, Inbox, LoaderCircle, Lock, X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useIdioma } from "@/lib/i18n";

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

// cargando: muestra un spinner antes del texto y desactiva el botón mientras dura la operación
export function Boton({
  variante = "primario",
  cargando = false,
  className,
  disabled,
  children,
  ...p
}: ComponentProps<"button"> & { variante?: Variante; cargando?: boolean }) {
  return (
    <button
      className={unir(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        cargando && "disabled:cursor-wait",
        VARIANTES[variante],
        className
      )}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...p}
    >
      {/* Con movimiento reducido el spinner queda fijo; el texto del botón indica la espera */}
      {cargando && <LoaderCircle aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
}

// block: como inline dejarían bajo la línea el hueco de los descendentes
const campo =
  "block w-full rounded-lg border border-piedra-300 bg-white px-3 py-2 text-sm text-piedra-900 outline-none transition placeholder:text-piedra-400 hover:border-piedra-400 focus:border-marca-600 focus:ring-4 focus:ring-marca-600/15 disabled:bg-piedra-50 disabled:text-piedra-500";

export function Entrada({ className, ...p }: ComponentProps<"input">) {
  return <input className={unir(campo, className)} {...p} />;
}

// Campo de contraseña con un botón de ojo para mostrar u ocultar lo escrito
export function EntradaContrasena({ className, ...p }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const { t } = useIdioma();
  const etiqueta = visible ? t.ui.ocultarContrasena : t.ui.mostrarContrasena;
  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={unir(campo, "pr-10", className)} {...p} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={etiqueta}
        aria-pressed={visible}
        title={etiqueta}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-piedra-500 transition-colors hover:text-piedra-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marca-500"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
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

// Modales abiertos, del más antiguo al más reciente: Escape cierra solo el de
// arriba (por ejemplo, una confirmación abierta sobre otro modal).
const modalesAbiertos: object[] = [];

const enfocables = "input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled)";

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
  const dialogo = useRef<HTMLDivElement>(null);
  const cerrar = useRef(alCerrar);
  const { t } = useIdioma();
  useEffect(() => {
    cerrar.current = alCerrar;
  });

  // Al abrir: enfoca el elemento marcado con data-autofocus, el primer campo o el
  // propio diálogo. Al cerrar: devuelve el foco a lo que lo abrió.
  useEffect(() => {
    if (!abierto) return;
    const este = {};
    modalesAbiertos.push(este);
    const anterior = document.activeElement as HTMLElement | null;
    const caja = dialogo.current;
    (caja?.querySelector<HTMLElement>("[data-autofocus]") ?? caja?.querySelector<HTMLElement>(enfocables) ?? caja)?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalesAbiertos.at(-1) === este) cerrar.current();
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      modalesAbiertos.splice(modalesAbiertos.indexOf(este), 1);
      anterior?.focus();
    };
  }, [abierto]);

  if (!abierto) return null;
  // Se dibuja en <body>: el <main> de cada página tiene una animación con
  // transform, y un ancestro con transform encierra a los elementos fixed (el
  // fondo solo cubría el contenido y el diálogo quedaba cortado arriba).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-aparecer items-center justify-center bg-piedra-950/45 p-4"
      onClick={alCerrar}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg animate-emerger overflow-y-auto rounded-xl bg-white shadow-2xl shadow-piedra-950/25 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-piedra-200 px-6 py-4">
          <h2 className="font-titulo text-[1.375rem] font-medium leading-tight text-piedra-900">{titulo}</h2>
          <button
            onClick={alCerrar}
            className="rounded-md p-1.5 text-piedra-400 transition hover:bg-piedra-100 hover:text-piedra-700"
            aria-label={t.comun.cerrar}
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {pie && <div className="flex flex-wrap justify-end gap-2 rounded-b-xl border-t border-piedra-200 bg-piedra-50 px-6 py-3.5">{pie}</div>}
      </div>
    </div>,
    document.body
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
  const { t } = useIdioma();
  return (
    <Tarjeta className="flex flex-col items-center p-12 text-center">
      <Lock size={22} className="mb-3 text-piedra-400" />
      <p className="font-titulo text-xl font-medium text-piedra-900">{t.ui.sinAccesoTitulo}</p>
      <p className="mt-1 text-sm text-piedra-500">{t.ui.sinAccesoTexto}</p>
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

// Las cifras recorren el tramo desde su valor anterior, despacio al final.
function useCifra(objetivo: number) {
  const [valor, setValor] = useState(objetivo);
  const anterior = useRef(0);
  useEffect(() => {
    const desde = anterior.current;
    anterior.current = objetivo;
    if (desde === objetivo || matchMedia("(prefers-reduced-motion: reduce)").matches) return setValor(objetivo);
    const inicio = performance.now();
    let cuadro = 0;
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / 700, 1);
      setValor(desde + (objetivo - desde) * (1 - (1 - t) ** 3));
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo]);
  return valor;
}

export function Indicador({
  titulo,
  valor: objetivo,
  formato = (n) => String(Math.round(n)),
  detalle,
}: {
  titulo: string;
  valor: number;
  formato?: (n: number) => string;
  detalle?: string;
}) {
  const valor = formato(useCifra(objetivo));
  return (
    <div className="min-w-0 flex-1 basis-40 border-l border-t border-piedra-200 px-5 py-4">
      <dt className="text-sm text-piedra-600">{titulo}</dt>
      <dd className="mt-1 font-titulo text-4xl font-medium leading-none text-piedra-900 tabular-nums lining-nums">{valor}</dd>
      {detalle && <dd className="mt-2 text-xs text-piedra-500">{detalle}</dd>}
    </div>
  );
}
