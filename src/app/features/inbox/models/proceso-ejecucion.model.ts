export type ProcesoEjecucionDict = Record<string, ProcesoEjecucionItem>;

export interface ProcesoEjecucionItem {
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
