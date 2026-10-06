import { Injectable } from '@angular/core';
import type {
  ConfigDatoSelection,
  LegacyBpmnSnapshot,
} from '../models/diagrama.model';
import type {
  ConfiguracionesLegacyXml,
  DetalleMetadatoLegacy,
} from '../models/legacy-xml-configuraciones.model';
import type { DecisionConfig } from '../models/decision-config.model';
import type { MensajeConfig } from '../models/mensaje-config.model';
import { mensajeDestinoConfigurado } from '../models/mensaje-config.model';
import type {
  FormularioRequeridoSeleccion,
  MetadatoTransferidoConfig,
  TareaConfig,
} from '../models/tarea-config.model';
import type { TimerConfig } from '../models/timer-config.model';
import type {
  TransicionConfig,
  TransicionReglaNegocio,
  TransicionReglaUsuario,
} from '../models/transicion-config.model';
import {
  TRANSICION_ACCION_OPTIONS,
  TRANSICION_OPERADOR_REGLAS,
} from '../models/transicion-config.model';

type TagFlujoLegacy =
  | 'start-state'
  | 'task-node'
  | 'decision'
  | 'regla-negocio'
  | 'mensaje'
  | 'timer'
  | 'enlace-paralelo'
  | 'end-state'
  | 'terminate-state';

const TAGS_FLUJO_LEGACY: readonly TagFlujoLegacy[] = [
  'start-state',
  'task-node',
  'decision',
  'regla-negocio',
  'mensaje',
  'timer',
  'enlace-paralelo',
  'end-state',
  'terminate-state',
];

const TIPO_TO_DATO_DISPONIBLE: Record<string, string> = {
  texto_fijo: 'txf',
  metadato_formulario: 'met',
  correlativo: 'cor',
  nombre_proceso: 'npr',
};

interface DocumentoComunProcesoInfo {
  readonly nombre: string;
  readonly nombreDocumento: string;
  readonly privado: boolean;
  readonly compartido: boolean;
  readonly docComunId: number | null;
}

@Injectable({ providedIn: 'root' })
export class LegacyXmlConfiguracionesService {
  aplicarConfiguraciones(
    documentXml: Document,
    snapshot: LegacyBpmnSnapshot,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    this.aplicarConfiguracionProceso(documentXml, configuraciones);

    const nodosPorId = this.construirIndiceNodos(documentXml);

    for (const nodo of snapshot.nodes) {
      const elemento = nodosPorId.get(nodo.id);

      if (!elemento) {
        continue;
      }

      switch (elemento.tagName) {
        case 'task-node':
          this.aplicarConfiguracionTarea(elemento, configuraciones);
          break;
        case 'decision':
          this.aplicarConfiguracionDecision(elemento, configuraciones);
          break;
        case 'mensaje':
          this.aplicarConfiguracionMensaje(elemento, configuraciones);
          break;
        case 'timer':
          this.aplicarConfiguracionTimerNodo(elemento, configuraciones);
          break;
        default:
          break;
      }

      for (const transitionElement of Array.from(elemento.getElementsByTagName('transition'))) {
        this.aplicarConfiguracionTransicion(transitionElement, configuraciones);
      }
    }
  }

  // ====== Búsqueda de configuraciones ======

  private normalizarId(id: string): string {
    return id.replace(/ /g, '_');
  }

  private buscarTareaConfig(
    id: string,
    configuraciones: ConfiguracionesLegacyXml,
  ): TareaConfig | undefined {
    return (
      configuraciones.tareaConfigs[id] ??
      configuraciones.tareaConfigs[this.normalizarId(id)]
    );
  }

  private buscarDecisionConfig(
    id: string,
    configuraciones: ConfiguracionesLegacyXml,
  ): DecisionConfig | undefined {
    return (
      configuraciones.decisionConfigs[id] ??
      configuraciones.decisionConfigs[this.normalizarId(id)]
    );
  }

  private buscarTimerConfig(
    id: string,
    configuraciones: ConfiguracionesLegacyXml,
  ): TimerConfig | undefined {
    return (
      configuraciones.timerConfigs[id] ??
      configuraciones.timerConfigs[this.normalizarId(id)]
    );
  }

  private buscarMensajeConfig(
    id: string,
    configuraciones: ConfiguracionesLegacyXml,
  ) {
    return (
      configuraciones.mensajeConfigs[id] ??
      configuraciones.mensajeConfigs[this.normalizarId(id)]
    );
  }

  private buscarTransicionConfig(
    id: string,
    configuraciones: ConfiguracionesLegacyXml,
  ): TransicionConfig | undefined {
    return (
      configuraciones.transicionConfigs[id] ??
      configuraciones.transicionConfigs[this.normalizarId(id)]
    );
  }

  private construirIndiceNodos(documentXml: Document): Map<string, Element> {
    const nodosPorId = new Map<string, Element>();

    for (const tagName of TAGS_FLUJO_LEGACY) {
      for (const nodo of Array.from(documentXml.getElementsByTagName(tagName))) {
        const id = nodo.getAttribute('id');

        if (id !== null && id !== '') {
          nodosPorId.set(id, nodo);
        }
      }
    }

    return nodosPorId;
  }

  // ====== Proceso (cabecera y secciones) ======

  private aplicarConfiguracionProceso(
    documentXml: Document,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    const processDefinition = documentXml.documentElement;

    if (!processDefinition || processDefinition.tagName !== 'process-definition') {
      return;
    }

    const form = configuraciones.form;
    processDefinition.setAttribute('name', form.nombre.trim());
    processDefinition.setAttribute('privado', String(form.visibilidad === 'privado'));
    processDefinition.setAttribute('compartido', String(form.visibilidad === 'publico'));
    processDefinition.setAttribute('family', form.familiaProceso ?? '-1');
    processDefinition.setAttribute(
      'duration',
      `${form.duracionValor ?? 0} ${form.duracionUnidad ?? 'minutos'}`,
    );
    processDefinition.setAttribute('publicaEnCatalogo', String(form.publicaEnCatalogo));
    processDefinition.setAttribute('expedienteElectronico', String(form.creaExpedienteElectronico));

    const responsables = processDefinition.getElementsByTagName('responsables')[0];
    if (responsables) {
      this.reemplazarHijos(responsables, () =>
        form.responsables.map((id) => {
          const cargo = documentXml.createElement('cargo');
          cargo.setAttribute('id', id);
          return cargo;
        }),
      );
    }

    const catalogos = processDefinition.getElementsByTagName('catalogos')[0];
    if (catalogos) {
      this.reemplazarHijos(catalogos, () =>
        form.catalogosPublicacion.map((id) => {
          const catalogo = documentXml.createElement('catalogo');
          catalogo.setAttribute('idCatalogo', id);
          return catalogo;
        }),
      );
    }

    const mecanismo = processDefinition.getElementsByTagName('mecanismoDenominacion')[0];
    if (mecanismo) {
      mecanismo.setAttribute('idMecanismoDenominacion', form.mecanismoDenominacion ?? '-1');
      this.reemplazarHijos(mecanismo, () =>
        this.buildDatosProcesoMecanismo(documentXml, configuraciones),
      );
    }

    const documentosComunes =
      processDefinition.getElementsByTagName('documentosComunesProceso')[0];
    const formularios = configuraciones.formulariosProceso;

    if (documentosComunes && formularios.length > 0) {
      this.reemplazarHijos(documentosComunes, () =>
        formularios.map((formulario) =>
          this.buildDocumentoComunProceso(documentXml, {
            nombre: formulario.nombre,
            nombreDocumento: formulario.nombreDocumento ?? formulario.nombre,
            privado: formulario.visibilidad === 'privado',
            compartido: this.esCompartido(formulario),
            docComunId: formulario.docComunId ?? null,
          }, formulario.idFormulario),
        ),
      );
    }

    const hayDocumentos =
      formularios.length > 0 ||
      (documentosComunes?.getElementsByTagName('documentoComunProceso').length ?? 0) > 0;
    processDefinition.setAttribute('tieneDocumentosComunes', String(hayDocumentos));
  }

  private buildDatosProcesoMecanismo(
    documentXml: Document,
    configuraciones: ConfiguracionesLegacyXml,
  ): Element[] {
    const datos: Element[] = [];
    const mecanismo = configuraciones.mecanismo;

    if (!mecanismo) {
      return datos;
    }

    for (const datoRequerido of mecanismo.datos_requeridos) {
      if (datoRequerido.id_dato_mecanismo !== 'var') {
        continue;
      }

      const seleccion: ConfigDatoSelection | undefined =
        configuraciones.configDatoSelections[datoRequerido.id_dato_req_mecanismo];

      if (!seleccion || seleccion.tipo === '') {
        continue;
      }

      const dato = documentXml.createElement('datoProcesoMecanismo');
      dato.setAttribute(
        'idDatoDisponibleProceso',
        TIPO_TO_DATO_DISPONIBLE[seleccion.tipo] ?? '',
      );
      dato.setAttribute('idDatoReqMecanismo', String(datoRequerido.id_dato_req_mecanismo));
      dato.setAttribute('valorTextoFijo', seleccion.tipo === 'texto_fijo' ? (seleccion.valor ?? '') : '');
      dato.setAttribute('nombreSecuencia', seleccion.tipo === 'correlativo' ? (seleccion.secuencia ?? '') : '');
      dato.setAttribute('nombreDocumentoComun', '');
      dato.setAttribute('codigoBloque', seleccion.codigoBloque ?? '');
      dato.setAttribute('idDocumentoComun', '-1');
      dato.setAttribute('idMetadato', '-1');
      dato.setAttribute('idBloque', '-1');
      dato.setAttribute('idDocumento', '-1');

      if (seleccion.tipo === 'metadato_formulario') {
        const idDocumento = Number(seleccion.documento ?? '-1');
        const clave = seleccion.codigoBloque
          ? `${seleccion.codigoBloque}-${seleccion.metadato}`
          : String(seleccion.metadato ?? '');
        const detalle = idDocumento > 0 ? configuraciones.resolverMetadato(idDocumento, clave) : null;
        const documento = idDocumento > 0 ? configuraciones.resolverDocumento(idDocumento) : null;

        dato.setAttribute(
          'nombreDocumentoComun',
          documento?.nombre ?? documento?.nombreDocumento ?? '',
        );
        dato.setAttribute('codigoBloque', detalle?.codigoBloque ?? seleccion.codigoBloque ?? '');
        dato.setAttribute('idDocumentoComun', String(documento?.docComunId ?? -1));
        dato.setAttribute(
          'idMetadato',
          String(detalle?.idMetadato ?? Number(seleccion.metadato ?? '-1')),
        );
        dato.setAttribute('idBloque', String(detalle?.idBloque ?? -1));
        dato.setAttribute('idDocumento', String(idDocumento));
      }

      datos.push(dato);
    }

    return datos;
  }

  // ====== task-node ======

  private aplicarConfiguracionTarea(
    elemento: Element,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    const config = this.buscarTareaConfig(elemento.getAttribute('id') ?? '', configuraciones);

    if (!config) {
      return;
    }

    const documentXml = elemento.ownerDocument;
    const seleccion = config.formularioRequeridoSeleccionado;
    const tieneDocumentos = seleccion !== null && seleccion.idFormulario !== 0;
    elemento.setAttribute('tieneDocumentosComunes', String(tieneDocumentos));

    let task = elemento.getElementsByTagName('task')[0] ?? null;

    if (!task && documentXml) {
      task = documentXml.createElement('task');
      elemento.insertBefore(task, elemento.firstChild);
    }

    if (task) {
      task.setAttribute('validacionJerarquica', 'false');
      task.setAttribute('swimlane', config.cargo ?? '');
      task.setAttribute('tareaWeb', String(config.tareaWeb));
      task.setAttribute('imprimeFormulario', String(config.imprimirFormulario));
      task.setAttribute('tieneCheckPoint', String(config.checkpoint));
      task.setAttribute('comments', config.observaciones ?? '');
      task.setAttribute('utilizaAgenda', String(config.agenda));
      task.setAttribute('dispositivoMovil', String(config.dispositivoMovil));
      task.setAttribute('cualquierUsuario', 'false');
      task.setAttribute('automatica', String(config.tipoEjecucion === 'automatica'));
      task.setAttribute('consecutiva', String(config.tipoEjecucion === 'consecutiva'));
      task.setAttribute('conservarVistosBuenos', String(config.conservarVistosBuenos));
      task.setAttribute('etapaOrden', '0');
      task.setAttribute('minimoEjecutores', '0');
      task.setAttribute('porcentajeAvance', '0');
      task.setAttribute('nombreCheckPoint', task.getAttribute('nombreCheckPoint') ?? '');
      task.setAttribute('tieneNotificacion', String(config.notificarViaEmail));
      task.setAttribute(
        'duration',
        `${config.duracionValor ?? 0} ${config.duracionUnidad ?? 'minutos'}`,
      );
    }

    this.reemplazarHijosEtiquetas(elemento, ['documentoComunActividad'], () =>
      seleccion === null || seleccion.idFormulario === 0
        ? []
        : [this.buildDocumentoComunActividad(documentXml, configuraciones, seleccion)],
    );
    this.aplicarFunctionality(elemento, config.ejecutaFuncionalidad, config.funcionalidad);
  }

  private buildDocumentoComunActividad(
    documentXml: Document,
    configuraciones: ConfiguracionesLegacyXml,
    seleccion: NonNullable<TareaConfig['formularioRequeridoSeleccionado']>,
  ): Element {
    const contenedor = documentXml.createElement('documentoComunActividad');
    contenedor.setAttribute('idActividad', '-1');
    contenedor.setAttribute(
      'tieneMetadatosTransferidos',
      String((seleccion.metadatosTransferidos ?? []).length > 0),
    );

    const documento = configuraciones.resolverDocumento(seleccion.idFormulario);
    contenedor.appendChild(
      this.buildDocumentoComunProceso(
        documentXml,
        {
          nombre: seleccion.nombre,
          nombreDocumento:
            documento?.nombreDocumento ?? seleccion.nombreDocumento ?? seleccion.nombre,
          privado: documento?.privado ?? seleccion.visibilidad === 'privado',
          compartido: documento?.compartido ?? false,
          docComunId: documento?.docComunId ?? null,
        },
        seleccion.idFormulario,
      ),
    );

    const metadatosDisponibles = documentXml.createElement('metadatosDisponibles');
    for (const clave of seleccion.metadatosSeleccionados) {
      metadatosDisponibles.appendChild(
        this.buildBloqueMetadatoRequerido(
          documentXml,
          'bloqueMetadatoRequerido',
          configuraciones,
          seleccion.idFormulario,
          clave,
        ),
      );
    }
    contenedor.appendChild(metadatosDisponibles);

    const metadatosTransferidos = documentXml.createElement('metadatosTransferidos');
    for (const traspaso of seleccion.metadatosTransferidos ?? []) {
      metadatosTransferidos.appendChild(
        this.buildMetadatoTransferido(documentXml, configuraciones, traspaso),
      );
    }
    contenedor.appendChild(metadatosTransferidos);

    return contenedor;
  }

  // ====== decision ======

  private aplicarConfiguracionDecision(
    elemento: Element,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    const config = this.buscarDecisionConfig(elemento.getAttribute('id') ?? '', configuraciones);

    if (!config) {
      return;
    }

    elemento.setAttribute('swimlane', config.cargo ?? '');
    elemento.setAttribute('idTipoElementoRequerido', 'documento');
    elemento.setAttribute('dispositivoMovil', String(config.dispositivoMovil));
    elemento.setAttribute('tieneNotificacion', String(config.notificarViaEmail));
    elemento.setAttribute('automatica', String(config.tipoEjecucion === 'automatica'));
    elemento.setAttribute('consecutiva', String(config.tipoEjecucion === 'consecutiva'));
    elemento.setAttribute(
      'duration',
      `${config.duracionValor ?? 0} ${config.duracionUnidad ?? 'minutos'}`,
    );

    const tieneDocumentos = config.documento !== null && config.documento !== 0;
    elemento.setAttribute('tieneDocumentosComunes', String(tieneDocumentos));

    this.aplicarFunctionality(elemento, config.ejecutaFuncionalidad, config.funcionalidad);

    this.reemplazarHijosEtiquetas(elemento, ['documentoComunActividad'], () => {
      if (config.documento === null || config.documento === 0) {
        return [];
      }

      const documento = configuraciones.resolverDocumento(config.documento);
      const contenedor = elemento.ownerDocument.createElement('documentoComunActividad');
      contenedor.setAttribute('idActividad', '-1');
      contenedor.appendChild(
        this.buildDocumentoComunProceso(
          elemento.ownerDocument,
          {
            nombre: documento?.nombre ?? '',
            nombreDocumento: documento?.nombreDocumento ?? documento?.nombre ?? '',
            privado: documento?.privado ?? false,
            compartido: documento?.compartido ?? false,
            docComunId: documento?.docComunId ?? null,
          },
          config.documento,
        ),
      );

      contenedor.appendChild(elemento.ownerDocument.createElement('metadatosDisponibles'));

      const reglaMulti = elemento.ownerDocument.createElement('reglaMultiFormulario');
      reglaMulti.setAttribute('idBloqueRegla', '0');
      reglaMulti.setAttribute('nombreDocumentoProcesoRegla', '');
      reglaMulti.setAttribute('idMetadatoRegla', '0');
      reglaMulti.setAttribute('valorRegla', '');
      reglaMulti.setAttribute('idDocumentoComunProcesoRegla', '-1');
      reglaMulti.setAttribute('idDocumentoRegla', '-1');
      contenedor.appendChild(reglaMulti);

      return [contenedor];
    });
  }

  // ====== mensaje ======

  private aplicarConfiguracionMensaje(
    elemento: Element,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    const config = this.buscarMensajeConfig(elemento.getAttribute('id') ?? '', configuraciones);

    if (!config) {
      return;
    }

    elemento.setAttribute('subject', config.asunto ?? '');
    elemento.setAttribute('content', config.contenido ?? '');
    elemento.setAttribute('encabezado', String(config.encabezadoInfoProceso));
    elemento.setAttribute('enviarUsuariosDelCargo', String(config.enviarACargo));
    elemento.setAttribute(
      'enviaFormularioExterno',
      String(config.completarFormulario === 'externo'),
    );
    elemento.setAttribute('conCopia', String(mensajeDestinoConfigurado(config.destinatariosCc)));

    for (const etiqueta of ['metadatosMensaje', 'metadatosMensajeCc'] as const) {
      const contenedor = elemento.getElementsByTagName(etiqueta)[0] ?? null;

      if (contenedor) {
        this.reemplazarHijos(contenedor, () => []);
      } else {
        elemento.appendChild(elemento.ownerDocument.createElement(etiqueta));
      }
    }
  }

  // ====== timer (nodo) ======

  private aplicarConfiguracionTimerNodo(
    elemento: Element,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    const config = this.buscarTimerConfig(elemento.getAttribute('id') ?? '', configuraciones);

    if (!config) {
      return;
    }

    this.aplicarAtributosTimer(elemento, config, configuraciones);
  }

  private aplicarAtributosTimer(
    destino: Element,
    timer: TimerConfig,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    if (timer.modo === 'metadatoFormulario') {
      const detalle =
        timer.idDocumento !== null && timer.idMetadato !== null
          ? configuraciones.resolverMetadato(timer.idDocumento, timer.idMetadato)
          : null;
      const documento = timer.idDocumento !== null ? configuraciones.resolverDocumento(timer.idDocumento) : null;

      destino.setAttribute('esTiempo', 'false');
      destino.setAttribute('esMetFormulario', 'true');
      destino.setAttribute(
        'idMetadato',
        String(detalle?.idMetadato ?? this.parsearIdMetadatoDeClave(timer.idMetadato ?? '')),
      );
      destino.setAttribute('idBloque', String(detalle?.idBloque ?? ''));
      destino.setAttribute('nombreDocComunProceso', documento?.nombreDocumento ?? documento?.nombre ?? '');
      destino.setAttribute('nombreProceso', documento?.nombre ?? '');
      destino.setAttribute('datoFijo', '0');
      destino.setAttribute('idUnidadTiempo', '');
      destino.setAttribute('hora', '');
      destino.setAttribute('fecha', '');
      return;
    }

    destino.setAttribute('esTiempo', 'true');
    destino.setAttribute('esMetFormulario', 'false');
    destino.setAttribute('idMetadato', '');
    destino.setAttribute('idBloque', '');
    destino.setAttribute('nombreDocComunProceso', '');
    destino.setAttribute('nombreProceso', '');
    destino.setAttribute('datoFijo', String(timer.duracionValor ?? '0'));
    destino.setAttribute('idUnidadTiempo', timer.duracionUnidad ?? '');
    destino.setAttribute('hora', timer.hora ?? '');
    destino.setAttribute('fecha', timer.fecha ?? '');
  }

  // ====== transiciones ======

  private aplicarConfiguracionTransicion(
    transitionElement: Element,
    configuraciones: ConfiguracionesLegacyXml,
  ): void {
    const config = this.buscarTransicionConfig(
      transitionElement.getAttribute('id') ?? '',
      configuraciones,
    );

    if (!config) {
      return;
    }

    const documentXml = transitionElement.ownerDocument;

    transitionElement.setAttribute('esTimer', String(config.requiereTimer));
    transitionElement.setAttribute('interrupcion', String(config.interrupcion));
    transitionElement.setAttribute('accionTransicion', config.accion ?? '');
    transitionElement.setAttribute(
      'nombreAccionTransicion',
      config.accion !== null ? this.labelDeAccion(config.accion) : '',
    );
    transitionElement.setAttribute('levantaFormulario', 'false');

    if (transitionElement.getAttribute('divisiones') === null) {
      transitionElement.setAttribute('divisiones', '1');
    }

    this.reemplazarHijosEtiquetas(transitionElement, ['timerTransicion'], () => {
      if (!config.requiereTimer) {
        return [];
      }

      const timer = documentXml.createElement('timerTransicion');
      timer.setAttribute('id', 'TIMER');
      timer.setAttribute('name', '');
      this.aplicarAtributosTimer(timer, config.timer, configuraciones);
      return [timer];
    });

    this.reemplazarHijosEtiquetas(transitionElement, ['reglanegocio'], () =>
      config.reglasNegocio.map((regla) =>
        this.buildReglaNegocio(documentXml, configuraciones, regla),
      ),
    );

    this.reemplazarHijosEtiquetas(transitionElement, ['reglausuario'], () =>
      config.reglasUsuario.map((regla) =>
        this.buildReglaUsuario(documentXml, configuraciones, regla),
      ),
    );
  }

  private buildReglaNegocio(
    documentXml: Document,
    configuraciones: ConfiguracionesLegacyXml,
    regla: TransicionReglaNegocio,
  ): Element {
    const el = documentXml.createElement('reglanegocio');
    const detalleIzq = this.resolverDetalleRegla(configuraciones, regla.idDocumento, regla.idMetadato);
    const documentoIzq = regla.idDocumento !== null ? configuraciones.resolverDocumento(regla.idDocumento) : null;

    el.setAttribute('bloqIzq', String(detalleIzq?.idBloque ?? ''));
    el.setAttribute('codigoBloqIzq', detalleIzq?.codigoBloque ?? '');
    el.setAttribute('nombreDocComunIzq', documentoIzq?.nombre ?? '');
    el.setAttribute('nombreProcesoIzq', documentoIzq?.nombreDocumento ?? '');
    el.setAttribute(
      'metIzq',
      String(detalleIzq?.idMetadato ?? this.parsearIdMetadatoDeClave(regla.idMetadato ?? '')),
    );
    el.setAttribute('idTipoDato', detalleIzq?.tipo ?? '');
    el.setAttribute(
      'operador',
      this.codigoOperadorLegacy(regla.operador, detalleIzq?.tipo ?? null),
    );
    el.setAttribute('reqDoc', 'false');

    if (regla.fuenteValor === 'otroMetadato') {
      const detalleDer = this.resolverDetalleRegla(
        configuraciones,
        regla.idDocumentoValor,
        regla.idMetadatoValor ?? null,
      );
      const documentoDer =
        regla.idDocumentoValor !== null ? configuraciones.resolverDocumento(regla.idDocumentoValor) : null;

      el.setAttribute('docDer', String(regla.idDocumentoValor ?? ''));
      el.setAttribute('nombreProcesoDer', documentoDer?.nombreDocumento ?? '');
      el.setAttribute('bloqDer', String(detalleDer?.idBloque ?? ''));
      el.setAttribute('metDer', String(detalleDer?.idMetadato ?? ''));
      el.setAttribute('codigoBloqDer', detalleDer?.codigoBloque ?? '');
      el.setAttribute('valor', '');
      return el;
    }

    el.setAttribute('docDer', '');
    el.setAttribute('nombreProcesoDer', '');
    el.setAttribute('bloqDer', '');
    el.setAttribute('metDer', '');
    el.setAttribute('codigoBloqDer', '');
    el.setAttribute('valor', regla.valorTexto ?? '');

    return el;
  }

  private buildReglaUsuario(
    documentXml: Document,
    configuraciones: ConfiguracionesLegacyXml,
    regla: TransicionReglaUsuario,
  ): Element {
    const el = documentXml.createElement('reglausuario');
    const detalleIzq = this.resolverDetalleRegla(configuraciones, regla.idDocumento, regla.idMetadato);
    const documentoIzq = regla.idDocumento !== null ? configuraciones.resolverDocumento(regla.idDocumento) : null;

    el.setAttribute('campoValor2', 'false');
    el.setAttribute('bloqIzq', String(detalleIzq?.idBloque ?? ''));
    el.setAttribute('codigoBloqIzq', detalleIzq?.codigoBloque ?? '');
    el.setAttribute('metIzq', String(detalleIzq?.idMetadato ?? ''));
    el.setAttribute('nombreDocComunIzq', documentoIzq?.nombre ?? '');
    el.setAttribute('nombreProcesoIzq', documentoIzq?.nombreDocumento ?? '');
    el.setAttribute(
      'rolDer',
      regla.idCargo !== undefined && regla.idCargo !== null ? String(regla.idCargo) : '',
    );
    el.setAttribute('metDer', regla.idMetadatoValor ? String(this.parsearIdMetadatoDeClave(regla.idMetadatoValor)) : '');
    el.setAttribute('bloqDer', '');
    el.setAttribute(
      'codigoBloqDer',
      regla.idMetadatoValor ? (this.codigoBloqueDeClave(regla.idMetadatoValor) ?? '') : '',
    );

    return el;
  }

  // ====== documentos comunes ======

  private buildDocumentoComunProceso(
    documentXml: Document,
    info: DocumentoComunProcesoInfo,
    idDocumento: number,
  ): Element {
    const el = documentXml.createElement('documentoComunProceso');
    el.setAttribute('idDocumentoComunProceso', String(info.docComunId ?? -1));
    el.setAttribute('compartido', String(info.compartido));
    el.setAttribute('nombreDocumentoProceso', info.nombre);
    el.setAttribute('nombreDocumento', info.nombreDocumento);
    el.setAttribute('privado', String(info.privado));
    el.setAttribute('idDocumento', String(idDocumento));

    const compartir = documentXml.createElement('Compartir');
    for (const etiqueta of ['Usuarios', 'Roles', 'Grupos'] as const) {
      compartir.appendChild(documentXml.createElement(etiqueta));
    }
    el.appendChild(compartir);

    return el;
  }

  private buildBloqueMetadatoRequerido(
    documentXml: Document,
    etiquetaContenedor: 'bloqueMetadatoRequerido' | 'bloqueMetadatoRequeridoOrigen' | 'bloqueMetadatoRequeridoDestino',
    configuraciones: ConfiguracionesLegacyXml,
    idDocumento: number,
    clave: string,
  ): Element {
    const detalle = configuraciones.resolverMetadato(idDocumento, clave);
    const contenedor = documentXml.createElement(etiquetaContenedor);

    const metadatoRequerido = documentXml.createElement('metadatoRequerido');
    metadatoRequerido.setAttribute('nombreMetadato', detalle?.nombreMetadato ?? '');
    metadatoRequerido.setAttribute('esGrilla', String(detalle?.esGrilla ?? false));
    metadatoRequerido.setAttribute(
      'idMetadato',
      String(detalle?.idMetadato ?? this.parsearIdMetadatoDeClave(clave)),
    );
    metadatoRequerido.setAttribute('idTipoDato', detalle?.tipo ?? '');
    contenedor.appendChild(metadatoRequerido);

    const bloque = documentXml.createElement('bloqueMetadato');
    bloque.setAttribute('nombreBloque', detalle?.nombreBloque ?? '');
    bloque.setAttribute('idBloque', String(detalle?.idBloque ?? -1));
    bloque.setAttribute('codigoBloque', detalle?.codigoBloque ?? (this.codigoBloqueDeClave(clave) ?? ''));
    contenedor.appendChild(bloque);

    return contenedor;
  }

  private buildMetadatoTransferido(
    documentXml: Document,
    configuraciones: ConfiguracionesLegacyXml,
    traspaso: MetadatoTransferidoConfig,
  ): Element {
    const el = documentXml.createElement('metadatoTransferido');
    const documentoOrigen = configuraciones.resolverDocumento(traspaso.origen.idFormulario);
    const documentoDestino = configuraciones.resolverDocumento(traspaso.destino.idFormulario);

    el.appendChild(
      this.buildDocumentoComunProceso(
        documentXml,
        {
          nombre: traspaso.origen.nombreFormulario,
          nombreDocumento:
            documentoOrigen?.nombreDocumento ?? documentoOrigen?.nombre ?? traspaso.origen.nombreFormulario,
          privado: documentoOrigen?.privado ?? false,
          compartido: documentoOrigen?.compartido ?? false,
          docComunId: documentoOrigen?.docComunId ?? null,
        },
        traspaso.origen.idFormulario,
      ),
    );

    el.appendChild(
      this.buildBloqueDesdeDetalle(
        documentXml,
        'bloqueMetadatoRequeridoOrigen',
        configuraciones,
        traspaso.origen,
      ),
    );
    el.appendChild(
      this.buildBloqueDesdeDetalle(
        documentXml,
        'bloqueMetadatoRequeridoDestino',
        configuraciones,
        traspaso.destino,
      ),
    );

    return el;
  }

  private buildBloqueDesdeDetalle(
    documentXml: Document,
    etiquetaContenedor: 'bloqueMetadatoRequeridoOrigen' | 'bloqueMetadatoRequeridoDestino',
    configuraciones: ConfiguracionesLegacyXml,
    detalle: MetadatoTransferidoConfig['origen'],
  ): Element {
    const contenedor = documentXml.createElement(etiquetaContenedor);
    const resuelto = configuraciones.resolverMetadato(detalle.idFormulario, detalle.clave);

    const metadatoRequerido = documentXml.createElement('metadatoRequerido');
    metadatoRequerido.setAttribute('nombreMetadato', detalle.nombreMetadato);
    metadatoRequerido.setAttribute('esGrilla', String(detalle.esGrilla));
    metadatoRequerido.setAttribute('idMetadato', String(detalle.idMetadato));
    metadatoRequerido.setAttribute('idTipoDato', detalle.tipoMetadato ?? '');
    contenedor.appendChild(metadatoRequerido);

    const bloque = documentXml.createElement('bloqueMetadato');
    bloque.setAttribute('nombreBloque', detalle.nombreBloque ?? '');
    bloque.setAttribute('idBloque', String(resuelto?.idBloque ?? -1));
    bloque.setAttribute('codigoBloque', detalle.codigoBloque ?? resuelto?.codigoBloque ?? '');
    contenedor.appendChild(bloque);

    return contenedor;
  }

  // ====== utilidades ======

  private aplicarFunctionality(
    elemento: Element,
    ejecutaFuncionalidad: boolean,
    funcionalidad: string | null,
  ): void {
    const nombre = ejecutaFuncionalidad && funcionalidad !== null ? funcionalidad : null;

    this.reemplazarHijosEtiquetas(elemento, ['functionality'], () => {
      if (nombre === null) {
        return [];
      }

      const functionality = elemento.ownerDocument.createElement('functionality');
      functionality.setAttribute('name', nombre);
      return [functionality];
    });
  }

  private esCompartido(formulario: {
    readonly compartido?: {
      readonly usuario: readonly unknown[];
      readonly cargo: readonly unknown[];
      readonly grupo: readonly unknown[];
    };
  }): boolean {
    return (
      (formulario.compartido?.usuario.length ?? 0) > 0 ||
      (formulario.compartido?.cargo.length ?? 0) > 0 ||
      (formulario.compartido?.grupo.length ?? 0) > 0
    );
  }

  private labelDeAccion(accion: string): string {
    return TRANSICION_ACCION_OPTIONS.find((opcion) => opcion.value === accion)?.label ?? accion;
  }

  private codigoOperadorLegacy(operador: string, tipoMetadato: string | null): string {
    const candidatas = TRANSICION_OPERADOR_REGLAS.filter((regla) => regla.operador === operador);
    const porTipo = tipoMetadato !== null ? candidatas.find((regla) => regla.tipo === tipoMetadato) : undefined;

    return (porTipo ?? candidatas[0])?.idOperadorRegla ?? operador;
  }

  private resolverDetalleRegla(
    configuraciones: ConfiguracionesLegacyXml,
    idDocumento: number | null,
    clave: string | null,
  ): DetalleMetadatoLegacy | null {
    if (idDocumento === null || clave === null || clave.trim() === '') {
      return null;
    }

    return configuraciones.resolverMetadato(idDocumento, clave);
  }

  private parsearIdMetadatoDeClave(clave: string): number {
    return Number(clave.split('-').pop());
  }

  private codigoBloqueDeClave(clave: string): string | null {
    const indiceSeparador = clave.lastIndexOf('-');

    return indiceSeparador > 0 ? clave.slice(0, indiceSeparador) : null;
  }

  private reemplazarHijos(parent: Element, proveedor: () => Element[]): void {
    for (const hijo of Array.from(parent.children)) {
      parent.removeChild(hijo);
    }

    for (const nuevo of proveedor()) {
      parent.appendChild(nuevo);
    }
  }

  private reemplazarHijosEtiquetas(
    parent: Element,
    etiquetas: readonly string[],
    proveedor: () => Element[],
  ): void {
    const conjunto = new Set(etiquetas);

    for (const hijo of Array.from(parent.children)) {
      if (conjunto.has(hijo.tagName)) {
        parent.removeChild(hijo);
      }
    }

    for (const nuevo of proveedor()) {
      parent.appendChild(nuevo);
    }
  }
}
