import { Injectable } from '@angular/core';
import {
  ActividadRequest,
  ActividadWrapperRequest,
  BloqueMetadatoRequeridoRequest,
  CargoResponsableRequest,
  CrearProcesoRequest,
  DocumentoComunActividadWrapperRequest,
  DocumentoComunProcesoWrapperRequest,
  MetadatoTransferidoRequest,
  ProcesoActivityTypeId,
  ProcesoMecanismoRequest,
  ProcesoRequest,
  TransicionWrapperRequest,
} from '../models/crear-proceso-request.model';
import {
  FormularioProcesoConfig,
  FormularioRequeridoSeleccion,
  MetadatoTransferidoDetalle,
  ParColumnaTransferido,
  TareaConfig,
} from '../models/tarea-config.model';

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
  ): CrearProcesoRequest {
    const parser = new DOMParser();
    const documentXml = parser.parseFromString(liveXml, 'text/xml');
    const processDefinition =
      documentXml.documentElement?.tagName === 'process-definition'
        ? documentXml.documentElement
        : documentXml.getElementsByTagName('process-definition')[0];

    const documentosComunes = this.parseDocumentosComunes(processDefinition, formulariosProceso);
    const cargosResponsables = this.parseCargosResponsables(processDefinition);
    const procesoMecanismo = this.parseProcesoMecanismo(processDefinition);
    const actividades = this.parseActividades(processDefinition, tareaConfigs);
    const transiciones = this.parseTransiciones(processDefinition);

    const idDocumentoPublicar =
      documentosComunes.length > 0 ? documentosComunes[0].documentoComunProceso.idDocumento : -1;

    const proceso: ProcesoRequest = {
      processId: null,
      processName: form.nombre.trim(),
      version: this.parseNumber(processDefinition?.getAttribute('version') ?? '1', 1),
      idPadre: -1,
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
      permisosUsuarios: [],
      permisosRoles: [],
      permisosGrupos: [],
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
        permisosUsuarios: (formulario.compartido?.usuario ?? []).map((id) => ({
          id_usuario: id,
        })),
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

  private parseProcesoMecanismo(processDefinition: Element | undefined): ProcesoMecanismoRequest {
    const mecanismo = processDefinition?.getElementsByTagName('mecanismoDenominacion')[0];
    const id = mecanismo
      ? this.parseNumber(mecanismo.getAttribute('idMecanismoDenominacion') ?? '-1', -1)
      : -1;

    return {
      idMecanismoDenominacion: id,
      datosRequeridos: [],
    };
  }

  private parseActividades(
    processDefinition: Element | undefined,
    tareaConfigs?: Record<string, TareaConfig>,
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

        const actividad: ActividadRequest = {
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
          esTimer: false,
          utilizaAgenda: false,
          dispositivoMovil: false,
          tareaExternaCreaUsuario: null,
          tieneDestinatarioExterno: null,
          esConfiguracion: false,
        };

        const configTarea = activitytypeId === 'tarea' ? tareaConfigs?.[idElemento] : undefined;
        const documentosComunesActividad =
          configTarea !== undefined
            ? this.buildDocumentosComunesActividad(configTarea.formularioRequeridoSeleccionado)
            : this.parseDocumentosComunesActividad(nodo);

        actividades.push({
          actividad,
          rolesGenericos: [],
          usuariosPreAsignados: [],
          rolesPreAsignados: [],
          documentosComunesActividad,
          elementosRequeridos: [],
          idSubProceso: null,
          registroExterno: null,
          timer: null,
        });
      }
    }

    return actividades;
  }

  private buildDocumentosComunesActividad(
    seleccion: FormularioRequeridoSeleccion | null | undefined,
  ): DocumentoComunActividadWrapperRequest[] {
    if (!seleccion || seleccion.idFormulario === 0) {
      return [];
    }

    const metadatosTransferidos = this.buildMetadatosTransferidos(seleccion);

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
        metadatosDisponibles: seleccion.metadatosSeleccionados.map((clave) => ({
          id: {
            activityId: null,
            docComunId: null,
            idDocumento: seleccion.idFormulario,
            idMetadato: Number(clave.split('-').pop()),
            idBloque: -1,
          },
        })),
        reglaMultiFormulario: null,
        metadatosTransferidos,
      },
    ];
  }

  private buildMetadatosTransferidos(
    seleccion: FormularioRequeridoSeleccion,
  ): readonly MetadatoTransferidoRequest[] {
    return (seleccion.metadatosTransferidos ?? []).map((traspaso) => ({
      documentoComunProceso: {
        idDocumentoComunProceso: null,
        compartido: seleccion.visibilidad === 'publico' ? 'true' : 'false',
        nombreDocumentoProceso: seleccion.nombre,
        nombreDocumento: seleccion.nombreDocumento || seleccion.nombre,
        privado: seleccion.visibilidad === 'privado' ? 'true' : 'false',
        idDocumento: seleccion.idFormulario,
      },
      bloqueMetadatoRequeridoOrigen: this.buildBloqueMetadatoRequerido(traspaso.origen),
      bloqueMetadatoRequeridoDestino: this.buildBloqueMetadatoRequerido(
        traspaso.destino,
        traspaso.paresColumnas,
      ),
    }));
  }

  private buildBloqueMetadatoRequerido(
    detalle: MetadatoTransferidoDetalle,
    paresColumnas?: readonly ParColumnaTransferido[],
  ): BloqueMetadatoRequeridoRequest {
    const bloqueMetadato = {
      nombreBloque: detalle.nombreBloque,
      codigoBloque: detalle.codigoBloque,
    };

    if (!detalle.esGrilla || paresColumnas === undefined || paresColumnas.length === 0) {
      return {
        metadatoRequerido: {
          nombreMetadato: detalle.nombreMetadato,
          esGrilla: detalle.esGrilla ? 'true' : 'false',
          idMetadato: detalle.idMetadato,
          idTipoDato: detalle.tipoMetadato,
        },
        bloqueMetadato,
      };
    }

    return {
      metadatoRequerido: {
        nombreMetadato: detalle.nombreMetadato,
        esGrilla: 'true',
        idMetadato: detalle.idMetadato,
        idTipoDato: detalle.tipoMetadato,
        columnasTransferidas: paresColumnas.map((par) => ({
          idColumnaOrigen: par.origen.idColumnaGrilla,
          dataFieldOrigen: par.origen.datafield,
          idColumnaDestino: par.destino.idColumnaGrilla,
          dataFieldDestino: par.destino.datafield,
        })),
      },
      bloqueMetadato,
    };
  }

  private parseDocumentosComunesActividad(
    nodo: Element,
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
                idBloque: this.parseNumber(idNodo.getAttribute('idBloque') ?? '-1', -1),
              },
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

        return {
          documentoComunProceso: {
            idDocumentoComunProceso: this.parsearNumeroOpcional(
              documentoComunProceso?.getAttribute('idDocumentoComunProceso') ?? null,
            ),
            compartido: documentoComunProceso?.getAttribute('compartido') ?? 'false',
            nombreDocumentoProceso:
              documentoComunProceso?.getAttribute('nombreDocumentoProceso') ?? '',
            nombreDocumento: documentoComunProceso?.getAttribute('nombreDocumento') ?? '',
            privado: documentoComunProceso?.getAttribute('privado') ?? 'true',
            idDocumento: this.parseNumber(
              documentoComunProceso?.getAttribute('idDocumento') ?? '-1',
              -1,
            ),
          },
          bloqueMetadatoRequeridoOrigen: this.parseBloqueMetadatoRequerido(
            nodoTransferido.getElementsByTagName('bloqueMetadatoRequeridoOrigen')[0],
          ),
          bloqueMetadatoRequeridoDestino: this.parseBloqueMetadatoRequerido(
            nodoTransferido.getElementsByTagName('bloqueMetadatoRequeridoDestino')[0],
          ),
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

  private parseTransiciones(processDefinition: Element | undefined): TransicionWrapperRequest[] {
    if (!processDefinition) {
      return [];
    }

    const transiciones: TransicionWrapperRequest[] = [];

    for (const tagName of LEGACY_FLOW_TAGS) {
      const nodos = Array.from(processDefinition.getElementsByTagName(tagName));

      for (const nodo of nodos) {
        const idOrigen = nodo.getAttribute('id') ?? '';
        const transicionesNodo = Array.from(nodo.getElementsByTagName('transition'));

        for (const transicion of transicionesNodo) {
          const idDestino = transicion.getAttribute('to') ?? '';

          transiciones.push({
            transicion: {
              transitionId: null,
              transitionName: transicion.getAttribute('name') ?? '',
              activityIdSource: null,
              activityIdDestination: null,
              processId: null,
              transitiontypeId: null,
              idAccionTransicion: null,
              tieneTimer: transicion.getAttribute('esTimer') === 'true',
              levantaForm: transicion.getAttribute('levantaFormulario') === 'true',
            },
            idActividadOrigen: idOrigen,
            idActividadDestino: idDestino,
            reglasUsuario: [],
            reglasNegocio: [],
            tieneTimer: null,
            timer: null,
            conInterrupcion: null,
          });
        }
      }
    }

    return transiciones;
  }

  private parseNumber(valor: string, defecto: number): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : defecto;
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
