export interface NodoBasicoConfig {
  readonly cargo: string | null;
  readonly usuarios: readonly string[];
}

export function buildDefaultNodoBasicoConfig(): NodoBasicoConfig {
  return {
    cargo: null,
    usuarios: [],
  };
}
