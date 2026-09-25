export type ProcesoActivityTypeId =
  | 'inicio'
  | 'tarea'
  | 'decision'
  | 'mensaje'
  | 'timer'
  | 'finalizado'
  | 'enlaceParalelo'
  | 'reglaNegocio';

export interface ProcesoRequest {
  readonly processId: number | null;
  readonly processName: string;
  readonly version: number;
  readonly idPadre: number;
  readonly esUltimaVersion: boolean;
  readonly path: string;
  readonly processDesc: string | null;
  readonly timeunitId: string;
  readonly idUsuarioCreador: string;
  readonly active: boolean;
  readonly stageTotal: number;
  readonly responsibleId: number | null;
  readonly creationDate: string;
  readonly processTime: number;
  readonly observaciones: string;
  readonly idJornada: number;
  readonly idCalendario: number;
  readonly idFamilia: number;
  readonly esInstanciable: boolean;
  readonly visible: boolean;
  readonly expedienteElectronico: boolean;
  readonly tieneDocumentosComunes: boolean;
  readonly agregadoCatalogoFormularios: boolean;
  readonly privado: boolean;
  readonly compartido: boolean;
  readonly desactualizado: boolean;
  readonly bajaPrioridadGestion: number | null;
  readonly distribucionRequerida: boolean;
}

export interface DocumentoComunProcesoRequest {
  readonly docComunId: number | null;
  readonly idDocumento: number;
  readonly processId: number | null;
  readonly nombreDocComun: string;
  readonly nombreDocumento: string;
  readonly privado: boolean;
  readonly compartido: boolean;
}

export interface DocumentoComunProcesoWrapperRequest {
  readonly documentoComunProceso: DocumentoComunProcesoRequest;
  readonly permisosUsuarios: readonly unknown[];
  readonly permisosRoles: readonly unknown[];
  readonly permisosGrupos: readonly unknown[];
}

export interface CargoResponsableRequest {
  readonly idRol: number;
  readonly condicionesVisibilidad: readonly unknown[];
}

export interface DatoRequeridoProcesoDatoRequest {
  readonly idDatoReqProceso: number | null;
  readonly processId: number | null;
  readonly idDatoReqMecanismo: number;
  readonly idDatoDisponibleProceso: string;
  readonly valorTextoFijo: string;
  readonly nombreSecuencia: string;
}

export interface DatoRequeridoProcesoMetadatoRequest {
  readonly idDatoReqProceso: number | null;
  readonly idDocumento: number;
  readonly idMetadato: number;
  readonly idBloque: number;
  readonly codigoBloque: string;
  readonly docComunId: number | null;
}

export interface DatoRequeridoProcesoRequest {
  readonly dato: DatoRequeridoProcesoDatoRequest;
  readonly metadatoRequerido: DatoRequeridoProcesoMetadatoRequest | null;
  readonly nombreDocumentoComun: string | null;
}

export interface ProcesoMecanismoRequest {
  readonly idMecanismoDenominacion: number;
  readonly datosRequeridos: readonly DatoRequeridoProcesoRequest[];
}

export interface MetadatoDisponibleRequest {
  readonly id: {
    readonly activityId: number | null;
    readonly docComunId: number | null;
    readonly idDocumento: number;
    readonly idMetadato: number;
    readonly idBloque: number;
  };
  readonly codigoBloque: string;
}

export interface DocumentoComunActividadRequest {
  readonly id: {
    readonly activityId: number | null;
    readonly docComunId: number | null;
  };
  readonly tieneMetadatosTransferidos: string;
}

export interface BloqueMetadatoRequest {
  readonly nombreBloque: string | null;
  readonly codigoBloque: string | null;
  readonly idBloque?: number | null;
}

export interface MetadatoRequeridoTransferidoRequest {
  readonly nombreMetadato: string;
  readonly esGrilla: string;
  readonly idMetadato: number;
  readonly idTipoDato: string | null;
  readonly columnasTransferidas?: readonly ColumnaTransferidaRequest[];
}

export interface ColumnaTransferidaRequest {
  readonly idColumnaOrigen: number;
  readonly dataFieldOrigen: string;
  readonly idColumnaDestino: number;
  readonly dataFieldDestino: string;
}

export interface BloqueMetadatoRequeridoRequest {
  readonly metadatoRequerido: MetadatoRequeridoTransferidoRequest;
  readonly bloqueMetadato: BloqueMetadatoRequest;
}

export interface DocumentoComunProcesoTransferidoRequest {
  readonly idDocumentoComunProceso: number | null;
  readonly compartido: string;
  readonly nombreDocumentoProceso: string;
  readonly nombreDocumento: string;
  readonly privado: string;
  readonly idDocumento: number;
}

export interface MetadatoTransferidoRequest {
  readonly metadatoTransferidoId: number | null;
  readonly activityId: number | null;
  readonly nombreDocComunOrigen: string;
  readonly docComunIdOrigen: number | null;
  readonly idDocumentoOrigen: number;
  readonly idMetadatoOrigen: number;
  readonly idBloqueOrigen: number | null;
  readonly codigoBloqueOrigen: string | null;
  readonly docComunIdDestino: number | null;
  readonly idDocumentoDestino: number;
  readonly idMetadatoDestino: number;
  readonly idBloqueDestino: number | null;
  readonly codigoBloqueDestino: string | null;
  readonly columnasTransferidasDestino?: readonly ColumnaTransferidaRequest[];
}

export interface PermisosUsuarioProcesoRequest {
  readonly id_usuario: string;
}

export interface DocumentoComunActividadWrapperRequest {
  readonly nombreDocComunProceso: string;
  readonly documentoComunActividad: DocumentoComunActividadRequest;
  readonly metadatosDisponibles: readonly MetadatoDisponibleRequest[];
  readonly reglaMultiFormulario: unknown;
  readonly metadatosTransferidos: readonly MetadatoTransferidoRequest[];
}

export interface ActividadRequest {
  readonly activityId: number | null;
  readonly activityName: string;
  readonly activitytypeId: ProcesoActivityTypeId;
  readonly priorityId: number;
  readonly activityDesc: string | null;
  readonly activityTime: number;
  readonly timeunitId: string;
  readonly stage: number;
  readonly processId: number | null;
  readonly funcionality: string | null;
  readonly cantidadDocumentos: number;
  readonly adjuntarDocumento: boolean;
  readonly idJornada: number;
  readonly idCalendario: number;
  readonly idRol: number;
  readonly minimoEjecutores: number;
  readonly cualquierUsuario: boolean;
  readonly idElemento: string;
  readonly tieneDocumentosComunes: boolean;
  readonly validacionJerarquica: boolean;
  readonly tieneCheckpoint: boolean;
  readonly nombreCheckpoint: string;
  readonly porcentajeAvance: number;
  readonly etapaOrden: number;
  readonly tieneAlertas: boolean;
  readonly imprimeFormulario: boolean;
  readonly tareaWeb: boolean;
  readonly filtrarPorMetadato: boolean;
  readonly registrosExternos: boolean;
  readonly tieneNotificacion: boolean;
  readonly consecutiva: boolean;
  readonly automatica: boolean;
  readonly conservarVistosBuenos: boolean;
  readonly esTimer: boolean;
  readonly utilizaAgenda: boolean;
  readonly dispositivoMovil: boolean;
  readonly tareaExternaCreaUsuario: string | null;
  readonly tieneDestinatarioExterno: string | null;
  readonly esConfiguracion: boolean;
}

export interface UsuariosPreAsignadoRequest {
  readonly idUsuario: string;
  readonly idProcedencia: string;
}

export interface ActividadWrapperRequest {
  readonly actividad: ActividadRequest;
  readonly rolesGenericos: readonly unknown[];
  readonly usuariosPreAsignados: readonly UsuariosPreAsignadoRequest[];
  readonly rolesPreAsignados: readonly unknown[];
  readonly documentosComunesActividad: readonly DocumentoComunActividadWrapperRequest[];
  readonly elementosRequeridos: readonly unknown[];
  readonly idSubProceso: number | null;
  readonly registroExterno: unknown;
  readonly timer: unknown;
}

export interface TransicionRequest {
  readonly transitionId: number | null;
  readonly transitionName: string;
  readonly activityIdSource: number | null;
  readonly activityIdDestination: number | null;
  readonly processId: number | null;
  readonly transitiontypeId: unknown;
  readonly idAccionTransicion: number | null;
  readonly tieneTimer: boolean;
  readonly levantaForm: boolean;
}

export interface ReglaUsuarioRequest {
  readonly idReglaUsuario: number | null;
  readonly idDocIzq: number | null;
  readonly idBloqIzq: number | null;
  readonly codigoBloqIzq: string | null;
  readonly idMetIzq: number | null;
  readonly idRolDer: number | null;
  readonly idBloqDer: number | null;
  readonly codigoBloqDer: string | null;
  readonly idMetDer: number | null;
  readonly campoValor2: boolean;
}

export interface ReglaNegocioRequest {
  readonly idReglaNegocio: number | null;
  readonly idOperadorRegla: string | null;
  readonly izqEsDoc: boolean;
  readonly izqIdMetadato: number | null;
  readonly izqIdBloque: number | null;
  readonly izqCodigoBloque: string | null;
  readonly izqIdTipoDato: string | null;
  readonly izqIdOperando: number | null;
  readonly derEsDoc: boolean;
  readonly derIdMetadato: number | null;
  readonly derIdBloque: number | null;
  readonly derCodigoBloque: string | null;
  readonly derIdTipoDato: string | null;
  readonly derIdOperando: number | null;
  readonly derValorOperando: string | null;
}

export interface TimerTransicionRequest {
  readonly idTimerProceso: number | null;
  readonly esMetFormulario: boolean;
  readonly docComunId: number | null;
  readonly idBloque: number | null;
  readonly idMetadato: number | null;
  readonly esDatoFijo: boolean;
  readonly esTiempo: boolean;
  readonly datoFijo: string;
  readonly idUnidadTiempo: string;
  readonly esFecha: boolean;
  readonly fecha: string;
  readonly hora: string;
}

export interface TransicionWrapperRequest {
  readonly transicion: TransicionRequest;
  readonly idActividadOrigen: string;
  readonly idActividadDestino: string;
  readonly reglasUsuario: readonly ReglaUsuarioRequest[];
  readonly reglasNegocio: readonly ReglaNegocioRequest[];
  readonly tieneTimer: boolean | null;
  readonly timer: TimerTransicionRequest | null;
  readonly conInterrupcion: boolean | null;
}

export interface CrearProcesoRequest {
  readonly proceso: ProcesoRequest;
  readonly permisosUsuarios: readonly PermisosUsuarioProcesoRequest[];
  readonly permisosRoles: readonly number[];
  readonly permisosGrupos: readonly number[];
  readonly rolesGenericosProceso: readonly unknown[];
  readonly documentosComunes: readonly DocumentoComunProcesoWrapperRequest[];
  readonly cargosResponsables: readonly CargoResponsableRequest[];
  readonly procesoMecanismo: ProcesoMecanismoRequest;
  readonly actividades: readonly ActividadWrapperRequest[];
  readonly transiciones: readonly TransicionWrapperRequest[];
  readonly publicaEnCatalogo: boolean;
  readonly idDocumentoPublicar: number;
  readonly catalogos: readonly number[];
}
