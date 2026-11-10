import type { Logger } from 'pino';
import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

/**
 * Pruebas unitarias del logger: redacción de información sensible y
 * respeto del nivel configurado.
 *
 * Se usa la fábrica `createLogger` con un destino en memoria para poder
 * inspeccionar el JSON serializado sin acoplar las pruebas al stdout.
 */

interface CapturedLogger {
  logger: Logger;
  getEntries: () => Array<Record<string, unknown>>;
}

function captureLogs(level?: 'info' | 'error'): CapturedLogger {
  const lines: string[] = [];
  const logger = createLogger({
    level: level ?? 'info',
    destination: { write: (chunk: string) => lines.push(chunk) },
  });

  return {
    logger,
    getEntries: () => lines.map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

describe('createLogger', () => {
  it('redacta contraseñas y tokens en objetos anidados', () => {
    const { logger, getEntries } = captureLogs();

    logger.info({ user: { name: 'admin', password: 'secreto', token: 'abc123' } }, 'login');

    const entries = getEntries();
    expect(entries).toHaveLength(1);

    const user = entries[0]?.user as Record<string, unknown>;
    expect(user.name).toBe('admin');
    expect(user.password).toBe('[REDACTED]');
    expect(user.token).toBe('[REDACTED]');
  });

  it('redacta el encabezado Authorization en objetos de solicitud', () => {
    const { logger, getEntries } = captureLogs();

    logger.info(
      {
        req: {
          method: 'GET',
          url: '/health',
          headers: { authorization: 'Bearer token-super-secreto' },
        },
      },
      'request completed',
    );

    const req = getEntries()[0]?.req as Record<string, unknown>;
    const headers = req.headers as Record<string, unknown>;
    expect(req.method).toBe('GET');
    expect(headers.authorization).toBe('[REDACTED]');
  });

  it('redacta cookies y claves de API', () => {
    const { logger, getEntries } = captureLogs();

    logger.info({ cookie: 'session=abc', apiKey: 'sk-12345' }, 'datos sensibles');

    const entry = getEntries()[0];
    expect(entry?.cookie).toBe('[REDACTED]');
    expect(entry?.apiKey).toBe('[REDACTED]');
  });

  it('registra la información no sensible sin modificarla', () => {
    const { logger, getEntries } = captureLogs();

    logger.info({ user: { name: 'admin', role: 'admin' } }, 'login');

    const user = getEntries()[0]?.user as Record<string, unknown>;
    expect(user.name).toBe('admin');
    expect(user.role).toBe('admin');
  });

  it('respeta el nivel configurado', () => {
    const { logger, getEntries } = captureLogs('error');

    logger.info({ password: 'no-debe-appear' }, 'mensaje informativo');
    logger.error('error visible');

    const entries = getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.msg).toBe('error visible');
  });

  it('produce logs JSON estructurados', () => {
    const { logger, getEntries } = captureLogs();

    logger.info({ statusCode: 200 }, 'request completed');

    const entry = getEntries()[0];
    expect(entry?.statusCode).toBe(200);
    expect(entry?.msg).toBe('request completed');
    expect(entry?.level).toBe(30);
    expect(entry?.time).toBeDefined();
  });
});
