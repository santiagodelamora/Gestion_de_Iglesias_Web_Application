"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Boton } from "@/components/ui";
import { useIdioma } from "@/lib/i18n";
import { useDatos } from "@/lib/store";
import { supabaseNavegador } from "@/lib/supabase/cliente";

type Estado = "validando" | "confirmado" | "invalido";

// Destino del enlace del correo de verificación de las cuentas creadas con
// "Crear cuenta" (también del correo reenviado). Supabase verifica el correo
// antes de redirigir aquí con ?code=…, o con error_code si el enlace expiró o
// ya se usó. En el navegador donde se creó la cuenta el cliente canjea el
// código y abre la sesión; en otro navegador o dispositivo no puede, pero el
// correo ya quedó verificado y basta con iniciar sesión.
export default function Confirmar() {
  const { db, modo, usuario, recargar } = useDatos();
  const router = useRouter();
  const { t } = useIdioma();
  const tc = t.confirmar;
  const [estado, setEstado] = useState<Estado>("validando");
  const [conSesion, setConSesion] = useState(false);

  useEffect(() => {
    if (modo === "demo") {
      router.replace("/login");
      return;
    }
    const url = new URL(window.location.href);
    const fragmento = new URLSearchParams(url.hash.slice(1));
    const conError = ["error", "error_code"].some((p) => url.searchParams.has(p) || fragmento.has(p));
    // Abierta sin datos de un enlace: la raíz decide a dónde ir
    if (!conError && !url.searchParams.has("code")) {
      router.replace("/");
      return;
    }

    let vigente = true;
    // getSession espera a que el cliente intente canjear el código. Si lo
    // canjea, quita ?code= de la dirección: así se distingue la sesión abierta
    // por este enlace de una que ya existía en el navegador.
    supabaseNavegador().auth.getSession().then(async ({ data }) => {
      const abrioSesion = !conError && !!data.session && !new URL(window.location.href).searchParams.has("code");
      // Con sesión se carga el perfil para saber si la cuenta ya está activa
      if (abrioSesion) await recargar();
      if (!vigente) return;
      window.history.replaceState(null, "", url.pathname);
      setConSesion(abrioSesion);
      setEstado(conError ? "invalido" : "confirmado");
    });
    return () => {
      vigente = false;
    };
  }, [modo, router, recargar]);

  const textos = tc[estado];

  return (
    <PantallaAcceso nombre={db.configuracion.nombre} logoUrl={db.configuracion.logoUrl} titulo={textos.titulo} subtitulo={textos.subtitulo}>
      {estado === "validando" ? (
        <p className="text-sm text-piedra-600">{tc.espera}</p>
      ) : estado === "confirmado" ? (
        <div className="space-y-4">
          <p className="flex gap-2.5 rounded-lg bg-olivo-50 px-3 py-2.5 text-sm text-olivo-700">
            <CircleCheck size={18} className="mt-px shrink-0" aria-hidden="true" />
            {!conSesion ? tc.iniciaSesion : usuario?.activo ? tc.listo : tc.pendiente}
          </p>
          {conSesion ? (
            <Boton className="w-full py-2.5" onClick={() => router.replace("/")}>{tc.entrar}</Boton>
          ) : (
            <Boton className="w-full py-2.5" onClick={() => router.replace("/login")}>{t.login.iniciarSesion}</Boton>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="flex gap-2.5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <CircleAlert size={18} className="mt-px shrink-0" aria-hidden="true" />
            {tc.queHacer}
          </p>
          <Boton className="w-full py-2.5" onClick={() => router.replace("/login")}>{tc.irAIniciar}</Boton>
        </div>
      )}
    </PantallaAcceso>
  );
}
