import { TestBed } from '@angular/core/testing';
import { LegacyXmlConfiguracionesService } from './legacy-xml-configuraciones.service';
import { LegacyXmlSerializerService } from './legacy-xml-serializer.service';
import { buildDefaultDecisionConfig } from '../models/decision-config.model';
import { buildDefaultMensajeConfig } from '../models/mensaje-config.model';
import { TareaConfig, buildDefaultTareaConfig } from '../models/tarea-config.model';
import { buildDefaultTimerConfig } from '../models/timer-config.model';
import { buildDefaultTransicionConfig } from '../models/transicion-config.model';
import { LegacyBpmnSnapshot } from '../models/diagrama.model';
import { ConfiguracionesLegacyXml } from '../models/legacy-xml-configuraciones.model';

const TEMPLATE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<process-definition swimlane="1" privado="false" compartido="false" family="-1" version="1" name="Viejo" duration="0 minutos" tieneDocumentosComunes="false" expedienteElectronico="false" publicaEnCatalogo="false">
  <documentosComunesProceso></documentosComunesProceso>
  <responsables></responsables>
  <mecanismoDenominacion idMecanismoDenominacion="-1" />
  <catalogos></catalogos>
  <Roles></Roles>
  <SubProcesosAsociados></SubProcesosAsociados>
  <task-node name="Actividad 1" id="Tarea 1" x="0" y="0" width="123" height="69">
    <task validacionJerarquica="false" swimlane="46" duration="10 dias" />
    <transition esTimer="false" interrupcion="false" accionTransicion="" to="Decision 1" id="Transicion Tarea 1" />
  </task-node>
  <decision name="Decisión 1" id="Decision 1" x="300" y="0" width="70" height="70">
    <transition esTimer="false" interrupcion="false" accionTransicion="" to="Mensaje 1" id="Transicion Decision 1" />
  </decision>
  <mensaje name="Mensaje 1" id="Mensaje 1" x="450" y="0" width="80" height="30">
    <transition esTimer="false" interrupcion="false" accionTransicion="" to="Timer 1" id="Transicion Mensaje 1" />
  </mensaje>
  <timer name="Timer 1" id="Timer 1" x="600" y="0" width="80" height="30">
    <transition esTimer="false" interrupcion="false" accionTransicion="" to="Fin 1" id="Transicion Timer 1" />
  </timer>
  <end-state name="Fin 1" id="Fin 1" x="800" y="0" width="80" height="33" />
</process-definition>`;

const FORMULARIO_SOLICITUD = {
  id: 'fp-1',
  nombre: 'Solicitud',
  nombreDocumento: 'Solicitud de Viático',
  docComunId: 4128,
  idFormulario: 795,
  visibilidad: 'privado' as const,
};

function configuracionesBase(): ConfiguracionesLegacyXml {
  return {
    form: {
      nombre: 'Proceso Test',
      responsables: ['1'],
      duracionValor: 10,
      duracionUnidad: 'minutos',
      familiaProceso: '3',
      visibilidad: 'privado',
      mecanismoDenominacion: '38',
      observaciones: '',
      creaExpedienteElectronico: true,
      publicaEnCatalogo: true,
      catalogosPublicacion: ['22'],
      aplicaJornadaLaboral: false,
      jornada: null,
      calendario: null,
    },
    tareaConfigs: {},
    transicionConfigs: {},
    timerConfigs: {},
    mensajeConfigs: {},
    decisionConfigs: {},
    formulariosProceso: [FORMULARIO_SOLICITUD],
    configDatoSelections: {
      262: {
        tipo: 'metadato_formulario',
        documento: '795',
        metadato: '1219',
        codigoBloque: 'BM2172',
      },
    },
    mecanismo: {
      id_tipo_mecanismo: 'var',
      por_defecto: true,
      id_mecanismo_denominacion: 38,
      id_usuario_creador: 'soportemovilgo',
      nombre_mecanismo_denominacion: 'Mecanismo',
      fecha_creacion: '2026-01-01T00:00:00Z',
      datos_requeridos: [
        {
          valor_por_defecto: '',
          id_mecanismo_denominacion: 38,
          orden: 1,
          id_dato_mecanismo: 'var',
          id_dato_req_mecanismo: 262,
        },
      ],
    },
    resolverMetadato: (idDocumento, clave) => {
      if (idDocumento === 795 && clave === 'BM2172-1219') {
        return {
          idMetadato: 1219,
          idBloque: 5641,
          codigoBloque: 'BM2172',
          tipo: 'SIS',
          nombreMetadato: 'Funcionario',
          nombreBloque: 'Identificación General',
          esGrilla: false,
        };
      }

      if (idDocumento === 660 && clave === 'BM1576-961') {
        return {
          idMetadato: 961,
          idBloque: 4527,
          codigoBloque: 'BM1576',
          tipo: 'ALF',
          nombreMetadato: 'Flag 2',
          nombreBloque: 'Título 1',
          esGrilla: false,
        };
      }

      return null;
    },
    resolverDocumento: (idDocumento) => {
      if (idDocumento === 795) {
        return {
          nombre: 'Solicitud',
          nombreDocumento: 'Solicitud de Viático',
          privado: true,
          compartido: false,
          docComunId: 4128,
        };
      }

      if (idDocumento === 660) {
        return {
          nombre: 'Flag',
          nombreDocumento: 'Flag Solicitud',
          privado: true,
          compartido: false,
          docComunId: 3611,
        };
      }

      return null;
    },
  };
}

function tareaConfigCompleta(): TareaConfig {
  return {
    ...buildDefaultTareaConfig('Actividad 1'),
    cargo: '46',
    duracionValor: 10,
    duracionUnidad: 'dias',
    tipoEjecucion: 'automatica',
    checkpoint: true,
    observaciones: 'Obs',
    agenda: true,
    dispositivoMovil: true,
    conservarVistosBuenos: true,
    notificarViaEmail: true,
    imprimirFormulario: true,
    tareaWeb: true,
    ejecutaFuncionalidad: true,
    funcionalidad: 'cmf',
    formularioRequeridoSeleccionado: {
      idFormulario: 795,
      nombre: 'Solicitud',
      nombreDocumento: 'Solicitud de Viático',
      visibilidad: 'privado',
      metadatosSeleccionados: ['BM2172-1219'],
      metadatosTransferidos: [
        {
          origen: {
            idFormulario: 660,
            nombreFormulario: 'Flag',
            clave: 'BM1576-961',
            idMetadato: 961,
            nombreMetadato: 'Flag 2',
            tipoMetadato: 'ALF',
            esGrilla: false,
            nombreBloque: 'Título 1',
            codigoBloque: 'BM1576',
          },
          destino: {
            idFormulario: 795,
            nombreFormulario: 'Solicitud',
            clave: 'BM2172-1219',
            idMetadato: 1219,
            nombreMetadato: 'Funcionario',
            tipoMetadato: 'SIS',
            esGrilla: false,
            nombreBloque: 'Identificación General',
            codigoBloque: 'BM2172',
          },
        },
      ],
    },
  };
}

function snapshotCompleto(): LegacyBpmnSnapshot {
  const nodo = (
    id: string,
    type: string,
    extras: Record<string, unknown> = {},
  ): LegacyBpmnSnapshot['nodes'][number] => ({
    id,
    type,
    name: '',
    x: 0,
    y: 0,
    width: 100,
    height: 60,
    hasMessageEventDefinition: false,
    hasTimerEventDefinition: false,
    hasTerminateEventDefinition: false,
    ...extras,
  });

  return {
    nodes: [
      nodo('Tarea 1', 'bpmn:Task'),
      nodo('Decision 1', 'bpmn:InclusiveGateway'),
      nodo('Mensaje 1', 'bpmn:IntermediateThrowEvent', { hasMessageEventDefinition: true }),
      nodo('Timer 1', 'bpmn:IntermediateCatchEvent', { hasTimerEventDefinition: true }),
      nodo('Fin 1', 'bpmn:EndEvent'),
    ],
    transitions: [],
  };
}

function documentoBase(): Document {
  return new DOMParser().parseFromString(TEMPLATE_XML, 'text/xml');
}

describe('LegacyXmlConfiguracionesService', () => {
  let service: LegacyXmlConfiguracionesService;

  beforeEach(() => {
    service = new LegacyXmlConfiguracionesService();
  });

  function aplicar(
    configuracionesExtra: Partial<ConfiguracionesLegacyXml> = {},
  ): Document {
    const document = documentoBase();
    service.aplicarConfiguraciones(
      document,
      snapshotCompleto(),
      { ...configuracionesBase(), ...configuracionesExtra },
    );
    return document;
  }

  it('escribe la configuración del proceso en la cabecera y secciones', () => {
    const document = aplicar();
    const processDefinition = document.documentElement;

    expect(processDefinition.getAttribute('name')).toBe('Proceso Test');
    expect(processDefinition.getAttribute('privado')).toBe('true');
    expect(processDefinition.getAttribute('family')).toBe('3');
    expect(processDefinition.getAttribute('duration')).toBe('10 minutos');
    expect(processDefinition.getAttribute('expedienteElectronico')).toBe('true');
    expect(processDefinition.getAttribute('tieneDocumentosComunes')).toBe('true');
    expect(processDefinition.querySelector('responsables cargo')?.getAttribute('id')).toBe('1');
    expect(
      processDefinition.querySelector('catalogos catalogo')?.getAttribute('idCatalogo'),
    ).toBe('22');
  });

  it('escribe documentosComunesProceso y datos del mecanismo de denominación', () => {
    const document = aplicar();

    const documentoComun = document.querySelector(
      'documentosComunesProceso documentoComunProceso',
    );
    expect(documentoComun?.getAttribute('idDocumento')).toBe('795');
    expect(documentoComun?.getAttribute('idDocumentoComunProceso')).toBe('4128');
    expect(documentoComun?.getAttribute('nombreDocumentoProceso')).toBe('Solicitud');
    expect(documentoComun?.getAttribute('nombreDocumento')).toBe('Solicitud de Viático');

    const datoMecanismo = document.querySelector('mecanismoDenominacion datoProcesoMecanismo');
    expect(datoMecanismo?.getAttribute('idDatoReqMecanismo')).toBe('262');
    expect(datoMecanismo?.getAttribute('nombreDocumentoComun')).toBe('Solicitud');
    expect(datoMecanismo?.getAttribute('idDatoDisponibleProceso')).toBe('met');
    expect(datoMecanismo?.getAttribute('idDocumento')).toBe('795');
    expect(datoMecanismo?.getAttribute('idMetadato')).toBe('1219');
    expect(datoMecanismo?.getAttribute('idBloque')).toBe('5641');
    expect(datoMecanismo?.getAttribute('codigoBloque')).toBe('BM2172');
    expect(datoMecanismo?.getAttribute('idDocumentoComun')).toBe('4128');
  });

  it('escribe la configuración completa del task-node', () => {
    const document = aplicar({
      tareaConfigs: { 'Tarea 1': tareaConfigCompleta() },
    });

    const taskNode = document.querySelector('task-node#Tarea\\ 1');
    expect(taskNode?.getAttribute('tieneDocumentosComunes')).toBe('true');

    const task = taskNode?.querySelector('task');
    expect(task?.getAttribute('swimlane')).toBe('46');
    expect(task?.getAttribute('duration')).toBe('10 dias');
    expect(task?.getAttribute('automatica')).toBe('true');
    expect(task?.getAttribute('tareaWeb')).toBe('true');
    expect(task?.getAttribute('tieneCheckPoint')).toBe('true');
    expect(task?.getAttribute('comments')).toBe('Obs');
    expect(task?.getAttribute('utilizaAgenda')).toBe('true');
    expect(task?.getAttribute('dispositivoMovil')).toBe('true');
    expect(task?.getAttribute('conservarVistosBuenos')).toBe('true');
    expect(task?.getAttribute('tieneNotificacion')).toBe('true');
    expect(task?.getAttribute('imprimeFormulario')).toBe('true');
    expect(taskNode?.querySelector('functionality')?.getAttribute('name')).toBe('cmf');

    const documentoComun = taskNode?.querySelector(
      'documentoComunActividad documentoComunProceso',
    );
    expect(documentoComun?.getAttribute('idDocumento')).toBe('795');
    expect(documentoComun?.getAttribute('idDocumentoComunProceso')).toBe('4128');

    const disponible = taskNode?.querySelector(
      'metadatosDisponibles bloqueMetadatoRequerido metadatoRequerido',
    );
    expect(disponible?.getAttribute('idMetadato')).toBe('1219');
    expect(disponible?.getAttribute('nombreMetadato')).toBe('Funcionario');
    expect(disponible?.getAttribute('idTipoDato')).toBe('SIS');

    const traspaso = taskNode?.querySelector('metadatosTransferidos metadatoTransferido');
    expect(traspaso?.querySelector('documentoComunProceso')?.getAttribute('idDocumento')).toBe('660');
    expect(
      traspaso?.querySelector('bloqueMetadatoRequeridoOrigen metadatoRequerido')?.getAttribute('idMetadato'),
    ).toBe('961');
    expect(
      traspaso?.querySelector('bloqueMetadatoRequeridoDestino metadatoRequerido')?.getAttribute('idMetadato'),
    ).toBe('1219');
  });

  it('escribe la configuración de decisión y mensaje', () => {
    const document = aplicar({
      decisionConfigs: {
        'Decision 1': {
          ...buildDefaultDecisionConfig('Decisión 1'),
          cargo: '47',
          duracionValor: 1,
          duracionUnidad: 'horas',
          ejecutaFuncionalidad: true,
          funcionalidad: 'freg',
          documento: 795,
        },
      },
      mensajeConfigs: {
        'Mensaje 1': {
          ...buildDefaultMensajeConfig(),
          asunto: 'Asunto',
          contenido: 'Contenido',
          encabezadoInfoProceso: true,
          enviarACargo: true,
          completarFormulario: 'externo',
        },
      },
    });

    const decision = document.querySelector('decision#Decision\\ 1');
    expect(decision?.getAttribute('swimlane')).toBe('47');
    expect(decision?.getAttribute('idTipoElementoRequerido')).toBe('documento');
    expect(decision?.getAttribute('duration')).toBe('1 horas');
    expect(decision?.getAttribute('tieneDocumentosComunes')).toBe('true');
    expect(decision?.querySelector('functionality')?.getAttribute('name')).toBe('freg');
    expect(
      decision?.querySelector('documentoComunActividad documentoComunProceso')?.getAttribute('idDocumento'),
    ).toBe('795');
    expect(decision?.querySelector('reglaMultiFormulario')).not.toBeNull();

    const mensaje = document.querySelector('mensaje#Mensaje\\ 1');
    expect(mensaje?.getAttribute('subject')).toBe('Asunto');
    expect(mensaje?.getAttribute('content')).toBe('Contenido');
    expect(mensaje?.getAttribute('encabezado')).toBe('true');
    expect(mensaje?.getAttribute('enviarUsuariosDelCargo')).toBe('true');
    expect(mensaje?.getAttribute('enviaFormularioExterno')).toBe('true');
    expect(mensaje?.getAttribute('conCopia')).toBe('false');
    expect(mensaje?.querySelector('metadatosMensaje')).not.toBeNull();
    expect(mensaje?.querySelector('metadatosMensajeCc')).not.toBeNull();
  });

  it('marca conCopia cuando el mensaje tiene destinatarios en copia', () => {
    const document = aplicar({
      mensajeConfigs: {
        'Mensaje 1': {
          ...buildDefaultMensajeConfig(),
          destinatariosCc: {
            usuariosSistema: ['mrojas'],
            usuariosExternos: [],
            referencias: [],
          },
        },
      },
    });

    const mensaje = document.querySelector('mensaje#Mensaje\\ 1');
    expect(mensaje?.getAttribute('conCopia')).toBe('true');
  });

  it('escribe la configuración del nodo timer y del timer de transición', () => {
    const document = aplicar({
      timerConfigs: {
        'Timer 1': {
          ...buildDefaultTimerConfig(),
          modo: 'metadatoFormulario',
          idDocumento: 795,
          idMetadato: 'BM2172-1219',
        },
      },
      transicionConfigs: {
        'Transicion Tarea 1': {
          ...buildDefaultTransicionConfig(),
          requiereTimer: true,
          timer: {
            ...buildDefaultTimerConfig(),
            modo: 'metadatoFormulario',
            idDocumento: 795,
            idMetadato: 'BM2172-1219',
          },
          interrupcion: true,
          accionRequerida: true,
          accion: 'FIRMAR_TOKEN',
          reglasNegocio: [
            {
              idDocumento: 795,
              idMetadato: 'BM2172-1219',
              operador: 'contiene',
              fuenteValor: 'valor',
              valorTexto: 'abc',
              idDocumentoValor: null,
              idMetadatoValor: null,
            },
          ],
          reglasUsuario: [
            {
              idDocumento: 660,
              idMetadato: 'BM1576-961',
              interpretacion: 'id',
              idCargo: 52,
            },
          ],
        },
      },
    });

    const timer = document.querySelector('timer#Timer\\ 1');
    expect(timer?.getAttribute('esMetFormulario')).toBe('true');
    expect(timer?.getAttribute('idMetadato')).toBe('1219');
    expect(timer?.getAttribute('idBloque')).toBe('5641');
    expect(timer?.getAttribute('nombreDocComunProceso')).toBe('Solicitud de Viático');

    const transicion = document.querySelector(
      'task-node#Tarea\\ 1 transition#Transicion\\ Tarea\\ 1',
    );
    expect(transicion?.getAttribute('esTimer')).toBe('true');
    expect(transicion?.getAttribute('interrupcion')).toBe('true');
    expect(transicion?.getAttribute('accionTransicion')).toBe('FIRMAR_TOKEN');
    expect(transicion?.getAttribute('nombreAccionTransicion')).toBe('Firmar con token');
    expect(transicion?.getAttribute('divisiones')).toBe('1');

    const timerTransicion = transicion?.querySelector('timerTransicion');
    expect(timerTransicion?.getAttribute('esMetFormulario')).toBe('true');
    expect(timerTransicion?.getAttribute('idMetadato')).toBe('1219');
    expect(timerTransicion?.getAttribute('idBloque')).toBe('5641');

    const reglaNegocio = transicion?.querySelector('reglanegocio');
    expect(reglaNegocio?.getAttribute('bloqIzq')).toBe('5641');
    expect(reglaNegocio?.getAttribute('codigoBloqIzq')).toBe('BM2172');
    expect(reglaNegocio?.getAttribute('metIzq')).toBe('1219');
    expect(reglaNegocio?.getAttribute('valor')).toBe('abc');
    expect(reglaNegocio?.getAttribute('operador')).toBe('sco');
    expect(reglaNegocio?.getAttribute('reqDoc')).toBe('false');

    const reglaUsuario = transicion?.querySelector('reglausuario');
    expect(reglaUsuario?.getAttribute('metIzq')).toBe('961');
    expect(reglaUsuario?.getAttribute('rolDer')).toBe('52');
  });

  it('conserva la configuración previa de nodos sin config en la sesión', () => {
    const document = aplicar();

    const taskSinConfig = document.querySelector('task-node#Tarea\\ 1');
    expect(taskSinConfig?.querySelector('task')?.getAttribute('swimlane')).toBe('46');
    expect(taskSinConfig?.querySelector('task')?.getAttribute('duration')).toBe('10 dias');
    expect(taskSinConfig?.getAttribute('tieneDocumentosComunes')).toBeNull();
    expect(taskSinConfig?.querySelector('functionality')).toBeNull();

    const transicionSinConfig = document.querySelector(
      'timer#Timer\\ 1 transition#Transicion\\ Timer\\ 1',
    );
    expect(transicionSinConfig?.getAttribute('esTimer')).toBe('false');
    expect(transicionSinConfig?.querySelector('timerTransicion')).toBeNull();
  });

  it('el serializer integra estructura y configuraciones', () => {
    TestBed.configureTestingModule({});
    const serializer = TestBed.inject(LegacyXmlSerializerService);
    const configuraciones = {
      ...configuracionesBase(),
      formulariosProceso: [],
      configDatoSelections: {},
      mecanismo: null,
      tareaConfigs: { 'Tarea 1': tareaConfigCompleta() },
    };

    const xml = serializer.serializeFromSnapshot(
      TEMPLATE_XML,
      snapshotCompleto(),
      configuraciones,
    );
    const document = new DOMParser().parseFromString(xml, 'text/xml');

    expect(document.querySelector('parsererror')).toBeNull();
    const tarea = Array.from(document.querySelectorAll('task-node')).find(
      (nodo) => nodo.getAttribute('id') === 'Tarea 1',
    );
    expect(tarea?.querySelector('task')?.getAttribute('swimlane')).toBe('46');
    expect(document.documentElement?.getAttribute('name')).toBe('Proceso Test');
  });
});
