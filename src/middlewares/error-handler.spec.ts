import express, { type Express, type RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { HttpError } from '../common/errors/http-error.js';
import { errorHandler } from './error-handler.middleware.js';

/**
 * Pruebas del middleware central de errores.
 *
 * Cada caso construye una aplicación mínima con una ruta que falla y el
 * middleware bajo prueba, sin depender de la aplicación completa.
 */

function createTestApp(routeHandler: RequestHandler, exposeDetails: boolean): Express {
  const app = express();
  app.get('/test', routeHandler);
  app.use(errorHandler({ exposeDetails }));
  return app;
}

describe('errorHandler', () => {
  it('responde con statusCode, message y error para HttpError', async () => {
    const app = createTestApp(() => {
      throw new HttpError(404, 'Order not found');
    }, true);

    const response = await request(app).get('/test');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Order not found',
      error: 'NOT_FOUND',
    });
  });

  it('responde 500 con mensaje genérico para errores inesperados', async () => {
    const app = createTestApp(() => {
      throw new Error('fallo interno con detalle sensible');
    }, false);

    const response = await request(app).get('/test');

    expect(response.statusCode).toBe(500);
    expect(response.body.statusCode).toBe(500);
    expect(response.body.message).toBe('Internal server error');
    expect(response.body.error).toBe('INTERNAL_SERVER_ERROR');
  });

  it('incluye detalles internos cuando exposeDetails es true (desarrollo)', async () => {
    const app = createTestApp(() => {
      throw new Error('detalle interno para diagnóstico');
    }, true);

    const response = await request(app).get('/test');

    expect(response.statusCode).toBe(500);
    expect(response.body.details).toBe('detalle interno para diagnóstico');
  });

  it('no expone detalles internos cuando exposeDetails es false (producción)', async () => {
    const app = createTestApp(() => {
      throw new Error('detalle sensible: usuario=admin contraseña=secreta');
    }, false);

    const response = await request(app).get('/test');

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('Internal server error');
    expect(response.body.details).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('detalle sensible');
    expect(JSON.stringify(response.body)).not.toContain('secreta');
  });

  it('maneja errores lanzados desde handlers asíncronos', async () => {
    const app = createTestApp(async () => {
      throw new HttpError(409, 'Order already cancelled', 'ORDER_ALREADY_CANCELLED');
    }, true);

    const response = await request(app).get('/test');

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({
      statusCode: 409,
      message: 'Order already cancelled',
      error: 'ORDER_ALREADY_CANCELLED',
    });
  });

  it('trata los errores de JSON inválido como errores controlados', async () => {
    const app = express();
    app.use(express.json());
    app.post('/test', (_request, response) => {
      response.status(200).json({ ok: true });
    });
    app.use(errorHandler({ exposeDetails: true }));

    const response = await request(app)
      .post('/test')
      .set('content-type', 'application/json')
      .send('{ json-invalido');

    expect(response.statusCode).toBe(400);
    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('BAD_REQUEST');
  });
});
