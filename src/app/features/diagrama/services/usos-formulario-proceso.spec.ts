import { buildDefaultDecisionConfig } from '../models/decision-config.model';
import {
  TareaConfig,
  buildDefaultTareaConfig,
} from '../models/tarea-config.model';
import { TimerConfig, buildDefaultTimerConfig } from '../models/timer-config.model';
import {
  MensajeConfig,
  buildDefaultMensajeConfig,
} from '../models/mensaje-config.model';
import {
  TransicionConfig,
  buildDefaultTransicionConfig,
} from '../models/transicion-config.model';
import {
  USO_DECISION,
  USO_FORMULARIO_REQUERIDO,
  USO_MECANISMO,
  USO_MENSAJE,
  USO_REGLAS_NEGOCIO,
  USO_TIMER,
  USO_TRASPASOS,
  usosFormularioProceso,
} from './usos-formulario-proceso';

function tareaCon(
  overrides: Partial<TareaConfig> & { formularioRequeridoSeleccionado: TareaConfig['formularioRequeridoSeleccionado'] },
): TareaConfig {
  return { ...buildDefaultTareaConfig('Tarea'), ...overrides };
}

describe('usosFormularioProceso', () => {
  it('sin resolver (idFormulario 0) no puede estar en uso', () => {
    expect(
      usosFormularioProceso(0, {
        tareaConfigs: {
          T: tareaCon({
            formularioRequeridoSeleccionado: { idFormulario: 0, nombre: '', visibilidad: 'privado', metadatosSeleccionados: [] },
          }),
        },
      }),
    ).toEqual([]);
  });

  it('detecta formulario requerido de una tarea sin duplicar la descripción', () => {
    const usos = usosFormularioProceso(795, {
      tareaConfigs: {
        T1: tareaCon({
          formularioRequeridoSeleccionado: { idFormulario: 795, nombre: '', visibilidad: 'privado', metadatosSeleccionados: [] },
        }),
        T2: tareaCon({
          formularioRequeridoSeleccionado: { idFormulario: 795, nombre: '', visibilidad: 'privado', metadatosSeleccionados: [] },
        }),
      },
    });

    expect(usos).toEqual([USO_FORMULARIO_REQUERIDO]);
  });

  it('detecta traspasos como origen y como destino', () => {
    const usos = usosFormularioProceso(660, {
      tareaConfigs: {
        T1: tareaCon({
          formularioRequeridoSeleccionado: {
            idFormulario: 795,
            nombre: '',
            visibilidad: 'privado',
            metadatosSeleccionados: [],
            metadatosTransferidos: [
              {
                origen: {
                  idFormulario: 660,
                  nombreFormulario: 'Flag',
                  clave: 'k',
                  idMetadato: 1,
                  nombreMetadato: 'x',
                  tipoMetadato: 'ALF',
                  esGrilla: false,
                  nombreBloque: null,
                  codigoBloque: null,
                },
                destino: {
                  idFormulario: 795,
                  nombreFormulario: 'Solicitud',
                  clave: 'k2',
                  idMetadato: 2,
                  nombreMetadato: 'y',
                  tipoMetadato: 'ALF',
                  esGrilla: false,
                  nombreBloque: null,
                  codigoBloque: null,
                },
              },
            ],
          },
        }),
      },
    });

    expect(usos).toContain(USO_TRASPASOS);
    expect(usos).not.toContain(USO_FORMULARIO_REQUERIDO);
  });

  it('detecta reglas de negocio por documento y por documento del valor', () => {
    const transicion: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      reglasUsuario: [
        {
          idDocumento: 795,
          idMetadato: 'BM1-1',
          interpretacion: 'id',
        },
      ],
      reglasNegocio: [
        {
          idDocumento: 660,
          idMetadato: 'BM2-2',
          operador: 'contiene',
          fuenteValor: 'otroMetadato',
          valorTexto: '',
          idDocumentoValor: 795,
          idMetadatoValor: 'BM3-3',
        },
      ],
    };

    const usos795 = usosFormularioProceso(795, { transicionConfigs: { F1: transicion } });
    const usos660 = usosFormularioProceso(660, { transicionConfigs: { F1: transicion } });

    expect(usos795).toEqual([USO_REGLAS_NEGOCIO]);
    expect(usos660).toEqual([USO_REGLAS_NEGOCIO]);
  });

  it('detecta timer con metadato de formulario', () => {
    const timer: TimerConfig = { ...buildDefaultTimerConfig(), modo: 'metadatoFormulario', idDocumento: 795 };

    expect(usosFormularioProceso(795, { timerConfigs: { T1: timer } })).toEqual([USO_TIMER]);
  });

  it('detecta mensaje en destinatarios, cc, formularios a completar y adjuntos PDF', () => {
    const base: MensajeConfig = buildDefaultMensajeConfig();

    const porReferencia: MensajeConfig = {
      ...base,
      destinatarios: { ...base.destinatarios, referencias: [{ idDocumento: 795, idMetadato: 'BM1-1' }] },
    };
    const porCc: MensajeConfig = {
      ...base,
      destinatariosCc: { ...base.destinatariosCc, referencias: [{ idDocumento: 795, idMetadato: 'BM1-1' }] },
    };
    const porFormulario: MensajeConfig = {
      ...base,
      formularioItems: [{ idDocumento: 795, idsMetadatos: ['BM1-1'] }],
    };
    const porAdjunto: MensajeConfig = { ...base, adjuntarPdfIds: [795] };

    for (const config of [porReferencia, porCc, porFormulario, porAdjunto]) {
      expect(usosFormularioProceso(795, { mensajeConfigs: { M1: config } })).toEqual([USO_MENSAJE]);
    }
  });

  it('detecta decisión con documento', () => {
    const decision = { ...buildDefaultDecisionConfig('D'), documento: 795 };

    expect(usosFormularioProceso(795, { decisionConfigs: { D1: decision } })).toEqual([USO_DECISION]);
  });

  it('detecta mecanismo de denominación comparando el documento como texto', () => {
    const usos = usosFormularioProceso(795, {
      configDatoSelections: { dato1: { tipo: 'metadato_formulario', documento: '795', metadato: 'BM1-1' } },
    });

    expect(usos).toEqual([USO_MECANISMO]);
  });

  it('combina usos de distintos tipos sin duplicados', () => {
    const usos = usosFormularioProceso(795, {
      tareaConfigs: {
        T: tareaCon({
          formularioRequeridoSeleccionado: { idFormulario: 795, nombre: '', visibilidad: 'privado', metadatosSeleccionados: [] },
        }),
      },
      timerConfigs: {
        T1: { ...buildDefaultTimerConfig(), idDocumento: 795 },
      },
      configDatoSelections: { dato1: { tipo: 'metadato_formulario', documento: '795' } },
    });

    expect(usos).toEqual([
      USO_FORMULARIO_REQUERIDO,
      USO_TIMER,
      USO_MECANISMO,
    ]);
  });

  it('ignora referencias de otros formularios', () => {
    const usos = usosFormularioProceso(111, {
      tareaConfigs: {
        T: tareaCon({
          formularioRequeridoSeleccionado: { idFormulario: 795, nombre: '', visibilidad: 'privado', metadatosSeleccionados: [] },
        }),
      },
      timerConfigs: { T1: { ...buildDefaultTimerConfig(), idDocumento: 660 } },
    });

    expect(usos).toEqual([]);
  });
});
