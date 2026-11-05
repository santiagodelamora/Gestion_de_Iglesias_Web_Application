import type { ConceptoAportacion, MetodoPago, Rol, TipoEvento } from "../types";

// Textos de la interfaz en español. El diccionario en inglés (en.tsx) tiene la
// misma forma: TypeScript avisa si le falta una clave o si una función recibe
// otros parámetros. Los mensajes con negritas son funciones que devuelven JSX.
//
// Los catálogos (conceptos, métodos, tipos de evento y días) se guardan en
// español en la base de datos; aquí solo cambia cómo se muestran.

export const es = {
  locale: "es-MX",

  fechas: {
    meses: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    diasCortos: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  },

  catalogos: {
    roles: {
      administrador: "Administrador",
      pastor: "Pastor",
      secretario: "Secretario",
      tesorero: "Tesorero",
      coordinador: "Coordinador",
      miembro: "Miembro",
    } satisfies Record<Rol, string>,
    conceptos: {
      Diezmo: "Diezmo",
      Ofrenda: "Ofrenda",
      Primicias: "Primicias",
      "Donativo especial": "Donativo especial",
      Misiones: "Misiones",
      Construcción: "Construcción",
      Otro: "Otro",
    } satisfies Record<ConceptoAportacion, string>,
    metodos: {
      Efectivo: "Efectivo",
      "Transferencia SPEI": "Transferencia SPEI",
      Tarjeta: "Tarjeta",
      "Depósito bancario": "Depósito bancario",
      Cheque: "Cheque",
    } satisfies Record<MetodoPago, string>,
    tiposEvento: {
      "Culto dominical": "Culto dominical",
      "Culto de oración": "Culto de oración",
      "Estudio bíblico": "Estudio bíblico",
      "Reunión de ministerio": "Reunión de ministerio",
      "Reunión administrativa": "Reunión administrativa",
      "Actividad especial": "Actividad especial",
      Evangelismo: "Evangelismo",
    } satisfies Record<TipoEvento, string>,
    // Días de los horarios de reunión, tal como se guardan
    dias: {
      Lunes: "Lunes",
      Martes: "Martes",
      Miércoles: "Miércoles",
      Jueves: "Jueves",
      Viernes: "Viernes",
      Sábado: "Sábado",
      Domingo: "Domingo",
    } as Record<string, string>,
  },

  comun: {
    guardar: "Guardar",
    guardando: "Guardando…",
    cancelar: "Cancelar",
    cerrar: "Cerrar",
    editar: "Editar",
    agregar: "Agregar",
    quitar: "Quitar",
    cargando: "Cargando…",
    activo: "Activo",
    inactivo: "Inactivo",
    sinAsignar: "Sin asignar",
    ninguno: "Ninguno",
    importante: "Importante",
    todasLasSedes: "Todas las sedes",
    desde: "Desde",
    hasta: "Hasta",
    nombre: "Nombre",
    nombreCompleto: "Nombre completo",
    telefono: "Teléfono",
    correo: "Correo",
    correoElectronico: "Correo electrónico",
    direccion: "Dirección",
    fecha: "Fecha",
    hora: "Hora",
    titulo: "Título",
    descripcion: "Descripción",
    coordinador: "Coordinador",
    sede: "Sede",
    estado: "Estado",
    cerrarSesion: "Cerrar sesión",
    nombreObligatorio: "El nombre es obligatorio.",
    tituloObligatorio: "El título es obligatorio.",
  },

  // Errores de conexión y de la base de datos (usar-carga.ts y repositorio/supabase.ts)
  errores: {
    conexion: "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    cargarDatos: "No se pudieron cargar los datos.",
    inesperado: "Ocurrió un error inesperado.",
    sinPermiso: "No tienes permiso para realizar esta acción.",
    duplicado: "Ya existe un registro con esos datos.",
    ligado: "No se puede completar porque el registro está ligado a otros datos.",
    formato: "Algún dato no tiene un formato válido. Revisa el formulario e inténtalo de nuevo.",
    sesionExpirada: "Tu sesión expiró. Vuelve a iniciar sesión.",
    generico: "No se pudo completar la acción. Inténtalo de nuevo en unos minutos.",
  },

  ui: {
    mostrarContrasena: "Mostrar contraseña",
    ocultarContrasena: "Ocultar contraseña",
    sinAccesoTitulo: "No tienes acceso a este módulo",
    sinAccesoTexto: "Tu rol no tiene permiso para ver esta información.",
    logotipo: "Logotipo",
    cerrarAviso: "Cerrar aviso",
  },

  menu: {
    grupos: {
      general: "General",
      congregacion: "Congregación",
      finanzas: "Finanzas",
      administracion: "Administración",
    },
    enlaces: {
      inicio: "Inicio",
      panel: "Panel principal",
      miembros: "Miembros",
      asistencia: "Asistencia",
      eventos: "Eventos",
      ministerios: "Ministerios",
      comunicados: "Comunicados",
      donaciones: "Donaciones",
      reportes: "Reportes",
      usuarios: "Usuarios",
      sedes: "Sedes",
      configuracion: "Configuración",
    },
    abrirMenu: "Abrir menú",
    pendienteTitulo: "Tu cuenta está pendiente de activación",
    pendienteTexto: "Un administrador debe asignarte un rol y una sede antes de que puedas entrar.",
    primeraSedeTitulo: "Primero registra una sede",
    primeraSedeTexto: "Todo en el sistema pertenece a una sede.",
    crearPrimeraSede: "Crear la primera sede",
    sinSedeTitulo: "Tu cuenta no tiene sede asignada",
    sinSedeTexto: "Pide a un administrador que te asigne una sede.",
  },

  // Portada de las pantallas sin sesión
  acceso: {
    versiculo: "“Hágase todo decentemente y con orden.”",
    cita: "1 Corintios 14:40",
  },

  login: {
    vistas: {
      entrar: { titulo: "Inicia sesión", subtitulo: "Con el correo y la contraseña de tu cuenta." },
      recuperar: { titulo: "Recupera tu acceso", subtitulo: "Te enviaremos un enlace para restablecer tu contraseña." },
      registrar: { titulo: "Crea tu cuenta", subtitulo: "Un administrador la activará y te asignará tu sede." },
    },
    escribeCorreo: "Escribe tu correo electrónico.",
    escribeNombre: "Escribe tu nombre.",
    contrasenaCorta: "La contraseña debe tener al menos 8 caracteres.",
    noCoinciden: "Las contraseñas no coinciden.",
    correoEnviado: (correo: string) => (
      <>Te enviamos un correo a <b>{correo}</b>. Abre el enlace para confirmarlo; después un administrador activará tu cuenta.</>
    ),
    volverAIniciar: "Volver a iniciar sesión",
    nombrePlaceholder: "Nombre y apellidos",
    correoPlaceholder: "nombre@correo.mx",
    contrasena: "Contraseña",
    contrasenaPlaceholder: "Mínimo 8 caracteres",
    confirmarContrasena: "Confirmar contraseña",
    creandoCuenta: "Creando cuenta…",
    crearCuenta: "Crear cuenta",
    yaTienesCuenta: "¿Ya tienes cuenta?",
    iniciaSesion: "Inicia sesión",
    entrando: "Entrando…",
    iniciarSesion: "Iniciar sesión",
    olvidaste: "¿Olvidaste tu contraseña?",
    eresNuevo: "¿Eres nuevo?",
    enlaceEnviado: "Si el correo está registrado, recibirás el enlace en unos minutos.",
    volver: "Volver",
    enviando: "Enviando…",
    enviarEnlace: "Enviar enlace",
  },

  // Errores de inicio de sesión, recuperación y registro (store.tsx)
  auth: {
    sinConexion: "No se pudo conectar con el servidor. Revisa tu conexión o avisa al administrador.",
    soloInvitacion: "Por ahora las cuentas solo se crean por invitación del administrador.",
    cuentaExiste: "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
    correoInvalido: "El correo no es válido. Revisa que esté bien escrito.",
    limiteCorreos: "Se alcanzó el límite de correos por hora. Intenta de nuevo más tarde.",
    correoNoAutorizado: "El servidor no puede enviar el correo de confirmación a esa dirección. Avisa al administrador.",
    contrasenaInvalida: "La contraseña no es válida. Usa al menos 8 caracteres.",
    noSeCreo: "No se pudo crear la cuenta. Intenta de nuevo en unos minutos.",
    credenciales: "Correo o contraseña incorrectos.",
    correoNoEnviado: "No se pudo enviar el correo. Intenta de nuevo en unos minutos.",
    demoSinCuentas: "En la demostración no se crean cuentas.",
  },

  restablecer: {
    titulo: "Define tu contraseña",
    subtitulo: "Usa al menos 8 caracteres.",
    noSeGuardo: "No se pudo guardar la contraseña. Pide un enlace nuevo.",
    soloSupabase: "Esta página se usa con Supabase configurado.",
    validando: "Validando el enlace… Si no avanza, el enlace pudo haber expirado: solicita uno nuevo desde la pantalla de inicio de sesión.",
    nuevaContrasena: "Nueva contraseña",
    guardarYEntrar: "Guardar y entrar",
  },

  semana: {
    titulo: "Próximos 7 días",
    verCalendario: "Ver calendario",
    hoy: "Hoy",
    sinActividades: "Sin actividades",
  },

  inicio: {
    bienvenida: (nombre: string) => `Bienvenido, ${nombre}`,
    anuncios: "Anuncios",
    sinAnuncios: "No hay anuncios por ahora.",
    horarios: "Horarios de reunión",
    sinHorarios: "La sede aún no registra horarios.",
  },

  panel: {
    saludo: (nombre: string) => `Hola, ${nombre}`,
    miembrosActivos: "Miembros activos",
    deRegistrados: (n: number) => `de ${n} registrados`,
    eventosProximos: "Eventos próximos",
    desdeHoy: "programados desde hoy",
    asistenciasMes: "Asistencias del mes",
    presencias: "presencias registradas",
    ministerios: "Ministerios",
    gruposTrabajo: "grupos de trabajo",
    ingresosMes: "Ingresos del mes",
    sinAnuladas: "sin contar aportaciones anuladas",
    asistenciaCultos: "Asistencia a cultos dominicales",
    ultimosDomingos: "Personas presentes en los últimos 8 domingos",
    asistentes: "Asistentes",
    ingresosPorMes: "Ingresos por mes",
    ingresosDetalle: "Aportaciones registradas en pesos; el mes en curso, en verde oscuro",
    ingresos: "Ingresos",
    avisos: "Avisos",
    sinAvisos: "No hay avisos publicados.",
  },

  miembros: {
    titulo: "Miembros",
    descripcion: (activos: number, sede: string) => `${activos} activos en ${sede}`,
    nuevo: "Nuevo miembro",
    buscar: "Buscar por nombre",
    filtros: { activos: "Activos", inactivos: "Inactivos", todos: "Todos" },
    ingreso: "Ingreso",
    editarA: (nombre: string) => `Editar a ${nombre}`,
    desactivar: "Desactivar",
    reactivar: "Reactivar",
    sinResultados: "No hay miembros que coincidan con la búsqueda.",
    editarTitulo: "Editar miembro",
    fechaIngreso: "Fecha de ingreso",
    confirmarTitulo: "Desactivar miembro",
    confirmarMensaje: (nombre: string) => (
      <>
        ¿Desactivar a <b>{nombre}</b>? Ya no aparecerá entre los miembros activos. Su historial se conserva y podrás
        reactivar su registro desde el filtro «Inactivos».
      </>
    ),
    desactivado: (nombre: string) => `Se desactivó a ${nombre}.`,
    reactivado: (nombre: string) => `Se reactivó a ${nombre}.`,
  },

  eventos: {
    titulo: "Eventos",
    descripcion: "Cultos, reuniones y actividades de la sede",
    nuevo: "Nuevo evento",
    mesAnterior: "Mes anterior",
    mesSiguiente: "Mes siguiente",
    hoy: "Hoy",
    reactivar: "Reactivar evento",
    cancelar: "Cancelar evento",
    mantener: "Mantener evento",
    cancelado: "Cancelado",
    fechaDetalle: "Fecha:",
    lugarDetalle: "Lugar:",
    ministerioDetalle: "Ministerio:",
    responsablesDetalle: "Responsables:",
    editarTitulo: "Editar evento",
    tipo: "Tipo",
    ministerioOpcional: "Ministerio (opcional)",
    lugar: "Lugar",
    responsables: "Responsables (Ctrl o Cmd para elegir varios)",
    lugarPredeterminado: "Templo principal",
    indicaFechaHora: "Indica la fecha y la hora.",
    confirmarMensaje: (titulo: string, fecha: string, hora: string) => (
      <>
        ¿Cancelar <b>{titulo}</b> del {fecha.toLowerCase()} a las {hora}? Se mostrará tachado en el calendario y no se
        podrá pasar lista. Podrás reactivarlo después.
      </>
    ),
    reactivado: (titulo: string) => `Se reactivó «${titulo}».`,
    canceladoAviso: (titulo: string) => `Se canceló «${titulo}».`,
  },

  asistencia: {
    titulo: "Control de asistencia",
    descripcion: "Selecciona el evento y marca a los presentes",
    evento: "Evento",
    buscar: "Buscar",
    conteo: (presentes: number, ausentes: number) => (
      <>
        <strong>{presentes}</strong> presentes · <strong>{ausentes}</strong> ausentes
      </>
    ),
    todosPresentes: "Todos presentes",
    guardar: "Guardar asistencia",
    guardada: "Asistencia guardada.",
    presente: "Presente",
    ausente: "Ausente",
    sinEventos: "No hay eventos disponibles para pasar lista.",
    historial: "Historial reciente",
    presentes: "Presentes",
    deTotal: (presentes: number, total: number) => `${presentes} de ${total}`,
    sinRegistro: "Sin registro",
    confirmarTitulo: "Asistencia sin guardar",
    confirmarMensaje: "Marcaste asistencia que aún no guardas. Si cambias de evento, se perderán esas marcas.",
    descartar: "Descartar y cambiar",
    seguir: "Seguir pasando lista",
  },

  ministerios: {
    titulo: "Ministerios",
    descripcion: "Grupos de trabajo, sus coordinadores e integrantes",
    nuevo: "Nuevo ministerio",
    sinMinisterios: "Esta sede todavía no tiene ministerios registrados.",
    tuMinisterio: "Tu ministerio",
    integrantes: "Integrantes",
    proximaActividad: "Próxima actividad",
    ninguna: "Ninguna",
    verIntegrantes: "Ver integrantes",
    vincular: "Vincular un miembro…",
    quitarA: (nombre: string) => `Quitar a ${nombre} del ministerio`,
    quitarDelMinisterio: "Quitar del ministerio",
    actividades: "Actividades programadas",
    crear: "Crear",
    confirmarTitulo: "Quitar integrante",
    confirmarMensaje: (quien: string, ministerio: string) => (
      <>¿Quitar a <b>{quien}</b> de <b>{ministerio}</b>? Podrás volver a agregar a esta persona después.</>
    ),
    quitado: (quien: string, ministerio: string) => `Se quitó a ${quien} de ${ministerio}.`,
  },

  comunicados: {
    titulo: "Comunicados y anuncios",
    descripcion: "Los miembros ven estos avisos al iniciar sesión",
    nuevo: "Nuevo anuncio",
    sinAnuncios: "No hay anuncios publicados.",
    programado: "Programado",
    eliminar: "Eliminar",
    editarTitulo: "Editar anuncio",
    publicar: "Publicar",
    contenido: "Contenido",
    fechaPublicacion: "Fecha de publicación",
    dirigidoA: "Dirigido a",
    marcarImportante: "Marcar como aviso importante",
    confirmarTitulo: "Eliminar anuncio",
    confirmarMensaje: (titulo: string) => (
      <>¿Eliminar <b>{titulo}</b>? Los miembros dejarán de verlo. Esta acción no se puede deshacer.</>
    ),
    eliminado: "Se eliminó el anuncio.",
  },

  donaciones: {
    titulo: "Donaciones y aportaciones",
    descripcion: "Información financiera restringida a administración, pastor y tesorería",
    registrar: "Registrar aportación",
    soloLectura: "Tienes acceso de solo lectura.",
    totalPeriodo: "Total del periodo",
    aportaciones: (n: number) => `${n} aportaciones`,
    movimientos: "Movimientos del periodo",
    concepto: "Concepto",
    aportante: "Aportante",
    metodo: "Método",
    monto: "Monto",
    anulada: "Anulada",
    anonimo: "Anónimo",
    restaurar: "Restaurar",
    anular: "Anular",
    sinAportaciones: "No hay aportaciones en este periodo.",
    porConcepto: "Por concepto",
    resumen: "Resumen mensual",
    mes: "Mes",
    diezmos: "Diezmos",
    total: "Total",
    montoMxn: "Monto (MXN)",
    metodoRecepcion: "Método de recepción",
    anonima: "Aportación anónima",
    aportanteOpcional: "Aportante (opcional)",
    sinAsociar: "Sin asociar",
    montoInvalido: "Escribe un monto mayor a cero.",
    indicaFecha: "Indica la fecha.",
    confirmarTitulo: "Anular aportación",
    confirmarMensaje: (monto: string, concepto: string, fecha: string) => (
      <>
        ¿Anular la aportación de <b>{monto}</b> ({concepto}) del {fecha}? Dejará de sumar en los totales y reportes. Podrás
        restaurarla después.
      </>
    ),
    restaurada: "Se restauró la aportación.",
    anuladaAviso: "Se anuló la aportación.",
  },

  reportes: {
    titulo: "Reportes",
    descripcion: (sede: string) => `Información de ${sede}`,
    tipos: {
      miembros: "Miembros",
      asistencia: "Asistencia por evento",
      ministerios: "Participación por ministerio",
      ingresos: "Ingresos por periodo",
    } as Record<string, string>,
    periodo: (desde: string, hasta: string) => ` · del ${desde} al ${hasta}`,
    excel: "Exportar a Excel",
    pdf: "Exportar a PDF",
    registros: (n: number) => `${n} registros`,
    columnas: {
      miembros: ["Nombre", "Teléfono", "Correo", "Fecha de ingreso", "Estado", "Ministerios"],
      asistencia: ["Fecha", "Evento", "Presentes", "Ausentes", "% asistencia"],
      ministerios: ["Ministerio", "Coordinador", "Integrantes", "Actividades en el periodo", "Asistencia promedio"],
      ingresos: ["Mes", "Diezmos (MXN)", "Ofrendas (MXN)", "Otros (MXN)", "Total (MXN)", "Aportaciones"],
    },
  },

  usuarios: {
    titulo: "Usuarios del sistema",
    descripcion: "Cuentas de acceso, su rol y su sede",
    invitar: "Invitar usuario",
    rol: "Rol",
    todas: "Todas",
    sinSede: "Sin sede",
    pendiente: "Pendiente o bloqueado",
    editarA: (nombre: string) => `Editar a ${nombre}`,
    enviarInvitacion: "Enviar invitación",
    avisoInvitacion: "La persona recibirá un correo con un enlace para crear su contraseña.",
    editarTitulo: (nombre: string) => `Editar ${nombre}`,
    cuentaActiva: "Cuenta activa (desmarca para bloquear el acceso)",
    miembroVinculado: "Registro de miembro vinculado",
    obligatorios: "Nombre y correo son obligatorios.",
    creadoDemo: "Usuario creado (demostración).",
    invitacionEnviada: (correo: string) => `Se envió la invitación a ${correo}.`,
    confirmarTitulo: "Bloquear acceso",
    confirmarMensaje: (nombre: string) => (
      <><b>{nombre}</b> no podrá iniciar sesión hasta que vuelvas a marcar su cuenta como activa.</>
    ),
    bloquear: "Bloquear acceso",
    // Respuestas de la acción del servidor que envía la invitación
    soloAdmin: "Solo un administrador puede crear usuarios.",
    faltaLlave: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para enviar invitaciones.",
    cuentaExiste: "Ya existe una cuenta con ese correo.",
  },

  sedes: {
    titulo: "Sedes",
    descripcion: "Cada sede tiene sus propios miembros, eventos, ministerios y finanzas",
    nueva: "Nueva sede",
    sinSedes: "Aún no hay sedes. Registra la primera para empezar.",
    activa: "Activa",
    inactiva: "Inactiva",
    sinDireccion: "Sin dirección",
    resumen: (miembros: number, ministerios: number) => `${miembros} miembros activos · ${ministerios} ministerios`,
    sedeActiva: "Sede activa",
    trabajarAqui: "Trabajar en esta sede",
    editarTitulo: "Editar sede",
  },

  configuracion: {
    titulo: "Configuración",
    descripcion: "Información institucional y de la sede activa",
    guardarCambios: "Guardar cambios",
    guardados: "Cambios guardados.",
    logoNoImagen: "El logotipo debe ser una imagen (PNG, JPG o SVG).",
    logoPesado: "La imagen debe pesar menos de 2 MB.",
    logoActualizado: "Logotipo actualizado.",
    iglesia: "Iglesia",
    subiendo: "Subiendo…",
    cambiarLogo: "Cambiar logotipo",
    nombreIglesia: "Nombre de la iglesia",
    lema: "Lema",
    contacto: (sede: string) => `Datos de contacto · ${sede}`,
    horarios: (sede: string) => `Horarios habituales de reunión · ${sede}`,
    quitarHorario: "Quitar horario",
    sinHorarios: "Sin horarios registrados.",
    tipoReunion: "Tipo de reunión",
    confirmarMensaje: (horario: string) => <>¿Quitar el horario <b>{horario}</b>? Esta acción no se puede deshacer.</>,
    horarioQuitado: "Se quitó el horario.",
    idioma: "Idioma",
    idiomaDescripcion: "Se aplica de inmediato y se recuerda en este navegador.",
    idiomaCampo: "Idioma de la interfaz",
    idiomaCambiado: "La aplicación ahora está en español.",
  },

  exportar: {
    hoja: "Reporte",
    pie: (pagina: number, fecha: string) => `Página ${pagina} · generado el ${fecha}`,
  },
};

export type Textos = typeof es;
