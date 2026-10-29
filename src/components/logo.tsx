/* eslint-disable @next/next/no-img-element -- el logo viene de Supabase Storage o de un archivo local */
import { Church } from "lucide-react";

// Sin logo propio se muestra una ventana de arco, como la de un templo
export function Logo({ url, tamano = 36, claro = false }: { url?: string | null; tamano?: number; claro?: boolean }) {
  if (url) {
    return <img src={url} alt="Logotipo" width={tamano} height={tamano} className="rounded-lg object-cover" style={{ width: tamano, height: tamano }} />;
  }
  return (
    <span
      className={`flex shrink-0 items-end justify-center rounded-t-full rounded-b-md ${
        claro ? "bg-marca-50 text-marca-800" : "bg-marca-700 text-marca-50"
      }`}
      style={{ width: tamano, height: tamano * 1.15, paddingBottom: tamano * 0.14 }}
    >
      <Church size={tamano * 0.55} strokeWidth={1.75} />
    </span>
  );
}
