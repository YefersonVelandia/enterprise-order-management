import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Pruebas unitarias de la validación de variables de entorno.
 *
 * `env.ts` valida `process.env` en el momento de la importación, por lo que
 * cada caso reimporta el módulo tras modificar las variables y restaura el
 * entorno original al terminar.
 */

const VALID_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/eoms';

const MANAGED_KEYS = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'LOG_LEVEL', 'CORS_ORIGINS'] as const;

type ManagedKey = (typeof MANAGED_KEYS)[number];

// Copia del entorno original para restaurar tras cada prueba.
const originalEnv = new Map<string, string | undefined>(
  MANAGED_KEYS.map((key) => [key, process.env[key]]),
);

async function importEnv(): Promise<typeof import('./env.js')> {
  vi.resetModules();
  return import('./env.js');
}

/** Borra las variables gestionadas y aplica solo las del caso de prueba. */
function setEnvironment(overrides: Partial<Record<ManagedKey, string>>): void {
  for (const key of MANAGED_KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(overrides) as Array<[ManagedKey, string]>) {
    process.env[key] = value;
  }
}

afterEach(() => {
  for (const [key, value] of originalEnv) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  vi.resetModules();
});

describe('validación de variables de entorno', () => {
  it('aplica los valores por defecto cuando no están definidas', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL });

    const { env } = await importEnv();

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it('coerce PORT a número entero', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL, PORT: '4000' });

    const { env } = await importEnv();

    expect(env.PORT).toBe(4000);
  });

  it('acepta la URL con protocolo postgres://', async () => {
    setEnvironment({ DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/eoms' });

    const { env } = await importEnv();

    expect(env.DATABASE_URL).toBe('postgres://postgres:postgres@localhost:5432/eoms');
  });

  it('rechaza DATABASE_URL ausente', async () => {
    setEnvironment({});

    await expect(importEnv()).rejects.toThrow(/DATABASE_URL/);
  });

  it('rechaza DATABASE_URL con protocolo distinto de PostgreSQL', async () => {
    setEnvironment({ DATABASE_URL: 'mysql://usuario:clave@localhost:3306/eoms' });

    await expect(importEnv()).rejects.toThrow(/DATABASE_URL/);
  });

  it('rechaza DATABASE_URL con formato inválido', async () => {
    setEnvironment({ DATABASE_URL: 'no-es-una-url' });

    await expect(importEnv()).rejects.toThrow(/DATABASE_URL/);
  });

  it('rechaza PORT fuera de rango', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL, PORT: '70000' });

    await expect(importEnv()).rejects.toThrow(/PORT/);
  });

  it('rechaza PORT no numérico', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL, PORT: 'no-un-puerto' });

    await expect(importEnv()).rejects.toThrow(/PORT/);
  });

  it('rechaza LOG_LEVEL inválido', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL, LOG_LEVEL: 'verbose' });

    await expect(importEnv()).rejects.toThrow(/LOG_LEVEL/);
  });

  it('rechaza NODE_ENV inválido', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL, NODE_ENV: 'staging' });

    await expect(importEnv()).rejects.toThrow(/NODE_ENV/);
  });

  it('parsea CORS_ORIGINS separadas por comas', async () => {
    setEnvironment({
      DATABASE_URL: VALID_DATABASE_URL,
      CORS_ORIGINS: 'http://localhost:5173, https://app.ejemplo.com ,http://localhost:3000',
    });

    const { env } = await importEnv();

    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:5173',
      'https://app.ejemplo.com',
      'http://localhost:3000',
    ]);
  });

  it('rechaza CORS_ORIGINS con entradas que no son URLs válidas', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL, CORS_ORIGINS: 'http://ok.com,no-es-url' });

    await expect(importEnv()).rejects.toThrow(/CORS_ORIGINS/);
  });

  it('acepta CORS_ORIGINS vacío como lista vacía', async () => {
    setEnvironment({ DATABASE_URL: VALID_DATABASE_URL, CORS_ORIGINS: '' });

    const { env } = await importEnv();

    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it('no incluye el valor de las variables en el mensaje de error', async () => {
    setEnvironment({ DATABASE_URL: 'no-es-una-url-con-clave-super-secreta' });

    const importPromise = importEnv();

    // Verifica que el mensaje no exponga el valor recibido.
    try {
      await importPromise;
      throw new Error('La importación debía fallar con una URL inválida');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toContain('DATABASE_URL');
      expect(message).not.toContain('clave-super-secreta');
    }
  });
});
