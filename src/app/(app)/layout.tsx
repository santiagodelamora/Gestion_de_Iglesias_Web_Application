"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  HandCoins,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProveedorConfirmacion } from "@/components/confirmacion";
import { Logo } from "@/components/logo";
import { Boton, Selector, Tarjeta } from "@/components/ui";
import { useIdioma, type Textos } from "@/lib/i18n";
import { puedeVer, type Modulo } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Rol } from "@/lib/types";

type Grupo = keyof Textos["menu"]["grupos"];

// El texto de cada enlace sale del diccionario del idioma activo
interface Enlace {
  href: string;
  texto: keyof Textos["menu"]["enlaces"];
  icono: React.ReactNode;
  grupo: Grupo;
  visible: (rol: Rol) => boolean;
}

const porModulo = (m: Modulo) => (rol: Rol) => puedeVer(rol, m);

const ENLACES: Enlace[] = [
  { href: "/inicio", texto: "inicio", icono: <Home size={18} />, grupo: "general", visible: (r) => r === "miembro" },
  { href: "/panel", texto: "panel", icono: <LayoutDashboard size={18} />, grupo: "general", visible: (r) => r !== "miembro" },
  { href: "/miembros", texto: "miembros", icono: <Users size={18} />, grupo: "congregacion", visible: (r) => r !== "miembro" && puedeVer(r, "miembros") },
  { href: "/asistencia", texto: "asistencia", icono: <ClipboardCheck size={18} />, grupo: "congregacion", visible: porModulo("asistencia") },
  { href: "/eventos", texto: "eventos", icono: <CalendarDays size={18} />, grupo: "congregacion", visible: porModulo("eventos") },
  { href: "/ministerios", texto: "ministerios", icono: <UsersRound size={18} />, grupo: "congregacion", visible: porModulo("ministerios") },
  { href: "/comunicados", texto: "comunicados", icono: <Megaphone size={18} />, grupo: "congregacion", visible: (r) => r !== "miembro" && puedeVer(r, "comunicados") },
  { href: "/donaciones", texto: "donaciones", icono: <HandCoins size={18} />, grupo: "finanzas", visible: porModulo("donaciones") },
  { href: "/reportes", texto: "reportes", icono: <BarChart3 size={18} />, grupo: "finanzas", visible: porModulo("reportes") },
  { href: "/usuarios", texto: "usuarios", icono: <UserCog size={18} />, grupo: "administracion", visible: porModulo("usuarios") },
  { href: "/sedes", texto: "sedes", icono: <Building2 size={18} />, grupo: "administracion", visible: porModulo("sedes") },
  { href: "/configuracion", texto: "configuracion", icono: <Settings size={18} />, grupo: "administracion", visible: porModulo("configuracion") },
];

const GRUPOS: Grupo[] = ["general", "congregacion", "finanzas", "administracion"];

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  const { usuario, db, sedeId, cambiarSede, cerrarSesion } = useDatos();
  const router = useRouter();
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { t } = useIdioma();

  useEffect(() => {
    if (!usuario) router.replace("/login");
  }, [usuario, router]);
  useEffect(() => setMenuAbierto(false), [ruta]);

  if (!usuario) return null;

  const salir = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  // Cuenta creada pero todavía sin rol asignado por un administrador
  if (!usuario.activo) {
    return (
      <Aviso titulo={t.menu.pendienteTitulo} salir={salir}>
        {t.menu.pendienteTexto}
      </Aviso>
    );
  }

  const enlaces = ENLACES.filter((e) => e.visible(usuario.rol));
  const actual = enlaces.find((e) => ruta.startsWith(e.href));
  const sede = db.sedes.find((s) => s.id === sedeId);

  if (!sede && !(usuario.rol === "administrador" && ruta.startsWith("/sedes"))) {
    return usuario.rol === "administrador" ? (
      <Aviso titulo={t.menu.primeraSedeTitulo} salir={salir}>
        {t.menu.primeraSedeTexto}{" "}
        <Link href="/sedes" className="font-semibold text-marca-700 hover:underline">{t.menu.crearPrimeraSede}</Link>
      </Aviso>
    ) : (
      <Aviso titulo={t.menu.sinSedeTitulo} salir={salir}>
        {t.menu.sinSedeTexto}
      </Aviso>
    );
  }

  // El menú es el índice: todo el contenido deja libre un margen a la izquierda
  // por donde cuelga el listón, desde el borde superior hasta la sección actual.
  // El listón vive dentro del enlace activo y el desplazamiento del menú lo recorta.
  const barra = (
    <nav className="flex h-full flex-col overflow-y-auto border-r border-piedra-200 bg-white">
      <div className="pb-6 pl-10 pr-4 pt-6">
        <div className="flex items-center gap-3">
          <Logo url={db.configuracion.logoUrl} tamano={32} />
          <p className="line-clamp-2 font-titulo text-lg font-medium leading-tight text-piedra-900">{db.configuracion.nombre}</p>
        </div>
        {usuario.rol === "administrador" ? (
          <label className="relative mt-4 flex items-center">
            <Building2 size={15} className="pointer-events-none absolute left-3 text-piedra-400" />
            <span className="sr-only">{t.comun.sede}</span>
            <Selector value={sedeId} onChange={(e) => cambiarSede(e.target.value)} className="py-1.5 pl-9">
              {db.sedes.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Selector>
          </label>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm text-piedra-600">
            <Building2 size={15} className="text-piedra-400" /> {sede?.nombre}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-5 pb-6">
        {GRUPOS.map((grupo) => {
          const delGrupo = enlaces.filter((e) => e.grupo === grupo);
          if (delGrupo.length === 0) return null;
          return (
            <div key={grupo}>
              <p className="mb-1 pl-10 pr-4 font-titulo text-[15px] italic text-piedra-500">{t.menu.grupos[grupo]}</p>
              <ul className="space-y-0.5">
                {delGrupo.map((e) => {
                  const activo = e === actual;
                  return (
                    <li key={e.href} className="relative">
                      {activo && (
                        <span aria-hidden className="liston absolute -bottom-1.5 left-4 h-[300vh] w-2.5 animate-caer bg-liston-600" />
                      )}
                      <Link
                        href={e.href}
                        aria-current={activo ? "page" : undefined}
                        className={`ml-7 mr-3 flex items-center gap-3 rounded-md px-3 py-2 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 ${
                          activo ? "bg-marca-50 font-semibold text-marca-900" : "text-piedra-700 hover:bg-piedra-100 hover:text-piedra-900"
                        }`}
                      >
                        <span className={activo ? "text-marca-700" : "text-piedra-400"}>{e.icono}</span>
                        {t.menu.enlaces[e.texto]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t border-piedra-200 py-3 pl-10 pr-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marca-100 text-xs font-bold text-marca-800">
          {iniciales(usuario.nombre)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-piedra-900">{usuario.nombre}</p>
          <p className="truncate text-xs text-piedra-500">{t.catalogos.roles[usuario.rol]}</p>
        </div>
        <button
          onClick={salir}
          title={t.comun.cerrarSesion}
          aria-label={t.comun.cerrarSesion}
          className="rounded-md p-2 text-piedra-400 transition hover:bg-piedra-100 hover:text-piedra-800"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );

  return (
    <ProveedorConfirmacion>
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 hidden w-64 lg:block print:hidden">{barra}</aside>
        {menuAbierto && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuAbierto(false)}>
            <div className="absolute inset-0 animate-aparecer bg-piedra-950/45" />
            <aside className="absolute inset-y-0 w-72 animate-deslizar shadow-2xl" onClick={(e) => e.stopPropagation()}>{barra}</aside>
          </div>
        )}
        <div className="min-w-0 flex-1 lg:pl-64 print:pl-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-piedra-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden print:hidden">
            <button
              className="rounded-md p-1.5 text-piedra-600 hover:bg-piedra-100"
              onClick={() => setMenuAbierto(true)}
              aria-label={t.menu.abrirMenu}
            >
              <Menu size={20} />
            </button>
            <p className="min-w-0 truncate font-titulo text-lg font-medium text-piedra-900">{db.configuracion.nombre}</p>
          </header>
          {/* La clave repite la entrada suave en cada cambio de página */}
          <main key={ruta} className="mx-auto max-w-7xl animate-entrar px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </ProveedorConfirmacion>
  );
}

function Aviso({ titulo, salir, children }: { titulo: string; salir: () => void; children: React.ReactNode }) {
  const { t } = useIdioma();
  return (
    <div className="flex min-h-screen items-center justify-center bg-papel p-4">
      <Tarjeta className="max-w-md p-8 text-center">
        <p className="font-titulo text-2xl font-medium text-piedra-900">{titulo}</p>
        <p className="mt-2 text-piedra-600">{children}</p>
        <Boton variante="secundario" className="mt-6" onClick={salir}>
          <LogOut size={14} /> {t.comun.cerrarSesion}
        </Boton>
      </Tarjeta>
    </div>
  );
}
