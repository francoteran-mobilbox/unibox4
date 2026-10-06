import { ConfigDatoSelection } from '../models/diagrama.model';
import { DecisionConfig } from '../models/decision-config.model';
import { MensajeConfig } from '../models/mensaje-config.model';
import { TareaConfig } from '../models/tarea-config.model';
import { TimerConfig } from '../models/timer-config.model';
import { TransicionConfig } from '../models/transicion-config.model';

export const USO_FORMULARIO_REQUERIDO = 'Formulario requerido de una tarea';
export const USO_TRASPASOS = 'Traspasos de metadatos de una tarea';
export const USO_REGLAS_NEGOCIO = 'Reglas de negocio de una transición';
export const USO_TIMER = 'Timer con metadato de formulario';
export const USO_MENSAJE = 'Mensaje (destinatarios, formularios a completar o adjuntos PDF)';
export const USO_DECISION = 'Decisión con documento';
export const USO_MECANISMO = 'Mecanismo de denominación';

export interface UsosFormularioProcesoInput {
  readonly tareaConfigs?: Readonly<Record<string, TareaConfig>>;
  readonly timerConfigs?: Readonly<Record<string, TimerConfig>>;
  readonly mensajeConfigs?: Readonly<Record<string, MensajeConfig>>;
  readonly decisionConfigs?: Readonly<Record<string, DecisionConfig>>;
  readonly transicionConfigs?: Readonly<Record<string, TransicionConfig>>;
  readonly configDatoSelections?: Readonly<Record<string, ConfigDatoSelection>>;
}

export function usosFormularioProceso(
  idFormulario: number,
  input: UsosFormularioProcesoInput,
): readonly string[] {
  if (idFormulario === 0) {
    return [];
  }

  const usos = new Set<string>();

  for (const tarea of Object.values(input.tareaConfigs ?? {})) {
    const seleccion = tarea.formularioRequeridoSeleccionado;

    if (seleccion !== null && seleccion.idFormulario === idFormulario) {
      usos.add(USO_FORMULARIO_REQUERIDO);
    }

    for (const traspaso of seleccion?.metadatosTransferidos ?? []) {
      if (
        traspaso.origen.idFormulario === idFormulario ||
        traspaso.destino.idFormulario === idFormulario
      ) {
        usos.add(USO_TRASPASOS);
        break;
      }
    }
  }

  for (const timer of Object.values(input.timerConfigs ?? {})) {
    if (timer.idDocumento === idFormulario) {
      usos.add(USO_TIMER);
    }
  }

  for (const mensaje of Object.values(input.mensajeConfigs ?? {})) {
    const referenciaEn = (destinatarios: MensajeConfig['destinatarios']): boolean =>
      (destinatarios.referencias ?? []).some(
        (referencia) => referencia.idDocumento === idFormulario,
      );

    if (
      referenciaEn(mensaje.destinatarios) ||
      referenciaEn(mensaje.destinatariosCc) ||
      (mensaje.formularioItems ?? []).some(
        (item) => item.idDocumento === idFormulario,
      ) ||
      (mensaje.adjuntarPdfIds ?? []).includes(idFormulario)
    ) {
      usos.add(USO_MENSAJE);
    }
  }

  for (const decision of Object.values(input.decisionConfigs ?? {})) {
    if (decision.documento === idFormulario) {
      usos.add(USO_DECISION);
    }
  }

  for (const transicion of Object.values(input.transicionConfigs ?? {})) {
    const usaDocumento = (regla: { idDocumento: number | null }): boolean =>
      regla.idDocumento === idFormulario;

    if (
      (transicion.reglasUsuario ?? []).some(usaDocumento) ||
      (transicion.reglasNegocio ?? []).some(
        (regla) => regla.idDocumento === idFormulario || regla.idDocumentoValor === idFormulario,
      )
    ) {
      usos.add(USO_REGLAS_NEGOCIO);
    }
  }

  for (const seleccion of Object.values(input.configDatoSelections ?? {})) {
    if (seleccion.documento === String(idFormulario)) {
      usos.add(USO_MECANISMO);
    }
  }

  return [...usos];
}
