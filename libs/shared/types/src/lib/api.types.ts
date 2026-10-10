/** Envelope padrão para respostas de API bem-sucedidas. */
export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

/** Envelope padrão para erros de API. */
export type ApiError = {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
};
