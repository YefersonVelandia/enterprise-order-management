import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../infrastructure/database/prisma-client.js';

/**
 * Pruebas HTTP de la ruta /ready.
 *
 * El cliente Prisma se simula para que las pruebas no dependan de
 * PostgreSQL y sean deterministas (200 y 503).
 *
 * Las pruebas de integración con una base de datos real se documentan en
 * el README y aún no se ejecutan en CI.
 */
vi.mock('../../infrastructure/database/prisma-client.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  disconnectPrisma: vi.fn(),
}));

const queryRawMock = vi.mocked(prisma.$queryRaw);

describe('GET /ready', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it('responde 200 cuando PostgreSQL está disponible', async () => {
    queryRawMock.mockResolvedValue([]);

    const response = await request(app).get('/ready');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      checks: [{ name: 'database', status: 'up' }],
    });
  });

  it('responde 503 cuando PostgreSQL no está disponible', async () => {
    queryRawMock.mockRejectedValue(
      new Error('connect ECONNREFUSED 127.0.0.1:5432 usuario=postgres'),
    );

    const response = await request(app).get('/ready');

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({
      status: 'unavailable',
      checks: [{ name: 'database', status: 'down' }],
    });
  });

  it('no expone detalles internos de conexión en la respuesta de fallo', async () => {
    queryRawMock.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

    const response = await request(app).get('/ready');

    expect(JSON.stringify(response.body)).not.toContain('ECONNREFUSED');
    expect(JSON.stringify(response.body)).not.toContain('5432');
  });

  it('reutiliza el cliente Prisma centralizado para la comprobación', async () => {
    queryRawMock.mockResolvedValue([]);

    await request(app).get('/ready');

    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });
});
