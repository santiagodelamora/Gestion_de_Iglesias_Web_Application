"use client";

import { useCallback, useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Semana } from "@/components/semana";
import { Encabezado, Etiqueta, Indicador, Indicadores, Liston, Tarjeta } from "@/components/ui";
import { fechaCorta, fechaLarga, mesCorto, mxn } from "@/lib/formato";
import { puedeVer, veFinanzas } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Anuncio, Aportacion, Asistencia, Evento, Miembro, Ministerio } from "@/lib/types";
import { useCarga } from "@/lib/usar-carga";

interface DatosPanel {
  miembros: Miembro[];
  eventos: Evento[];
  ministerios: Ministerio[];
  asistencias: Asistencia[];
  aportaciones: Aportacion[];
  anuncios: Anuncio[];
}

const VACIO: DatosPanel = { miembros: [], eventos: [], ministerios: [], asistencias: [], aportaciones: [], anuncios: [] };

// Estilo común de las gráficas, alineado con la paleta de marca (globals.css)
const MARCA = "#2e5f4b";
const MARCA_CLARO = "#87b39d";
const MARCA_FONDO = "#dae8e0";
const EJE = { fontSize: 12, fill: "#6b7468" };
const CUADRICULA = "#edefeb";
const GLOBO = {
  contentStyle: { borderRadius: 8, border: "1px solid #dde1db", boxShadow: "0 8px 24px -10px rgba(17,20,16,.25)", fontSize: 13 },
  cursor: { stroke: "#b5d1c2", fill: "#eff5f2" },
};

// Panel principal: indicadores de la sede activa. Cada rol solo carga lo que
// puede ver; las cifras financieras son para administrador, pastor y tesorero.
export default function Panel() {
  const { usuario, repo, sedeId, hoy } = useDatos();
  const rol = usuario!.rol;
  const finanzas = veFinanzas(rol);
  const veAsistencia = puedeVer(rol, "asistencia");
  const mesActual = hoy.slice(0, 7);

  const cargar = useCallback(async (): Promise<DatosPanel> => {
    const nada = Promise.resolve([]);
    const [miembros, eventos, ministerios, asistencias, aportaciones, anuncios] = await Promise.all([
      repo.miembros.listar(sedeId),
      repo.eventos.listar(sedeId),
      puedeVer(rol, "ministerios") ? repo.ministerios.listar(sedeId) : nada,
      veAsistencia ? repo.asistencias.listar(sedeId) : nada,
      finanzas ? repo.aportaciones.listar(sedeId) : nada,
      repo.anuncios.listar(sedeId),
    ]);
    return { miembros, eventos, ministerios, asistencias, aportaciones, anuncios };
  }, [repo, sedeId, rol, veAsistencia, finanzas]);
  const { datos: d } = useCarga<DatosPanel>(cargar, VACIO);
  const { miembros, ministerios, anuncios } = d;

  const datos = useMemo(() => {
    const eventos = d.eventos.filter((e) => !e.cancelado);
    const presentes = d.asistencias.filter((a) => a.presente);
    const eventosDelMes = new Set(eventos.filter((e) => e.fecha.startsWith(mesActual)).map((e) => e.id));

    // Asistencia a los últimos 8 cultos dominicales
    const cultos = eventos
      .filter((e) => e.tipo === "Culto dominical" && e.fecha < hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-8)
      .map((e) => ({
        fecha: fechaCorta(e.fecha).replace(/ \d{4}$/, ""),
        asistentes: presentes.filter((a) => a.eventoId === e.id).length,
      }));

    // Ingresos de los últimos 6 meses (sin las aportaciones anuladas)
    const porMes = new Map<string, number>();
    d.aportaciones
      .filter((a) => !a.anulada)
      .forEach((a) => {
        const clave = a.fecha.slice(0, 7);
        porMes.set(clave, (porMes.get(clave) ?? 0) + a.monto);
      });
    const ingresos = [...porMes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mes, total]) => ({ mes: mesCorto(mes), total, actual: mes === mesActual }));

    return {
      activos: miembros.filter((m) => m.activo).length,
      proximos: eventos.filter((e) => e.fecha >= hoy).length,
      asistenciasMes: presentes.filter((a) => eventosDelMes.has(a.eventoId)).length,
      cultos,
      ingresos,
      ingresoMes: porMes.get(mesActual) ?? 0,
    };
  }, [d, miembros, hoy, mesActual]);

  const avisos = anuncios
    .filter((a) => a.fechaPublicacion <= hoy)
    .sort((a, b) => Number(b.importante) - Number(a.importante) || b.fechaPublicacion.localeCompare(a.fechaPublicacion))
    .slice(0, 3);
  // Con las dos gráficas (o ninguna) los avisos ocupan el ancho completo
  const avisosAncho = veAsistencia === finanzas;

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario!.nombre.split(" ")[0]}`} descripcion={hoy && fechaLarga(hoy)} />

      <Semana eventos={d.eventos} hoy={hoy} />

      <div className="mt-6">
        <Indicadores>
          <Indicador titulo="Miembros activos" valor={datos.activos} detalle={`de ${miembros.length} registrados`} />
          <Indicador titulo="Eventos próximos" valor={datos.proximos} detalle="programados desde hoy" />
          {veAsistencia && <Indicador titulo="Asistencias del mes" valor={datos.asistenciasMes} detalle="presencias registradas" />}
          <Indicador titulo="Ministerios" valor={ministerios.length} detalle="grupos de trabajo" />
          {finanzas && <Indicador titulo="Ingresos del mes" valor={mxn(datos.ingresoMes)} detalle="sin contar aportaciones anuladas" />}
        </Indicadores>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {veAsistencia && (
          <Tarjeta className="p-5">
            <h2 className="font-titulo text-xl font-medium">Asistencia a cultos dominicales</h2>
            <p className="mb-4 text-sm text-piedra-500">Personas presentes en los últimos 8 domingos</p>
            <div className="h-60">
              <ResponsiveContainer>
                <AreaChart data={datos.cultos} margin={{ left: -20, right: 8, top: 4 }}>
                  <CartesianGrid stroke={CUADRICULA} vertical={false} />
                  <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
                  <YAxis tick={EJE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...GLOBO} />
                  <Area
                    type="monotone"
                    dataKey="asistentes"
                    name="Asistentes"
                    stroke={MARCA}
                    strokeWidth={2}
                    fill={MARCA_FONDO}
                    fillOpacity={0.6}
                    dot={{ r: 3, fill: "#fff", stroke: MARCA, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Tarjeta>
        )}

        {finanzas && (
          <Tarjeta className="p-5">
            <h2 className="font-titulo text-xl font-medium">Ingresos por mes</h2>
            <p className="mb-4 text-sm text-piedra-500">Aportaciones registradas en pesos; el mes en curso, en verde oscuro</p>
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={datos.ingresos} margin={{ left: 0, right: 8, top: 4 }}>
                  <CartesianGrid stroke={CUADRICULA} vertical={false} />
                  <XAxis dataKey="mes" tick={EJE} axisLine={false} tickLine={false} />
                  <YAxis tick={EJE} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip {...GLOBO} formatter={(v) => mxn(Number(v))} />
                  <Bar dataKey="total" name="Ingresos" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {datos.ingresos.map((m) => (
                      <Cell key={m.mes} fill={m.actual ? MARCA : MARCA_CLARO} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Tarjeta>
        )}

        <Tarjeta className={`p-5 ${avisosAncho ? "lg:col-span-2" : ""}`}>
          <h2 className="mb-4 font-titulo text-xl font-medium">Avisos</h2>
          <ListaAvisos avisos={avisos} columnas={avisosAncho} />
        </Tarjeta>
      </div>
    </>
  );
}

function ListaAvisos({ avisos, columnas }: { avisos: Anuncio[]; columnas: boolean }) {
  return (
    <ul className={`grid gap-3 ${columnas ? "md:grid-cols-3" : ""}`}>
      {avisos.length === 0 && <li className="text-sm text-piedra-500">No hay avisos publicados.</li>}
      {avisos.map((a) => (
        <li key={a.id} className="relative rounded-lg border border-piedra-200 p-4 pt-3.5">
          {a.importante && <Liston className="right-4 h-7" />}
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <p className="font-semibold text-piedra-900">{a.titulo}</p>
            {a.importante && <Etiqueta tono="liston">Importante</Etiqueta>}
          </div>
          <p className="mt-1 text-sm text-piedra-600">{a.contenido}</p>
        </li>
      ))}
    </ul>
  );
}
