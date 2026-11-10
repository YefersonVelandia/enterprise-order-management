import 'dotenv/config';
import { prisma } from '../infrastructure/database/prisma-client.js';
import { logger } from '../infrastructure/logger/logger.js';

/**
 * Comprueba la conectividad con PostgreSQL usando el cliente Prisma
 * centralizado. Uso: `pnpm db:check`.
 */
async function main(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Conexión a PostgreSQL verificada correctamente');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'No se pudo conectar a PostgreSQL');
  process.exitCode = 1;
});
