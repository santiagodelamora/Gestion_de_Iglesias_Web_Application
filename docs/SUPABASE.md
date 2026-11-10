# Configurar Supabase

Esta guía conecta la aplicación a una base de datos real. Toma unos 15 minutos y usa el plan gratuito de Supabase. Sin estos pasos, la aplicación sigue funcionando en **modo demostración**.

## 1. Crear el proyecto

1. Entra a [supabase.com](https://supabase.com), crea una cuenta y luego **New project**.
2. Ponle un nombre (por ejemplo `gestion-iglesias`), elige una contraseña para la base de datos y guárdala en un lugar seguro.
3. En **Region** elige la más cercana a México (por ejemplo *East US* o *West US*).
4. Espera uno o dos minutos a que el proyecto termine de crearse.

## 2. Crear las tablas y la seguridad

1. En el menú izquierdo abre **SQL Editor** y crea una consulta nueva (**New query**).
2. Ejecuta, en este orden y cada uno en su propia consulta, el contenido de los archivos de [`supabase/migrations/`](../supabase/migrations). Copia el archivo completo, pégalo y presiona **Run**. Cada uno debe decir *Success. No rows returned*.
   - [`20261026000001_fase1_esquema.sql`](../supabase/migrations/20261026000001_fase1_esquema.sql): sedes, usuarios, miembros, configuración y horarios.
   - [`20261026000002_fase2_esquema.sql`](../supabase/migrations/20261026000002_fase2_esquema.sql): ministerios, eventos, asistencia y comunicados.
   - [`20261026000003_fase3_esquema.sql`](../supabase/migrations/20261026000003_fase3_esquema.sql): donaciones y aportaciones.
3. (Opcional) Para tener datos de ejemplo, ejecuta también, en orden, [`seed.sql`](../supabase/seed.sql), [`seed_fase2.sql`](../supabase/seed_fase2.sql) y [`seed_fase3.sql`](../supabase/seed_fase3.sql). Agregan la "Iglesia Comunidad de Fe" con 3 sedes, horarios, miembros, ministerios, eventos de las últimas semanas con su asistencia, algunos anuncios y seis meses de aportaciones.

   Si el editor muestra el aviso *Potential issue detected* al ejecutar un archivo de datos de ejemplo, elige **Run without RLS**: esos archivos no crean tablas, solo agregan filas a tablas que ya tienen su seguridad activada.

> Haz el paso 3 **antes** del paso 5: así el administrador queda asignado automáticamente a la primera sede.

**¿Ya tenías una fase anterior instalada?** Ejecuta solo los archivos de las fases nuevas (esquema y, si usas los datos de ejemplo, su `seed_faseN.sql`). No vuelvas a ejecutar los anteriores: fallarían porque las tablas ya existen.

## 3. Cerrar el registro público (por ahora)

Mientras no exista el administrador, nadie más debe poder registrarse: la primera cuenta del sistema queda como administrador.

1. Ve a **Authentication → Sign In / Providers**.
2. Desactiva **Allow new users to sign up** y guarda.

Con el registro cerrado, las cuentas solo se crean por invitación desde **Usuarios**.

**Para usar el botón "Crear cuenta" del inicio de sesión**, vuelve a activar **Allow new users to sign up** después de crear el administrador (paso 5) y deja encendido **Confirm email**. Cada cuenta creada así nace como Miembro, **inactiva y sin sede**: no ve nada hasta que un administrador, en **Usuarios**, le asigna rol y sede y la activa. El riesgo es que cualquiera puede llenar la lista de pendientes con cuentas falsas (el administrador las borra con el botón de eliminar de cada fila); el correo gratuito de Supabase además envía pocos correos por hora.

## 4. Direcciones de la aplicación

1. Ve a **Authentication → URL Configuration**.
2. En **Site URL** escribe `http://localhost:3000` (cámbialo por la dirección de Vercel cuando publiques la app).
3. En **Redirect URLs** agrega `http://localhost:3000/restablecer` y `http://localhost:3000/confirmar` (y después las mismas con `https://tu-app.vercel.app`).

`/restablecer` es a donde llevan los correos de invitación y de recuperación de contraseña; `/confirmar`, el de verificación de las cuentas creadas con "Crear cuenta": muestra que la cuenta quedó verificada, o que el enlace expiró o ya se usó. Si `/confirmar` no está en la lista, el correo se verifica igual, pero Supabase manda a la persona a la Site URL sin mostrarle ese aviso.

Al reenviar el correo de verificación (botón que aparece al intentar iniciar sesión sin haber verificado), el enlace del correo anterior deja de servir.

## 5. Crear el primer administrador

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Escribe tu correo y una contraseña, deja marcada **Auto Confirm User** y crea el usuario.

**La primera cuenta del sistema queda como administrador automáticamente.** Las siguientes se crean desde la pantalla *Usuarios* de la aplicación.

## 6. Conectar la aplicación

1. Ve a **Project Settings → API Keys** (o **Data API**) y copia:
   - **Project URL** (solo `https://xxxxxxxx.supabase.co`, sin `/rest/v1/`)
   - la llave pública: **Publishable key** (`sb_publishable_…`) o, en proyectos antiguos, **anon / public**
   - la llave secreta: **Secret key** (`sb_secret_…`) o **service_role**. Permite crear cuentas: no la compartas
2. En la carpeta del proyecto copia `.env.example` como `.env.local` y pega los valores:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```

3. Ejecuta `npm run dev`, abre http://localhost:3000 y entra con el administrador del paso 5.

`.env.local` está en `.gitignore`: nunca subas la llave secreta al repositorio ni la pegues en chats o correos. Si se expone, crea una nueva en **API Keys** y borra la anterior.

## 7. Invitar al equipo

En **Usuarios → Invitar usuario** escribe nombre, correo, rol y sede. La persona recibe un correo con un enlace para crear su contraseña.

En **Registro de miembro vinculado** elige a qué miembro corresponde la cuenta. Es necesario para dos roles:

- **Coordinador:** el sistema sabe qué ministerio coordina por este vínculo (el coordinador de cada ministerio se elige en *Ministerios*).
- **Miembro:** así la persona ve su propio registro.

Para quitarle el acceso a alguien hay dos opciones en cada fila de **Usuarios**:

- **Editar → desmarcar Cuenta activa:** bloquea el inicio de sesión y se puede revertir.
- **Eliminar cuenta (bote de basura):** borra la cuenta de Supabase y libera el correo para invitarlo otra vez. No se puede deshacer. Las aportaciones, la asistencia y los anuncios que registró se conservan; los anuncios siguen mostrando su nombre. Nadie puede eliminar su propia cuenta, así que siempre queda al menos un administrador.

El servicio de correo incluido en Supabase solo envía unos pocos correos por hora. Para un proyecto académico alcanza; si necesitas más, configura un SMTP propio en **Project Settings → Authentication → SMTP Settings**.

## Publicar en internet

La guía [DESPLIEGUE.md](DESPLIEGUE.md) explica cómo subir la aplicación a Vercel.

## Si conectaste GitHub en Supabase

Con la integración de GitHub (**Project Settings → Integrations → GitHub**), Supabase aplica los archivos de `supabase/migrations/` cada vez que llega un cambio a la rama de producción. GitHub muestra el resultado en cada commit como el check **Supabase Preview**.

Supabase anota las migraciones que ya aplicó en la tabla `supabase_migrations.schema_migrations`, pero el SQL Editor no escribe en ella. Si creaste las tablas con el paso 2, la integración cree que faltan todas, intenta crearlas de nuevo y el check falla con `ERROR: type "rol" already exists (SQLSTATE 42710)`. Tus tablas y datos no cambian: la migración se detiene en la primera instrucción.

Para corregirlo, ejecuta esto **una sola vez** en el **SQL Editor**. Registra las tres migraciones como ya aplicadas:

```sql
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
insert into supabase_migrations.schema_migrations (version, name) values
  ('20261026000001', 'fase1_esquema'),
  ('20261026000002', 'fase2_esquema'),
  ('20261026000003', 'fase3_esquema')
on conflict (version) do nothing;
```

El check sale en verde desde el siguiente cambio que llegue a la rama de producción. Los commits anteriores conservan su ❌.

Desde ese momento, una migración nueva se agrega como archivo en `supabase/migrations/` y la aplica la integración al fusionar en la rama de producción. No la ejecutes también en el SQL Editor: el check volvería a fallar con *already exists*.

Si no quieres que Supabase aplique las migraciones, desconecta la integración en **Project Settings → Integrations → GitHub** y el check deja de aparecer.

## Qué protege la base de datos

Las reglas de acceso están en la propia base de datos (Row Level Security), no solo en la interfaz:

| Tabla | Quién ve | Quién modifica |
| --- | --- | --- |
| Sedes | Cualquier usuario activo | Administrador |
| Usuarios | Su propio perfil; pastor los de su sede; administrador todos | Administrador (nadie cambia su propio rol) |
| Miembros | Administrador todas las sedes; pastor, secretario, tesorero y coordinador su sede; un miembro solo su registro | Administrador; pastor y secretario en su sede. Nadie borra: se desactivan |
| Configuración | Todos (se muestra en el inicio de sesión) | Administrador |
| Horarios | Su sede | Administrador |
| Logotipo | Público | Administrador |
| Ministerios | Administrador; pastor, secretario, tesorero y coordinador de la sede | Administrador; pastor y secretario en su sede. El coordinador solo agrega o quita integrantes del suyo |
| Eventos | Toda la sede, incluido el rol Miembro | Administrador; pastor y secretario en su sede; el coordinador, los de su ministerio. Nadie borra: se cancelan |
| Asistencia | Quien puede gestionar el evento | Igual que eventos |
| Comunicados | Toda la sede, cuando llega su fecha de publicación (los programados solo los ve quien los gestiona) | Administrador (una sede o todas); pastor y secretario en su sede. El autor lo pone la base de datos |
| Aportaciones | Administrador; pastor y tesorero de la sede | Administrador; tesorero en su sede. No se editan ni se borran: se anulan, y quien registró lo pone la base de datos |

Las pruebas de estas reglas están en [`supabase/pruebas/`](../supabase/pruebas).

## Desarrollo local con Docker (opcional)

Si tienes Docker, `npx supabase start` levanta Supabase en tu computadora con la migración y los datos de ejemplo ya aplicados (la configuración está en `supabase/config.toml`). `npx supabase status` muestra la URL y las llaves para `.env.local`, y los correos de invitación se ven en http://127.0.0.1:54324.
