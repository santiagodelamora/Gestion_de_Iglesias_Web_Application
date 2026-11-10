"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Boton, Campo, Entrada, EntradaContrasena } from "@/components/ui";
import { useIdioma } from "@/lib/i18n";
import { useDatos } from "@/lib/store";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import {
  LIMITE,
  useCamposTocados,
  validarContrasena,
  validarContrasenaNueva,
  validarCorreo,
  validarNombre,
} from "@/lib/validacion";

type Vista = "entrar" | "recuperar" | "registrar";
// Avisos de la vista de inicio de sesión sobre la confirmación del correo
type Nota = "correoConfirmado" | "confirmacionReenviada" | "enlaceVencido";

export default function Login() {
  const { modo, db, usuario, entrar, recuperar, registrar, reenviarConfirmacion } = useDatos();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState<Vista>("entrar");
  const [enviado, setEnviado] = useState(false);
  const [sinConfirmar, setSinConfirmar] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [nota, setNota] = useState<Nota | null>(null);
  const { t } = useIdioma();
  const tl = t.login;
  const campos = useCamposTocados<"nombre" | "correo" | "contrasena">();

  // Se recalculan en cada tecla. La contraseña del registro pide 8 caracteres;
  // la del inicio de sesión solo que no esté vacía.
  const errores = {
    nombre: validarNombre(nombre),
    correo: validarCorreo(correo),
    contrasena: vista === "registrar" ? validarContrasenaNueva(contrasena) : validarContrasena(contrasena),
  };
  const aviso = (campo: keyof typeof errores) => {
    const clave = errores[campo];
    return clave && campos.visible(campo) ? tl[clave] : undefined;
  };
  // Si algún campo es inválido, muestra todos sus avisos y no envía. Los
  // formularios llevan noValidate: estos avisos sustituyen a los del navegador.
  const hayErrores = (...lista: (keyof typeof errores)[]) => {
    campos.intentar();
    if (!lista.some((c) => errores[c])) return false;
    setError("");
    return true;
  };
  const alCambiar = (campo: keyof typeof errores, guardar: (valor: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    guardar(e.target.value);
    campos.marcar(campo, e.target.value);
  };

  const irA = (v: Vista) => {
    setVista(v);
    setEnviado(false);
    setError("");
    setSinConfirmar(false);
    setNota(null);
    setContrasena("");
    setConfirmacion("");
    campos.reiniciar();
  };

  // Con sesión iniciada se pasa directo a la aplicación
  useEffect(() => {
    if (usuario) router.replace(usuario.rol === "miembro" ? "/inicio" : "/panel");
  }, [usuario, router]);

  // El enlace del correo de confirmación pasa por Supabase, que confirma el
  // correo y regresa aquí con ?code=… (o con error_code si el enlace ya no
  // sirve). Si el enlace se abre en otro navegador, el cliente no puede abrir
  // la sesión con ese código, pero el correo ya quedó confirmado.
  useEffect(() => {
    if (modo === "demo") return;
    const url = new URL(window.location.href);
    const fragmento = new URLSearchParams(url.hash.slice(1));
    const conError = ["error", "error_code"].some((p) => url.searchParams.has(p) || fragmento.has(p));
    if (!conError && !url.searchParams.has("code")) return;
    const limpiar = () => window.history.replaceState(null, "", url.pathname);
    if (conError) {
      limpiar();
      setNota("enlaceVencido");
      return;
    }
    // getSession espera a que el cliente intente canjear el código
    supabaseNavegador().auth.getSession().then(({ data }) => {
      if (data.session) return; // con sesión, el efecto de arriba cambia de página
      limpiar();
      setNota("correoConfirmado");
    });
  }, [modo]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hayErrores("correo", "contrasena")) return;
    setNota(null);
    setEnviando(true);
    const fallo = await entrar(correo, contrasena);
    setError(fallo?.mensaje ?? "");
    setSinConfirmar(!!fallo?.sinConfirmar);
    // Si entra, el spinner sigue hasta que el efecto de arriba cambia de página
    if (fallo) setEnviando(false);
  };

  const reenviar = async () => {
    if (hayErrores("correo")) return;
    setReenviando(true);
    const fallo = await reenviarConfirmacion(correo);
    setReenviando(false);
    if (fallo) return setError(fallo);
    setError("");
    setSinConfirmar(false);
    setNota("confirmacionReenviada");
  };

  const pedirEnlace = async () => {
    if (hayErrores("correo")) return;
    setError("");
    setEnviando(true);
    const fallo = await recuperar(correo);
    setEnviando(false);
    if (fallo) setError(fallo);
    else setEnviado(true);
  };

  const crearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hayErrores("nombre", "correo", "contrasena")) return;
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
          <form onSubmit={crearCuenta} noValidate className="space-y-4">
            <Campo etiqueta={t.comun.nombreCompleto} error={aviso("nombre")}>
              <Entrada autoComplete="name" maxLength={LIMITE.nombre} value={nombre} onChange={alCambiar("nombre", setNombre)} placeholder={tl.nombrePlaceholder} />
            </Campo>
            <Campo etiqueta={t.comun.correoElectronico} error={aviso("correo")}>
              <Entrada type="email" autoComplete="email" maxLength={LIMITE.correo} value={correo} onChange={alCambiar("correo", setCorreo)} placeholder={tl.correoPlaceholder} />
            </Campo>
            {/* items-start: el aviso de un campo no estira al de al lado */}
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Campo etiqueta={tl.contrasena} error={aviso("contrasena")}>
                <EntradaContrasena autoComplete="new-password" maxLength={LIMITE.contrasena} value={contrasena} onChange={alCambiar("contrasena", setContrasena)} placeholder={tl.contrasenaPlaceholder} />
              </Campo>
              <Campo etiqueta={tl.confirmarContrasena}>
                <EntradaContrasena autoComplete="new-password" maxLength={LIMITE.contrasena} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
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
        <form onSubmit={enviar} noValidate className="space-y-4">
          <Campo etiqueta={t.comun.correoElectronico} error={aviso("correo")}>
            <Entrada type="email" autoComplete="email" maxLength={LIMITE.correo} value={correo} onChange={alCambiar("correo", setCorreo)} placeholder={tl.correoPlaceholder} />
          </Campo>
          <Campo etiqueta={tl.contrasena} error={aviso("contrasena")}>
            <EntradaContrasena autoComplete="current-password" maxLength={LIMITE.contrasena} value={contrasena} onChange={alCambiar("contrasena", setContrasena)} />
          </Campo>
          {nota === "enlaceVencido" ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{tl.enlaceVencido}</p>
          ) : nota === "correoConfirmado" ? (
            <p className="rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">{tl.correoConfirmado}</p>
          ) : nota === "confirmacionReenviada" ? (
            <p className="rounded-lg bg-olivo-50 px-3 py-2 text-sm text-olivo-700">{tl.confirmacionReenviada(correo.trim())}</p>
          ) : null}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {sinConfirmar && (
            <Boton type="button" variante="secundario" className="w-full py-2.5" cargando={reenviando} onClick={reenviar}>
              {reenviando ? tl.enviando : tl.reenviarConfirmacion}
            </Boton>
          )}
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
          <Campo etiqueta={t.comun.correoElectronico} error={aviso("correo")}>
            <Entrada type="email" maxLength={LIMITE.correo} value={correo} onChange={alCambiar("correo", setCorreo)} placeholder={tl.correoPlaceholder} />
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
