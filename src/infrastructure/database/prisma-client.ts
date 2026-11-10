import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env.js';

/**
 * Cliente Prisma centralizado de la aplicación.
 *
 * La URL de conexión proviene del objeto `env` validado. Crear el cliente
 * (y el pool de `pg` del adapter) no abre conexiones: se establecen de
 * forma diferida con la primera consulta, por lo que importar este módulo
 * no consume recursos de base de datos.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
});

/**
 * Cierra de forma controlada el pool de conexiones de PostgreSQL.
 * Debe invocarse durante el apagado del proceso.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
