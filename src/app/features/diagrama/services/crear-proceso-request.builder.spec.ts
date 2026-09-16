import { CrearProcesoRequestBuilder, CrearProcesoFormSource } from './crear-proceso-request.builder';
import { buildDefaultTareaConfig, TareaConfig } from '../models/tarea-config.model';

const XML_BASE = `<?xml version="1.0" encoding="UTF-8"?>
<process-definition swimlane="1" version="1" name="Proceso" privado="true" compartido="false">
  <documentosComunesProceso></documentosComunesProceso>
  <responsables></responsables>
  <mecanismoDenominacion idMecanismoDenominacion="-1" />
  <catalogos></catalogos>
  <Roles></Roles>
  <SubProcesosAsociados></SubProcesosAsociados>
  <start-state name="Inicio" id="Inicio_1">
    <transition to="Tarea_1" />
  </start-state>
  <task-node name="Tarea" id="Tarea_1">
    <transition to="Fin_1" />
  </task-node>
  <end-state name="Fin" id="Fin_1" />
</process-definition>`;

const XML_CON_TRASPASOS = `<?xml version="1.0" encoding="UTF-8"?>
<process-definition swimlane="1" version="1" name="Proceso" privado="true" compartido="false">
  <documentosComunesProceso></documentosComunesProceso>
  <responsables></responsables>
  <mecanismoDenominacion idMecanismoDenominacion="-1" />
  <catalogos></catalogos>
  <Roles></Roles>
  <SubProcesosAsociados></SubProcesosAsociados>
  <start-state name="Inicio" id="Inicio_1">
    <transition to="Tarea_1" />
  </start-state>
  <task-node name="Tarea" id="Tarea_1">
    <documentosComunesActividad>
      <documentoComunActividadWrapper nombreDocComunProceso="Flag">
        <documentoComunActividad activityId="" docComunId="" tieneMetadatosTransferidos="true" />
        <metadatosDisponibles>
          <id activityId="" docComunId="" idDocumento="660" idMetadato="866" idBloque="-1" />
        </metadatosDisponibles>
        <metadatosTransferidos>
          <metadatoTransferido>
            <documentoComunProceso idDocumentoComunProceso="3856" compartido="false" nombreDocumentoProceso="Flag" nombreDocumento="Flag Solicitud" privado="true" idDocumento="660" />
            <bloqueMetadatoRequeridoOrigen>
              <metadatoRequerido nombreMetadato="Flag 2" esGrilla="false" idMetadato="961" idTipoDato="ALF" />
              <bloqueMetadato nombreBloque="Título 1" idBloque="4527" codigoBloque="BM1576" />
            </bloqueMetadatoRequeridoOrigen>
            <bloqueMetadatoRequeridoDestino>
              <metadatoRequerido nombreMetadato="Flag Actualiza" esGrilla="false" idMetadato="1860" idTipoDato="ALF" />
              <bloqueMetadato nombreBloque="Oculto" idBloque="5646" codigoBloque="BM2177" />
            </bloqueMetadatoRequeridoDestino>
          </metadatoTransferido>
        </metadatosTransferidos>
      </documentoComunActividadWrapper>
    </documentosComunesActividad>
    <transition to="Fin_1" />
  </task-node>
  <end-state name="Fin" id="Fin_1" />
</process-definition>`;

const FORM_SOURCE: CrearProcesoFormSource = {
  nombre: 'Proceso',
  responsables: [],
  duracionValor: 1,
  duracionUnidad: 'dias',
  familiaProceso: null,
  visibilidad: 'privado',
  mecanismoDenominacion: null,
  observaciones: '',
  creaExpedienteElectronico: false,
  publicaEnCatalogo: false,
  catalogosPublicacion: [],
  aplicaJornadaLaboral: false,
  jornada: null,
  calendario: null,
};

function encontrarDocumentoComunTarea(
  builder: CrearProcesoRequestBuilder,
  xml: string,
  tareaConfigs?: Record<string, TareaConfig>,
) {
  const request = builder.buildRequest(FORM_SOURCE, xml, 'admin', tareaConfigs);
  const actividadTarea = request.actividades.find(
    (actividad) => actividad.actividad.activityName === 'Tarea',
  );

  return actividadTarea?.documentosComunesActividad[0];
}

describe('CrearProcesoRequestBuilder - metadatosTransferidos', () => {
  it('mapea los traspasos configurados al payload con flag en true', () => {
    const builder = new CrearProcesoRequestBuilder();
    const tareaConfigs: Record<string, TareaConfig> = {
      Tarea_1: {
        ...buildDefaultTareaConfig('Tarea'),
        formularioRequeridoSeleccionado: {
          idFormulario: 660,
          nombre: 'Flag',
          nombreDocumento: 'Flag Solicitud',
          visibilidad: 'privado',
          metadatosSeleccionados: ['BM1576-866'],
          metadatosTransferidos: [
            {
              origen: {
                idFormulario: 900,
                nombreFormulario: 'Solicitud',
                clave: 'BM1576-1901',
                idMetadato: 1901,
                nombreMetadato: 'ejecutarWS',
                tipoMetadato: 'ALF',
                esGrilla: false,
                nombreBloque: 'Título 1',
                codigoBloque: 'BM1576',
              },
              destino: {
                idFormulario: 660,
                nombreFormulario: 'Flag',
                clave: 'BM2177-866',
                idMetadato: 866,
                nombreMetadato: 'Flag',
                tipoMetadato: 'ALF',
                esGrilla: false,
                nombreBloque: 'Oculto',
                codigoBloque: 'BM2177',
              },
            },
          ],
        },
      },
    };

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_BASE, tareaConfigs);

    expect(documentoComun).toBeDefined();
    expect(documentoComun?.documentoComunActividad.tieneMetadatosTransferidos).toBe('true');

    const traspaso = documentoComun?.metadatosTransferidos[0];
    expect(traspaso?.documentoComunProceso).toEqual({
      idDocumentoComunProceso: null,
      compartido: 'false',
      nombreDocumentoProceso: 'Flag',
      nombreDocumento: 'Flag Solicitud',
      privado: 'true',
      idDocumento: 660,
    });
    expect(traspaso?.bloqueMetadatoRequeridoOrigen).toEqual({
      metadatoRequerido: {
        nombreMetadato: 'ejecutarWS',
        esGrilla: 'false',
        idMetadato: 1901,
        idTipoDato: 'ALF',
      },
      bloqueMetadato: { nombreBloque: 'Título 1', codigoBloque: 'BM1576' },
    });
    expect(traspaso?.bloqueMetadatoRequeridoDestino).toEqual({
      metadatoRequerido: {
        nombreMetadato: 'Flag',
        esGrilla: 'false',
        idMetadato: 866,
        idTipoDato: 'ALF',
      },
      bloqueMetadato: { nombreBloque: 'Oculto', codigoBloque: 'BM2177' },
    });
    expect(
      'idBloque' in (traspaso?.bloqueMetadatoRequeridoOrigen.bloqueMetadato ?? {}),
    ).toBeFalse();
  });

  it('envía flag en false y lista vacía cuando no hay traspasos', () => {
    const builder = new CrearProcesoRequestBuilder();
    const tareaConfigs: Record<string, TareaConfig> = {
      Tarea_1: {
        ...buildDefaultTareaConfig('Tarea'),
        formularioRequeridoSeleccionado: {
          idFormulario: 660,
          nombre: 'Flag',
          visibilidad: 'privado',
          metadatosSeleccionados: ['BM1576-866'],
        },
      },
    };

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_BASE, tareaConfigs);

    expect(documentoComun?.documentoComunActividad.tieneMetadatosTransferidos).toBe('false');
    expect(documentoComun?.metadatosTransferidos).toEqual([]);
  });

  it('conserva nombre contextual, nombre documento y docComunId de los formularios de proceso', () => {
    const builder = new CrearProcesoRequestBuilder();

    const request = builder.buildRequest(FORM_SOURCE, XML_BASE, 'admin', undefined, [
      {
        id: 'fp-1',
        nombre: 'Flag',
        nombreDocumento: 'Flag Solicitud de Viático',
        docComunId: 3856,
        idFormulario: 660,
        visibilidad: 'privado',
      },
    ]);

    const wrapper = request.documentosComunes[0];

    expect(wrapper.documentoComunProceso).toEqual({
      docComunId: 3856,
      idDocumento: 660,
      processId: null,
      nombreDocComun: 'Flag',
      nombreDocumento: 'Flag Solicitud de Viático',
      privado: true,
      compartido: false,
    });
  });

  it('parsea los metadatos transferidos existentes en el XML de plantilla', () => {
    const builder = new CrearProcesoRequestBuilder();

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_CON_TRASPASOS);

    expect(documentoComun).toBeDefined();
    expect(documentoComun?.metadatosTransferidos.length).toBe(1);

    const traspaso = documentoComun?.metadatosTransferidos[0];
    expect(traspaso?.documentoComunProceso).toEqual({
      idDocumentoComunProceso: 3856,
      compartido: 'false',
      nombreDocumentoProceso: 'Flag',
      nombreDocumento: 'Flag Solicitud',
      privado: 'true',
      idDocumento: 660,
    });
    expect(traspaso?.bloqueMetadatoRequeridoOrigen).toEqual({
      metadatoRequerido: {
        nombreMetadato: 'Flag 2',
        esGrilla: 'false',
        idMetadato: 961,
        idTipoDato: 'ALF',
      },
      bloqueMetadato: { nombreBloque: 'Título 1', codigoBloque: 'BM1576' },
    });
    expect(traspaso?.bloqueMetadatoRequeridoDestino).toEqual({
      metadatoRequerido: {
        nombreMetadato: 'Flag Actualiza',
        esGrilla: 'false',
        idMetadato: 1860,
        idTipoDato: 'ALF',
      },
      bloqueMetadato: { nombreBloque: 'Oculto', codigoBloque: 'BM2177' },
    });
  });

  it('mapea traspaso grilla con pares de columnas al payload', () => {
    const builder = new CrearProcesoRequestBuilder();
    const tareaConfigs: Record<string, TareaConfig> = {
      Tarea_1: {
        ...buildDefaultTareaConfig('Tarea'),
        formularioRequeridoSeleccionado: {
          idFormulario: 660,
          nombre: 'Flag',
          visibilidad: 'privado',
          metadatosSeleccionados: ['BM2176-986'],
          metadatosTransferidos: [
            {
              origen: {
                idFormulario: 900,
                nombreFormulario: 'Solicitud',
                clave: 'BM2176-986',
                idMetadato: 986,
                nombreMetadato: 'Bitácora',
                tipoMetadato: 'DGD',
                esGrilla: true,
                nombreBloque: 'Bitácora',
                codigoBloque: 'BM2176',
              },
              destino: {
                idFormulario: 660,
                nombreFormulario: 'Flag',
                clave: 'BM2283-986',
                idMetadato: 986,
                nombreMetadato: 'Bitácora',
                tipoMetadato: 'DGD',
                esGrilla: true,
                nombreBloque: 'Bitácora',
                codigoBloque: 'BM2283',
              },
              paresColumnas: [
                {
                  origen: {
                    idColumnaGrilla: 21487,
                    datafield: '_Usuario',
                    titulo: 'Usuario',
                    tipoDato: 'ALF',
                  },
                  destino: {
                    idColumnaGrilla: 21922,
                    datafield: '_Usuario',
                    titulo: 'Usuario',
                    tipoDato: 'ALF',
                  },
                },
                {
                  origen: {
                    idColumnaGrilla: 21488,
                    datafield: '_Fecha_y_Hora',
                    titulo: 'Fecha y Hora',
                    tipoDato: 'ALF',
                  },
                  destino: {
                    idColumnaGrilla: 21923,
                    datafield: '_Fecha_y_Hora',
                    titulo: 'Fecha y Hora',
                    tipoDato: 'ALF',
                  },
                },
              ],
            },
          ],
        },
      },
    };

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_BASE, tareaConfigs);
    const traspaso = documentoComun?.metadatosTransferidos[0];

    expect(traspaso?.bloqueMetadatoRequeridoOrigen.metadatoRequerido.esGrilla).toBe('true');
    expect(
      traspaso?.bloqueMetadatoRequeridoOrigen.metadatoRequerido.columnasTransferidas,
    ).toBeUndefined();
    expect(traspaso?.bloqueMetadatoRequeridoDestino.metadatoRequerido.esGrilla).toBe('true');
    expect(
      traspaso?.bloqueMetadatoRequeridoDestino.metadatoRequerido.columnasTransferidas,
    ).toEqual([
      {
        idColumnaOrigen: 21487,
        dataFieldOrigen: '_Usuario',
        idColumnaDestino: 21922,
        dataFieldDestino: '_Usuario',
      },
      {
        idColumnaOrigen: 21488,
        dataFieldOrigen: '_Fecha_y_Hora',
        idColumnaDestino: 21923,
        dataFieldDestino: '_Fecha_y_Hora',
      },
    ]);
  });

  it('parsea columnaTransferida del XML de plantilla en el destino', () => {
    const builder = new CrearProcesoRequestBuilder();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<process-definition swimlane="1" version="1" name="Proceso" privado="true" compartido="false">
  <documentosComunesProceso></documentosComunesProceso>
  <responsables></responsables>
  <mecanismoDenominacion idMecanismoDenominacion="-1" />
  <catalogos></catalogos>
  <Roles></Roles>
  <SubProcesosAsociados></SubProcesosAsociados>
  <start-state name="Inicio" id="Inicio_1">
    <transition to="Tarea_1" />
  </start-state>
  <task-node name="Tarea" id="Tarea_1">
    <documentosComunesActividad>
      <documentoComunActividadWrapper nombreDocComunProceso="Flag">
        <documentoComunActividad activityId="" docComunId="" tieneMetadatosTransferidos="true" />
        <metadatosDisponibles></metadatosDisponibles>
        <metadatosTransferidos>
          <metadatoTransferido>
            <documentoComunProceso idDocumentoComunProceso="4032" compartido="false" nombreDocumentoProceso="Solicitud" nombreDocumento="Solicitud ubx4" privado="true" idDocumento="795" />
            <bloqueMetadatoRequeridoOrigen>
              <metadatoRequerido nombreMetadato="Bitácora" esGrilla="true" idMetadato="986" idTipoDato="DGD" />
              <bloqueMetadato nombreBloque="Bitácora" idBloque="5645" codigoBloque="BM2176" />
            </bloqueMetadatoRequeridoOrigen>
            <bloqueMetadatoRequeridoDestino>
              <metadatoRequerido nombreMetadato="Bitácora" esGrilla="true" idMetadato="986" idTipoDato="DGD">
                <columnaTransferida idColumnaOrigen="21487" dataFieldDestino="_Usuario" idColumnaDestino="21922" dataFieldOrigen="_Usuario" />
              </metadatoRequerido>
              <bloqueMetadato nombreBloque="Bitácora" idBloque="5801" codigoBloque="BM2283" />
            </bloqueMetadatoRequeridoDestino>
          </metadatoTransferido>
        </metadatosTransferidos>
      </documentoComunActividadWrapper>
    </documentosComunesActividad>
    <transition to="Fin_1" />
  </task-node>
  <end-state name="Fin" id="Fin_1" />
</process-definition>`;

    const documentoComun = encontrarDocumentoComunTarea(builder, xml);
    const traspaso = documentoComun?.metadatosTransferidos[0];

    expect(traspaso?.bloqueMetadatoRequeridoDestino.metadatoRequerido.columnasTransferidas).toEqual([
      {
        idColumnaOrigen: 21487,
        dataFieldOrigen: '_Usuario',
        idColumnaDestino: 21922,
        dataFieldDestino: '_Usuario',
      },
    ]);
  });

  it('respeta el flag del REST aunque la lista de traspasos esté vacía', () => {
    const builder = new CrearProcesoRequestBuilder();
    const tareaConfigs: Record<string, TareaConfig> = {
      Tarea_1: {
        ...buildDefaultTareaConfig('Tarea'),
        formularioRequeridoSeleccionado: {
          idFormulario: 660,
          nombre: 'Flag',
          visibilidad: 'privado',
          metadatosSeleccionados: ['BM1576-866'],
          tieneMetadatosTransferidos: 'true',
        },
      },
    };

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_BASE, tareaConfigs);

    expect(documentoComun?.documentoComunActividad.tieneMetadatosTransferidos).toBe('true');
    expect(documentoComun?.metadatosTransferidos).toEqual([]);
  });

  it('el OR con la lista poblada gana aunque el flag sea false', () => {
    const builder = new CrearProcesoRequestBuilder();
    const tareaConfigs: Record<string, TareaConfig> = {
      Tarea_1: {
        ...buildDefaultTareaConfig('Tarea'),
        formularioRequeridoSeleccionado: {
          idFormulario: 660,
          nombre: 'Flag',
          visibilidad: 'privado',
          metadatosSeleccionados: ['BM1576-866'],
          tieneMetadatosTransferidos: 'false',
          metadatosTransferidos: [
            {
              origen: {
                idFormulario: 900,
                nombreFormulario: 'Solicitud',
                clave: 'BM1576-1901',
                idMetadato: 1901,
                nombreMetadato: 'ejecutarWS',
                tipoMetadato: 'ALF',
                esGrilla: false,
                nombreBloque: 'Título 1',
                codigoBloque: 'BM1576',
              },
              destino: {
                idFormulario: 660,
                nombreFormulario: 'Flag',
                clave: 'BM2177-866',
                idMetadato: 866,
                nombreMetadato: 'Flag',
                tipoMetadato: 'ALF',
                esGrilla: false,
                nombreBloque: 'Oculto',
                codigoBloque: 'BM2177',
              },
            },
          ],
        },
      },
    };

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_BASE, tareaConfigs);

    expect(documentoComun?.documentoComunActividad.tieneMetadatosTransferidos).toBe('true');
  });
});
