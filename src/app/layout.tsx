import type { Metadata } from "next";
import { Alegreya, Source_Sans_3 } from "next/font/google";
import { ProveedorDatos } from "@/lib/store";
import "./globals.css";

// Alegreya (Huerta Tipográfica) para títulos y cifras; Source Sans 3, humanista
// como ella y de lectura clara en tamaños chicos, para la interfaz.
const texto = Source_Sans_3({ subsets: ["latin"], variable: "--fuente-texto", display: "swap" });
const titulo = Alegreya({ subsets: ["latin"], variable: "--fuente-titulo", display: "swap", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Gestión de Iglesias",
  description: "Sistema de gestión para iglesias con varias sedes",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={`${texto.variable} ${titulo.variable}`}>
      <body className="antialiased">
        <ProveedorDatos>{children}</ProveedorDatos>
      </body>
    </html>
  );
}
