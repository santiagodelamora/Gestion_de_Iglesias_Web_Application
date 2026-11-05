"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Boton, Campo, Entrada, EntradaContrasena } from "@/components/ui";
import { useIdioma } from "@/lib/i18n";
import { useDatos } from "@/lib/store";

type Vista = "entrar" | "recuperar" | "registrar";

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
  const { t } = useIdioma();
  const tl = t.login;

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
    if (!correo.trim()) return setError(tl.escribeCorreo);
    setError("");
    setEnviando(true);
    const fallo = await recuperar(correo);
    setEnviando(false);
    if (fallo) setError(fallo);
    else setEnviado(true);
  };

  const crearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError(tl.escribeNombre);
    if (!correo.trim()) return setError(tl.escribeCorreo);
    if (contrasena.length < 8) return setError(tl.contrasenaCorta);
    if (contrasena !== confirmacion) return setError(tl.noCoinciden);
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
      titulo={tl.vistas[vista].titulo}
      subtitulo={tl.vistas[vista].subtitulo}
    >
      {vista === "registrar" ? (
        enviado ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">
              {tl.correoEnviado(correo.trim())}
            </p>
            <Boton variante="secundario" className="w-full py-2.5" onClick={() => irA("entrar")}>{tl.volverAIniciar}</Boton>
          </div>
        ) : (
          <form onSubmit={crearCuenta} className="space-y-4">
            <Campo etiqueta={t.comun.nombreCompleto}>
              <Entrada autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={tl.nombrePlaceholder} />
            </Campo>
            <Campo etiqueta={t.comun.correoElectronico}>
              <Entrada type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder={tl.correoPlaceholder} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta={tl.contrasena}>
                <EntradaContrasena autoComplete="new-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} placeholder={tl.contrasenaPlaceholder} />
              </Campo>
              <Campo etiqueta={tl.confirmarContrasena}>
                <EntradaContrasena autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
              </Campo>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Boton type="submit" className="w-full py-2.5" cargando={enviando}>{enviando ? tl.creandoCuenta : tl.crearCuenta}</Boton>
            <p className="text-center text-sm text-piedra-600">
              {tl.yaTienesCuenta}{" "}
              <button type="button" onClick={() => irA("entrar")} className="font-semibold text-marca-700 hover:underline">{tl.iniciaSesion}</button>
            </p>
          </form>
        )
      ) : vista === "entrar" ? (
        <form onSubmit={enviar} className="space-y-4">
          <Campo etiqueta={t.comun.correoElectronico}>
            <Entrada type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder={tl.correoPlaceholder} />
          </Campo>
          <Campo etiqueta={tl.contrasena}>
            <EntradaContrasena autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </Campo>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Boton type="submit" className="w-full py-2.5" cargando={enviando}>{enviando ? tl.entrando : tl.iniciarSesion}</Boton>
          <button type="button" onClick={() => irA("recuperar")} className="w-full text-center text-sm font-semibold text-marca-700 hover:underline">
            {tl.olvidaste}
          </button>
          <div className="flex items-center gap-3 pt-2 text-xs text-piedra-400">
            <span className="h-px flex-1 bg-piedra-200" />
            {tl.eresNuevo}
            <span className="h-px flex-1 bg-piedra-200" />
          </div>
          <Boton type="button" variante="secundario" className="w-full py-2.5" onClick={() => irA("registrar")}>{tl.crearCuenta}</Boton>
        </form>
      ) : (
        <div className="space-y-4">
          <Campo etiqueta={t.comun.correoElectronico}>
            <Entrada type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder={tl.correoPlaceholder} />
          </Campo>
          {enviado && <p className="rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">{tl.enlaceEnviado}</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => irA("entrar")}>{tl.volver}</Boton>
            <Boton className="flex-1" cargando={enviando} onClick={pedirEnlace}>{enviando ? tl.enviando : tl.enviarEnlace}</Boton>
          </div>
        </div>
      )}
    </PantallaAcceso>
  );
}
