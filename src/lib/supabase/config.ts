// Si no hay variables de Supabase configuradas, la aplicación funciona en
// modo demostración con datos ficticios en memoria.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const modoDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Rutas a las que se entra sin sesión
export const RUTAS_PUBLICAS = ["/login", "/restablecer", "/confirmar"];
