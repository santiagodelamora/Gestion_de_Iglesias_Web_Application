# Comunidad de Fe
Aplicación web para administrar una iglesia con varias sedes: miembros, asistencia, eventos, ministerios, donaciones, comunicados, panel de indicadores, reportes y configuración. Proyecto académico.

## Estado
| Fase | Contenido | Estado |
| --- | --- | --- |
| 0 | Prototipo navegable con datos de ejemplo | Listo |
| 1 | Supabase: inicio de sesión real, roles, sedes, usuarios, miembros, configuración | Listo |
| 2 | Eventos y calendario, asistencia, ministerios, comunicados | Listo |
| 3 | Donaciones, dashboard, reportes PDF y Excel, despliegue | Listo |

La aplicación tiene dos modos:
- **Demostración** (sin variables de Supabase): datos ficticios en memoria de la "Iglesia Comunidad de Fe" con 3 sedes. Muestra todos los módulos; los cambios se pierden al recargar.
- **Supabase** (con `.env.local`): datos reales y sesión real. Todos los módulos guardan en la base de datos y cada rol solo ve lo que le corresponde.

## Cómo ejecutarlo
Requiere Node.js 20 o superior.
```bash
npm install
npm run dev
```

Abre http://localhost:3000.
- **Modo demostración:** entra con uno de los botones de rol (Administrador, Pastor, Secretario, Tesorero, Coordinador o Miembro).
- **Modo Supabase:** sigue la guía [docs/SUPABASE.md](docs/SUPABASE.md) para crear el proyecto, las tablas y el primer administrador.
- **Publicar en internet:** sigue [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) para subir la aplicación a Vercel.

## Qué ve cada rol
| Módulo | Administrador | Pastor | Secretario | Tesorero | Coordinador | Miembro |
| --- | --- | --- | --- | --- | --- | --- |
| Sedes | Total | — | — | — | — | — |
| Usuarios y roles | Total | Ver | — | — | — | — |
| Miembros | Total | Total | Total | Ver | Ver | — |
| Asistencia | Total | Total | Total | — | Su ministerio | — |
| Eventos | Total | Total | Total | Ver | Su ministerio | Ver |
| Ministerios | Total | Total | Editar | Ver | Su ministerio | — |
| Donaciones | Total | Ver | — | Total | — | — |
| Comunicados | Total | Total | Total | — | Ver | Ver (en Inicio) |
| Dashboard financiero | Sí | Sí | No | Sí | No | No |
| Reportes | Todos | Todos | Sin ingresos | Solo ingresos | Su ministerio | — |
| Configuración | Total | Ver | — | — | — | — |

El administrador puede cambiar de sede desde la barra superior; los demás roles trabajan solo con su sede.

## Estructura
```
src/
  app/
    login/            Inicio de sesión y recuperación de contraseña
    (app)/            Pantallas con menú lateral, una carpeta por módulo
  components/ui.tsx   Componentes básicos (botones, tablas, modales…)
  lib/
    types.ts          Modelo de datos
    permisos.ts       Matriz de permisos por rol
    catalogos.ts      Conceptos de aportación, métodos de pago, tipos de evento
    datos-ejemplo.ts  Generador de datos ficticios (modo demostración)
    exportar.ts       Exportación de reportes a Excel (.xlsx) y PDF
    i18n/             Textos de la interfaz en español (es.tsx) e inglés (en.tsx)
    store.tsx         Sesión y estado global (modo demostración o Supabase)
    repositorio/      Acceso a datos: implementación demo y Supabase
    supabase/         Clientes de Supabase (navegador, servidor, administrador)
  middleware.ts       Renueva la sesión y protege las rutas
supabase/
  migrations/         Esquema SQL con políticas de seguridad por sede (RLS)
  seed*.sql           Datos de ejemplo opcionales (uno por fase)
  pruebas/            Pruebas de permisos por rol en SQL
  pruebas/            Pruebas de permisos por rol
```

## Tecnología
Next.js 15 (React 19, TypeScript), Tailwind CSS 4, Recharts para gráficas, lucide-react para íconos y Supabase (PostgreSQL, autenticación, almacenamiento y políticas de seguridad por sede).

La interfaz está en español o en inglés: cada persona lo elige en Configuración y se recuerda en su navegador. Los montos son en pesos mexicanos (MXN) y las fechas siguen el idioma elegido (es-MX o en-US). Los datos capturados (nombres, títulos, anuncios) no se traducen.
