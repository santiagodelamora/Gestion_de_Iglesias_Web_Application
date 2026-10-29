"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Boton, Campo, Entrada } from "@/components/ui";
import { useDatos } from "@/lib/store";
import { supabaseNavegador } from "@/lib/supabase/cliente";

// Destino de los enlaces de invitación y de recuperación de contraseña.
// Supabase abre la sesión a partir del enlace; aquí se define la contraseña.
export default function Restablecer() {
  const { db, modo, recargar } = useDatos();
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (modo === "demo") return;
    const supabase = supabaseNavegador();
    // Las invitaciones enviadas por el administrador llegan con la sesión en el
    // fragmento (#access_token=…). El cliente PKCE no lo lee solo, así que se
    // toma aquí; los enlaces de recuperación (?code=…) los procesa el cliente.
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    const access_token = fragmento.get("access_token");
    const refresh_token = fragmento.get("refresh_token");
    if (access_token && refresh_token) {
      window.history.replaceState(null, "", window.location.pathname);
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data }) => setListo(!!data.session));
    } else {
      supabase.auth.getSession().then(({ data }) => setListo(!!data.session));
    }
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => setListo(!!sesion));
    return () => data.subscription.unsubscribe();
  }, [modo]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (contrasena !== confirmacion) return setError("Las contraseñas no coinciden.");
    setGuardando(true);
    const { error: fallo } = await supabaseNavegador().auth.updateUser({ password: contrasena });
    setGuardando(false);
    if (fallo) return setError("No se pudo guardar la contraseña. Pide un enlace nuevo.");
    await recargar();
    router.replace("/");
  };

  return (
    <PantallaAcceso
      nombre={db.configuracion.nombre}
      logoUrl={db.configuracion.logoUrl}
      titulo="Define tu contraseña"
      subtitulo="Usa al menos 8 caracteres."
    >
      {modo === "demo" ? (
        <p className="text-sm text-piedra-600">Esta página se usa con Supabase configurado.</p>
      ) : !listo ? (
        <p className="text-sm text-piedra-600">Validando el enlace… Si no avanza, el enlace pudo haber expirado: solicita uno nuevo desde la pantalla de inicio de sesión.</p>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          <Campo etiqueta="Nueva contraseña">
            <Entrada type="password" autoComplete="new-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </Campo>
          <Campo etiqueta="Confirmar contraseña">
            <Entrada type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
          </Campo>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Boton type="submit" className="w-full py-2.5" disabled={guardando}>Guardar y entrar</Boton>
        </form>
      )}
    </PantallaAcceso>
  );
}
