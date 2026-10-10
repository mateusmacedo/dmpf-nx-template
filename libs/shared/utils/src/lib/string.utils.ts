/**
 * Converte uma string para kebab-case.
 * Exemplo: "HelloWorld" → "hello-world"
 */
export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converte uma string para camelCase.
 * Exemplo: "hello-world" → "helloWorld"
 */
export function toCamelCase(value: string): string {
  return value.replace(/[-_\s]+(.)?/g, (_, char: string) => (char ? char.toUpperCase() : ''));
}

/**
 * Verifica se uma string está vazia ou contém apenas espaços.
 */
export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}

/**
 * Converte uma string para snake_case.
 * Exemplo: "HelloWorld" → "hello_world"
 */
export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Converte uma string para PascalCase.
 * Exemplo: "hello-world" → "HelloWorld"
 */
export function toPascalCase(value: string): string {
  return value
    .replace(/[-_\s]+(.)?/g, (_, char: string) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, (char) => char.toUpperCase());
}
