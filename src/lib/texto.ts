// Quita los espacios al principio y al final de cada texto de un formulario
// antes de guardarlo. Los demás valores (números, listas, booleanos) no cambian.
export const recortar = <T extends object>(datos: T): T =>
  Object.fromEntries(
    Object.entries(datos).map(([clave, valor]) => [clave, typeof valor === "string" ? valor.trim() : valor])
  ) as T;
