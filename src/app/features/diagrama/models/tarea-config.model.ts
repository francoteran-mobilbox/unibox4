export type TareaDuracionUnidad = 'minutos' | 'horas' | 'dias';

export type TareaFuncionalidad = 'cmf' | 'freg' | 'rdd' | 'aur' | 'aurg' | 'cmmf';

export type TareaTipoEjecucion = 'normal' | 'automatica' | 'consecutiva';

export type FormularioVisibilidad = 'publico' | 'privado';

export interface FormularioCompartido {
  readonly grupo: readonly string[];
  readonly cargo: readonly string[];
  readonly usuario: readonly string[];
}

export interface FormularioProcesoConfig {
  readonly id: string;
  readonly nombre: string;
  readonly nombreDocumento?: string;
  readonly docComunId?: number;
  readonly idFormulario: number;
  readonly visibilidad: FormularioVisibilidad;
  readonly compartido?: FormularioCompartido;
}

export interface FormularioRequeridoSeleccion {
  readonly idFormulario: number;
  readonly nombre: string;
  readonly nombreDocumento?: string;
  readonly visibilidad: FormularioVisibilidad;
  readonly metadatosSeleccionados: readonly string[];
  readonly metadatosTransferidos?: readonly MetadatoTransferidoConfig[];
  readonly tieneMetadatosTransferidos?: string;
}

export interface MetadatoTransferidoDetalle {
  readonly idFormulario: number;
  readonly nombreFormulario: string;
  readonly clave: string;
  readonly idMetadato: number;
  readonly nombreMetadato: string;
  readonly tipoMetadato: string | null;
  readonly esGrilla: boolean;
  readonly nombreBloque: string | null;
  readonly codigoBloque: string | null;
}

export interface ColumnaTransferidaDetalle {
  readonly idColumnaGrilla: number;
  readonly datafield: string;
  readonly titulo: string;
  readonly tipoDato: string;
}

export interface ParColumnaTransferido {
  readonly origen: ColumnaTransferidaDetalle;
  readonly destino: ColumnaTransferidaDetalle;
}

export interface MetadatoTransferidoConfig {
  readonly origen: MetadatoTransferidoDetalle;
  readonly destino: MetadatoTransferidoDetalle;
  readonly paresColumnas?: readonly ParColumnaTransferido[];
}

export const COMBINACIONES_TRASPASO_VALIDAS: readonly (readonly [string, string])[] = [
  ['ADJ', 'ADJ'],
  ['ALF', 'ALF'],
  ['ALF', 'ATX'],
  ['ALF', 'DGD'],
  ['ATX', 'ALF'],
  ['ATX', 'ATX'],
  ['CBX', 'ALF'],
  ['CBX', 'CBX'],
  ['CBX', 'DGD'],
  ['CHK', 'CHK'],
  ['COR', 'COR'],
  ['DGD', 'DGD'],
  ['FEC', 'FEC'],
  ['GLO', 'GLO'],
  ['HOR', 'HOR'],
  ['NUM', 'ALF'],
  ['NUM', 'DGD'],
  ['NUM', 'NUM'],
  ['RBT', 'ALF'],
  ['RBT', 'RBT'],
  ['SIS', 'ALF'],
];

export function esCombinacionTraspasoValida(origen: string, destino: string): boolean {
  const tipoOrigen = origen.trim().toUpperCase();
  const tipoDestino = destino.trim().toUpperCase();

  if (tipoOrigen === '' || tipoDestino === '') {
    return false;
  }

  return COMBINACIONES_TRASPASO_VALIDAS.some(
    ([validoOrigen, validoDestino]) => tipoOrigen === validoOrigen && tipoDestino === validoDestino,
  );
}

export interface TareaConfig {
  readonly nombre: string;
  readonly duracionValor: number | null;
  readonly duracionUnidad: TareaDuracionUnidad | null;
  readonly cargo: string | null;
  readonly usuarios: readonly string[];
  readonly observaciones: string;
  readonly ejecutaFuncionalidad: boolean;
  readonly funcionalidad: TareaFuncionalidad | null;
  readonly dispositivoMovil: boolean;
  readonly agenda: boolean;
  readonly tipoEjecucion: TareaTipoEjecucion;
  readonly ignorarValidacionCargo: boolean;
  readonly aplicarJornadaLaboral: boolean;
  readonly jornada: string | null;
  readonly calendario: string | null;
  readonly agregarRegistrosExternos: boolean;
  readonly filtrarUsuariosPorMetadatos: boolean;
  readonly conservarVistosBuenos: boolean;
  readonly imprimirFormulario: boolean;
  readonly tareaWeb: boolean;
  readonly notificarViaEmail: boolean;
  readonly alertas: boolean;
  readonly checkpoint: boolean;
  readonly formularioRequeridoSeleccionado: FormularioRequeridoSeleccion | null;
  readonly activityId?: number;
}

export interface LabelValueOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export const TAREA_DURACION_UNIDAD_OPTIONS: readonly TareaDuracionUnidad[] = [
  'minutos',
  'horas',
  'dias',
];

export const TAREA_FUNCIONALIDAD_OPTIONS: readonly LabelValueOption<TareaFuncionalidad>[] = [
  { value: 'cmf', label: 'Completar formulario' },
  { value: 'freg', label: 'Firmar registro' },
  { value: 'rdd', label: 'Adjuntar documento para revisión por la dirección' },
  { value: 'aur', label: 'Asignar usuarios a cargo' },
  { value: 'aurg', label: 'Asignar usuarios a cargo contextual' },
  { value: 'cmmf', label: 'Completar multi formulario' },
];

export const TAREA_TIPO_EJECUCION_OPTIONS: readonly LabelValueOption<TareaTipoEjecucion>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'automatica', label: 'Automática' },
  { value: 'consecutiva', label: 'Consecutiva' },
];

export const TAREA_FORMULARIO_VISIBILIDAD_OPTIONS: readonly LabelValueOption<FormularioVisibilidad>[] = [
  { value: 'publico', label: 'Público' },
  { value: 'privado', label: 'Privado' },
];

export const CARGO_USUARIOS_DEMO: Readonly<Record<string, readonly string[]>> = {
  '1': ['jperez', 'mrojas', 'lgomez'],
  '2': ['soporte', 'admin', 'lmarillanca'],
  '3': ['rcastro', 'avalenzuela'],
};

export function buildDefaultTareaConfig(nombre: string): TareaConfig {
  return {
    nombre,
    duracionValor: null,
    duracionUnidad: null,
    cargo: null,
    usuarios: [],
    observaciones: '',
    ejecutaFuncionalidad: false,
    funcionalidad: null,
    dispositivoMovil: false,
    agenda: false,
    tipoEjecucion: 'normal',
    ignorarValidacionCargo: false,
    aplicarJornadaLaboral: false,
    jornada: null,
    calendario: null,
    agregarRegistrosExternos: false,
    filtrarUsuariosPorMetadatos: false,
    conservarVistosBuenos: false,
    imprimirFormulario: false,
    tareaWeb: false,
    notificarViaEmail: false,
    alertas: false,
    checkpoint: false,
    formularioRequeridoSeleccionado: null,
  };
}
