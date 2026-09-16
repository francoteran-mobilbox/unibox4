export type DecisionDuracionUnidad = 'minutos' | 'horas' | 'dias';

export type DecisionFuncionalidad = 'freg';

export type DecisionTipoEjecucion = 'normal' | 'automatica' | 'consecutiva';

export interface DecisionConfig {
  readonly nombre: string;
  readonly duracionValor: number | null;
  readonly duracionUnidad: DecisionDuracionUnidad | null;
  readonly cargo: string | null;
  readonly usuarios: readonly string[];
  readonly tipoEjecucion: DecisionTipoEjecucion;
  readonly ejecutaFuncionalidad: boolean;
  readonly funcionalidad: DecisionFuncionalidad | null;
  readonly documento: number | null;
  readonly activarMetadatosSistema: boolean;
  readonly aplicarJornadaLaboral: boolean;
  readonly jornada: string | null;
  readonly calendario: string | null;
  readonly dispositivoMovil: boolean;
  readonly alertas: boolean;
  readonly alertaSeleccionada: string | null;
  readonly notificarViaEmail: boolean;
  readonly activityId?: number;
}

interface LabelValueOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export const DECISION_DURACION_UNIDAD_OPTIONS: readonly DecisionDuracionUnidad[] = [
  'minutos',
  'horas',
  'dias',
];

export const DECISION_FUNCIONALIDAD_OPTIONS: readonly LabelValueOption<DecisionFuncionalidad>[] = [
  { value: 'freg', label: 'Firmar Registro' },
];

export const DECISION_TIPO_EJECUCION_OPTIONS: readonly LabelValueOption<DecisionTipoEjecucion>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'automatica', label: 'Automática' },
  { value: 'consecutiva', label: 'Consecutiva' },
];

export const DECISION_ALERTAS_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
];

export function buildDefaultDecisionConfig(nombre: string): DecisionConfig {
  return {
    nombre,
    duracionValor: null,
    duracionUnidad: null,
    cargo: null,
    usuarios: [],
    tipoEjecucion: 'normal',
    ejecutaFuncionalidad: false,
    funcionalidad: null,
    documento: null,
    activarMetadatosSistema: false,
    aplicarJornadaLaboral: false,
    jornada: null,
    calendario: null,
    dispositivoMovil: false,
    alertas: false,
    alertaSeleccionada: null,
    notificarViaEmail: false,
  };
}
