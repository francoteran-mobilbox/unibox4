import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ObtenerProcesosEjecucionRequest,
  ObtenerProcesosEjecucionResponse,
  ObtenerProcesosResponse,
  ObtenerXmlPathProcesoResponse,
  ObtenerJornadaCalendarioResponse,
  RolRaw,
  FamiliaRaw,
  MecanismoProceso,
  CatalogoSegunUsuario,
  ObtenerCatalogosSegunUsuarioRequest,
  DocumentoComunProceso,
  MetadatoRequeridoDocumento,
  ActividadTareaProceso,
  TareasProcesoResponse,
  MetadatoRequeridoRol,
  ObtenerDocumentosLivianoResponse,
  ObtenerUsuariosLivianoResponse,
} from '../models/diagrama.model';

const PROCESOS_EJECUCION_PATH =
  '/rest-gestor/procesos-ejecucion-gestion/obtenerTodosGestionProcesosEE/';
const PROCESO_XML_PATH = '/rest-gestor/procesos/obtenerXMLPathPorIdProceso';
const PROCESOS_PATH = '/rest-gestor/procesos/obtenerTodosLivianoConfiguracion/';
const CATALOGOS_SEGUN_USUARIO_PATH =
  '/rest-gestor/procesos/obtenerCatalogosSegunUsuario';
const DOCUMENTOS_COMUN_PROCESO_PATH =
  '/rest-gestor/doc-comun-process/obtenerDocumentosComunProcesoSegunProcessId';
const DOCUMENTO_LIVIANO_CONFIGURACION_PATH =
  '/rest-gestor/documento/obtenerTodosLivianoConfiguracion/';
const TAREAS_PROCESO_PATH = '/rest-gestor/activities/obtenerTareasProceso/';
const METADATOS_REQ_ROL_PATH = '/rest-gestor/metadatoReqRol/obtenerMetadatosReqRol';
const USUARIOS_LIVIANO_PATH = '/rest-usuario/usuario/obtenerUsuariosLiviano';
const METADATOS_REQUERIDOS_DOCUMENTO_PATH =
  '/rest-gestor/metadatoRequeridoDocumento/obtenerMRDPorIdDoc/';
const USUARIO_ACTUAL_ID = 'soportemovilgo';

@Injectable({ providedIn: 'root' })
export class DiagramaService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '')+'/gestorDocumental';

  obtenerProcesosEjecucion(
    request: ObtenerProcesosEjecucionRequest,
  ): Observable<ObtenerProcesosEjecucionResponse> {
    return this.http.post<ObtenerProcesosEjecucionResponse>(
      this.buildUrl(PROCESOS_EJECUCION_PATH),
      request,
    );
  }

  obtenerProcesos(): Observable<ObtenerProcesosResponse> {
    return this.http.get<ObtenerProcesosResponse>(this.buildUrl(PROCESOS_PATH));
  }

  obtenerXmlPathPorIdProceso(processrunningId: number): Observable<string> {
    return this.http.post(this.buildUrl(PROCESO_XML_PATH), JSON.stringify(processrunningId), {
      responseType: 'text',
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    });
  }

  obtenerRoles(): Observable<RolRaw[]> {
    return this.http.get<RolRaw[]>(this.buildUrl('/rest-gestor/rol/obtenerRoles'));
  }

  getFamiliasProceso(): Observable<FamiliaRaw[]> {
    return this.http.get<FamiliaRaw[]>(
      this.buildUrl('/rest-gestor/procesos/obtenerFamiliaProceso'),
    );
  }

  getMecanismosProceso(): Observable<MecanismoProceso[]> {
    return this.http.get<MecanismoProceso[]>(
      this.buildUrl('/rest-gestor/procesos/obtenerMecanismoProceso'),
    );
  }

  getJornadaCalendario(): Observable<ObtenerJornadaCalendarioResponse> {
    return this.http.get<ObtenerJornadaCalendarioResponse>(
      this.buildUrl('/rest-gestor/procesos/obtenerJornadaCalendario'),
    );
  }

  obtenerCatalogosSegunUsuario(): Observable<CatalogoSegunUsuario[]> {
    return this.http.post<CatalogoSegunUsuario[]>(
      this.buildUrl(CATALOGOS_SEGUN_USUARIO_PATH), USUARIO_ACTUAL_ID,
    );
  }

  obtenerDocumentosComunProcesoSegunProcessId(
    processId: number,
  ): Observable<DocumentoComunProceso[]> {
    return this.http.post<DocumentoComunProceso[]>(
      this.buildUrl(DOCUMENTOS_COMUN_PROCESO_PATH),
      processId,
    );
  }

  obtenerMetadatosRequeridosDocumento(idDocumento: number): Observable<MetadatoRequeridoDocumento[]> {
    return this.http.get<MetadatoRequeridoDocumento[]>(
      this.buildUrl(`${METADATOS_REQUERIDOS_DOCUMENTO_PATH}${idDocumento}`),
    );
  }

  obtenerDocumentosLivianoConfiguracion(): Observable<ObtenerDocumentosLivianoResponse> {
    return this.http.get<ObtenerDocumentosLivianoResponse>(
      this.buildUrl(DOCUMENTO_LIVIANO_CONFIGURACION_PATH),
    );
  }

  obtenerTareasProceso(processId: number): Observable<TareasProcesoResponse> {
    return this.http.get<TareasProcesoResponse>(
      this.buildUrl(`${TAREAS_PROCESO_PATH}${processId}`),
    );
  }

  obtenerMetadatosReqRol(): Observable<MetadatoRequeridoRol[]> {
    return this.http.get<MetadatoRequeridoRol[]>(
      this.buildUrl(METADATOS_REQ_ROL_PATH),
    );
  }

  obtenerUsuariosLiviano(): Observable<ObtenerUsuariosLivianoResponse> {
    return this.http.get<ObtenerUsuariosLivianoResponse>(
      this.buildApiUrl(USUARIOS_LIVIANO_PATH),
    );
  }

  private buildUrl(path: string): string {
    return `${this.apiBaseUrl}${path}`;
  }

  private buildLocalUrl(path: string): string {
    return `http://localhost:8085/gestorDocumental${path}`;
  }

  private buildApiUrl(path: string): string {
    return `${environment.apiBaseUrl}/api${path}`;
  }
}
