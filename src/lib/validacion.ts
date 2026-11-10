import { useState } from "react";

// Reglas de los campos de las pantallas de acceso (inicio de sesión, registro,
// recuperación y nueva contraseña). Se validan en cada tecla: cada función
// devuelve la clave del mensaje de error en t.login, o undefined si es válido.

// Máximo de caracteres que deja escribir cada campo (atributo maxLength)
export const LIMITE = { correo: 60, nombre: 50, contrasena: 50 } as const;

const MINIMO = { nombre: 3, contrasena: 8 } as const;

// Algo antes de la @, y después un dominio con al menos un punto y sin partes vacías
const PATRON_CORREO = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export type ErrorCampo = "escribeCorreo" | "correoInvalido" | "escribeNombre" | "nombreCorto" | "escribeContrasena" | "contrasenaCorta";

export const validarCorreo = (valor: string): ErrorCampo | undefined => {
  const correo = valor.trim();
  if (!correo) return "escribeCorreo";
  if (!PATRON_CORREO.test(correo)) return "correoInvalido";
};

export const validarNombre = (valor: string): ErrorCampo | undefined => {
  const nombre = valor.trim();
  if (!nombre) return "escribeNombre";
  if (nombre.length < MINIMO.nombre) return "nombreCorto";
};

// Inicio de sesión: solo se pide que no esté vacía (las cuentas ya existen)
export const validarContrasena = (valor: string): ErrorCampo | undefined => {
  if (!valor) return "escribeContrasena";
};

// Registro y nueva contraseña. Los espacios cuentan: son parte de la contraseña.
export const validarContrasenaNueva = (valor: string): ErrorCampo | undefined => {
  if (!valor) return "escribeContrasena";
  if (valor.length < MINIMO.contrasena) return "contrasenaCorta";
};

// Lleva qué campos ya tuvieron texto. El aviso de campo vacío solo aparece
// después de escribir algo y borrarlo, o al intentar enviar el formulario;
// los demás avisos aparecen en cuanto el texto deja de ser válido.
export function useCamposTocados<C extends string>() {
  const [tocados, setTocados] = useState<Partial<Record<C, boolean>>>({});
  const [intento, setIntento] = useState(false);
  return {
    // Llamar en cada onChange con el valor nuevo
    marcar: (campo: C, valor: string) => {
      if (valor && !tocados[campo]) setTocados((t) => ({ ...t, [campo]: true }));
    },
    visible: (campo: C) => intento || !!tocados[campo],
    // Al enviar: muestra también los avisos de los campos que nunca se tocaron
    intentar: () => setIntento(true),
    reiniciar: () => {
      setTocados({});
      setIntento(false);
    },
  };
}
