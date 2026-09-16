import {
  operadorDesdeIdOperadorRegla,
  operadoresPorTipoDato,
  TransicionOperador,
} from './transicion-config.model';

describe('operadores de reglas de negocio', () => {
  it('mapea todos los id_operador_regla al operador correcto', () => {
    const esperados: readonly (readonly [string, TransicionOperador])[] = [
      ['ctn', 'contiene'],
      ['nct', 'noContiene'],
      ['exc', 'esExactamente'],
      ['esf', 'es'],
      ['ant', 'esAnterior'],
      ['pos', 'esPosterior'],
      ['myq', 'mayorQue'],
      ['mnq', 'menorQue'],
      ['igq', 'igualQue'],
      ['dtd', 'distintoDe'],
      ['sco', 'contiene'],
      ['snc', 'noContiene'],
      ['see', 'esExactamente'],
      ['smy', 'mayorQue'],
      ['smn', 'menorQue'],
      ['syi', 'mayorIgualQue'],
      ['sni', 'menorIgualQue'],
      ['cbc', 'contiene'],
      ['cbn', 'noContiene'],
      ['cbe', 'esExactamente'],
      ['che', 'esExactamente'],
      ['rbc', 'contiene'],
      ['rbn', 'noContiene'],
      ['rbe', 'esExactamente'],
      ['rct', 'contiene'],
      ['rnc', 'noContiene'],
      ['rex', 'esExactamente'],
      ['coc', 'contiene'],
      ['con', 'noContiene'],
      ['coe', 'esExactamente'],
    ];

    for (const [id, operador] of esperados) {
      expect(operadorDesdeIdOperadorRegla(id)).withContext(id).toBe(operador);
    }
  });

  it('es insensible a mayúsculas y devuelve null para ids desconocidos', () => {
    expect(operadorDesdeIdOperadorRegla('CTN')).toBe('contiene');
    expect(operadorDesdeIdOperadorRegla('xxx')).toBeNull();
    expect(operadorDesdeIdOperadorRegla(null)).toBeNull();
    expect(operadorDesdeIdOperadorRegla('')).toBeNull();
  });

  it('filtra operadores por tipo de dato', () => {
    expect(operadoresPorTipoDato('ALF').map((o) => o.value)).toEqual([
      'contiene',
      'noContiene',
      'esExactamente',
    ]);
    expect(operadoresPorTipoDato('FEC').map((o) => o.value)).toEqual([
      'es',
      'esAnterior',
      'esPosterior',
    ]);
    expect(operadoresPorTipoDato('NUM').map((o) => o.value)).toEqual([
      'mayorQue',
      'menorQue',
      'igualQue',
      'distintoDe',
    ]);
    expect(operadoresPorTipoDato('CHK').map((o) => o.value)).toEqual(['esExactamente']);
    expect(operadoresPorTipoDato('SIS').map((o) => o.value)).toEqual([
      'contiene',
      'noContiene',
      'esExactamente',
      'mayorQue',
      'menorQue',
      'mayorIgualQue',
      'menorIgualQue',
    ]);
  });

  it('retorna todas las opciones cuando el tipo es desconocido', () => {
    expect(operadoresPorTipoDato(null).length).toBe(12);
    expect(operadoresPorTipoDato('desconocido').length).toBe(12);
  });
});
