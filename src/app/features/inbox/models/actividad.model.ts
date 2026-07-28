export interface ActividadResponse {
  readonly count_finalizadas: number;
  readonly count_recibidas: number;
  readonly count_enviadas?: number;
  readonly actividades_paralelas: unknown[];
  readonly actividades: readonly ActividadEjecucion[];
}

export interface ActividadEjecucion {
  readonly end_date: string;
  readonly limit_date: string;
  readonly state_activity: StateActivity;
  readonly creation_date: string;
  readonly actividad_paralela: boolean;
  readonly transitions: readonly Transition[];
  readonly id_usuario_anterior: string;
  readonly actividad: ActividadBase;
  readonly derivada_actividad_paralela: boolean;
  readonly proceso_en_ejecucion: ProcesoEjecucion;
  readonly modification_date: string;
  readonly tiempo_restante: string;
  readonly activityrunning_id: number;
  readonly id_estado_ejecucion: string;
}

export interface StateActivity {
  readonly statetype_name: string;
  readonly activitystate_id: number;
  readonly usuarios_activitystate: string;
  readonly statetype_id: string;
}

export interface ActividadBase {
  readonly activity_name: string;
  readonly activity_type: string;
  readonly activity_id: number;
  readonly funcionality: string;
  readonly documentos_comun_actividad?: readonly DocumentoComun[];
  readonly metadatos_disponibles_actividad?: readonly MetadataDisponible[];
}

export interface ProcesoEjecucion {
  readonly processrunnig_id: number;
  readonly processrunnig_name: string;
}

export interface Transition {
  readonly activity_id_source: number;
  readonly checked: boolean;
  readonly activity_id_destination: number;
  readonly transition_id: number;
  readonly transition_name: string;
}

export interface DocumentoComun {
  readonly id_documento: number;
  readonly id_proceso: number;
  readonly doc_comun_id: number;
}

export interface MetadataDisponible {
  readonly id_documento: number;
  readonly doc_comun_id: number;
  readonly id_metadato: number;
  readonly codigo_bloque: string;
  readonly id_bloque: number;
}
