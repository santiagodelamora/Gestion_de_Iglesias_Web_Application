"use client";

import { CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Boton, Modal } from "@/components/ui";

// Confirmación antes de desactivar, anular, cancelar o eliminar algo, y aviso
// breve cuando la acción terminó. Las páginas los usan con useConfirmacion():
//   if (!(await confirmar({ titulo, mensaje, accion: "Desactivar" }))) return;
//   notificar("Se desactivó a Ana López.");

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: ReactNode;
  // Texto del botón que confirma; nombra la acción, no "Aceptar"
  accion: string;
  // Texto del botón que vuelve atrás sin hacer nada
  cancelar?: string;
}

interface Contexto {
  confirmar: (opciones: OpcionesConfirmacion) => Promise<boolean>;
  notificar: (texto: string) => void;
}

const ContextoConfirmacion = createContext<Contexto | null>(null);

export function ProveedorConfirmacion({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<(OpcionesConfirmacion & { responder: (ok: boolean) => void }) | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; clave: number } | null>(null);

  const confirmar = useCallback(
    (opciones: OpcionesConfirmacion) => new Promise<boolean>((responder) => setPendiente({ ...opciones, responder })),
    []
  );
  const notificar = useCallback((texto: string) => setAviso({ texto, clave: Date.now() }), []);
  const valor = useMemo(() => ({ confirmar, notificar }), [confirmar, notificar]);

  // El aviso se oculta solo a los pocos segundos
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const responder = (ok: boolean) => {
    pendiente?.responder(ok);
    setPendiente(null);
  };

  return (
    <ContextoConfirmacion.Provider value={valor}>
      {children}
      <Modal
        titulo={pendiente?.titulo ?? ""}
        abierto={!!pendiente}
        alCerrar={() => responder(false)}
        pie={
          <>
            {/* El foco empieza en la opción segura: Enter no confirma por accidente */}
            <Boton variante="secundario" data-autofocus onClick={() => responder(false)}>{pendiente?.cancelar ?? "Cancelar"}</Boton>
            <Boton variante="peligro" onClick={() => responder(true)}>{pendiente?.accion}</Boton>
          </>
        }
      >
        <div className="text-sm leading-relaxed text-piedra-700">{pendiente?.mensaje}</div>
      </Modal>
      {/* La región existe siempre para que los lectores de pantalla anuncien el aviso */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:left-auto sm:justify-end print:hidden">
        {aviso && (
          <div
            key={aviso.clave}
            className="pointer-events-auto flex max-w-sm animate-emerger items-center gap-2.5 rounded-lg bg-piedra-900 py-2.5 pl-3.5 pr-2 text-sm text-white shadow-xl shadow-piedra-950/25"
          >
            <CircleCheck size={16} className="shrink-0 text-olivo-300" aria-hidden="true" />
            <span className="flex-1">{aviso.texto}</span>
            <button
              onClick={() => setAviso(null)}
              aria-label="Cerrar aviso"
              title="Cerrar aviso"
              className="rounded-md p-1 text-piedra-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </ContextoConfirmacion.Provider>
  );
}

export function useConfirmacion() {
  const contexto = useContext(ContextoConfirmacion);
  if (!contexto) throw new Error("useConfirmacion debe usarse dentro de ProveedorConfirmacion.");
  return contexto;
}
