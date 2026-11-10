/**
 * Error HTTP controlado por la aplicación.
 *
 * Representa errores conocidos (por ejemplo, recursos inexistentes o reglas
 * de negocio violadas) que el middleware central de errores puede traducir a
 * una respuesta JSON consistente sin exponer detalles internos.
 */
export class HttpError extends Error {
  /** Código de estado HTTP de la respuesta. */
  public readonly statusCode: number;

  /** Código identificador estable de la causa, en formato UPPER_SNAKE_CASE. */
  public readonly code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);

    // Conserva el prototipo y el nombre correctos incluso si el código se
    // transpila a un objetivo sin clases nativas.
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code ?? errorCodeForStatus(statusCode);
  }
}

/** Cuerpo de respuesta de error que devuelve la API. */
export interface HttpErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
}

/** Códigos por defecto para los estados HTTP más comunes. */
const DEFAULT_ERROR_CODES: Readonly<Record<number, string>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Devuelve el código identificador asociado a un estado HTTP.
 * Los estados sin código conocido reciben el valor genérico `HTTP_ERROR`.
 */
export function errorCodeForStatus(statusCode: number): string {
  return DEFAULT_ERROR_CODES[statusCode] ?? 'HTTP_ERROR';
}
