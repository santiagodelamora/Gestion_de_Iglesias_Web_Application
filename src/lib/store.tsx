"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { generarDatos, iso, type BaseDatos } from "./datos-ejemplo";
import { textos, useIdioma } from "./i18n";
import { repositorioDemo } from "./repositorio/demo";
import { aUsuario, repositorioSupabase } from "./repositorio/supabase";
import type { Repositorio } from "./repositorio/tipos";
import { supabaseNavegador } from "./supabase/cliente";
import { modoDemo } from "./supabase/config";
import type { Sede, Usuario } from "./types";

export { nuevoId } from "./ids";

// Estado global de la aplicación. Funciona en dos modos:
// - demo: datos ficticios en memoria y usuarios de demostración
// - supabase: sesión real; los módulos leen y escriben con `repo`
// En modo supabase, `db` solo trae configuración, sedes y el perfil. Cada módulo
// carga sus datos con `repo`, igual en los dos modos.

interface Contexto {
  modo: "demo" | "supabase";
  db: BaseDatos;
  actualizar: (cambio: (db: BaseDatos) => BaseDatos) => void;
  repo: Repositorio;
  usuario: Usuario | null;
  entrar: (correo: string, contrasena: string) => Promise<FalloEntrada | null>;
  entrarDemo: (usuarioId: string) => void;
  recuperar: (correo: string) => Promise<string | null>;
  reenviarConfirmacion: (correo: string) => Promise<string | null>;
  registrar: (nombre: string, correo: string, contrasena: string) => Promise<{ error?: string; sesion?: boolean }>;
  cerrarSesion: () => Promise<void>;
  recargar: () => Promise<void>;
  sedeId: string;
  cambiarSede: (sedeId: string) => void;
  hoy: string;
}

// sinConfirmar: la contraseña es correcta pero el correo no se ha confirmado;
// la pantalla ofrece reenviar el correo de confirmación
export interface FalloEntrada {
  mensaje: string;
  sinConfirmar?: boolean;
}

const Ctx = createContext<Contexto | null>(null);
const CLAVE_SESION = "gi-sesion";

const BASE_VACIA: BaseDatos = {
  configuracion: { nombre: "", lema: "" },
  sedes: [],
  usuarios: [],
  miembros: [],
  eventos: [],
  asistencias: [],
  ministerios: [],
  aportaciones: [],
  anuncios: [],
  horarios: [],
};

// Traduce el error de signUp a un mensaje para la persona, en el idioma activo.
// Se revisa primero el código de Supabase y, si no viene, el texto del mensaje.
const mensajeErrorRegistro = (error: AuthError) => {
  const t = textos().auth;
  // Sin respuesta del servidor: sin internet, URL mal escrita o proyecto pausado
  if (isAuthRetryableFetchError(error)) return t.sinConexion;
  const codigo = error.code ?? "";
  if (["signup_disabled", "email_provider_disabled"].includes(codigo) || /disabled|not allowed/i.test(error.message)) {
    return t.soloInvitacion;
  }
  if (["user_already_exists", "email_exists"].includes(codigo)) return t.cuentaExiste;
  if (codigo === "email_address_invalid") return t.correoInvalido;
  if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(codigo)) return t.limiteCorreos;
  if (codigo === "email_address_not_authorized") return t.correoNoAutorizado;
  if (codigo === "weak_password" || /password/i.test(error.message)) return t.contrasenaInvalida;
  return t.noSeCreo;
};

// Traduce el error de signInWithPassword. Supabase solo responde
// email_not_confirmed si la contraseña es correcta, así que distinguirlo no
// revela qué correos están registrados.
const falloEntrada = (error: AuthError): FalloEntrada => {
  const t = textos().auth;
  if (isAuthRetryableFetchError(error)) return { mensaje: t.sinConexion };
  switch (error.code) {
    case "invalid_credentials":
      return { mensaje: t.credenciales };
    case "email_not_confirmed":
      return { mensaje: t.correoSinConfirmar, sinConfirmar: true };
    case "over_request_rate_limit":
      return { mensaje: t.demasiadosIntentos };
  }
  console.error("Error al iniciar sesión:", error);
  return { mensaje: t.noSeEntro };
};

// Los correos de confirmación regresan a /login (agregarla en Redirect URLs)
const urlConfirmacion = () => `${window.location.origin}/login`;

const leerSesionGuardada = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION) ?? "null") as { usuarioId?: string; sedeId?: string } | null;
  } catch {
    return null;
  }
};

const guardarSesion = (usuarioId: string | null, sedeId: string) => {
  try {
    if (usuarioId) localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuarioId, sedeId }));
    else localStorage.removeItem(CLAVE_SESION);
  } catch {
    // almacenamiento no disponible
  }
};

export function ProveedorDatos({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<BaseDatos | null>(null);
  const dbRef = useRef<BaseDatos>(BASE_VACIA);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [sedeId, setSedeId] = useState("");
  const [hoy, setHoy] = useState("");
  const { t } = useIdioma();

  // El atributo lang del documento sigue al idioma elegido (lectores de pantalla y corrector)
  useEffect(() => {
    document.documentElement.lang = t.locale;
  }, [t]);

  // dbRef siempre tiene la versión más reciente, para leer justo después de un cambio
  const fijarDb = useCallback((nueva: BaseDatos) => {
    dbRef.current = nueva;
    setDb(nueva);
  }, []);

  const actualizar = useCallback(
    (cambio: (db: BaseDatos) => BaseDatos) => fijarDb(cambio(dbRef.current)),
    [fijarDb]
  );

  // Carga de perfil, sedes y configuración desde Supabase
  const recargar = useCallback(async () => {
    if (modoDemo) return;
    const supabase = supabaseNavegador();
    const { data: cfg } = await supabase.from("configuracion_iglesia").select("*").eq("id", 1).maybeSingle();
    const configuracion = {
      nombre: cfg?.nombre ?? "Gestión de Iglesias",
      lema: cfg?.lema ?? "",
      logoUrl: cfg?.logo_url ?? null,
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUsuarioId(null);
      fijarDb({ ...BASE_VACIA, configuracion });
      return;
    }

    const [{ data: perfil }, { data: sedes }] = await Promise.all([
      supabase.from("usuarios").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("sedes").select("*").order("creado_en"),
    ]);
    const usuario: Usuario = perfil
      ? aUsuario(perfil)
      : { id: user.id, nombre: user.email ?? "", correo: user.email ?? "", rol: "miembro", sedeId: null, activo: false };
    const listaSedes: Sede[] = (sedes ?? []).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: s.telefono,
      correo: s.correo,
      activa: s.activa,
    }));

    fijarDb({ ...BASE_VACIA, configuracion, sedes: listaSedes, usuarios: [usuario] });
    setUsuarioId(usuario.id);
    setSedeId((actual) => {
      // Solo el administrador elige sede; el resto trabaja en la suya
      if (usuario.rol !== "administrador") return usuario.sedeId ?? "";
      const guardada = leerSesionGuardada()?.sedeId;
      const candidata = [actual, guardada, usuario.sedeId].find((s) => s && listaSedes.some((x) => x.id === s));
      return candidata ?? listaSedes[0]?.id ?? "";
    });
  }, [fijarDb]);

  useEffect(() => {
    const ahora = new Date();
    setHoy(iso(ahora));

    if (modoDemo) {
      fijarDb(generarDatos(ahora));
      const guardada = leerSesionGuardada();
      if (guardada?.usuarioId) {
        setUsuarioId(guardada.usuarioId);
        setSedeId(guardada.sedeId ?? "s1");
      }
      return;
    }

    recargar();
    const { data } = supabaseNavegador().auth.onAuthStateChange((evento) => {
      // No se consulta dentro del callback para no bloquear al cliente de auth
      if (evento === "SIGNED_IN" || evento === "SIGNED_OUT" || evento === "USER_UPDATED") {
        setTimeout(recargar, 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [recargar, fijarDb]);

  const usuario = useMemo(
    () => db?.usuarios.find((u) => u.id === usuarioId) ?? null,
    [db, usuarioId]
  );
  const usuarioRef = useRef(usuario);
  usuarioRef.current = usuario;

  const repo = useMemo(
    () => (modoDemo ? repositorioDemo(() => dbRef.current, actualizar, () => usuarioRef.current) : repositorioSupabase()),
    [actualizar]
  );

  const valor = useMemo<Contexto | null>(() => {
    if (!db) return null;
    return {
      modo: modoDemo ? "demo" : "supabase",
      db,
      actualizar,
      repo,
      usuario,
      hoy,
      sedeId,
      recargar,
      entrarDemo: (id) => {
        const u = db.usuarios.find((x) => x.id === id);
        if (!u) return;
        setUsuarioId(id);
        setSedeId(u.sedeId ?? "");
        guardarSesion(id, u.sedeId ?? "");
      },
      entrar: async (correo, contrasena) => {
        if (modoDemo) {
          const u = db.usuarios.find((x) => x.correo === correo.trim().toLowerCase());
          if (!u || !contrasena) return { mensaje: textos().auth.credenciales };
          setUsuarioId(u.id);
          setSedeId(u.sedeId ?? "");
          guardarSesion(u.id, u.sedeId ?? "");
          return null;
        }
        const { error } = await supabaseNavegador().auth.signInWithPassword({
          email: correo.trim(),
          password: contrasena,
        });
        if (error) return falloEntrada(error);
        await recargar();
        return null;
      },
      recuperar: async (correo) => {
        if (modoDemo) return null;
        const { error } = await supabaseNavegador().auth.resetPasswordForEmail(correo.trim(), {
          redirectTo: `${window.location.origin}/restablecer`,
        });
        return error ? textos().auth.correoNoEnviado : null;
      },
      reenviarConfirmacion: async (correo) => {
        if (modoDemo) return null;
        const { error } = await supabaseNavegador().auth.resend({
          type: "signup",
          email: correo.trim(),
          options: { emailRedirectTo: urlConfirmacion() },
        });
        if (!error) return null;
        console.error("Error al reenviar la confirmación:", error);
        if (isAuthRetryableFetchError(error)) return textos().auth.sinConexion;
        if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(error.code ?? "")) return textos().auth.limiteCorreos;
        return textos().auth.correoNoEnviado;
      },
      // La cuenta nace inactiva y sin sede (trigger crear_perfil): no ve nada
      // hasta que un administrador le asigna rol y sede en Usuarios.
      registrar: async (nombre, correo, contrasena) => {
        if (modoDemo) return { error: textos().auth.demoSinCuentas };
        const { data, error } = await supabaseNavegador().auth.signUp({
          email: correo.trim(),
          password: contrasena,
          options: { data: { nombre: nombre.trim() }, emailRedirectTo: urlConfirmacion() },
        });
        if (error) {
          // El detalle original queda en la consola para diagnosticar
          console.error("Error al crear la cuenta:", error);
          return { error: mensajeErrorRegistro(error) };
        }
        // Con la confirmación de correo activa, si el correo ya tiene una cuenta
        // confirmada Supabase no da error: devuelve un usuario sin identidades
        // y no envía ningún correo
        if (data.user && data.user.identities?.length === 0) return { error: textos().auth.cuentaExiste };
        if (data.session) await recargar();
        return { sesion: !!data.session };
      },
      cerrarSesion: async () => {
        if (!modoDemo) await supabaseNavegador().auth.signOut();
        setUsuarioId(null);
        guardarSesion(null, sedeId);
      },
      cambiarSede: (s) => {
        setSedeId(s);
        guardarSesion(usuarioId, s);
      },
    };
  }, [db, actualizar, repo, usuario, hoy, sedeId, usuarioId, recargar]);

  if (!valor) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-piedra-500">
        {t.comun.cargando}
      </div>
    );
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useDatos() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDatos debe usarse dentro de ProveedorDatos");
  return c;
}
