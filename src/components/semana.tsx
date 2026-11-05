"use client";

import Link from "next/link";
import { Tarjeta } from "@/components/ui";
import { aFecha } from "@/lib/formato";
import { useIdioma } from "@/lib/i18n";
import type { Evento } from "@/lib/types";

const aIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Los siete días a partir de hoy con las actividades de cada uno. Los domingos
// van en carmín, como en los calendarios impresos.
export function Semana({ eventos, hoy }: { eventos: Evento[]; hoy: string }) {
  const { t } = useIdioma();
  if (!hoy) return null;
  const inicio = aFecha(hoy);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    const fecha = aIso(d);
    const delDia = eventos.filter((e) => e.fecha === fecha && !e.cancelado).sort((a, b) => a.hora.localeCompare(b.hora));
    return { fecha, d, delDia };
  });

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-4 border-b border-piedra-200 px-5 py-3.5">
        <h2 className="font-titulo text-xl font-medium text-piedra-900">{t.semana.titulo}</h2>
        <Link href="/eventos" className="text-sm font-semibold text-marca-700 hover:underline">{t.semana.verCalendario}</Link>
      </div>
      <ol className="grid divide-y divide-piedra-200 md:grid-cols-7 md:divide-x md:divide-y-0">
        {dias.map(({ fecha, d, delDia }, i) => (
          <li key={fecha} className={`flex gap-4 px-5 py-3 md:block md:min-h-44 md:px-3 md:pb-4 ${i === 0 ? "bg-marca-50/70" : ""}`}>
            <p className="w-16 shrink-0 md:mb-3 md:w-auto">
              <span className={`block text-xs font-semibold ${i === 0 ? "text-marca-700" : "text-piedra-500"}`}>
                {i === 0 ? t.semana.hoy : t.fechas.diasCortos[d.getDay()]}
              </span>
              <span className={`font-titulo text-2xl font-medium leading-none lining-nums ${d.getDay() === 0 ? "text-liston-600" : "text-piedra-900"}`}>
                {d.getDate()}
              </span>
              {(i === 0 || d.getDate() === 1) && <span className="ml-1 text-xs text-piedra-500">{t.fechas.meses[d.getMonth()].slice(0, 3)}</span>}
            </p>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {delDia.length === 0 && <li className="pt-1 text-sm text-piedra-400 md:hidden">{t.semana.sinActividades}</li>}
              {delDia.map((e) => (
                <li key={e.id} className="text-sm leading-snug">
                  <span className="mr-2 text-xs tabular-nums text-piedra-500 md:mr-0 md:block">{e.hora}</span>
                  <span className="font-semibold text-piedra-800 md:line-clamp-2">{e.titulo}</span>
                  <span className="block truncate text-xs text-piedra-500">{e.lugar}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Tarjeta>
  );
}
