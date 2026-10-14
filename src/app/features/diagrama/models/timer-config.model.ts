export type TimerModo = 'datoFijo' | 'metadatoFormulario';

export type TimerDatoFijoTipo = 'tiempo' | 'fecha';

export interface TimerConfig {
  // cargo: solo lo usa el TIMER NODO (cargo asociado del nodo); el timer de
  // transición comparte este modelo y no lo setea.
  readonly cargo?: string | null;
  readonly modo: TimerModo;
  readonly datoFijoTipo: TimerDatoFijoTipo;
  readonly duracionValor: number | null;
  readonly duracionUnidad: string | null;
  readonly fecha: string | null;
  readonly hora: string | null;
  readonly idDocumento: number | null;
  readonly idMetadato: string | null;
  readonly activityId?: number;
}

export const TIMER_DURACION_UNIDAD_OPTIONS: readonly string[] = ['minutos', 'horas', 'dias'];

export function buildDefaultTimerConfig(): TimerConfig {
  return {
    cargo: null,
    modo: 'datoFijo',
    datoFijoTipo: 'tiempo',
    duracionValor: null,
    duracionUnidad: null,
    fecha: null,
    hora: null,
    idDocumento: null,
    idMetadato: null,
  };
}
