import { Injectable } from '@angular/core';
import {
  ActividadRequest,
  ActividadWrapperRequest,
  BloqueMetadatoRequeridoRequest,
  CargoResponsableRequest,
  ColumnaGrillaMensajeRequest,
  CrearProcesoRequest,
  DatoRequeridoProcesoDatoRequest,
  DatoRequeridoProcesoMetadatoRequest,
  DatoRequeridoProcesoRequest,
  DestinatarioMetadatoMensajeRequest,
  DocumentoComunActividadWrapperRequest,
  DocumentoComunProcesoWrapperRequest,
  MensajeActividadRequest,
  MetadatoTransferidoRequest,
  ProcesoActivityTypeId,
  ProcesoMecanismoRequest,
  ProcesoRequest,
  ReglaNegocioRequest,
  ReglaUsuarioRequest,
  TimerTransicionRequest,
  TransicionWrapperRequest,
} from '../models/crear-proceso-request.model';
import { DecisionConfig } from '../models/decision-config.model';
import { ConfigDatoSelection, MecanismoProceso, ProcesoCompartido } from '../models/diagrama.model';
import {
  MensajeConfig,
  MensajeReferenciaPar,
  mensajeDestinoConfigurado,
} from '../models/mensaje-config.model';
import { TimerConfig } from '../models/timer-config.model';
import {
  TransicionConfig,
  TransicionReglaNegocio,
  TransicionReglaUsuario,
  TRANSICION_OPERADOR_REGLAS,
} from '../models/transicion-config.model';
import {
  FormularioProcesoConfig,
  FormularioRequeridoSeleccion,
  MetadatoTransferidoDetalle,
  TareaConfig,
} from '../models/tarea-config.model';

export interface OpcionMetadatoResuelta {
  readonly idMetadato: number;
  readonly idBloque: number | null;
  readonly codigoBloque: string | null;
  readonly tipo: string | null;
  readonly esGrilla?: boolean;
  readonly columnasGrilla?: readonly ColumnaGrillaMensajeRequest[];
}

export interface OpcionDocumentoProceso {
  readonly label: string;
  readonly value: string;
}

const PROCEDENCIA_DIAGRAMA = 'diagrama';

export interface CrearProcesoRequestExtras {
  readonly mecanismo?: MecanismoProceso | null;
  readonly configDatoSelections?: Record<number, ConfigDatoSelection>;
  readonly procesoCompartido?: ProcesoCompartido | null;
  readonly transicionConfigs?: Record<string, TransicionConfig>;
  readonly decisionConfigs?: Record<string, DecisionConfig>;
  readonly timerConfigs?: Record<string, TimerConfig>;
  readonly mensajeConfigs?: Record<string, MensajeConfig>;
  readonly resolverMetadato?: (
    idDocumento: number,
    clave: string,
  ) => OpcionMetadatoResuelta | null;
  readonly resolverMetadatoRol?: (
    idRol: number | null,
    idMetadato: number | null,
  ) => OpcionMetadatoResuelta | null;
  readonly documentosProceso?: readonly OpcionDocumentoProceso[];
  readonly idPadre?: number | null;
}

export interface CrearProcesoFormSource {
  readonly nombre: string;
  readonly responsables: readonly string[];
  readonly duracionValor: number | null;
  readonly duracionUnidad: 'minutos' | 'horas' | 'dias' | null;
  readonly familiaProceso: string | null;
  readonly visibilidad: 'privado' | 'publico';
  readonly mecanismoDenominacion: string | null;
  readonly observaciones: string;
  readonly creaExpedienteElectronico: boolean;
  readonly publicaEnCatalogo: boolean;
  readonly catalogosPublicacion: readonly string[];
  readonly aplicaJornadaLaboral: boolean;
  readonly jornada: string | null;
  readonly calendario: string | null;
}

const LEGACY_FLOW_TAGS = [
  'start-state',
  'task-node',
  'decision',
  'regla-negocio',
  'mensaje',
  'timer',
  'enlace-paralelo',
  'end-state',
  'terminate-state',
] as const;

const ACTIVITY_TYPE_BY_TAG: Record<string, ProcesoActivityTypeId> = {
  'start-state': 'inicio',
  'task-node': 'tarea',
  decision: 'decision',
  'regla-negocio': 'reglaNegocio',
  mensaje: 'mensaje',
  timer: 'timer',
  'enlace-paralelo': 'enlaceParalelo',
  'end-state': 'finalizado',
  'terminate-state': 'finalizado',
};

const TIPO_TO_DATO_DISPONIBLE: Record<string, string> = {
  texto_fijo: 'txf',
  metadato_formulario: 'met',
  correlativo: 'cor',
  nombre_proceso: 'npr',
};

@Injectable({ providedIn: 'root' })
export class CrearProcesoRequestBuilder {
  buildLegacyTemplateXml(form: CrearProcesoFormSource, usuarioCreador: string): string {
    const nombre = this.escapeXmlAttribute(form.nombre.trim());
    const familia = form.familiaProceso !== null ? form.familiaProceso : '-1';
    const duracion = `${form.duracionValor ?? 0} ${form.duracionUnidad ?? 'minutos'}`;
    const privado = form.visibilidad === 'privado';
    const compartido = form.visibilidad === 'publico';
    const mecanismo = form.mecanismoDenominacion !== null ? form.mecanismoDenominacion : '-1';

    const cargos = form.responsables
      .map((id) => `<cargo id="${this.escapeXmlAttribute(id)}" />`)
      .join('');
    const catalogos = form.catalogosPublicacion
      .map((id) => `<catalogo idCatalogo="${this.escapeXmlAttribute(id)}" />`)
      .join('');

    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      `<process-definition swimlane="1" idDocumentoPublicar="-1" workingschedule="-1" ` +
      `compartido="${compartido}" privado="${privado}" family="${this.escapeXmlAttribute(familia)}" ` +
      `comments="" version="1" idUsuarioCreador="${this.escapeXmlAttribute(usuarioCreador)}" ` +
      `publicaEnCatalogo="${form.publicaEnCatalogo}" tieneDocumentosComunes="false" ` +
      `name="${nombre}" duration="${this.escapeXmlAttribute(duracion)}" ` +
      `expedienteElectronico="${form.creaExpedienteElectronico}" processId="-1" workingtime="-1">` +
      `<documentosComunesProceso></documentosComunesProceso>` +
      `<responsables>${cargos}</responsables>` +
      `<mecanismoDenominacion idMecanismoDenominacion="${this.escapeXmlAttribute(mecanismo)}" />` +
      `<catalogos>${catalogos}</catalogos>` +
      `<Roles></Roles>` +
      `<SubProcesosAsociados></SubProcesosAsociados>` +
      `</process-definition>`
    );
  }

  buildRequest(
    form: CrearProcesoFormSource,
    liveXml: string,
    usuarioCreador: string,
    tareaConfigs?: Record<string, TareaConfig>,
    formulariosProceso?: readonly FormularioProcesoConfig[],
    extras?: CrearProcesoRequestExtras,
  ): CrearProcesoRequest {
    const parser = new DOMParser();
    const documentXml = parser.parseFromString(liveXml, 'text/xml');
    const processDefinition =
      documentXml.documentElement?.tagName === 'process-definition'
        ? documentXml.documentElement
        : documentXml.getElementsByTagName('process-definition')[0];

    const documentosComunes = this.parseDocumentosComunes(processDefinition, formulariosProceso);
    const cargosResponsables = this.parseCargosResponsables(processDefinition);
    const procesoMecanismo = this.parseProcesoMecanismo(
      processDefinition,
      formulariosProceso,
      extras,
    );
    const actividades = this.parseActividades(
      processDefinition,
      tareaConfigs,
      extras,
      formulariosProceso,
    );
    const transiciones = this.parseTransiciones(processDefinition, extras, formulariosProceso);

    const idDocumentoPublicar =
      documentosComunes.length > 0 ? documentosComunes[0].documentoComunProceso.idDocumento : -1;

    const procesoCompartido = extras?.procesoCompartido ?? null;

    const proceso: ProcesoRequest = {
      processId: null,
      processName: form.nombre.trim(),
      version: this.parseNumber(processDefinition?.getAttribute('version') ?? '1', 1),
      idPadre: extras?.idPadre ?? -1,
      esUltimaVersion: true,
      path: liveXml,
      processDesc: null,
      timeunitId: form.duracionUnidad ?? 'minutos',
      idUsuarioCreador: usuarioCreador,
      active: true,
      stageTotal: 0,
      responsibleId: null,
      creationDate: new Date().toISOString(),
      processTime: form.duracionValor ?? 0,
      observaciones: form.observaciones?.trim() ?? '',
      idJornada: form.aplicaJornadaLaboral && form.jornada !== null ? Number(form.jornada) : -1,
      idCalendario:
        form.aplicaJornadaLaboral && form.calendario !== null ? Number(form.calendario) : -1,
      idFamilia: form.familiaProceso !== null ? Number(form.familiaProceso) : -1,
      esInstanciable: true,
      visible: true,
      expedienteElectronico: form.creaExpedienteElectronico,
      tieneDocumentosComunes: documentosComunes.length > 0,
      agregadoCatalogoFormularios: form.publicaEnCatalogo,
      privado: form.visibilidad === 'privado',
      compartido: form.visibilidad === 'publico',
      desactualizado: false,
      bajaPrioridadGestion: null,
      distribucionRequerida: false,
    };

    return {
      proceso,
      permisosUsuarios: (procesoCompartido?.usuario ?? []).map((usuario) => usuario.id_usuario),
      permisosRoles: (procesoCompartido?.cargo ?? []).map((cargo) => cargo.id_rol),
      permisosGrupos: (procesoCompartido?.grupo ?? []).map((grupo) => grupo.id_grupo),
      rolesGenericosProceso: [],
      documentosComunes,
      cargosResponsables,
      procesoMecanismo,
      actividades,
      transiciones,
      publicaEnCatalogo: form.publicaEnCatalogo,
      idDocumentoPublicar,
      catalogos: form.catalogosPublicacion.map((id) => Number(id)),
    };
  }

  private parseDocumentosComunes(
    processDefinition: Element | undefined,
    formulariosProceso?: readonly FormularioProcesoConfig[],
  ): DocumentoComunProcesoWrapperRequest[] {
    if (formulariosProceso && formulariosProceso.length > 0) {
      return formulariosProceso.map((formulario) => ({
        documentoComunProceso: {
          docComunId: formulario.docComunId ?? null,
          idDocumento: formulario.idFormulario,
          processId: null,
          nombreDocComun: formulario.nombre,
          nombreDocumento: formulario.nombreDocumento ?? formulario.nombre,
          privado: formulario.visibilidad === 'privado',
          compartido:
            (formulario.compartido?.usuario.length ?? 0) > 0 ||
            (formulario.compartido?.cargo.length ?? 0) > 0 ||
            (formulario.compartido?.grupo.length ?? 0) > 0,
        },
        permisosUsuarios: (formulario.compartido?.usuario ?? []).map((id) => id),
        permisosRoles: (formulario.compartido?.cargo ?? []).map((id) => ({
          id_rol: Number(id),
        })),
        permisosGrupos: (formulario.compartido?.grupo ?? []).map((id) => ({
          id_grupo: Number(id),
        })),
      }));
    }

    if (!processDefinition) {
      return [];
    }

    const contenedor = processDefinition.getElementsByTagName('documentosComunesProceso')[0];
    if (!contenedor) {
      return [];
    }

    return Array.from(contenedor.getElementsByTagName('documentoComunProceso')).map((nodo) => ({
      documentoComunProceso: {
        docComunId: this.parsearNumeroOpcional(nodo.getAttribute('docComunId')),
        idDocumento: this.parseNumber(nodo.getAttribute('idDocumento') ?? '-1', -1),
        processId: null,
        nombreDocComun: nodo.getAttribute('nombreDocumentoProceso') ?? '',
        nombreDocumento:
          nodo.getAttribute('nombreDocumento') ??
          nodo.getAttribute('nombreDocumentoProceso') ??
          '',
        privado: nodo.getAttribute('privado') === 'true',
        compartido: nodo.getAttribute('compartido') === 'true',
      },
      permisosUsuarios: [],
      permisosRoles: [],
      permisosGrupos: [],
    }));
  }

  private parseCargosResponsables(processDefinition: Element | undefined): CargoResponsableRequest[] {
    if (!processDefinition) {
      return [];
    }

    const responsables = processDefinition.getElementsByTagName('responsables')[0];
    if (!responsables) {
      return [];
    }

    return Array.from(responsables.getElementsByTagName('cargo')).map((cargo) => ({
      idRol: this.parseNumber(cargo.getAttribute('id') ?? '-1', -1),
      condicionesVisibilidad: [],
    }));
  }

  private parseProcesoMecanismo(
    processDefinition: Element | undefined,
    formulariosProceso?: readonly FormularioProcesoConfig[],
    extras?: CrearProcesoRequestExtras,
  ): ProcesoMecanismoRequest {
    const mecanismo = processDefinition?.getElementsByTagName('mecanismoDenominacion')[0];
    let id = mecanismo
      ? this.parseNumber(mecanismo.getAttribute('idMecanismoDenominacion') ?? '-1', -1)
      : -1;

    if (id === -1 && extras?.mecanismo) {
      id = extras.mecanismo.id_mecanismo_denominacion;
    }

    return {
      idMecanismoDenominacion: id,
      datosRequeridos: this.buildDatosRequeridos(formulariosProceso, extras),
    };
  }

  private buildDatosRequeridos(
    formulariosProceso: readonly FormularioProcesoConfig[] | undefined,
    extras?: CrearProcesoRequestExtras,
  ): readonly DatoRequeridoProcesoRequest[] {
    const mecanismo = extras?.mecanismo;
    if (!mecanismo) {
      return [];
    }

    const selections = extras?.configDatoSelections ?? {};
    const resolver = extras?.resolverMetadato;
    const datos: DatoRequeridoProcesoRequest[] = [];

    for (const datoRequerido of mecanismo.datos_requeridos) {
      if (datoRequerido.id_dato_mecanismo !== 'var') {
        continue;
      }

      const seleccion = selections[datoRequerido.id_dato_req_mecanismo] ?? { tipo: '' };
      if (seleccion.tipo === '') {
        continue;
      }

      const esTextoFijo = seleccion.tipo === 'texto_fijo';
      const idDatoDisponible = TIPO_TO_DATO_DISPONIBLE[seleccion.tipo] ?? '';
      const dato: DatoRequeridoProcesoDatoRequest = {
        idDatoReqMecanismo: datoRequerido.id_dato_req_mecanismo,
        ...(esTextoFijo
          ? { idDatoDisponibleProceso: idDatoDisponible, valorTextoFijo: seleccion.valor ?? '' }
          : { idDatoDisponibleProceso: idDatoDisponible }),
      };

      let metadatoRequerido: DatoRequeridoProcesoMetadatoRequest | null = null;
      let nombreDocumentoComun: string | null = null;

      if (seleccion.tipo === 'metadato_formulario') {
        const idDocumento = Number(seleccion.documento ?? '-1');
        const idMetadato = Number(seleccion.metadato ?? '-1');
        const clave = this.claveMetadatoSeleccion(seleccion);
        const resuelto = idDocumento > 0 ? (resolver?.(idDocumento, clave) ?? null) : null;

        metadatoRequerido = {
          idDocumento,
          idMetadato,
          idBloque: resuelto?.idBloque ?? -1,
          codigoBloque: seleccion.codigoBloque ?? resuelto?.codigoBloque ?? '',
        };
        // El nombre que viaja es el contextual del formulario de proceso.
        nombreDocumentoComun =
          formulariosProceso?.find((f) => f.idFormulario === idDocumento)?.nombre ?? null;
      }

      datos.push({ dato, metadatoRequerido, nombreDocumentoComun });
    }

    return datos;
  }

  private claveMetadatoSeleccion(seleccion: ConfigDatoSelection): string {
    return seleccion.codigoBloque !== undefined && seleccion.codigoBloque !== ''
      ? `${seleccion.codigoBloque}-${seleccion.metadato}`
      : String(seleccion.metadato);
  }

  private parseActividades(
    processDefinition: Element | undefined,
    tareaConfigs?: Record<string, TareaConfig>,
    extras?: CrearProcesoRequestExtras,
    formulariosProceso?: readonly FormularioProcesoConfig[],
  ): ActividadWrapperRequest[] {
    if (!processDefinition) {
      return [];
    }

    const actividades: ActividadWrapperRequest[] = [];

    for (const tagName of LEGACY_FLOW_TAGS) {
      const nodos = Array.from(processDefinition.getElementsByTagName(tagName));

      for (const nodo of nodos) {
        const idElemento = nodo.getAttribute('id') ?? '';
        const activitytypeId = ACTIVITY_TYPE_BY_TAG[tagName] ?? 'tarea';
        const idElementoBpmn = this.normalizarId(idElemento);

        const configTarea = activitytypeId === 'tarea' ? this.buscarConfig(tareaConfigs, idElemento) : undefined;
        const decisionConfig =
          activitytypeId === 'decision' ? (extras?.decisionConfigs?.[idElementoBpmn] ?? null) : null;
        const timerConfig =
          activitytypeId === 'timer'
            ? (extras?.timerConfigs?.[idElemento] ??
              extras?.timerConfigs?.[idElementoBpmn] ??
              undefined)
            : undefined;
        const mensajeConfig =
          activitytypeId === 'mensaje'
            ? (extras?.mensajeConfigs?.[idElemento] ??
              extras?.mensajeConfigs?.[idElementoBpmn] ??
              undefined)
            : undefined;

        const actividad = this.construirActividad(nodo, activitytypeId, idElemento, configTarea, decisionConfig);

        const seleccionTarea = configTarea?.formularioRequeridoSeleccionado ?? null;
        const documentosComunesActividad =
          configTarea !== undefined
            ? this.buildDocumentosComunesActividad(seleccionTarea, extras)
            : activitytypeId === 'decision' && decisionConfig?.documento !== null && decisionConfig?.documento !== undefined
              ? this.buildDocumentosComunesActividadDecision(decisionConfig, extras, formulariosProceso)
              : this.parseDocumentosComunesActividad(nodo, extras);

        actividades.push({
          actividad,
          rolesGenericos: [],
          usuariosPreAsignados: (configTarea?.usuarios ?? []).map((usuario) => ({
            idUsuario: usuario,
            idProcedencia: PROCEDENCIA_DIAGRAMA,
          })),
          rolesPreAsignados: [],
          documentosComunesActividad,
          elementosRequeridos: [],
          idSubProceso: null,
          registroExterno: null,
          timer:
            activitytypeId === 'timer'
              ? timerConfig !== undefined
                ? this.buildTimerTransicion(timerConfig, extras)
                : this.parseTimerDelXml(nodo)
              : null,
          mensaje:
            activitytypeId === 'mensaje'
              ? mensajeConfig !== undefined
                ? this.buildMensajeActividad(mensajeConfig, extras, formulariosProceso)
                : this.parseMensajeDelXml(nodo)
              : null,
        });
      }
    }

    return actividades;
  }

  private buildMensajeActividad(
    config: MensajeConfig,
    extras?: CrearProcesoRequestExtras,
    formulariosProceso?: readonly FormularioProcesoConfig[],
  ): MensajeActividadRequest {
    const destinatariosMetadato = this.buildDestinatariosMetadatoMensaje(
      config.destinatarios.referencias,
      extras,
      formulariosProceso,
    );
    const destinatariosMetadatoCc = this.buildDestinatariosMetadatoMensaje(
      config.destinatariosCc.referencias,
      extras,
      formulariosProceso,
    );

    return {
      asunto: config.asunto,
      contenido: config.contenido,
      encabezado: config.encabezadoInfoProceso,
      cc: mensajeDestinoConfigurado(config.destinatariosCc),
      enviaACargo: config.enviarACargo,
      enviaFormularioExterno: config.completarFormulario === 'externo',
      usuariosSistema: [...config.destinatarios.usuariosSistema],
      usuariosSistemaCc: [...config.destinatariosCc.usuariosSistema],
      usuariosExternos: [...config.destinatarios.usuariosExternos],
      usuariosExternosCc: [...config.destinatariosCc.usuariosExternos],
      rolesSistema: [],
      destinatariosMetadato,
      destinatariosMetadatoCc,
      documentosFormulario: [],
      documentosAdjuntos: config.adjuntarPdfIds
        .map((idFormulario) =>
          this.nombreDocumentoAdjuntoDe(idFormulario, formulariosProceso, extras),
        )
        .filter((nombre) => nombre.trim() !== ''),
    };
  }

  private buildDestinatariosMetadatoMensaje(
    referencias: readonly MensajeReferenciaPar[],
    extras?: CrearProcesoRequestExtras,
    formulariosProceso?: readonly FormularioProcesoConfig[],
  ): DestinatarioMetadatoMensajeRequest[] {
    return referencias
      .filter(
        (referencia) =>
          referencia.idDocumento !== null &&
          referencia.idMetadato !== null &&
          referencia.idMetadato.trim() !== '',
      )
      .map((referencia) => {
        const idDocumento = referencia.idDocumento as number;
        const clave = referencia.idMetadato as string;
        const resuelto = extras?.resolverMetadato?.(idDocumento, clave) ?? null;

        return {
          nombreDocComun: this.nombreDocComunDe(idDocumento, formulariosProceso, extras),
          idMetadato: resuelto?.idMetadato ?? this.parseIdMetadatoDeClave(clave),
          idBloque: resuelto?.idBloque ?? null,
          ...(resuelto?.codigoBloque ? { codigoBloque: resuelto.codigoBloque } : {}),
          esGrilla: resuelto?.esGrilla ?? false,
          ...(resuelto?.esGrilla === true && resuelto.columnasGrilla
            ? { columnasGrilla: resuelto.columnasGrilla }
            : {}),
        };
      });
  }

  private nombreDocumentoAdjuntoDe(
    idFormulario: number,
    formulariosProceso?: readonly FormularioProcesoConfig[],
    extras?: CrearProcesoRequestExtras,
  ): string {
    const formulario = formulariosProceso?.find((f) => f.idFormulario === idFormulario);

    if (formulario) {
      return formulario.nombre || formulario.nombreDocumento || '';
    }

    return (
      extras?.documentosProceso?.find((opcion) => opcion.value === String(idFormulario))?.label ??
      ''
    );
  }

  /**
   * Recupera el mensaje guardado del XML legacy cuando no hay configuración en
   * la sesión (atributos del nodo <mensaje> escritos por el serializer).
   */
  private parseMensajeDelXml(nodo: Element): MensajeActividadRequest {
    return {
      asunto: nodo.getAttribute('subject') ?? '',
      contenido: nodo.getAttribute('content') ?? '',
      encabezado: nodo.getAttribute('encabezado') === 'true',
      cc: nodo.getAttribute('conCopia') === 'true',
      enviaACargo: nodo.getAttribute('enviarUsuariosDelCargo') === 'true',
      enviaFormularioExterno: nodo.getAttribute('enviaFormularioExterno') === 'true',
      usuariosSistema: [],
      usuariosSistemaCc: [],
      usuariosExternos: [],
      usuariosExternosCc: [],
      rolesSistema: [],
      destinatariosMetadato: [],
      destinatariosMetadatoCc: [],
      documentosFormulario: [],
      documentosAdjuntos: [],
    };
  }

  private buscarConfig(
    configs: Record<string, TareaConfig> | undefined,
    idElemento: string,
  ): TareaConfig | undefined {
    if (!configs) {
      return undefined;
    }

    return configs[idElemento] ?? configs[this.normalizarId(idElemento)];
  }

  private normalizarId(id: string): string {
    return id.replace(/ /g, '_');
  }

  private construirActividad(
    nodo: Element,
    activitytypeId: ProcesoActivityTypeId,
    idElemento: string,
    configTarea: TareaConfig | undefined,
    decisionConfig: DecisionConfig | null,
  ): ActividadRequest {
    const config =
      configTarea ??
      (decisionConfig !== null ? this.tareaConfigDesdeDecision(decisionConfig) : undefined);

    const overrides =
      config === undefined
        ? {}
        : {
            activityTime: config.duracionValor ?? 0,
            timeunitId: config.duracionUnidad ?? 'minutos',
            funcionality:
              config.ejecutaFuncionalidad && config.funcionalidad !== null
                ? config.funcionalidad
                : null,
            idRol: config.cargo !== null ? Number(config.cargo) : -1,
            idJornada:
              config.aplicarJornadaLaboral && config.jornada !== null ? Number(config.jornada) : -1,
            idCalendario:
              config.aplicarJornadaLaboral && config.calendario !== null
                ? Number(config.calendario)
                : -1,
            tieneDocumentosComunes:
              config.formularioRequeridoSeleccionado !== null &&
              config.formularioRequeridoSeleccionado.idFormulario !== 0,
            tieneCheckpoint: config.checkpoint,
            tieneAlertas: config.alertas,
            imprimeFormulario: config.imprimirFormulario,
            tareaWeb: config.tareaWeb,
            filtrarPorMetadato: config.filtrarUsuariosPorMetadatos,
            registrosExternos: config.agregarRegistrosExternos,
            tieneNotificacion: config.notificarViaEmail,
            consecutiva: config.tipoEjecucion === 'consecutiva',
            automatica: config.tipoEjecucion === 'automatica',
            conservarVistosBuenos: config.conservarVistosBuenos,
            utilizaAgenda: config.agenda,
            dispositivoMovil: config.dispositivoMovil,
          };

    return {
      activityId: null,
      activityName: nodo.getAttribute('name') ?? '',
      activitytypeId,
      priorityId: 3,
      activityDesc: null,
      activityTime: 0,
      timeunitId: 'minutos',
      stage: 0,
      processId: null,
      funcionality: null,
      cantidadDocumentos: 0,
      adjuntarDocumento: false,
      idJornada: 0,
      idCalendario: 0,
      idRol: -1,
      minimoEjecutores: 0,
      cualquierUsuario: false,
      idElemento,
      tieneDocumentosComunes: false,
      validacionJerarquica: false,
      tieneCheckpoint: false,
      nombreCheckpoint: '',
      porcentajeAvance: 0,
      etapaOrden: 0,
      tieneAlertas: false,
      imprimeFormulario: false,
      tareaWeb: false,
      filtrarPorMetadato: false,
      registrosExternos: false,
      tieneNotificacion: false,
      consecutiva: false,
      automatica: false,
      conservarVistosBuenos: false,
      esTimer: activitytypeId === 'timer',
      utilizaAgenda: false,
      dispositivoMovil: false,
      tareaExternaCreaUsuario: null,
      tieneDestinatarioExterno: null,
      esConfiguracion: false,
      ...overrides,
    };
  }

  private tareaConfigDesdeDecision(config: DecisionConfig): TareaConfig {
    return {
      ...config,
      observaciones: '',
      ignorarValidacionCargo: false,
      agenda: false,
      checkpoint: false,
      agregarRegistrosExternos: false,
      filtrarUsuariosPorMetadatos: false,
      imprimirFormulario: false,
      tareaWeb: false,
      conservarVistosBuenos: false,
      formularioRequeridoSeleccionado: null,
    };
  }

  private buildDocumentosComunesActividadDecision(
    decisionConfig: DecisionConfig,
    extras?: CrearProcesoRequestExtras,
    formulariosProceso?: readonly FormularioProcesoConfig[],
  ): DocumentoComunActividadWrapperRequest[] {
    if (decisionConfig.documento === null || decisionConfig.documento === 0) {
      return [];
    }

    // Igual que en actividad: el nombre del documento común es el del
    // formulario de proceso, no el del documento asociado.
    const nombre =
      this.nombreDocComunDe(decisionConfig.documento, formulariosProceso, extras) ?? '';

    return [
      {
        nombreDocComunProceso: nombre,
        documentoComunActividad: {
          id: { activityId: null, docComunId: null },
          tieneMetadatosTransferidos: 'false',
        },
        metadatosDisponibles: [],
        reglaMultiFormulario: null,
        metadatosTransferidos: [],
      },
    ];
  }

  private buildDocumentosComunesActividad(
    seleccion: FormularioRequeridoSeleccion | null | undefined,
    extras?: CrearProcesoRequestExtras,
  ): DocumentoComunActividadWrapperRequest[] {
    if (!seleccion || seleccion.idFormulario === 0) {
      return [];
    }

    const metadatosTransferidos = this.buildMetadatosTransferidos(seleccion, extras);

    return [
      {
        nombreDocComunProceso: seleccion.nombre,
        documentoComunActividad: {
          id: { activityId: null, docComunId: null },
          tieneMetadatosTransferidos:
            metadatosTransferidos.length > 0 || seleccion.tieneMetadatosTransferidos === 'true'
              ? 'true'
              : 'false',
        },
        metadatosDisponibles: seleccion.metadatosSeleccionados.map((clave) => {
          const resuelto = extras?.resolverMetadato?.(seleccion.idFormulario, clave) ?? null;

          return {
            id: {
              activityId: null,
              docComunId: null,
              idDocumento: seleccion.idFormulario,
              idMetadato: resuelto?.idMetadato ?? this.parseIdMetadatoDeClave(clave),
              idBloque: resuelto?.idBloque ?? -1,
            },
            codigoBloque:
              resuelto?.codigoBloque ?? (this.codigoBloqueDeClave(clave) ?? ''),
          };
        }),
        reglaMultiFormulario: null,
        metadatosTransferidos,
      },
    ];
  }

  private parseIdMetadatoDeClave(clave: string): number {
    return Number(clave.split('-').pop());
  }

  private codigoBloqueDeClave(clave: string): string | null {
    const indiceSeparador = clave.lastIndexOf('-');

    return indiceSeparador > 0 ? clave.slice(0, indiceSeparador) : null;
  }

  private buildMetadatosTransferidos(
    seleccion: FormularioRequeridoSeleccion,
    extras?: CrearProcesoRequestExtras,
  ): readonly MetadatoTransferidoRequest[] {
    return (seleccion.metadatosTransferidos ?? []).map((traspaso) => {
      const origen = this.mapearDetalleTransferidoPlano(traspaso.origen, extras);
      const destino = this.mapearDetalleTransferidoPlano(traspaso.destino, extras);

      return {
        metadatoTransferidoId: null,
        activityId: null,
        nombreDocComunOrigen: traspaso.origen.nombreFormulario,
        docComunIdOrigen: null,
        idDocumentoOrigen: traspaso.origen.idFormulario,
        idMetadatoOrigen: origen.idMetadato,
        idBloqueOrigen: origen.idBloque,
        codigoBloqueOrigen: origen.codigoBloque,
        docComunIdDestino: null,
        idDocumentoDestino: traspaso.destino.idFormulario,
        idMetadatoDestino: destino.idMetadato,
        idBloqueDestino: destino.idBloque,
        codigoBloqueDestino: destino.codigoBloque,
        ...(destino.esGrilla && traspaso.paresColumnas !== undefined
          ? { columnasTransferidasDestino: traspaso.paresColumnas.map((par) => ({
              idColumnaOrigen: par.origen.idColumnaGrilla,
              dataFieldOrigen: par.origen.datafield,
              idColumnaDestino: par.destino.idColumnaGrilla,
              dataFieldDestino: par.destino.datafield,
            })) }
          : {}),
      };
    });
  }

  private mapearDetalleTransferidoPlano(
    detalle: MetadatoTransferidoDetalle,
    extras?: CrearProcesoRequestExtras,
  ): { idMetadato: number; idBloque: number | null; codigoBloque: string | null; esGrilla: boolean } {
    const resuelto = extras?.resolverMetadato?.(detalle.idFormulario, detalle.clave) ?? null;

    return {
      idMetadato: detalle.idMetadato,
      idBloque: resuelto?.idBloque ?? -1,
      codigoBloque: detalle.codigoBloque ?? resuelto?.codigoBloque ?? null,
      esGrilla: detalle.esGrilla,
    };
  }

  private parseDocumentosComunesActividad(
    nodo: Element,
    extras?: CrearProcesoRequestExtras,
  ): DocumentoComunActividadWrapperRequest[] {
    const contenedor = nodo.getElementsByTagName('documentosComunesActividad')[0];
    if (!contenedor) {
      return [];
    }

    return Array.from(contenedor.children).map((docActividad) => {
      const documentoComunActividad = docActividad.getElementsByTagName('documentoComunActividad')[0];
      const metadatos = docActividad.getElementsByTagName('metadatosDisponibles')[0];

      return {
        nombreDocComunProceso: docActividad.getAttribute('nombreDocComunProceso') ?? '',
        documentoComunActividad: {
          id: {
            activityId: null,
            docComunId: null,
          },
          tieneMetadatosTransferidos:
            documentoComunActividad?.getAttribute('tieneMetadatosTransferidos') ?? 'false',
        },
        metadatosDisponibles: metadatos
          ? Array.from(metadatos.getElementsByTagName('id')).map((idNodo) => ({
              id: {
                activityId: null,
                docComunId: null,
                idDocumento: this.parseNumber(idNodo.getAttribute('idDocumento') ?? '-1', -1),
                idMetadato: this.parseNumber(idNodo.getAttribute('idMetadato') ?? '-1', -1),
                idBloque: this.parsearNumeroOpcional(idNodo.getAttribute('idBloque')) ?? -1,
              },
              codigoBloque: idNodo.getAttribute('codigoBloque') ?? '',
            }))
          : [],
        reglaMultiFormulario: null,
        metadatosTransferidos: this.parseMetadatosTransferidos(docActividad),
      };
    });
  }

  private parseMetadatosTransferidos(contenedor: Element): readonly MetadatoTransferidoRequest[] {
    const nodoTransferidos = contenedor.getElementsByTagName('metadatosTransferidos')[0];

    if (!nodoTransferidos) {
      return [];
    }

    return Array.from(nodoTransferidos.getElementsByTagName('metadatoTransferido')).map(
      (nodoTransferido) => {
        const documentoComunProceso =
          nodoTransferido.getElementsByTagName('documentoComunProceso')[0];
        const bloqueOrigen = nodoTransferido.getElementsByTagName('bloqueMetadatoRequeridoOrigen')[0];
        const bloqueDestino = nodoTransferido.getElementsByTagName('bloqueMetadatoRequeridoDestino')[0];
        const origen = this.parseBloqueMetadatoRequerido(bloqueOrigen);
        const destino = this.parseBloqueMetadatoRequerido(bloqueDestino);
        const idDocumento = this.parseNumber(
          documentoComunProceso?.getAttribute('idDocumento') ?? '-1',
          -1,
        );

        return {
          metadatoTransferidoId: this.parsearNumeroOpcional(
            nodoTransferido.getAttribute('metadatoTransferidoId') ?? null,
          ),
          activityId: null,
          nombreDocComunOrigen:
            documentoComunProceso?.getAttribute('nombreDocumentoProceso') ?? '',
          docComunIdOrigen: this.parsearNumeroOpcional(
            documentoComunProceso?.getAttribute('docComunIdOrigen') ?? null,
          ),
          idDocumentoOrigen: idDocumento,
          idMetadatoOrigen: origen.metadatoRequerido.idMetadato,
          idBloqueOrigen: origen.bloqueMetadato.idBloque ?? -1,
          codigoBloqueOrigen: origen.bloqueMetadato.codigoBloque,
          docComunIdDestino: null,
          idDocumentoDestino: idDocumento,
          idMetadatoDestino: destino.metadatoRequerido.idMetadato,
          idBloqueDestino: destino.bloqueMetadato.idBloque ?? -1,
          codigoBloqueDestino: destino.bloqueMetadato.codigoBloque,
          ...(destino.metadatoRequerido.columnasTransferidas
            ? { columnasTransferidasDestino: destino.metadatoRequerido.columnasTransferidas }
            : {}),
        };
      },
    );
  }

  private parseBloqueMetadatoRequerido(
    nodo: Element | undefined,
  ): BloqueMetadatoRequeridoRequest {
    const metadatoRequerido = nodo?.getElementsByTagName('metadatoRequerido')[0];
    const bloqueMetadato = nodo?.getElementsByTagName('bloqueMetadato')[0];
    const columnasTransferidas = Array.from(
      metadatoRequerido?.getElementsByTagName('columnaTransferida') ?? [],
    ).map((columna) => ({
      idColumnaOrigen: this.parseNumber(columna.getAttribute('idColumnaOrigen') ?? '-1', -1),
      dataFieldOrigen: columna.getAttribute('dataFieldOrigen') ?? '',
      idColumnaDestino: this.parseNumber(columna.getAttribute('idColumnaDestino') ?? '-1', -1),
      dataFieldDestino: columna.getAttribute('dataFieldDestino') ?? '',
    }));

    return {
      metadatoRequerido: {
        nombreMetadato: metadatoRequerido?.getAttribute('nombreMetadato') ?? '',
        esGrilla: metadatoRequerido?.getAttribute('esGrilla') ?? 'false',
        idMetadato: this.parseNumber(metadatoRequerido?.getAttribute('idMetadato') ?? '-1', -1),
        idTipoDato: metadatoRequerido?.getAttribute('idTipoDato') ?? null,
        ...(columnasTransferidas.length > 0 ? { columnasTransferidas } : {}),
      },
      bloqueMetadato: {
        nombreBloque: bloqueMetadato?.getAttribute('nombreBloque') ?? null,
        codigoBloque: bloqueMetadato?.getAttribute('codigoBloque') ?? null,
        idBloque: this.parsearNumeroOpcional(bloqueMetadato?.getAttribute('idBloque') ?? null),
      },
    };
  }

  private parsearNumeroOpcional(valor: string | null): number | null {
    if (valor === null || valor.trim() === '') {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
  }

  private parseTransiciones(
    processDefinition: Element | undefined,
    extras?: CrearProcesoRequestExtras,
    formulariosProceso?: readonly FormularioProcesoConfig[],
  ): TransicionWrapperRequest[] {
    if (!processDefinition) {
      return [];
    }

    const transicionConfigs = extras?.transicionConfigs ?? {};
    const transiciones: TransicionWrapperRequest[] = [];

    for (const tagName of LEGACY_FLOW_TAGS) {
      const nodos = Array.from(processDefinition.getElementsByTagName(tagName));

      for (const nodo of nodos) {
        const idOrigen = nodo.getAttribute('id') ?? '';
        const transicionesNodo = Array.from(nodo.getElementsByTagName('transition'));

        for (const transicion of transicionesNodo) {
          const idDestino = transicion.getAttribute('to') ?? '';
          const idTransicionXml = transicion.getAttribute('id') ?? '';
          const config =
            transicionConfigs[idTransicionXml] ??
            transicionConfigs[this.normalizarId(idTransicionXml)] ??
            null;
          const requiereTimer = config?.requiereTimer === true;
          const esTimerXml = transicion.getAttribute('esTimer') === 'true';

          const timer = requiereTimer
            ? this.buildTimerTransicion(config.timer, extras)
            : esTimerXml
              ? this.parseTimerTransicionDelXml(transicion)
              : null;
          const idAccionTransicion =
            config !== null && config.accionRequerida ? (config.accion ?? null) : null;

          transiciones.push({
            transicion: {
              transitionId: null,
              transitionName: transicion.getAttribute('name') ?? '',
              activityIdSource: null,
              activityIdDestination: null,
              processId: null,
              transitiontypeId: null,
              idAccionTransicion,
              tieneTimer: requiereTimer || esTimerXml,
              levantaForm: transicion.getAttribute('levantaFormulario') === 'true',
            },
            idActividadOrigen: idOrigen,
            idActividadDestino: idDestino,
            reglasUsuario: (config?.reglasUsuario ?? []).map((regla) =>
              this.buildReglaUsuarioPlana(regla, extras),
            ),
            reglasNegocio: (config?.reglasNegocio ?? []).map((regla) =>
              this.buildReglaNegocioPlana(regla, extras, formulariosProceso),
            ),
            tieneTimer: timer !== null ? true : null,
            timer,
            conInterrupcion:
              requiereTimer && config !== null
                ? config.interrupcion
                : esTimerXml
                  ? transicion.getAttribute('interrupcion') === 'true'
                  : null,
          });
        }
      }
    }

    return transiciones;
  }

  private buildReglaUsuarioPlana(
    regla: TransicionReglaUsuario,
    extras?: CrearProcesoRequestExtras,
  ): ReglaUsuarioRequest {
    const idDocumento = regla.idDocumento ?? null;
    const idMetIzqClave = regla.idMetadato ?? null;
    const izquierda =
      idDocumento !== null && idMetIzqClave !== null
        ? (extras?.resolverMetadato?.(idDocumento, idMetIzqClave) ?? null)
        : null;
    const idMetadatoValor = regla.idMetadatoValor ?? null;
    const derecho =
      extras?.resolverMetadatoRol?.(
        regla.idCargo ?? null,
        this.parsearNumeroOpcional(idMetadatoValor),
      ) ?? null;
    const idMetDer = this.parsearNumeroOpcional(idMetadatoValor);

    return {
      idReglaUsuario: regla.idReglaUsuario ?? null,
      idDocIzq: idDocumento,
      idBloqIzq: izquierda?.idBloque ?? -1,
      codigoBloqIzq: izquierda?.codigoBloque ?? null,
      idMetIzq: izquierda?.idMetadato ?? (idMetIzqClave !== null ? this.parseIdMetadatoDeClave(idMetIzqClave) : null),
      idRolDer: regla.idCargo ?? null,
      idBloqDer: derecho?.idBloque ?? -1,
      codigoBloqDer: derecho?.codigoBloque ?? null,
      idMetDer,
      campoValor2: regla.interpretacion === 'id',
    };
  }

  private buildReglaNegocioPlana(
    regla: TransicionReglaNegocio,
    extras?: CrearProcesoRequestExtras,
    formulariosProceso?: readonly FormularioProcesoConfig[],
  ): ReglaNegocioRequest {
    const idDocumento = regla.idDocumento ?? null;
    const idMetIzqClave = regla.idMetadato ?? null;
    const izquierda =
      idDocumento !== null && idMetIzqClave !== null
        ? (extras?.resolverMetadato?.(idDocumento, idMetIzqClave) ?? null)
        : null;

    const esOtroMetadato = regla.fuenteValor === 'otroMetadato';
    const idMetDerClave = regla.idMetadatoValor ?? null;
    const derecho =
      esOtroMetadato && regla.idDocumentoValor !== null && idMetDerClave !== null
        ? (extras?.resolverMetadato?.(regla.idDocumentoValor, idMetDerClave) ?? null)
        : null;

    return {
      idOperadorRegla: regla.idOperadorRegla ?? this.buscarIdOperadorRegla(izquierda?.tipo ?? null, regla.operador),
      operandoIzq: {
        valorOperando: null,
        esDoc: true,
        nombreDocComun: this.nombreDocComunDe(idDocumento, formulariosProceso, extras),
        idBloque: izquierda?.idBloque ?? null,
        codigoBloque: izquierda?.codigoBloque ?? null,
        idMetadato: izquierda?.idMetadato ?? (idMetIzqClave !== null ? this.parseIdMetadatoDeClave(idMetIzqClave) : null),
        idTipoDato: izquierda?.tipo ?? null,
      },
      operandoDer: esOtroMetadato
        ? {
            valorOperando: null,
            esDoc: true,
            nombreDocComun: this.nombreDocComunDe(regla.idDocumentoValor, formulariosProceso, extras),
            idBloque: derecho?.idBloque ?? null,
            codigoBloque: derecho?.codigoBloque ?? null,
            idMetadato: derecho?.idMetadato ?? (idMetDerClave !== null ? this.parseIdMetadatoDeClave(idMetDerClave) : null),
            idTipoDato: derecho?.tipo ?? null,
          }
        : {
            valorOperando: regla.valorTexto,
            esDoc: false,
            nombreDocComun: null,
            idBloque: null,
            codigoBloque: null,
            idMetadato: null,
            idTipoDato: null,
          },
    };
  }

  private nombreDocComunDe(
    idDocumento: number | null,
    formulariosProceso?: readonly FormularioProcesoConfig[],
    extras?: CrearProcesoRequestExtras,
  ): string | null {
    if (idDocumento === null) {
      return null;
    }

    const formulario = formulariosProceso?.find((f) => f.idFormulario === idDocumento);

    if (formulario) {
      return formulario.nombre;
    }

    return (
      extras?.documentosProceso?.find((opcion) => opcion.value === String(idDocumento))?.label ??
      null
    );
  }

  private buscarIdOperadorRegla(tipo: string | null, operador: string): string | null {
    if (tipo === null) {
      return null;
    }

    return (
      TRANSICION_OPERADOR_REGLAS.find(
        (item) => item.tipo === tipo && item.operador === operador,
      )?.idOperadorRegla ?? null
    );
  }

  private buildTimerTransicion(
    timer: TimerConfig,
    extras?: CrearProcesoRequestExtras,
  ): TimerTransicionRequest {
    if (timer.modo === 'metadatoFormulario') {
      const resuelto =
        timer.idDocumento !== null && timer.idMetadato !== null
          ? (extras?.resolverMetadato?.(timer.idDocumento, timer.idMetadato) ?? null)
          : null;
      const idMetadato = timer.idMetadato !== null ? this.parseIdMetadatoDeClave(timer.idMetadato) : null;

      return {
        idTimerProceso: null,
        esMetFormulario: true,
        docComunId: null,
        idBloque: resuelto?.idBloque ?? -1,
        idMetadato,
        esDatoFijo: false,
        esTiempo: false,
        datoFijo: '0',
        idUnidadTiempo: '',
        esFecha: false,
        fecha: '',
        hora: '',
      };
    }

    const esTiempo = timer.datoFijoTipo === 'tiempo';

    return {
      idTimerProceso: null,
      esMetFormulario: false,
      docComunId: null,
      idBloque: null,
      idMetadato: null,
      esDatoFijo: true,
      esTiempo,
      datoFijo: esTiempo ? String(timer.duracionValor ?? 0) : '0',
      idUnidadTiempo: esTiempo ? (timer.duracionUnidad ?? '') : '',
      esFecha: !esTiempo,
      fecha: esTiempo ? '' : (timer.fecha ?? ''),
      hora: esTiempo ? '' : (timer.hora ?? ''),
    };
  }

  private parseNumber(valor: string, defecto: number): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : defecto;
  }

  /**
   * Recupera el timer guardado del XML legacy cuando no hay configuración en
   * la sesión (nodo <timer> del canvas con sus atributos de configuración).
   */
  private parseTimerDelXml(nodo: Element): TimerTransicionRequest | null {
    return this.construirTimerDesdeAtributos(
      nodo.getAttribute('esMetFormulario') === 'true',
      nodo.getAttribute('esTiempo') === 'true',
      nodo.getAttribute('datoFijo'),
      nodo.getAttribute('idUnidadTiempo'),
      nodo.getAttribute('fecha'),
      nodo.getAttribute('hora'),
      nodo.getAttribute('idMetadato'),
      nodo.getAttribute('idBloque'),
      nodo.getAttribute('docComunId'),
    );
  }

  /**
   * Recupera el timer guardado de la transición legacy (hijo <timerTransicion>)
   * cuando no hay configuración en la sesión.
   */
  private parseTimerTransicionDelXml(transicion: Element): TimerTransicionRequest | null {
    const timerTransicion = transicion.getElementsByTagName('timerTransicion')[0] ?? null;

    if (timerTransicion === null) {
      return this.construirTimerDesdeAtributos(
        transicion.getAttribute('esMetFormulario') === 'true',
        transicion.getAttribute('esTiempo') === 'true',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      );
    }

    return this.construirTimerDesdeAtributos(
      timerTransicion.getAttribute('esMetFormulario') === 'true',
      timerTransicion.getAttribute('esTiempo') === 'true',
      timerTransicion.getAttribute('datoFijo'),
      timerTransicion.getAttribute('idUnidadTiempo'),
      timerTransicion.getAttribute('fecha'),
      timerTransicion.getAttribute('hora'),
      timerTransicion.getAttribute('idMetadato'),
      timerTransicion.getAttribute('idBloque'),
      timerTransicion.getAttribute('docComunId'),
    );
  }

  private construirTimerDesdeAtributos(
    esMetFormulario: boolean,
    esTiempo: boolean,
    datoFijo: string | null,
    idUnidadTiempo: string | null,
    fecha: string | null,
    hora: string | null,
    idMetadato: string | null,
    idBloque: string | null,
    docComunId: string | null,
  ): TimerTransicionRequest {
    return {
      idTimerProceso: null,
      esMetFormulario,
      docComunId: this.parsearNumeroOpcional(docComunId),
      idBloque: this.parsearNumeroOpcional(idBloque),
      idMetadato: this.parsearNumeroOpcional(idMetadato),
      esDatoFijo: !esMetFormulario,
      esTiempo,
      datoFijo: esMetFormulario ? '0' : (datoFijo ?? '0'),
      idUnidadTiempo: idUnidadTiempo ?? '',
      esFecha: !esMetFormulario && !esTiempo,
      fecha: fecha ?? '',
      hora: hora ?? '',
    };
  }

  private escapeXmlAttribute(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
