import type { ErrorRequestHandler } from 'express';
import { isProduction } from '../config/env.js';
import {
  errorCodeForStatus,
  HttpError,
  type HttpErrorResponseBody,
} from '../common/errors/http-error.js';
import { logger } from '../infrastructure/logger/logger.js';

export interface ErrorHandlerOptions {
  /**
   * Incluye el mensaje original de los errores inesperados en la respuesta
   * (`details`). Solo debe habilitarse fuera de producción; el valor por
   * defecto lo desactiva en producción.
   */
  exposeDetails?: boolean;
}

/**
 * Representación interna del error una vez clasificado como controlado
 * o inesperado, con los campos seguros para responder al cliente.
 */
interface PublicError {
  /** `true` si el error es conocido y su mensaje puede exponerse al cliente. */
  expected: boolean;
  statusCode: number;
  message: string;
  code: string;
  /** Detalle interno del error original; nunca se expone en producción. */
  details?: string;
}

/**
 * Errores controlados del ecosistema Express (por ejemplo, JSON inválido en
 * el body). Siguen la convención de `http-errors`: traen `status` y marcan
 * `expose` en `true` cuando el mensaje es seguro para el cliente.
 */
function isExposableHttpError(error: unknown): error is { status: number; message: string } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { status, message, expose } = error as {
    status?: unknown;
    message?: unknown;
    expose?: unknown;
  };

  return (
    typeof status === 'number' &&
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 499 &&
    typeof message === 'string' &&
    expose === true
  );
}

/**
 * Clasifica el error y calcula la respuesta pública.
 * Los errores inesperados siempre producen un 500 con mensaje genérico.
 */
function toPublicError(error: unknown): PublicError {
  if (error instanceof HttpError) {
    return {
      expected: true,
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
    };
  }

  if (isExposableHttpError(error)) {
    return {
      expected: true,
      statusCode: error.status,
      message: error.message,
      code: errorCodeForStatus(error.status),
    };
  }

  const details = error instanceof Error ? error.message : undefined;

  return {
    expected: false,
    statusCode: 500,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(details !== undefined ? { details } : {}),
  };
}

/**
 * Middleware central de manejo de errores de Express 5.
 *
 * - Errores controlados (`HttpError` y errores de body-parser): responden
 *   con su propio estado y mensaje.
 * - Errores inesperados: responden 500 con un mensaje genérico y se
 *   registran una única vez aquí mediante Pino (el middleware de
 *   `pino-http` solo registra la finalización de la solicitud, no duplica
 *   el error).
 */
export function errorHandler(options: ErrorHandlerOptions = {}): ErrorRequestHandler {
  const exposeDetails = options.exposeDetails ?? !isProduction;

  return (error, request, response, next) => {
    if (response.headersSent) {
      // La respuesta ya comenzó a enviarse: delega en el mecanismo por
      // defecto de Express para no corromper la respuesta en curso.
      next(error);
      return;
    }

    const publicError = toPublicError(error);

    if (!publicError.expected) {
      // `request.log` lo añade pino-http; se usa el logger central como
      // respaldo cuando la solicitud no pasó por ese middleware.
      const requestLogger = request.log ?? logger;
      requestLogger.error({ err: error }, 'Error inesperado al procesar la solicitud');
    }

    const body: HttpErrorResponseBody & { details?: string } = {
      statusCode: publicError.statusCode,
      message: publicError.message,
      error: publicError.code,
    };

    if (exposeDetails && publicError.details !== undefined) {
      body.details = publicError.details;
    }

    response.status(publicError.statusCode).json(body);
  };
}
