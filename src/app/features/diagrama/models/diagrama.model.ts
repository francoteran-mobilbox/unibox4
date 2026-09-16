export interface ObtenerProcesosEjecucionRequest {
  readonly id_roles: readonly number[];
  readonly pag: number;
  readonly itemPag: number;
  readonly texto_busqueda?: string;
}

export interface ProcesoEjecucion {
  readonly process_id: number;
  readonly user_login_creator: string;
  readonly estado_tiempo_restante: string;
  readonly processrunning_id: number;
  readonly limit_date: string;
  readonly process_name: string;
  readonly tiempo_restante: string;
  readonly processrunning_name: string;
  readonly creation_date: string;
  readonly id_estado_ejecucion: string;
}

export interface ObtenerProcesosEjecucionResponse {
  readonly procesosEE: readonly ProcesoEjecucion[];
  readonly count_procesosEE: number;
  readonly count_procesosEE_Filtro?: number;
}

export interface ProcesoConfiguracion {
  readonly id_proceso: number;
  readonly modificado_por: string;
  readonly distribucion_requerida: boolean;
  readonly xml: string;
  readonly nombre_proceso: string;
  readonly id_organigrama: number;
  readonly ultima_modificacion: string;
  readonly id_padre: number;
  readonly privado: boolean;
  readonly version: number;
  readonly es_oficina_partes: boolean;
  readonly compartido: boolean;
  readonly id_familia?: number;
  readonly responsables?: readonly number[];
  readonly process_time?: number;
  readonly timeunit_id?: string;
  readonly id_mecanismo?: number;
  readonly id_mecanismo_denominacion?: number;
  readonly expediente_electronico?: boolean;
  readonly agregado_catalogo_formularios?: boolean;
  readonly procesosEE?: number;
  readonly id_jornada?: number;
  readonly id_calendario?: number;
  readonly datoProcesoMecanismo?: readonly DatoProcesoMecanismo[];
  readonly proceso_compartido?: ProcesoCompartido;
  readonly id_catalogo?: readonly number[];
}

export interface DatoRequerido {
  readonly valor_por_defecto: string;
  readonly id_mecanismo_denominacion: number;
  readonly orden: number;
  readonly id_dato_mecanismo: string;
  readonly id_dato_req_mecanismo: number;
}

export interface MecanismoProceso {
  readonly id_tipo_mecanismo: string;
  readonly por_defecto: boolean;
  readonly id_mecanismo_denominacion: number;
  readonly id_usuario_creador: string;
  readonly nombre_mecanismo_denominacion: string;
  readonly fecha_creacion: string;
  readonly datos_requeridos: readonly DatoRequerido[];
}

export interface ProcesoCompartidoGrupo {
  readonly id_grupo: number;
  readonly nombre_grupo: string;
}

export interface ProcesoCompartidoUsuario {
  readonly id_usuario: string;
}

export interface ProcesoCompartidoCargo {
  readonly id_rol: number;
  readonly nombre_rol: string;
}

export interface ProcesoCompartido {
  readonly grupo: readonly ProcesoCompartidoGrupo[];
  readonly usuario: readonly ProcesoCompartidoUsuario[];
  readonly cargo: readonly ProcesoCompartidoCargo[];
}

export interface ConfigDatoSelection {
  readonly tipo: string;
  readonly valor?: string;
  readonly documento?: string;
  readonly metadato?: string;
  readonly codigoBloque?: string;
  readonly secuencia?: string;
}

export interface DatoProcesoMecanismo {
  readonly process_id: number;
  readonly id_dato_req_proceso?: number;
  readonly valor_texto_fijo?: string;
  readonly id_dato_req_mecanismo: number;
  readonly id_dato_disponible_proceso: string;
  readonly nombre_secuencia?: string;
  readonly id_documento?: number;
  readonly doc_comun_id?: number;
  readonly nombre_doc_comun?: string;
  readonly id_metadato?: number;
  readonly id_bloque?: number;
  readonly codigo_bloque?: string;
}

export interface ObtenerDocumentosComunProcesoSegunProcessIdRequest {
  readonly processId: number;
}

export interface DocumentoComunProceso {
  readonly id_documento: number;
  readonly doc_comun_id: number;
  readonly process_id: number;
  readonly nombre_doc_comun: string;
  readonly nombre_documento: string;
  readonly privado: boolean;
  readonly compartido: boolean;
}

export interface ReglaNegocioActividad {
  readonly id_regla_negocio?: number;
  readonly id_operador_regla?: string;
  readonly operador?: string;
  readonly id_tipo_dato?: string;
  readonly izq_es_doc?: boolean;
  readonly izq_id_metadato?: number;
  readonly izq_id_bloque?: number;
  readonly izq_doc_comun_id?: number;
  readonly izq_codigo_bloque?: string;
  readonly izq_id_tipo_dato?: string;
  readonly izq_id_operando?: number;
  readonly der_es_doc?: boolean;
  readonly der_id_metadato?: number;
  readonly der_id_bloque?: number;
  readonly der_doc_comun_id?: number;
  readonly der_codigo_bloque?: string;
  readonly der_id_tipo_dato?: string;
  readonly der_id_operando?: number;
  readonly der_valor_operando?: string | null;
}

export interface ReglaUsuarioActividad {
  readonly id_regla_usuario?: number;
  readonly transition_id?: number;
  readonly id_doc_izq?: number;
  readonly id_bloq_izq?: number;
  readonly codigo_bloq_izq?: string;
  readonly id_met_izq?: number;
  readonly id_rol_der?: number;
  readonly id_bloq_der?: number;
  readonly codigo_bloq_der?: string;
  readonly id_met_der?: number;
  readonly campo_valor2?: boolean;
}

export interface MetadatoRequeridoRol {
  readonly id_rol: number;
  readonly nombre_rol: string;
  readonly metadatosRequeridos: readonly {
    readonly id_metadato: number;
    readonly nombre_metadato: string;
    readonly nombre_bloque?: string;
    readonly id_bloque?: number;
  }[];
}

export interface TransicionTareaProceso {
  readonly transition_id: number;
  readonly process_id: number;
  readonly activity_id_source: number;
  readonly activity_id_destination: number;
  readonly transition_name: string;
  readonly levanta_form: boolean;
  readonly tiene_timer: boolean;
  readonly con_interrupcion?: boolean;
  readonly id_accion_transicion?: string | null;
  readonly timers: readonly TimerProcesoActividad[];
  readonly reglasUsuario: readonly ReglaUsuarioActividad[];
  readonly reglasNegocio: readonly ReglaNegocioActividad[];
}

export interface TareasProcesoResponse {
  readonly activities: readonly ActividadTareaProceso[];
  readonly transitions: readonly TransicionTareaProceso[];
}

export interface MetadatoDisponibleActividad {
  readonly id_documento: number;
  readonly doc_comun_id?: number;
  readonly id_metadato: number;
  readonly codigo_bloque?: string;
  readonly id_bloque?: number;
  readonly activity_id?: number;
}

export interface MetadatoTransferidoActividad {
  readonly id_metadato_origen: number;
  readonly id_metadato_destino: number;
  readonly id_documento_origen: number;
  readonly id_documento_destino: number;
  readonly codigo_bloque_origen?: string;
  readonly codigo_bloque_destino?: string;
  readonly id_bloque_origen?: number;
  readonly id_bloque_destino?: number;
  readonly doc_comun_id_origen?: number;
  readonly doc_comun_id_destino?: number;
  readonly metadato_transferido_id?: number;
  readonly activity_id?: number;
}

export interface TimerProcesoActividad {
  readonly es_fecha: boolean;
  readonly es_tiempo: boolean;
  readonly es_dato_fijo: boolean;
  readonly es_met_formulario: boolean;
  readonly dato_fijo: string | null;
  readonly fecha: string | null;
  readonly hora: string | null;
  readonly id_unidad_tiempo: string | null;
  readonly id_metadato: number | null;
  readonly id_bloque: number | null;
  readonly doc_comun_id: number | null;
  readonly id_timer_proceso?: number;
  readonly activity_id?: number;
  readonly transition_id?: number;
  readonly transitionTimer?: readonly unknown[];
}

export interface ReferenciaMetadatoMensaje {
  readonly doc_comun_id?: number;
  readonly id_bloque?: number;
  readonly id_metadato?: number;
}

export interface RolSecundarioUsuario {
  readonly id_rol: number;
  readonly nombre_rol: string;
}

export interface UsuarioLiviano {
  readonly id_rol: number;
  readonly nombre_completo_usuario: string;
  readonly roles_secundarios: readonly RolSecundarioUsuario[];
  readonly id_usuario: string;
  readonly apellido_paterno?: string;
  readonly apellido_materno?: string;
  readonly tiene_subrogante?: boolean;
  readonly nombre_rol?: string;
  readonly nombre?: string;
  readonly email?: string;
  readonly activo?: boolean;
}

export interface ObtenerUsuariosLivianoResponse {
  readonly user_count: number;
  readonly usuarios: readonly UsuarioLiviano[];
}

export interface DocumentoComunAdjuntoMensaje {
  readonly id_mensaje?: number;
  readonly nombre_documento_comun?: string;
}

export interface MensajeProcesoActividad {
  readonly id_mensaje?: number;
  readonly activity_id?: number;
  readonly asunto?: string;
  readonly contenido?: string;
  readonly envia_a_cargo?: boolean;
  readonly encabezado?: boolean;
  readonly con_copia?: boolean;
  readonly envia_formulario_externo?: boolean;
  readonly usuarios?: readonly string[];
  readonly roles?: readonly unknown[];
  readonly documentos?: readonly unknown[];
  readonly documentosComunesAdjuntos?: readonly DocumentoComunAdjuntoMensaje[];
  readonly metadatosDestino?: readonly ReferenciaMetadatoMensaje[];
  readonly metadatosDestinoCC?: readonly ReferenciaMetadatoMensaje[];
}

export interface UsuariosPreAsignadoActividad {
  readonly id_usuario: string;
  readonly activity_id?: number;
  readonly id_procedencia?: string;
}

export interface DocumentoComunActividadActividad {
  readonly doc_comun_id?: number;
  readonly activity_id?: number;
  readonly tiene_metadatos_transferidos?: string;
}

export interface ActividadTareaProceso {
  readonly activity_id: number;
  readonly process_id: number;
  readonly activity_name: string;
  readonly activitytype_id: string;
  readonly id_elemento: string;
  readonly activity_time: number;
  readonly timeunit_id: string | null;
  readonly priority_id?: number;
  readonly stage?: number;
  readonly etapa_orden?: number;
  readonly porcentaje_avance?: string | number;
  readonly funcionality?: string | null;
  readonly id_rol?: number | null;
  readonly id_jornada?: number;
  readonly id_calendario?: number;
  readonly minimo_ejecutores?: number;
  readonly cualquier_usuario?: boolean;
  readonly adjuntar_documento?: boolean;
  readonly cantidad_documentos?: number;
  readonly es_configuracion?: boolean;
  readonly es_timer?: boolean;
  readonly automatica?: boolean;
  readonly consecutiva?: boolean;
  readonly tiene_documentos_comunes?: boolean;
  readonly filtrar_por_metadato?: boolean;
  readonly tiene_checkpoint?: boolean;
  readonly nombre_checkpoint?: string;
  readonly tiene_alertas?: boolean;
  readonly imprime_formulario?: boolean;
  readonly tarea_web?: boolean;
  readonly utiliza_agenda?: boolean;
  readonly conservar_vistos_buenos?: boolean;
  readonly dispositivo_movil?: boolean;
  readonly validacion_jerarquica?: boolean;
  readonly tiene_notificacion?: boolean;
  readonly registros_externos?: boolean;
  readonly usuariosPreAsignados: readonly UsuariosPreAsignadoActividad[];
  readonly documentoComunActividad: readonly DocumentoComunActividadActividad[];
  readonly metadatosDisponibles: readonly MetadatoDisponibleActividad[];
  readonly metadatosTransferidos: readonly MetadatoTransferidoActividad[];
  readonly timers: readonly TimerProcesoActividad[];
  readonly mensajes: readonly MensajeProcesoActividad[];
}

export interface DocumentoLiviano {
  readonly inserta_marca_agua: boolean;
  readonly nombre_documento: string;
  readonly config_doc_genera_firma: { readonly es_grilla: boolean };
  readonly version: number;
  readonly ejecuta_distribucion: boolean;
  readonly es_mobile: number;
  readonly tipo_documento: number;
  readonly es_web: boolean;
  readonly genera_firma: boolean;
  readonly ultima_modificacion: string;
  readonly id: number;
  readonly tiene_folio_configurado: boolean;
  readonly privado: boolean;
  readonly sigla_config_folio: string;
}

export interface ObtenerDocumentosLivianoResponse {
  readonly documentos: readonly DocumentoLiviano[];
  readonly count_documentos: number;
}

export interface GrillaMetadatoColumna {
  readonly id_columna_grilla: number;
  readonly datafield: string;
  readonly tipo_dato: string;
  readonly titulo: string;
}

export interface GrillaMetadatoInfo {
  readonly id_grilla_metadato: number;
  readonly columnas: readonly GrillaMetadatoColumna[];
}

export interface MetadatoRequeridoDocumento {
  readonly id_metadato: number;
  readonly nombre_metadato: string;
  readonly nombre_bloque?: string;
  readonly codigo_bloque?: string;
  readonly is_selected?: boolean;
  readonly id_bloque?: number;
  readonly disabled?: boolean;
  readonly tipo_metadato?: string;
  readonly grilla?: GrillaMetadatoInfo | null;
  readonly orden_bloque?: number;
}

export interface RolRaw {
  readonly id_rol: number;
  readonly nombre_rol: string;
}

export interface FamiliaRaw {
  readonly id_familia: number;
  readonly nombre_familia: string;
  readonly sigla_familia?: string;
}

export interface JornadaRaw {
  readonly id_jornada: number;
  readonly jornada_nombre: string;
  readonly creador: string;
  readonly fecha: string;
}

export interface CalendarioRaw {
  readonly id_calendario: number;
  readonly calendario_nombre: string;
  readonly creador: string;
  readonly fecha_creacion: string;
}

export interface ObtenerJornadaCalendarioResponse {
  readonly jornada?: readonly JornadaRaw[];
  readonly calendario?: readonly CalendarioRaw[];
}

export interface CatalogoSegunUsuario {
  readonly eliminado: boolean;
  readonly id_catalogo: number;
  readonly id_usuario_creador: string;
  readonly nombre_catalogo: string;
  readonly privado: boolean;
  readonly compartido: boolean;
}

export interface ObtenerCatalogosSegunUsuarioRequest {
  readonly id_usuario: string;
}

export interface ObtenerProcesosResponse {
  readonly count_procesos: number;
  readonly procesos: readonly ProcesoConfiguracion[];
}

export interface LegacyTaskExecution {
  readonly id_elemento?: string;
  readonly elemento?: string;
  readonly idElemento?: string;
  readonly activity_id?: string;
  readonly idActivity?: string;
}

export interface LegacyFlowProgress {
  readonly elemento: string;
  readonly cuenta: number;
  readonly total: number;
}

export interface ObtenerXmlPathProcesoResponse {
  readonly xml?: string;
  readonly xmlPath?: string;
  readonly path?: string;
  readonly tareasEjecutadas?: readonly LegacyTaskExecution[];
  readonly actividadesEjecutadas?: readonly LegacyFlowProgress[];
  readonly actividadesEjecutadasEnProcesoEESegunProcesoId?: readonly LegacyFlowProgress[];
  readonly tareasEncuesta?: readonly unknown[];
}

export interface LegacyBpmnNodeSnapshot {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly hasMessageEventDefinition: boolean;
  readonly hasTimerEventDefinition: boolean;
  readonly hasTerminateEventDefinition: boolean;
}

export interface LegacyBpmnTransitionSnapshot {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly name: string;
}

export interface LegacyBpmnSnapshot {
  readonly nodes: readonly LegacyBpmnNodeSnapshot[];
  readonly transitions: readonly LegacyBpmnTransitionSnapshot[];
}
