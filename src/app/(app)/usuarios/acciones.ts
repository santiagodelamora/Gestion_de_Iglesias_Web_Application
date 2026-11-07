"use server";

import { headers } from "next/headers";
import { DICCIONARIOS, esIdioma, type Idioma } from "@/lib/i18n/diccionarios";
import type { DatosInvitacion } from "@/lib/repositorio/tipos";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase/servidor";

// Crear cuentas requiere la llave de servicio de Supabase, que nunca llega al
// navegador. Antes de usarla se comprueba que quien llama es administrador.
// Los mensajes de error vuelven en el idioma de quien invita.
export async function invitarUsuario(datos: DatosInvitacion, idioma: Idioma = "es"): Promise<{ error?: string }> {
  const t = DICCIONARIOS[esIdioma(idioma) ? idioma : "es"];
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.errores.sesionExpirada };

  const { data: perfil } = await supabase.from("usuarios").select("rol, activo").eq("id", user.id).single();
  if (perfil?.rol !== "administrador" || !perfil.activo) {
    return { error: t.usuarios.soloAdmin };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return { error: t.usuarios.faltaLlave };
  }

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
