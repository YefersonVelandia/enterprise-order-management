import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from './logger.js';

/** Longitud máxima aceptada para un requestId recibido del cliente. */
const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Normaliza el encabezado `x-request-id` entrante.
 * Devuelve `undefined` cuando el encabezado está ausente, está vacío o
 * llega como lista; en ese caso se genera un nuevo UUID.
 */
function normalizeRequestId(header: string | string[] | undefined): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;

  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  return value.trim().slice(0, MAX_REQUEST_ID_LENGTH);
}

/**
 * Middleware de logging HTTP basado en pino-http.
 *
 * Para cada solicitud registra método, URL, código de estado, duración y
 * `requestId` (los serializadores por defecto incluyen `req.id`,
 * `req.method`, `req.url`, `res.statusCode` y `responseTime`). El
 * `requestId` se propaga también como encabezado de respuesta para
 * correlacionar solicitudes con soporte.
 *
 * La redacción de encabezados sensibles (Authorization, cookies) la realiza
 * Pino a través de las rutas configuradas en `createLogger`.
 */
export const httpLogger = pinoHttp({
  logger,

  genReqId(request, response) {
    const requestId = normalizeRequestId(request.headers['x-request-id']) ?? randomUUID();
    response.setHeader('x-request-id', requestId);
    return requestId;
  },

  autoLogging: true,

  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) return 'error';
    if (response.statusCode >= 400) return 'warn';
    return 'info';
  },
});
