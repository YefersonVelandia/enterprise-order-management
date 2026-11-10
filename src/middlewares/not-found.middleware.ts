import type { RequestHandler } from 'express';

/**
 * Middleware para solicitudes a rutas no registradas.
 *
 * Sustituye la respuesta HTML por defecto de Express por un cuerpo JSON
 * consistente con el resto de errores de la API.
 */
export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    statusCode: 404,
    message: `Cannot ${request.method} ${request.originalUrl}`,
    error: 'NOT_FOUND',
  });
};
