import { BpmnNodoKind } from './bpmn-elemento.model';
import { TimerConfig, buildDefaultTimerConfig } from './timer-config.model';

export type TransicionAccion =
  | 'RECHAZO'
  | 'FIRMAR_TOKEN'
  | 'VISAR'
  | 'FIRMA_CA4WEB'
  | 'FIRMA_BIOMETRICA_TOC'
  | 'FIRMAR';

export type TransicionOperador =
  | 'contiene'
  | 'noContiene'
  | 'esExactamente'
  | 'es'
  | 'esAnterior'
  | 'esPosterior'
  | 'mayorQue'
  | 'menorQue'
  | 'igualQue'
  | 'distintoDe'
  | 'mayorIgualQue'
  | 'menorIgualQue';

export type TransicionInterpretacion = 'id' | 'texto';

export type TransicionFuenteValor = 'valor' | 'otroMetadato';

export interface TransicionReglaUsuario {
  readonly idDocumento: number | null;
  readonly idMetadato: string | null;
  readonly interpretacion: TransicionInterpretacion;
  readonly idCargo?: number | null;
  readonly idMetadatoValor?: string | null;
  readonly idReglaUsuario?: number | null;
}

export interface TransicionReglaNegocio {
  readonly idDocumento: number | null;
  readonly idMetadato: string | null;
  readonly operador: TransicionOperador;
  readonly idOperadorRegla?: string | null;
  readonly fuenteValor: TransicionFuenteValor;
  readonly valorTexto: string;
  readonly idDocumentoValor: number | null;
  readonly idMetadatoValor: string | null;
}

export interface TransicionConfig {
  readonly requiereTimer: boolean;
  readonly timer: TimerConfig;
  readonly interrupcion: boolean;
  readonly accionRequerida: boolean;
  readonly accion: TransicionAccion | null;
  readonly reglasUsuario: readonly TransicionReglaUsuario[];
  readonly reglasNegocio: readonly TransicionReglaNegocio[];
  readonly transitionId?: number;
}

export interface TransicionFlags {
  readonly requiereTimer: boolean;
  readonly interrupcion: boolean;
  readonly accion: boolean;
  readonly reglasUsuario: boolean;
  readonly reglasNegocio: boolean;
}

export interface LabelValueOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export const TRANSICION_ACCION_OPTIONS: readonly LabelValueOption<TransicionAccion>[] = [
  { value: 'RECHAZO', label: 'Rechazo' },
  { value: 'FIRMAR_TOKEN', label: 'Firmar con token' },
  { value: 'VISAR', label: 'Visar' },
  { value: 'FIRMA_CA4WEB', label: 'Firma acepta.com' },
  { value: 'FIRMA_BIOMETRICA_TOC', label: 'Firma Biométrica Toc' },
  { value: 'FIRMAR', label: 'Firmar con Certificado' },
];

export const TRANSICION_OPERADOR_OPTIONS: readonly LabelValueOption<TransicionOperador>[] = [
  { value: 'contiene', label: 'Contiene' },
  { value: 'noContiene', label: 'No contiene' },
  { value: 'esExactamente', label: 'Es exactamente' },
  { value: 'es', label: 'Es' },
  { value: 'esAnterior', label: 'Es anterior' },
  { value: 'esPosterior', label: 'Es posterior' },
  { value: 'mayorQue', label: 'Mayor que' },
  { value: 'menorQue', label: 'Menor que' },
  { value: 'igualQue', label: 'Igual que' },
  { value: 'distintoDe', label: 'Distinto de' },
  { value: 'mayorIgualQue', label: 'Mayor igual que' },
  { value: 'menorIgualQue', label: 'Menor igual que' },
];

export interface TransicionOperadorRegla {
  readonly idOperadorRegla: string;
  readonly tipo: string;
  readonly operador: TransicionOperador;
}

export const TRANSICION_OPERADOR_REGLAS: readonly TransicionOperadorRegla[] = [
  { idOperadorRegla: 'ctn', tipo: 'ALF', operador: 'contiene' },
  { idOperadorRegla: 'nct', tipo: 'ALF', operador: 'noContiene' },
  { idOperadorRegla: 'exc', tipo: 'ALF', operador: 'esExactamente' },
  { idOperadorRegla: 'esf', tipo: 'FEC', operador: 'es' },
  { idOperadorRegla: 'ant', tipo: 'FEC', operador: 'esAnterior' },
  { idOperadorRegla: 'pos', tipo: 'FEC', operador: 'esPosterior' },
  { idOperadorRegla: 'myq', tipo: 'NUM', operador: 'mayorQue' },
  { idOperadorRegla: 'mnq', tipo: 'NUM', operador: 'menorQue' },
  { idOperadorRegla: 'igq', tipo: 'NUM', operador: 'igualQue' },
  { idOperadorRegla: 'dtd', tipo: 'NUM', operador: 'distintoDe' },
  { idOperadorRegla: 'sco', tipo: 'SIS', operador: 'contiene' },
  { idOperadorRegla: 'snc', tipo: 'SIS', operador: 'noContiene' },
  { idOperadorRegla: 'see', tipo: 'SIS', operador: 'esExactamente' },
  { idOperadorRegla: 'smy', tipo: 'SIS', operador: 'mayorQue' },
  { idOperadorRegla: 'smn', tipo: 'SIS', operador: 'menorQue' },
  { idOperadorRegla: 'syi', tipo: 'SIS', operador: 'mayorIgualQue' },
  { idOperadorRegla: 'sni', tipo: 'SIS', operador: 'menorIgualQue' },
  { idOperadorRegla: 'cbc', tipo: 'CBX', operador: 'contiene' },
  { idOperadorRegla: 'cbn', tipo: 'CBX', operador: 'noContiene' },
  { idOperadorRegla: 'cbe', tipo: 'CBX', operador: 'esExactamente' },
  { idOperadorRegla: 'che', tipo: 'CHK', operador: 'esExactamente' },
  { idOperadorRegla: 'rbc', tipo: 'RBT', operador: 'contiene' },
  { idOperadorRegla: 'rbn', tipo: 'RBT', operador: 'noContiene' },
  { idOperadorRegla: 'rbe', tipo: 'RBT', operador: 'esExactamente' },
  { idOperadorRegla: 'rct', tipo: 'RUT', operador: 'contiene' },
  { idOperadorRegla: 'rnc', tipo: 'RUT', operador: 'noContiene' },
  { idOperadorRegla: 'rex', tipo: 'RUT', operador: 'esExactamente' },
  { idOperadorRegla: 'coc', tipo: 'COR', operador: 'contiene' },
  { idOperadorRegla: 'con', tipo: 'COR', operador: 'noContiene' },
  { idOperadorRegla: 'coe', tipo: 'COR', operador: 'esExactamente' },
];

export function operadoresPorTipoDato(
  tipo: string | null | undefined,
): readonly LabelValueOption<TransicionOperador>[] {
  if (tipo === null || tipo === undefined || tipo.trim() === '') {
    return TRANSICION_OPERADOR_OPTIONS;
  }

  const tipoNormalizado = tipo.trim().toUpperCase();
  const operadoresValidos = new Set(
    TRANSICION_OPERADOR_REGLAS.filter((regla) => regla.tipo === tipoNormalizado).map(
      (regla) => regla.operador,
    ),
  );

  if (operadoresValidos.size === 0) {
    return TRANSICION_OPERADOR_OPTIONS;
  }

  return TRANSICION_OPERADOR_OPTIONS.filter((option) => operadoresValidos.has(option.value));
}

export function operadorDesdeIdOperadorRegla(id: string | null | undefined): TransicionOperador | null {
  if (id === null || id === undefined || id.trim() === '') {
    return null;
  }

  const regla = TRANSICION_OPERADOR_REGLAS.find(
    (item) => item.idOperadorRegla === id.trim().toLowerCase(),
  );

  return regla?.operador ?? null;
}

const FLAGS_VACIOS: TransicionFlags = {
  requiereTimer: false,
  interrupcion: false,
  accion: false,
  reglasUsuario: false,
  reglasNegocio: false,
};

const COMBOS_TRANSICION: Record<string, Partial<TransicionFlags>> = {
  'tarea->reglaNegocio': { requiereTimer: true, interrupcion: true },
  'reglaNegocio->tarea': { reglasUsuario: true, reglasNegocio: true },
  'reglaNegocio->fin': { reglasUsuario: true },
  'tarea->tarea': { requiereTimer: true, reglasUsuario: true },
  'reglaNegocio->mensaje': { reglasUsuario: true, reglasNegocio: true },
  'reglaNegocio->reglaNegocio': { reglasNegocio: true },
  'mensaje->tarea': { reglasUsuario: true },
  'mensaje->decision': { reglasUsuario: true },
  'tarea->mensaje': { requiereTimer: true, reglasUsuario: true },
  'inicio->tarea': { reglasUsuario: true },
  'decision->fin': { requiereTimer: true, accion: true },
  'decision->mensaje': { requiereTimer: true, accion: true, reglasUsuario: true },
  'decision->tarea': { accion: true },
  'decision->reglaNegocio': { accion: true },
  'decision->decision': { accion: true },
  'decision->timer': { accion: true },
  'tarea->decision': { requiereTimer: true, reglasUsuario: true },
  'inicio->mensaje': { reglasUsuario: true },
  'tarea->timer': { requiereTimer: true },
};

export function flagsDeComboTransicion(
  origen: BpmnNodoKind,
  destino: BpmnNodoKind,
): TransicionFlags {
  return { ...FLAGS_VACIOS, ...(COMBOS_TRANSICION[`${origen}->${destino}`] ?? {}) };
}

export function buildDefaultTransicionConfig(): TransicionConfig {
  return {
    requiereTimer: false,
    timer: buildDefaultTimerConfig(),
    interrupcion: false,
    accionRequerida: false,
    accion: null,
    reglasUsuario: [],
    reglasNegocio: [],
  };
}
