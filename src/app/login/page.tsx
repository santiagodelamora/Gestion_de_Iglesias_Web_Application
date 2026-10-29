"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Boton, Campo, Entrada } from "@/components/ui";
import { nombreRol } from "@/lib/catalogos";
import { useDatos } from "@/lib/store";

export default function Login() {
  const { db, modo, usuario, entrar, entrarDemo, recuperar } = useDatos();
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Con sesión iniciada se pasa directo a la aplicación
  useEffect(() => {
    if (usuario) router.replace(usuario.rol === "miembro" ? "/inicio" : "/panel");
  }, [usuario, router]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError((await entrar(correo, contrasena)) ?? "");
    setEnviando(false);
  };

  const pedirEnlace = async () => {
    if (!correo.trim()) return;
    setEnviando(true);
    const fallo = await recuperar(correo);
    setEnviando(false);
    if (fallo) setError(fallo);
    else setEnviado(true);
  };

  return (
    <PantallaAcceso
      nombre={db.configuracion.nombre}
      logoUrl={db.configuracion.logoUrl}
      titulo={recuperando ? "Recupera tu acceso" : "Inicia sesión"}
      subtitulo={recuperando ? "Te enviaremos un enlace para restablecer tu contraseña." : "Con el correo y la contraseña de tu cuenta."}
    >
      {!recuperando ? (
        <form onSubmit={enviar} className="space-y-4">
          <Campo etiqueta="Correo electrónico">
            <Entrada type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.mx" />
          </Campo>
          <Campo etiqueta="Contraseña">
            <Entrada type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </Campo>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Boton type="submit" className="w-full py-2.5" disabled={enviando}>{enviando ? "Entrando…" : "Iniciar sesión"}</Boton>
          <button type="button" onClick={() => { setRecuperando(true); setError(""); }} className="w-full text-center text-sm font-semibold text-marca-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <Campo etiqueta="Correo electrónico">
            <Entrada type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.mx" />
          </Campo>
          {enviado && <p className="rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">Si el correo está registrado, recibirás el enlace en unos minutos.</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => { setRecuperando(false); setEnviado(false); setError(""); }}>Volver</Boton>
            <Boton className="flex-1" disabled={enviando} onClick={pedirEnlace}>Enviar enlace</Boton>
          </div>
        </div>
      )}

      {modo === "demo" && (
        <div className="mt-10 border-t border-piedra-200 pt-6">
          <p className="mb-3 text-sm text-piedra-600">
            Demostración: entra con uno de los roles.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {db.usuarios.map((u) => (
              <Boton key={u.id} variante="secundario" className="px-2 text-xs" onClick={() => entrarDemo(u.id)}>
                {nombreRol(u.rol)}
              </Boton>
            ))}
          </div>
        </div>
      )}
    </PantallaAcceso>
  );
}
