import { toCamelCase, toKebabCase, isBlank } from './string.utils.js';

describe('toKebabCase', () => {
  it('converte PascalCase para kebab-case', () => {
    expect(toKebabCase('HelloWorld')).toBe('hello-world');
  });

  it('converte espaços para hífens', () => {
    expect(toKebabCase('hello world')).toBe('hello-world');
  });
});

describe('toCamelCase', () => {
  it('converte kebab-case para camelCase', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld');
  });

  it('converte snake_case para camelCase', () => {
    expect(toCamelCase('hello_world')).toBe('helloWorld');
  });
});

describe('isBlank', () => {
  it('retorna true para string vazia', () => {
    expect(isBlank('')).toBe(true);
  });

  it('retorna true para string com espaços', () => {
    expect(isBlank('   ')).toBe(true);
  });

  it('retorna false para string com conteúdo', () => {
    expect(isBlank('hello')).toBe(false);
  });

  it('retorna true para null e undefined', () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
  });
});
