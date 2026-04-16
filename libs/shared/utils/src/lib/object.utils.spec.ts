import { omitNullish, isPlainObject } from './object.utils.js';

describe('omitNullish', () => {
  it('remove propriedades null e undefined', () => {
    const result = omitNullish({ a: 1, b: null, c: undefined, d: 'ok' });
    expect(result).toEqual({ a: 1, d: 'ok' });
  });

  it('mantém valores falsy não-nullish (0, false, empty string)', () => {
    const result = omitNullish({ a: 0, b: false, c: '' });
    expect(result).toEqual({ a: 0, b: false, c: '' });
  });
});

describe('isPlainObject', () => {
  it('retorna true para objeto plain', () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('retorna false para array', () => {
    expect(isPlainObject([1, 2])).toBe(false);
  });

  it('retorna false para null', () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it('retorna false para instância de classe', () => {
    expect(isPlainObject(new Date())).toBe(false);
  });
});
