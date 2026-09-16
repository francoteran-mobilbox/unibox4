import { esCombinacionTraspasoValida } from './tarea-config.model';

describe('esCombinacionTraspasoValida', () => {
  it('acepta todas las combinaciones válidas de la matriz', () => {
    const paresValidos: readonly (readonly [string, string])[] = [
      ['ADJ', 'ADJ'],
      ['ALF', 'ALF'],
      ['ALF', 'ATX'],
      ['ALF', 'DGD'],
      ['ATX', 'ALF'],
      ['ATX', 'ATX'],
      ['CBX', 'ALF'],
      ['CBX', 'CBX'],
      ['CBX', 'DGD'],
      ['CHK', 'CHK'],
      ['COR', 'COR'],
      ['DGD', 'DGD'],
      ['FEC', 'FEC'],
      ['GLO', 'GLO'],
      ['HOR', 'HOR'],
      ['NUM', 'ALF'],
      ['NUM', 'DGD'],
      ['NUM', 'NUM'],
      ['RBT', 'ALF'],
      ['RBT', 'RBT'],
      ['SIS', 'ALF'],
    ];

    for (const [origen, destino] of paresValidos) {
      expect(esCombinacionTraspasoValida(origen, destino)).withContext(`${origen}|${destino}`).toBeTrue();
    }
  });

  it('rechaza combinaciones fuera de la matriz', () => {
    expect(esCombinacionTraspasoValida('FEC', 'ALF')).toBeFalse();
    expect(esCombinacionTraspasoValida('ALF', 'NUM')).toBeFalse();
    expect(esCombinacionTraspasoValida('SIS', 'SIS')).toBeFalse();
    expect(esCombinacionTraspasoValida('NUM', 'FEC')).toBeFalse();
  });

  it('es insensible a mayúsculas/minúsculas y espacios', () => {
    expect(esCombinacionTraspasoValida('alf', 'atx')).toBeTrue();
    expect(esCombinacionTraspasoValida(' ALF ', ' DGD ')).toBeTrue();
  });

  it('rechaza tipos vacíos', () => {
    expect(esCombinacionTraspasoValida('', 'ALF')).toBeFalse();
    expect(esCombinacionTraspasoValida('ALF', '')).toBeFalse();
  });
});
