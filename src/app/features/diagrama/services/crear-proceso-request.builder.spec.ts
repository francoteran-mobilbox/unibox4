import {
  CrearProcesoRequestBuilder,
  CrearProcesoFormSource,
  OpcionMetadatoResuelta,
} from './crear-proceso-request.builder';
import { buildDefaultTareaConfig, TareaConfig } from '../models/tarea-config.model';
import { MecanismoProceso, ProcesoCompartido } from '../models/diagrama.model';
import { buildDefaultTransicionConfig, TransicionConfig } from '../models/transicion-config.model';
import { buildDefaultTimerConfig } from '../models/timer-config.model';

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

const XML_CON_TRANSICIONES = `<?xml version="1.0" encoding="UTF-8"?>
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
    <transition id="Transicion 1" to="Fin_1" esTimer="false" levantaFormulario="false" />
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

function construirResolver(claves: Record<string, OpcionMetadatoResuelta>) {
  return (idDocumento: number, clave: string): OpcionMetadatoResuelta | null => {
    void idDocumento;
    return claves[clave] ?? null;
  };
}

function encontrarDocumentoComunTarea(
  builder: CrearProcesoRequestBuilder,
  xml: string,
  tareaConfigs?: Record<string, TareaConfig>,
  extras?: Parameters<CrearProcesoRequestBuilder['buildRequest']>[5],
) {
  const request = builder.buildRequest(FORM_SOURCE, xml, 'admin', tareaConfigs, undefined, extras);
  const actividadTarea = request.actividades.find(
    (actividad) => actividad.actividad.activityName === 'Tarea',
  );

  return actividadTarea?.documentosComunesActividad[0];
}

describe('CrearProcesoRequestBuilder - metadatosTransferidos', () => {
  it('mapea los traspasos configurados al payload plano con flag en true', () => {
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

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_BASE, tareaConfigs, {
      resolverMetadato: construirResolver({
        'BM1576-1901': {
          idMetadato: 1901,
          idBloque: 4527,
          codigoBloque: 'BM1576',
          tipo: 'ALF',
        },
        'BM2177-866': { idMetadato: 866, idBloque: 5646, codigoBloque: 'BM2177', tipo: 'ALF' },
      }),
    });

    expect(documentoComun).toBeDefined();
    expect(documentoComun?.documentoComunActividad.tieneMetadatosTransferidos).toBe('true');

    const traspaso = documentoComun?.metadatosTransferidos[0];
    expect(traspaso).toEqual({
      metadatoTransferidoId: null,
      activityId: null,
      nombreDocComunOrigen: 'Solicitud',
      docComunIdOrigen: null,
      idDocumentoOrigen: 900,
      idMetadatoOrigen: 1901,
      idBloqueOrigen: 4527,
      codigoBloqueOrigen: 'BM1576',
      docComunIdDestino: null,
      idDocumentoDestino: 660,
      idMetadatoDestino: 866,
      idBloqueDestino: 5646,
      codigoBloqueDestino: 'BM2177',
    });
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

  it('parsea los metadatos transferidos del XML de plantilla al formato plano', () => {
    const builder = new CrearProcesoRequestBuilder();

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_CON_TRASPASOS);

    expect(documentoComun).toBeDefined();
    expect(documentoComun?.metadatosTransferidos.length).toBe(1);

    const traspaso = documentoComun?.metadatosTransferidos[0];
    expect(traspaso).toEqual({
      metadatoTransferidoId: null,
      activityId: null,
      nombreDocComunOrigen: 'Flag',
      docComunIdOrigen: null,
      idDocumentoOrigen: 660,
      idMetadatoOrigen: 961,
      idBloqueOrigen: 4527,
      codigoBloqueOrigen: 'BM1576',
      docComunIdDestino: null,
      idDocumentoDestino: 660,
      idMetadatoDestino: 1860,
      idBloqueDestino: 5646,
      codigoBloqueDestino: 'BM2177',
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

    expect(traspaso?.columnasTransferidasDestino).toEqual([
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

    expect(traspaso?.columnasTransferidasDestino).toEqual([
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

describe('CrearProcesoRequestBuilder - permisos del proceso', () => {
  it('incluye los permisos del proceso compartido (usuarios, roles y grupos)', () => {
    const builder = new CrearProcesoRequestBuilder();
    const procesoCompartido: ProcesoCompartido = {
      grupo: [{ id_grupo: 3, nombre_grupo: 'Administración y Finanzas' }],
      usuario: [{ id_usuario: 'soporte' }],
      cargo: [
        { id_rol: 1, nombre_rol: 'Administrador' },
        { id_rol: 46, nombre_rol: 'Ejecutor' },
      ],
    };

    const request = builder.buildRequest(FORM_SOURCE, XML_BASE, 'admin', undefined, undefined, {
      procesoCompartido,
    });

    expect(request.permisosUsuarios).toEqual([{ id_usuario: 'soporte' }]);
    expect(request.permisosRoles).toEqual([1, 46]);
    expect(request.permisosGrupos).toEqual([3]);
  });

  it('deja permisos vacíos sin proceso compartido', () => {
    const builder = new CrearProcesoRequestBuilder();

    const request = builder.buildRequest(FORM_SOURCE, XML_BASE, 'admin');

    expect(request.permisosUsuarios).toEqual([]);
    expect(request.permisosRoles).toEqual([]);
    expect(request.permisosGrupos).toEqual([]);
  });
});

describe('CrearProcesoRequestBuilder - datos requeridos del mecanismo', () => {
  const MECANISMO: MecanismoProceso = {
    id_tipo_mecanismo: '1',
    por_defecto: false,
    id_mecanismo_denominacion: 38,
    id_usuario_creador: 'soporte',
    nombre_mecanismo_denominacion: 'Viáticos',
    fecha_creacion: '2026-01-01',
    datos_requeridos: [
      {
        valor_por_defecto: '',
        id_mecanismo_denominacion: 38,
        orden: 1,
        id_dato_mecanismo: 'Texto',
        id_dato_req_mecanismo: 100,
      },
      {
        valor_por_defecto: '',
        id_mecanismo_denominacion: 38,
        orden: 1,
        id_dato_mecanismo: 'var',
        id_dato_req_mecanismo: 260,
      },
      {
        valor_por_defecto: '',
        id_mecanismo_denominacion: 38,
        orden: 2,
        id_dato_mecanismo: 'var',
        id_dato_req_mecanismo: 262,
      },
    ],
  };

  it('mapea texto fijo y metadato de formulario con idBloque resuelto', () => {
    const builder = new CrearProcesoRequestBuilder();

    const request = builder.buildRequest(FORM_SOURCE, XML_BASE, 'admin', undefined, undefined, {
      mecanismo: MECANISMO,
      configDatoSelections: {
        260: { tipo: 'texto_fijo', valor: 'Viáticos' },
        262: {
          tipo: 'metadato_formulario',
          documento: '795',
          metadato: '1219',
          codigoBloque: 'BM2172',
        },
      },
      resolverMetadato: construirResolver({
        'BM2172-1219': {
          idMetadato: 1219,
          idBloque: 5641,
          codigoBloque: 'BM2172',
          tipo: 'ALF',
        },
      }),
      documentosProceso: [{ label: 'Solicitud de Viático', value: '795' }],
    });

    expect(request.procesoMecanismo.idMecanismoDenominacion).toBe(38);
    expect(request.procesoMecanismo.datosRequeridos).toEqual([
      {
        dato: {
          idDatoReqProceso: null,
          processId: null,
          idDatoReqMecanismo: 260,
          idDatoDisponibleProceso: 'txf',
          valorTextoFijo: 'Viáticos',
          nombreSecuencia: '',
        },
        metadatoRequerido: null,
        nombreDocumentoComun: null,
      },
      {
        dato: {
          idDatoReqProceso: null,
          processId: null,
          idDatoReqMecanismo: 262,
          idDatoDisponibleProceso: 'met',
          valorTextoFijo: '',
          nombreSecuencia: '',
        },
        metadatoRequerido: {
          idDatoReqProceso: null,
          idDocumento: 795,
          idMetadato: 1219,
          idBloque: 5641,
          codigoBloque: 'BM2172',
          docComunId: null,
        },
        nombreDocumentoComun: 'Solicitud de Viático',
      },
    ]);
  });

  it('devuelve datosRequeridos vacío sin mecanismo ni selecciones', () => {
    const builder = new CrearProcesoRequestBuilder();

    const request = builder.buildRequest(FORM_SOURCE, XML_BASE, 'admin');

    expect(request.procesoMecanismo.datosRequeridos).toEqual([]);
    expect(request.procesoMecanismo.idMecanismoDenominacion).toBe(-1);
  });
});

describe('CrearProcesoRequestBuilder - actividades y transiciones', () => {
  it('mapea la configuración de tarea en la actividad', () => {
    const builder = new CrearProcesoRequestBuilder();
    const tareaConfigs: Record<string, TareaConfig> = {
      Tarea_1: {
        ...buildDefaultTareaConfig('Tarea'),
        duracionValor: 4,
        duracionUnidad: 'horas',
        cargo: '46',
        usuarios: ['jperez'],
        ejecutaFuncionalidad: true,
        funcionalidad: 'cmf',
        dispositivoMovil: true,
        agenda: true,
        tipoEjecucion: 'automatica',
        aplicarJornadaLaboral: true,
        jornada: '2',
        calendario: '4',
        agregarRegistrosExternos: true,
        filtrarUsuariosPorMetadatos: true,
        conservarVistosBuenos: true,
        imprimirFormulario: true,
        tareaWeb: true,
        notificarViaEmail: true,
        alertas: true,
        checkpoint: true,
        formularioRequeridoSeleccionado: {
          idFormulario: 660,
          nombre: 'Flag',
          visibilidad: 'privado',
          metadatosSeleccionados: ['BM2177-866'],
        },
      },
    };

    const request = builder.buildRequest(FORM_SOURCE, XML_BASE, 'admin', tareaConfigs, undefined, {
      resolverMetadato: construirResolver({
        'BM1576-866': { idMetadato: 866, idBloque: 4527, codigoBloque: 'BM1576', tipo: 'ALF' },
        'BM2177-866': { idMetadato: 866, idBloque: 5646, codigoBloque: 'BM2177', tipo: 'ALF' },
      }),
    });

    const actividad = request.actividades.find(
      (wrapper) => wrapper.actividad.activityName === 'Tarea',
    );

    expect(actividad?.actividad).toEqual(
      jasmine.objectContaining({
        activityTime: 4,
        timeunitId: 'horas',
        funcionality: 'cmf',
        idRol: 46,
        idJornada: 2,
        idCalendario: 4,
        tieneDocumentosComunes: true,
        tieneCheckpoint: true,
        tieneAlertas: true,
        imprimeFormulario: true,
        tareaWeb: true,
        filtrarPorMetadato: true,
        registrosExternos: true,
        tieneNotificacion: true,
        automatica: true,
        consecutiva: false,
        conservarVistosBuenos: true,
        utilizaAgenda: true,
        dispositivoMovil: true,
      }),
    );
    expect(actividad?.usuariosPreAsignados).toEqual([
      { idUsuario: 'jperez', idProcedencia: 'diagrama' },
    ]);

    const documentoComun = actividad?.documentosComunesActividad[0];
    expect(documentoComun?.metadatosDisponibles[0]?.id).toEqual({
      activityId: null,
      docComunId: null,
      idDocumento: 660,
      idMetadato: 866,
      idBloque: 5646,
    });
    expect(documentoComun?.metadatosDisponibles[0]?.codigoBloque).toBe('BM2177');
  });

  it('actividades sin configuración de tarea mantienen el XML como fuente', () => {
    const builder = new CrearProcesoRequestBuilder();

    const documentoComun = encontrarDocumentoComunTarea(builder, XML_CON_TRASPASOS);

    expect(documentoComun?.documentoComunActividad.tieneMetadatosTransferidos).toBe('true');
    expect(documentoComun?.metadatosDisponibles[0]?.id.idBloque).toBe(-1);
  });

  it('mapea reglas de usuario planas, reglas de negocio y timer legacy en transiciones', () => {
    const builder = new CrearProcesoRequestBuilder();
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      requiereTimer: true,
      timer: {
        ...buildDefaultTimerConfig(),
        modo: 'metadatoFormulario',
        idDocumento: 795,
        idMetadato: 'BM2177-1483',
      },
      interrupcion: false,
      reglasUsuario: [
        {
          idDocumento: 795,
          idMetadato: 'BM2172-1266',
          interpretacion: 'texto',
          idCargo: 46,
          idMetadatoValor: '873',
          idReglaUsuario: null,
        },
      ],
      reglasNegocio: [
        {
          idDocumento: 795,
          idMetadato: 'BM2172-1266',
          operador: 'contiene',
          idOperadorRegla: null,
          fuenteValor: 'valor',
          valorTexto: 'Aprobado',
          idDocumentoValor: null,
          idMetadatoValor: null,
        },
      ],
    };

    const request = builder.buildRequest(FORM_SOURCE, XML_CON_TRANSICIONES, 'admin', undefined, undefined, {
      transicionConfigs: { Transicion_1: transicionConfig },
      resolverMetadato: construirResolver({
        'BM2172-1266': { idMetadato: 1266, idBloque: 5641, codigoBloque: 'BM2172', tipo: 'ALF' },
        'BM2177-1483': { idMetadato: 1483, idBloque: 5646, codigoBloque: 'BM2177', tipo: 'NUM' },
      }),
      resolverMetadatoRol: (idRol, idMetadato) =>
        idRol === 46 && idMetadato === 873
          ? { idMetadato: 873, idBloque: 4445, codigoBloque: null, tipo: null }
          : null,
    });

    expect(request.transiciones.length).toBeGreaterThan(0);

    const transicion = request.transiciones.find(
      (wrapper) => wrapper.idActividadDestino === 'Fin_1',
    );

    expect(transicion?.transicion.tieneTimer).toBe(true);
    expect(transicion?.transicion.levantaForm).toBe(false);
    expect(transicion?.reglasUsuario).toEqual([
      {
        idReglaUsuario: null,
        idDocIzq: 795,
        idBloqIzq: 5641,
        codigoBloqIzq: 'BM2172',
        idMetIzq: 1266,
        idRolDer: 46,
        idBloqDer: 4445,
        codigoBloqDer: null,
        idMetDer: 873,
        campoValor2: false,
      },
    ]);
    expect(transicion?.reglasNegocio).toEqual([
      {
        idReglaNegocio: null,
        idOperadorRegla: 'ctn',
        izqEsDoc: false,
        izqIdMetadato: 1266,
        izqIdBloque: 5641,
        izqCodigoBloque: 'BM2172',
        izqIdTipoDato: 'ALF',
        izqIdOperando: null,
        derEsDoc: false,
        derIdMetadato: null,
        derIdBloque: null,
        derCodigoBloque: null,
        derIdTipoDato: null,
        derIdOperando: null,
        derValorOperando: 'Aprobado',
      },
    ]);
    expect(transicion?.tieneTimer).toBe(true);
    expect(transicion?.timer).toEqual({
      idTimerProceso: null,
      esMetFormulario: true,
      docComunId: null,
      idBloque: 5646,
      idMetadato: 1483,
      esDatoFijo: false,
      esTiempo: false,
      datoFijo: '0',
      idUnidadTiempo: '',
      esFecha: false,
      fecha: '',
      hora: '',
    });
    expect(transicion?.conInterrupcion).toBe(false);
  });

  it('transiciones sin configuración quedan con reglas vacías y timer null', () => {
    const builder = new CrearProcesoRequestBuilder();

    const request = builder.buildRequest(FORM_SOURCE, XML_BASE, 'admin');

    for (const transicion of request.transiciones) {
      expect(transicion.reglasUsuario).toEqual([]);
      expect(transicion.reglasNegocio).toEqual([]);
      expect(transicion.tieneTimer).toBeNull();
      expect(transicion.timer).toBeNull();
      expect(transicion.conInterrupcion).toBeNull();
    }
  });

  it('timer dato fijo de tipo tiempo se mapea con esDatoFijo/esTiempo', () => {
    const builder = new CrearProcesoRequestBuilder();
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      requiereTimer: true,
      timer: {
        ...buildDefaultTimerConfig(),
        modo: 'datoFijo',
        datoFijoTipo: 'tiempo',
        duracionValor: 5,
        duracionUnidad: 'horas',
      },
      interrupcion: false,
    };

    const request = builder.buildRequest(FORM_SOURCE, XML_CON_TRANSICIONES, 'admin', undefined, undefined, {
      transicionConfigs: { Transicion_1: transicionConfig },
    });

    const transicion = request.transiciones.find((wrapper) => wrapper.idActividadDestino === 'Fin_1');

    expect(transicion?.timer).toEqual({
      idTimerProceso: null,
      esMetFormulario: false,
      docComunId: null,
      idBloque: null,
      idMetadato: null,
      esDatoFijo: true,
      esTiempo: true,
      datoFijo: '5',
      idUnidadTiempo: 'horas',
      esFecha: false,
      fecha: '',
      hora: '',
    });
  });
});
