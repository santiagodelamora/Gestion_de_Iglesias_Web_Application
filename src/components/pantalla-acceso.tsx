import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { useIdioma } from "@/lib/i18n";

// Marco de las pantallas sin sesión (inicio de sesión y restablecer contraseña).
// En escritorio, a la izquierda va la "portada": verde pino con el listón y el
// versículo; a la derecha, el formulario.
export function PantallaAcceso({
  nombre,
  logoUrl,
  titulo,
  subtitulo,
  children,
}: {
  nombre: string;
  logoUrl?: string | null;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  const { t } = useIdioma();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-marca-900 py-14 pl-28 pr-12 text-marca-50 lg:flex lg:flex-col lg:justify-between xl:pr-20">
        <span aria-hidden className="liston absolute left-12 top-0 h-[58%] w-4 origin-top animate-desenrollar bg-liston-500" />

        <div className="flex items-center gap-3">
          <Logo url={logoUrl} tamano={40} claro />
          <p className="font-titulo text-xl font-medium">{nombre}</p>
        </div>

        <figure className="max-w-xl">
          <blockquote className="animate-revelar font-titulo text-5xl font-normal italic leading-[1.1] text-white [animation-delay:500ms] xl:text-6xl">
            {t.acceso.versiculo}
          </blockquote>
          <figcaption className="mt-5 animate-revelar text-marca-200 [animation-delay:800ms]">{t.acceso.cita}</figcaption>
        </figure>
      </section>

      <section className="flex items-center justify-center bg-papel p-6 lg:bg-white">
        {/* La clave vuelve a animar el formulario al cambiar de vista */}
        <div key={titulo} className="escalonado w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Logo url={logoUrl} tamano={40} />
            <p className="font-titulo text-xl font-medium text-piedra-900">{nombre}</p>
          </div>
          <h1 className="font-titulo text-4xl font-medium leading-tight text-piedra-900">{titulo}</h1>
          {subtitulo && <p className="mt-2 text-piedra-600">{subtitulo}</p>}
          <div className="campos mt-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
