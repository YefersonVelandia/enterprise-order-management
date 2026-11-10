import { prisma } from '../../infrastructure/database/prisma-client.js';
import { logger } from '../../infrastructure/logger/logger.js';

/** Estado de una dependencia verificada. */
export type DependencyStatus = 'up' | 'down';

/** Resultado de una comprobación individual de dependencia. */
export interface ReadinessCheckResult {
  name: string;
  status: DependencyStatus;
}

/** Resultado agregado de todas las comprobaciones. */
export interface ReadinessResult {
  ready: boolean;
  checks: ReadonlyArray<ReadinessCheckResult>;
}

/** Contrato mínimo de una comprobación de dependencia. */
interface ReadinessCheck {
  name: string;
  run: () => Promise<void>;
}

/**
 * Verifica que PostgreSQL acepte consultas.
 * Reutiliza el cliente Prisma centralizado: el pool de conexiones
 * subyacente se comparte entre comprobaciones y con el resto de la API.
 */
async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

/**
 * Dependencias que determinan la preparación del servicio.
 *
 * Para agregar una dependencia futura (Kafka, APIs externas, etc.) se
 * agrega una entrada a este arreglo; la ruta `/ready` y su respuesta no
 * requieren cambios.
 */
const readinessChecks: ReadonlyArray<ReadinessCheck> = [{ name: 'database', run: checkDatabase }];

/**
 * Ejecuta todas las comprobaciones de dependencias.
 *
 * Los fallos se registran en el log interno (para diagnóstico) pero nunca
 * se exponen en la respuesta HTTP, para no filtrar información de conexión.
 */
export async function checkReadiness(): Promise<ReadinessResult> {
  const checks = await Promise.all(
    readinessChecks.map(async (check): Promise<ReadinessCheckResult> => {
      try {
        await check.run();
        return { name: check.name, status: 'up' };
      } catch (error) {
        logger.warn({ err: error, dependency: check.name }, 'La dependencia no está disponible');
        return { name: check.name, status: 'down' };
      }
    }),
  );

  return {
    ready: checks.every((check) => check.status === 'up'),
    checks,
  };
}
