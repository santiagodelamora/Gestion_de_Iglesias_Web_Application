import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

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
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-marca-900 py-14 pl-28 pr-12 text-marca-50 lg:flex lg:flex-col lg:justify-between xl:pr-20">
        <span aria-hidden className="liston absolute left-12 top-0 h-[58%] w-4 animate-caer bg-liston-500" />

        <div className="flex items-center gap-3">
          <Logo url={logoUrl} tamano={40} claro />
          <p className="font-titulo text-xl font-medium">{nombre}</p>
        </div>

        <figure className="max-w-xl">
          <blockquote className="font-titulo text-5xl font-normal italic leading-[1.1] text-white xl:text-6xl">
            “Hágase todo decentemente y con orden.”
          </blockquote>
          <figcaption className="mt-5 text-marca-200">1 Corintios 14:40</figcaption>
        </figure>
      </section>

      <section className="flex items-center justify-center bg-papel p-6 lg:bg-white">
        <div className="w-full max-w-sm animate-emerger">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Logo url={logoUrl} tamano={40} />
            <p className="font-titulo text-xl font-medium text-piedra-900">{nombre}</p>
          </div>
          <h1 className="font-titulo text-4xl font-medium leading-tight text-piedra-900">{titulo}</h1>
          {subtitulo && <p className="mt-2 text-piedra-600">{subtitulo}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
