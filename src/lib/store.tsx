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
  entrar: (correo: string, contrasena: string) => Promise<string | null>;
  entrarDemo: (usuarioId: string) => void;
  recuperar: (correo: string) => Promise<string | null>;
  registrar: (nombre: string, correo: string, contrasena: string) => Promise<{ error?: string; sesion?: boolean }>;
  cerrarSesion: () => Promise<void>;
  recargar: () => Promise<void>;
  sedeId: string;
  cambiarSede: (sedeId: string) => void;
  hoy: string;
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

// Traduce el error de signUp a un mensaje para la persona. Se revisa primero el
// código de Supabase y, si no viene, el texto del mensaje.
const mensajeErrorRegistro = (error: AuthError) => {
  // Sin respuesta del servidor: sin internet, URL mal escrita o proyecto pausado
  if (isAuthRetryableFetchError(error)) {
    return "No se pudo conectar con el servidor. Revisa tu conexión o avisa al administrador.";
  }
  const codigo = error.code ?? "";
  if (["signup_disabled", "email_provider_disabled"].includes(codigo) || /disabled|not allowed/i.test(error.message)) {
    return "Por ahora las cuentas solo se crean por invitación del administrador.";
  }
  if (["user_already_exists", "email_exists"].includes(codigo)) {
    return "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.";
  }
  if (codigo === "email_address_invalid") return "El correo no es válido. Revisa que esté bien escrito.";
  if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(codigo)) {
    return "Se alcanzó el límite de correos por hora. Intenta de nuevo más tarde.";
  }
  if (codigo === "email_address_not_authorized") {
    return "El servidor no puede enviar el correo de confirmación a esa dirección. Avisa al administrador.";
  }
  if (codigo === "weak_password" || /password/i.test(error.message)) {
    return "La contraseña no es válida. Usa al menos 8 caracteres.";
  }
  return "No se pudo crear la cuenta. Intenta de nuevo en unos minutos.";
};

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
          if (!u || !contrasena) return "Correo o contraseña incorrectos.";
          setUsuarioId(u.id);
          setSedeId(u.sedeId ?? "");
          guardarSesion(u.id, u.sedeId ?? "");
          return null;
        }
        const { error } = await supabaseNavegador().auth.signInWithPassword({
          email: correo.trim(),
          password: contrasena,
        });
        if (error) return "Correo o contraseña incorrectos.";
        await recargar();
        return null;
      },
      recuperar: async (correo) => {
        if (modoDemo) return null;
        const { error } = await supabaseNavegador().auth.resetPasswordForEmail(correo.trim(), {
          redirectTo: `${window.location.origin}/restablecer`,
        });
        return error ? "No se pudo enviar el correo. Intenta de nuevo en unos minutos." : null;
      },
      // La cuenta nace inactiva y sin sede (trigger crear_perfil): no ve nada
      // hasta que un administrador le asigna rol y sede en Usuarios.
      registrar: async (nombre, correo, contrasena) => {
        if (modoDemo) return { error: "En la demostración no se crean cuentas." };
        const { data, error } = await supabaseNavegador().auth.signUp({
          email: correo.trim(),
          password: contrasena,
          options: { data: { nombre: nombre.trim() }, emailRedirectTo: `${window.location.origin}/login` },
        });
        if (error) {
          // El detalle original queda en la consola para diagnosticar
          console.error("Error al crear la cuenta:", error);
          return { error: mensajeErrorRegistro(error) };
        }
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
        Cargando…
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
