"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Boton, Campo, Entrada, EntradaContrasena } from "@/components/ui";
import { useDatos } from "@/lib/store";

type Vista = "entrar" | "recuperar" | "registrar";

const TEXTOS: Record<Vista, { titulo: string; subtitulo: string }> = {
  entrar: { titulo: "Inicia sesión", subtitulo: "Con el correo y la contraseña de tu cuenta." },
  recuperar: { titulo: "Recupera tu acceso", subtitulo: "Te enviaremos un enlace para restablecer tu contraseña." },
  registrar: { titulo: "Crea tu cuenta", subtitulo: "Un administrador la activará y te asignará tu sede." },
};

export default function Login() {
  const { db, usuario, entrar, recuperar, registrar } = useDatos();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState<Vista>("entrar");
  const [enviado, setEnviado] = useState(false);

  const irA = (v: Vista) => {
    setVista(v);
    setEnviado(false);
    setError("");
    setContrasena("");
    setConfirmacion("");
  };

  // Con sesión iniciada se pasa directo a la aplicación
  useEffect(() => {
    if (usuario) router.replace(usuario.rol === "miembro" ? "/inicio" : "/panel");
  }, [usuario, router]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const fallo = await entrar(correo, contrasena);
    setError(fallo ?? "");
    // Si entra, el spinner sigue hasta que el efecto de arriba cambia de página
    if (fallo) setEnviando(false);
  };

  const pedirEnlace = async () => {
    if (!correo.trim()) return setError("Escribe tu correo electrónico.");
    setError("");
    setEnviando(true);
    const fallo = await recuperar(correo);
    setEnviando(false);
    if (fallo) setError(fallo);
    else setEnviado(true);
  };

  const crearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError("Escribe tu nombre.");
    if (!correo.trim()) return setError("Escribe tu correo electrónico.");
    if (contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (contrasena !== confirmacion) return setError("Las contraseñas no coinciden.");
    setEnviando(true);
    const resultado = await registrar(nombre, correo, contrasena);
    if (resultado.error) {
      setEnviando(false);
      return setError(resultado.error);
    }
    // Con sesión abierta, el efecto de arriba lleva al aviso de cuenta pendiente
    // y el spinner sigue hasta entonces
    if (!resultado.sesion) {
      setEnviando(false);
      setError("");
      setEnviado(true);
    }
  };

  return (
    <PantallaAcceso
      nombre={db.configuracion.nombre}
      logoUrl={db.configuracion.logoUrl}
      titulo={TEXTOS[vista].titulo}
      subtitulo={TEXTOS[vista].subtitulo}
    >
      {vista === "registrar" ? (
        enviado ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">
              Te enviamos un correo a <b>{correo.trim()}</b>. Abre el enlace para confirmarlo; después un administrador activará tu cuenta.
            </p>
            <Boton variante="secundario" className="w-full py-2.5" onClick={() => irA("entrar")}>Volver a iniciar sesión</Boton>
          </div>
        ) : (
          <form onSubmit={crearCuenta} className="space-y-4">
            <Campo etiqueta="Nombre completo">
              <Entrada autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellidos" />
            </Campo>
            <Campo etiqueta="Correo electrónico">
              <Entrada type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.mx" />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Contraseña">
                <EntradaContrasena autoComplete="new-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </Campo>
              <Campo etiqueta="Confirmar contraseña">
                <EntradaContrasena autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
              </Campo>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Boton type="submit" className="w-full py-2.5" cargando={enviando}>{enviando ? "Creando cuenta…" : "Crear cuenta"}</Boton>
            <p className="text-center text-sm text-piedra-600">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => irA("entrar")} className="font-semibold text-marca-700 hover:underline">Inicia sesión</button>
            </p>
          </form>
        )
      ) : vista === "entrar" ? (
        <form onSubmit={enviar} className="space-y-4">
          <Campo etiqueta="Correo electrónico">
            <Entrada type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.mx" />
          </Campo>
          <Campo etiqueta="Contraseña">
            <EntradaContrasena autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </Campo>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Boton type="submit" className="w-full py-2.5" cargando={enviando}>{enviando ? "Entrando…" : "Iniciar sesión"}</Boton>
          <button type="button" onClick={() => irA("recuperar")} className="w-full text-center text-sm font-semibold text-marca-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
          <div className="flex items-center gap-3 pt-2 text-xs text-piedra-400">
            <span className="h-px flex-1 bg-piedra-200" />
            ¿Eres nuevo?
            <span className="h-px flex-1 bg-piedra-200" />
          </div>
          <Boton type="button" variante="secundario" className="w-full py-2.5" onClick={() => irA("registrar")}>Crear cuenta</Boton>
        </form>
      ) : (
        <div className="space-y-4">
          <Campo etiqueta="Correo electrónico">
            <Entrada type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.mx" />
          </Campo>
          {enviado && <p className="rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">Si el correo está registrado, recibirás el enlace en unos minutos.</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => irA("entrar")}>Volver</Boton>
            <Boton className="flex-1" cargando={enviando} onClick={pedirEnlace}>{enviando ? "Enviando…" : "Enviar enlace"}</Boton>
          </div>
        </div>
      )}
    </PantallaAcceso>
  );
}
