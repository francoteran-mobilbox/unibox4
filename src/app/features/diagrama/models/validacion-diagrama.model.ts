export interface ResultadoValidacionDiagrama {
  readonly nivel: 'error' | 'advertencia';
  readonly mensaje: string;
  readonly elementoId?: string;
  readonly elementoNombre?: string;
}
