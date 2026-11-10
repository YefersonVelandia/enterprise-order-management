import 'dotenv/config';
import { env } from './config/env.js';
import app from './app.js';
import { disconnectPrisma } from './infrastructure/database/prisma-client.js';
import { logger } from './infrastructure/logger/logger.js';

/**
 * Punto de entrada del servidor HTTP.
 *
 * Este módolo solo se encarga del ciclo de vida del proceso: iniciar el
 * servidor, escuchar las señales de apagado y cerrar las conexiones
 * externas. La definición de rutas y middleware vive en `app.ts`.
 */

/** Tiempo máximo de espera del cierre elegante antes de forzar el corte. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'Servidor HTTP iniciado');
});

/**
 * Conexiones externas que deben cerrarse durante el apagado controlado.
 * Para agregar un cliente externo futuro (Kafka, APIs externas, etc.) se
 * agrega una entrada a este arreglo.
 */
const externalDependencies: ReadonlyArray<{ name: string; close: () => Promise<void> }> = [
  { name: 'postgresql', close: disconnectPrisma },
];

/** Evita ejecutar el cierre más de una vez si llegan señales repetidas. */
let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) {
    logger.warn({ signal }, 'Se recibió otra señal de apagado mientras el cierre está en curso');
    return;
  }

  shuttingDown = true;
  logger.info({ signal }, 'Iniciando apagado controlado');

  // Evita que conexiones keep-alive abiertas bloqueen el cierre indefinidamente.
  const forceCloseTimer = setTimeout(() => {
    logger.warn(
      { timeoutMs: SHUTDOWN_TIMEOUT_MS },
      'Forzando el cierre de conexiones HTTP abiertas',
    );
    server.closeAllConnections();
  }, SHUTDOWN_TIMEOUT_MS);
  forceCloseTimer.unref();

  server.close(async (closeError) => {
    clearTimeout(forceCloseTimer);

    if (closeError) {
      logger.error({ err: closeError }, 'Error al cerrar el servidor HTTP');
      process.exitCode = 1;
    } else {
      logger.info('Servidor HTTP cerrado');
    }

    for (const dependency of externalDependencies) {
      try {
        await dependency.close();
        logger.info({ dependency: dependency.name }, 'Conexión externa cerrada');
      } catch (error) {
        logger.error(
          { err: error, dependency: dependency.name },
          'Error al cerrar una conexión externa',
        );
        process.exitCode = 1;
      }
    }

    logger.info('Apagado completado');
  });
}

// `once` evita registrar listeners de apagado duplicados.
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
