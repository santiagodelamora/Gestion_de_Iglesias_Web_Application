"use client";

import { CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Boton, Modal } from "@/components/ui";
import { useIdioma } from "@/lib/i18n";

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

// Cambios de la página actual que todavía no se guardan (ver useCambiosSinGuardar)
interface CambiosPendientes {
  // Guarda lo pendiente; devuelve true si se guardó
  guardar: () => Promise<boolean>;
}

type OpcionSalida = "guardar" | "descartar" | "seguir";

interface Contexto {
  confirmar: (opciones: OpcionesConfirmacion) => Promise<boolean>;
  notificar: (texto: string) => void;
  // true si la página actual tiene cambios sin guardar
  cambiosPendientes: () => boolean;
  // Pregunta si guardar, descartar o seguir editando; devuelve true si ya se puede salir
  preguntarSalida: () => Promise<boolean>;
  registrarCambios: (cambios: CambiosPendientes | null) => void;
}

const ContextoConfirmacion = createContext<Contexto | null>(null);

export function ProveedorConfirmacion({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<(OpcionesConfirmacion & { responder: (ok: boolean) => void }) | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; clave: number } | null>(null);
  const cambios = useRef<CambiosPendientes | null>(null);
  const [salida, setSalida] = useState<{ responder: (sale: boolean) => void } | null>(null);
  const [guardandoSalida, setGuardandoSalida] = useState(false);
  const { t } = useIdioma();

  const confirmar = useCallback(
    (opciones: OpcionesConfirmacion) => new Promise<boolean>((responder) => setPendiente({ ...opciones, responder })),
    []
  );
  const notificar = useCallback((texto: string) => setAviso({ texto, clave: Date.now() }), []);
  const registrarCambios = useCallback((c: CambiosPendientes | null) => {
    cambios.current = c;
  }, []);
  const cambiosPendientes = useCallback(() => cambios.current !== null, []);
  const preguntarSalida = useCallback(() => new Promise<boolean>((responder) => setSalida({ responder })), []);
  const valor = useMemo(
    () => ({ confirmar, notificar, cambiosPendientes, preguntarSalida, registrarCambios }),
    [confirmar, notificar, cambiosPendientes, preguntarSalida, registrarCambios]
  );

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

  // Si guardar falla, la página se queda donde está y muestra su propio error
  const elegirSalida = async (opcion: OpcionSalida) => {
    if (!salida || guardandoSalida) return;
    let sale = opcion === "descartar";
    if (opcion === "guardar") {
      setGuardandoSalida(true);
      sale = (await cambios.current?.guardar()) ?? true;
      setGuardandoSalida(false);
    }
    salida.responder(sale);
    setSalida(null);
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
            <Boton variante="secundario" data-autofocus onClick={() => responder(false)}>{pendiente?.cancelar ?? t.comun.cancelar}</Boton>
            <Boton variante="peligro" onClick={() => responder(true)}>{pendiente?.accion}</Boton>
          </>
        }
      >
        <div className="text-sm leading-relaxed text-piedra-700">{pendiente?.mensaje}</div>
      </Modal>
      <Modal
        titulo={t.ui.salidaTitulo}
        abierto={!!salida}
        alCerrar={() => elegirSalida("seguir")}
        pie={
          <>
            {/* El foco empieza en la opción segura: Enter no descarta por accidente */}
            <Boton variante="secundario" data-autofocus disabled={guardandoSalida} onClick={() => elegirSalida("seguir")}>{t.ui.salidaSeguir}</Boton>
            <Boton variante="peligro" disabled={guardandoSalida} onClick={() => elegirSalida("descartar")}>{t.ui.salidaDescartar}</Boton>
            <Boton cargando={guardandoSalida} onClick={() => elegirSalida("guardar")}>{t.ui.salidaGuardar}</Boton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-piedra-700">{t.ui.salidaMensaje}</p>
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
              aria-label={t.ui.cerrarAviso}
              title={t.ui.cerrarAviso}
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

// La página avisa que tiene cambios sin guardar. Mientras los tenga, el menú, el
// selector de sede y cerrar sesión preguntan antes de salir (con la opción de
// guardarlos), y el navegador pregunta al recargar o cerrar la pestaña.
// guardar devuelve true si se guardó.
export function useCambiosSinGuardar(hayCambios: boolean, guardar: () => Promise<boolean>) {
  const { registrarCambios } = useConfirmacion();
  // Siempre la versión más reciente, con lo último que se escribió
  const guardarActual = useRef(guardar);
  useEffect(() => {
    guardarActual.current = guardar;
  });

  useEffect(() => {
    if (!hayCambios) return;
    const alSalir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", alSalir);
    registrarCambios({ guardar: () => guardarActual.current() });
    return () => {
      window.removeEventListener("beforeunload", alSalir);
      registrarCambios(null);
    };
  }, [hayCambios, registrarCambios]);
}
