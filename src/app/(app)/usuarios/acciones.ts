"use server";

import { headers } from "next/headers";
import { DICCIONARIOS, esIdioma, type Idioma } from "@/lib/i18n/diccionarios";
import type { DatosInvitacion } from "@/lib/repositorio/tipos";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase/servidor";

// Crear y eliminar cuentas requiere la llave de servicio de Supabase, que nunca
// llega al navegador. Antes de usarla se comprueba que quien llama es
// administrador. Los mensajes de error vuelven en el idioma de quien llama.
async function prepararAdmin(idioma: Idioma) {
  const t = DICCIONARIOS[esIdioma(idioma) ? idioma : "es"];
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { t, error: t.errores.sesionExpirada };

  const { data: perfil } = await supabase.from("usuarios").select("rol, activo").eq("id", user.id).single();
  if (perfil?.rol !== "administrador" || !perfil.activo) return { t, error: t.usuarios.soloAdmin };

  const admin = supabaseAdmin();
  if (!admin) return { t, error: t.usuarios.faltaLlave };
  return { t, admin, yo: user.id };
}

export async function invitarUsuario(datos: DatosInvitacion, idioma: Idioma = "es"): Promise<{ error?: string }> {
  const { t, admin, error: fallo } = await prepararAdmin(idioma);
  if (!admin) return { error: fallo };

  // La acción se puede llamar sin pasar por el formulario: se recorta aquí también
  const correo = datos.correo.trim().toLowerCase();
  const nombre = datos.nombre.trim();
  const origen = (await headers()).get("origin") ?? "";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(correo, {
    data: { nombre },
    redirectTo: `${origen}/restablecer`,
  });
  if (error) {
    return { error: error.message.includes("already") ? t.usuarios.cuentaExiste : error.message };
  }

  // El trigger creó el perfil inactivo; aquí se le asignan rol y sede
  const { error: errorPerfil } = await admin
    .from("usuarios")
    .update({ nombre, rol: datos.rol, sede_id: datos.sedeId, miembro_id: datos.miembroId ?? null, activo: true })
    .eq("id", data.user.id);
  if (errorPerfil) return { error: errorPerfil.message };
  return {};
}

// Borra la cuenta de acceso. El perfil de usuarios se elimina en cascada; las
// aportaciones, asistencias y anuncios que registró se conservan sin autor
// (on delete set null) y los anuncios mantienen el nombre guardado.
export async function eliminarUsuario(id: string, idioma: Idioma = "es"): Promise<{ error?: string }> {
  const { t, admin, yo, error: fallo } = await prepararAdmin(idioma);
  if (!admin) return { error: fallo };
  // Así siempre queda al menos un administrador: quien elimina
  if (id === yo) return { error: t.usuarios.noEliminarPropia };

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.status === 404 ? t.usuarios.noExiste : error.message };
  return {};
}
