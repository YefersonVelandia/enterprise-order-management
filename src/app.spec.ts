import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from './app.js';

/**
 * Pruebas HTTP de la aplicación ensamblada: endpoints de salud y
 * comportamiento de rutas inexistentes.
 */

describe('GET /health', () => {
  it('responde 200 con el estado del servicio HTTP', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('enterprise-order-management');
  });
});

describe('correlación de solicitudes (pino-http)', () => {
  it('propaga el requestId recibido y lo devuelve como encabezado', async () => {
    const response = await request(app).get('/health').set('x-request-id', 'id-correlacion-test');

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBe('id-correlacion-test');
  });

  it('genera un requestId cuando el cliente no lo envía', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('ruta inexistente', () => {
  it('responde 404 con un cuerpo JSON consistente', async () => {
    const response = await request(app).get('/ruta-que-no-existe');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Cannot GET /ruta-que-no-existe',
      error: 'NOT_FOUND',
    });
  });

  it('responde con JSON incluso para métodos distintos', async () => {
    const response = await request(app).post('/otra-ruta-inexistente');

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('NOT_FOUND');
    expect(response.body.statusCode).toBe(404);
  });
});
