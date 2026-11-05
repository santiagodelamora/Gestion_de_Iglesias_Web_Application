// Exportación de reportes a Excel (.xlsx) y PDF, generados en el navegador.
// Las librerías se cargan solo al exportar para no hacer más pesada la página.

import { textos } from "./i18n";

export type Valor = string | number;

export interface Reporte {
  titulo: string;
  subtitulo: string; // iglesia, sede y periodo
  columnas: string[];
  filas: Valor[][];
  moneda?: number[]; // índices de columnas con importes en MXN
}

const nombreArchivo = (titulo: string) =>
  titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export async function exportarExcel(r: Reporte, archivo = nombreArchivo(`${r.titulo} ${r.subtitulo}`)) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const ancho = r.columnas.length;
  const datos = [
    [{ value: r.titulo, fontWeight: "bold" as const, fontSize: 14, columnSpan: ancho }],
    [{ value: r.subtitulo, columnSpan: ancho }],
    [],
    r.columnas.map((c) => ({ value: c, fontWeight: "bold" as const, backgroundColor: "#DAE8E0" })),
    ...r.filas.map((fila) =>
      fila.map((v, i) =>
        typeof v === "number"
          ? { value: v, type: Number, format: r.moneda?.includes(i) ? '"$"#,##0.00' : "0" }
          : { value: v, type: String }
      )
    ),
  ];
  const columnas = r.columnas.map((c, i) => ({
    width: Math.min(45, Math.max(c.length, ...r.filas.map((f) => String(f[i] ?? "").length)) + 2),
  }));
  await writeExcelFile(datos, { columns: columnas, sheet: textos().exportar.hoja }).toFile(`${archivo}.xlsx`);
}

export async function exportarPdf(r: Reporte, archivo = nombreArchivo(`${r.titulo} ${r.subtitulo}`)) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const t = textos();
  const pesos = new Intl.NumberFormat(t.locale, { style: "currency", currency: "MXN" });
  const doc = new jsPDF({ orientation: r.columnas.length > 5 ? "landscape" : "portrait", unit: "pt", format: "letter" });
  doc.setFontSize(16);
  doc.text(r.titulo, 40, 50);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(r.subtitulo, 40, 68);
  autoTable(doc, {
    startY: 84,
    head: [r.columnas],
    body: r.filas.map((fila) => fila.map((v, i) => (typeof v === "number" && r.moneda?.includes(i) ? pesos.format(v) : String(v)))),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [37, 77, 61] },
    columnStyles: Object.fromEntries((r.moneda ?? []).map((i) => [i, { halign: "right" as const }])),
    didDrawPage: () => {
      const pagina = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(t.exportar.pie(pagina, new Date().toLocaleDateString(t.locale)), 40, doc.internal.pageSize.getHeight() - 20);
    },
  });
  doc.save(`${archivo}.pdf`);
}
