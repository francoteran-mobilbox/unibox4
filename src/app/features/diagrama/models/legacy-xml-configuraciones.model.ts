import type { ConfigDatoSelection, MecanismoProceso } from './diagrama.model';
import type { DecisionConfig } from './decision-config.model';
import type { MensajeConfig } from './mensaje-config.model';
import type { FormularioProcesoConfig, TareaConfig } from './tarea-config.model';
import type { TimerConfig } from './timer-config.model';
import type { TransicionConfig } from './transicion-config.model';
import type { CrearProcesoFormSource } from '../services/crear-proceso-request.builder';

export interface DetalleMetadatoLegacy {
  readonly idMetadato: number;
  readonly idBloque: number | null;
  readonly codigoBloque: string | null;
  readonly tipo: string | null;
  readonly nombreMetadato: string;
  readonly nombreBloque: string | null;
  readonly esGrilla: boolean;
}

export interface DocumentoLegacyInfo {
  readonly nombre: string;
  readonly nombreDocumento?: string;
  readonly privado: boolean;
  readonly compartido: boolean;
  readonly docComunId?: number | null;
}

export interface ConfiguracionesLegacyXml {
  readonly form: CrearProcesoFormSource;
  readonly tareaConfigs: Readonly<Record<string, TareaConfig>>;
  readonly transicionConfigs: Readonly<Record<string, TransicionConfig>>;
  readonly timerConfigs: Readonly<Record<string, TimerConfig>>;
  readonly mensajeConfigs: Readonly<Record<string, MensajeConfig>>;
  readonly decisionConfigs: Readonly<Record<string, DecisionConfig>>;
  readonly formulariosProceso: readonly FormularioProcesoConfig[];
  readonly configDatoSelections: Readonly<Record<string, ConfigDatoSelection>>;
  readonly mecanismo?: MecanismoProceso | null;
  readonly resolverMetadato: (
    idDocumento: number,
    clave: string,
  ) => DetalleMetadatoLegacy | null;
  readonly resolverDocumento: (idDocumento: number) => DocumentoLegacyInfo | null;
}
