import { textos } from "./i18n";

// Los formatos siguen el idioma activo (es-MX o en-US). Los componentes que los
// usan leen el idioma con useIdioma(), así que se vuelven a pintar al cambiarlo.

const monedas = new Map<string, Intl.NumberFormat>();

export const mxn = (monto: number) => {
  const locale = textos().locale;
  let moneda = monedas.get(locale);
  if (!moneda) {
    moneda = new Intl.NumberFormat(locale, { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
    monedas.set(locale, moneda);
  }
  return moneda.format(monto);
};

// Las fechas se guardan como AAAA-MM-DD; se leen como fecha local para evitar
// que la zona horaria las corra un día.
export const aFecha = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

export const fechaCorta = (iso: string) =>
  aFecha(iso).toLocaleDateString(textos().locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Día y mes, sin el año (por ejemplo, en el eje de las gráficas)
export const fechaDiaMes = (iso: string) =>
  aFecha(iso).toLocaleDateString(textos().locale, { day: "numeric", month: "short" });

export const fechaLarga = (iso: string) => {
  const t = aFecha(iso).toLocaleDateString(textos().locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const mesCorto = (clave: string) => {
  const [a, m] = clave.split("-").map(Number);
  return `${textos().fechas.meses[m - 1].slice(0, 3)} ${String(a).slice(2)}`;
};
