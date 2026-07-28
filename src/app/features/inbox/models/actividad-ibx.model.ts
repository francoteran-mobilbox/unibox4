export interface ActividadIbxUsuarioEncargado {
  readonly encargado: string;
}

export interface ActividadesResponse {
  readonly actividades: ActividadIbx[];
}

export interface ActividadIbx {
  readonly end_date: string;
  readonly activity_name: string;
  readonly statetype_name: string;
  readonly user_login_creator: string;
  readonly limit_date: string;
  readonly creation_date: string;
  readonly statetype_id: string;
  readonly sms_asociados: unknown[];
  readonly id_usuario_anterior: string;
  readonly id_elemento: string;
  readonly modification_date: string;
  readonly activity_type: string;
  readonly usuarios_encargados: ActividadIbxUsuarioEncargado[];
  readonly activity_id: number;
  readonly activityrunning_id: number;
  readonly emails_asociados: unknown[];
  readonly estado_tiempo_restante?: string;
  readonly tiempo_restante?: string;
}
