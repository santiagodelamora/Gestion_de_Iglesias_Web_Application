"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Boton, Campo, Encabezado, Entrada, SinAcceso, Tabla, Tarjeta, td, th, Vacio } from "@/components/ui";
import { iso } from "@/lib/datos-ejemplo";
import { aFecha, fechaCorta, mesCorto, mxn } from "@/lib/formato";
import { reportesPermitidos } from "@/lib/permisos";
import { exportarExcel, exportarPdf, type Reporte, type Valor } from "@/lib/exportar";
import { useDatos } from "@/lib/store";
import type { Aportacion, Asistencia, Evento, Miembro, Ministerio } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

const NOMBRES: Record<string, string> = {
  miembros: "Miembros",
  asistencia: "Asistencia por evento",
  ministerios: "Participación por ministerio",
  ingresos: "Ingresos por periodo",
};

interface Datos {
  miembros: Miembro[];
  eventos: Evento[];
  ministerios: Ministerio[];
  asistencias: Asistencia[];
  aportaciones: Aportacion[];
}

export default function Reportes() {
  const { db, usuario, repo, sedeId, hoy } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId);
  const permitidos = reportesPermitidos(usuario!.rol);
  // Cada rol carga solo lo que necesitan sus reportes
  const rol = usuario!.rol;
  const cargar = useCallback(async (): Promise<Datos> => {
    const usa = (r: string) => reportesPermitidos(rol).includes(r);
    const nada = Promise.resolve([]);
    const [miembros, eventos, ministerios, asistencias, aportaciones] = await Promise.all([
      usa("miembros") || usa("ministerios") ? repo.miembros.listar(sedeId) : nada,
      usa("asistencia") || usa("ministerios") ? repo.eventos.listar(sedeId) : nada,
      usa("miembros") || usa("ministerios") || usa("asistencia") ? repo.ministerios.listar(sedeId) : nada,
      usa("asistencia") || usa("ministerios") ? repo.asistencias.listar(sedeId) : nada,
      usa("ingresos") ? repo.aportaciones.listar(sedeId) : nada,
    ]);
    return { miembros, eventos, ministerios, asistencias, aportaciones };
  }, [repo, sedeId, rol]);
  const { datos, cargando, error } = useCarga<Datos>(cargar, { miembros: [], eventos: [], ministerios: [], asistencias: [], aportaciones: [] });
  const { miembros, eventos, ministerios, asistencias, aportaciones } = datos;
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState("");
  const [tipo, setTipo] = useState(permitidos[0]);
  const hace3Meses = useMemo(() => {
    const d = aFecha(hoy);
    d.setMonth(d.getMonth() - 3);
    return `${iso(d).slice(0, 7)}-01`;
  }, [hoy]);
  const [desde, setDesde] = useState(hace3Meses);
  const [hasta, setHasta] = useState(hoy);

  const soloMios = usuario!.rol === "coordinador";
  const minsVisibles = useMemo(
    () => (soloMios ? ministerios.filter((m) => usuario!.miembroId && m.coordinadorId === usuario!.miembroId) : ministerios),
    [soloMios, ministerios, usuario]
  );

  const reporte = useMemo((): { columnas: string[]; filas: Valor[][]; moneda?: number[] } => {
    const enPeriodo = (f: string) => f >= desde && f <= hasta;
    switch (tipo) {
      case "miembros":
        return {
          columnas: ["Nombre", "Teléfono", "Correo", "Fecha de ingreso", "Estado", "Ministerios"],
          filas: [...miembros]
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((m) => [
              m.nombre, m.telefono, m.correo, fechaCorta(m.fechaIngreso), m.activo ? "Activo" : "Inactivo",
              ministerios.filter((x) => x.integrantes.includes(m.id)).map((x) => x.nombre).join(", "),
            ]),
        };
      case "asistencia": {
        const ids = new Set(minsVisibles.map((m) => m.id));
        return {
          columnas: ["Fecha", "Evento", "Presentes", "Ausentes", "% asistencia"],
          filas: eventos
            .filter((e) => enPeriodo(e.fecha) && e.fecha <= hoy && !e.cancelado)
            .filter((e) => !soloMios || (e.ministerioId && ids.has(e.ministerioId)))
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .map((e) => {
              const regs = asistencias.filter((a) => a.eventoId === e.id);
              const p = regs.filter((a) => a.presente).length;
              return [fechaCorta(e.fecha), e.titulo, p, regs.length - p, regs.length ? `${Math.round((p / regs.length) * 100)}%` : "—"];
            }),
        };
      }
      case "ministerios":
        return {
          columnas: ["Ministerio", "Coordinador", "Integrantes", "Actividades en el periodo", "Asistencia promedio"],
          filas: minsVisibles.map((m) => {
            const acts = eventos.filter((e) => e.ministerioId === m.id && enPeriodo(e.fecha) && !e.cancelado);
            const regs = asistencias.filter((a) => acts.some((e) => e.id === a.eventoId));
            const prom = regs.length ? `${Math.round((regs.filter((a) => a.presente).length / regs.length) * 100)}%` : "—";
            return [m.nombre, miembros.find((x) => x.id === m.coordinadorId)?.nombre ?? "Sin asignar", m.integrantes.length, acts.length, prom];
          }),
        };
      case "ingresos": {
        const t = new Map<string, Record<string, number>>();
        aportaciones.filter((a) => enPeriodo(a.fecha) && !a.anulada).forEach((a) => {
          const k = a.fecha.slice(0, 7);
          const r = t.get(k) ?? { Diezmo: 0, Ofrenda: 0, Otros: 0, n: 0 };
          const c = a.concepto === "Diezmo" || a.concepto === "Ofrenda" ? a.concepto : "Otros";
          r[c] += a.monto;
          r.n++;
          t.set(k, r);
        });
        return {
          columnas: ["Mes", "Diezmos (MXN)", "Ofrendas (MXN)", "Otros (MXN)", "Total (MXN)", "Aportaciones"],
          filas: [...t.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([mes, r]) => [mesCorto(mes), r.Diezmo, r.Ofrenda, r.Otros, r.Diezmo + r.Ofrenda + r.Otros, r.n]),
          moneda: [1, 2, 3, 4],
        };
      }
      default:
        return { columnas: [], filas: [] };
    }
  }, [tipo, desde, hasta, miembros, ministerios, minsVisibles, eventos, aportaciones, asistencias, hoy, soloMios]);

  if (!permitidos.length) return <SinAcceso />;
  const usaPeriodo = tipo !== "miembros";
  const completo: Reporte = {
    titulo: NOMBRES[tipo],
    subtitulo: `${db.configuracion.nombre} · ${sede?.nombre ?? ""}${usaPeriodo ? ` · del ${fechaCorta(desde)} al ${fechaCorta(hasta)}` : ""}`,
    ...reporte,
  };
  const exportar = async (formato: "excel" | "pdf") => {
    setExportando(true);
    setErrorExportar(await intentar(() => (formato === "excel" ? exportarExcel(completo) : exportarPdf(completo))));
    setExportando(false);
  };
  const mostrar = (i: number, v: Valor) => (reporte.moneda?.includes(i) ? mxn(Number(v)) : v);

  return (
    <>
      <div className="print:hidden">
        <Encabezado
          titulo="Reportes"
          descripcion={`Información de ${sede?.nombre ?? ""}`}
          acciones={
            <>
              <Boton variante="secundario" disabled={exportando || cargando} onClick={() => exportar("excel")}>
                <FileSpreadsheet size={16} /> Exportar a Excel
              </Boton>
              <Boton variante="secundario" disabled={exportando || cargando} onClick={() => exportar("pdf")}>
                <FileText size={16} /> Exportar a PDF
              </Boton>
            </>
          }
        />
        {(error || errorExportar) && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error || errorExportar}</p>}
        <div className="mb-4 flex flex-wrap gap-2">
          {permitidos.map((p) => (
            <button
              key={p}
              onClick={() => setTipo(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tipo === p ? "bg-marca-600 text-white" : "bg-white text-piedra-600 ring-1 ring-piedra-200 hover:bg-piedra-50"}`}
            >
              {NOMBRES[p]}
            </button>
          ))}
        </div>
      </div>

      <Tarjeta>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-piedra-200 p-4">
          <div>
            <h2 className="font-semibold">{NOMBRES[tipo]}</h2>
            <p className="text-xs text-piedra-500">{completo.subtitulo}</p>
          </div>
          {usaPeriodo && (
            <div className="flex gap-2 print:hidden">
              <Campo etiqueta="Desde"><Entrada type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
              <Campo etiqueta="Hasta"><Entrada type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
            </div>
          )}
        </div>
        <Tabla>
          <thead>
            <tr>{reporte.columnas.map((c) => <th key={c} className={th}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {reporte.filas.map((f, i) => (
              <tr key={i}>
                {f.map((v, j) => <td key={j} className={`${td} ${j > 0 && j < 4 ? "whitespace-nowrap" : ""}`}>{mostrar(j, v)}</td>)}
              </tr>
            ))}
          </tbody>
        </Tabla>
        {cargando ? <Vacio>Cargando…</Vacio> : <p className="p-4 text-xs text-piedra-500">{reporte.filas.length} registros</p>}
      </Tarjeta>
    </>
  );
}
