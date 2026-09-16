export interface MensajeReferenciaPar {
  readonly idDocumento: number | null;
  readonly idMetadato: string | null;
}

export interface MensajeDestinatarios {
  readonly usuariosSistema: readonly string[];
  readonly usuariosExternos: readonly string[];
  readonly referencias: readonly MensajeReferenciaPar[];
}

export interface MensajeFormularioItem {
  readonly idDocumento: number | null;
  readonly idsMetadatos: readonly string[];
}

export type MensajeCompletarFormulario = 'sin' | 'proceso' | 'externo';

export interface MensajeConfig {
  readonly destinatarios: MensajeDestinatarios;
  readonly destinatariosCc: MensajeDestinatarios;
  readonly enviarACargo: boolean;
  readonly encabezadoInfoProceso: boolean;
  readonly asunto: string;
  readonly contenido: string;
  readonly adjuntarPdfIds: readonly number[];
  readonly completarFormulario: MensajeCompletarFormulario;
  readonly formularioItems: readonly MensajeFormularioItem[];
  readonly activityId?: number;
}

export const MENSAJE_CONTENIDO_TOOLBAR = [
  [{ font: ['arial', 'verdana', 'times-new-roman', 'georgia', 'courier-new'] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }],
  [{ align: [] }],
  [{ list: 'bullet' }],
];

export function buildDefaultMensajeDestinatarios(): MensajeDestinatarios {
  return {
    usuariosSistema: [],
    usuariosExternos: [],
    referencias: [],
  };
}

export function buildDefaultMensajeConfig(): MensajeConfig {
  return {
    destinatarios: buildDefaultMensajeDestinatarios(),
    destinatariosCc: buildDefaultMensajeDestinatarios(),
    enviarACargo: false,
    encabezadoInfoProceso: false,
    asunto: '',
    contenido: '',
    adjuntarPdfIds: [],
    completarFormulario: 'sin',
    formularioItems: [],
  };
}
