import * as z from 'zod';

/**
 * Único punto de acceso a las variables de entorno de la aplicación.
 *
 * El resto del código debe consumir el objeto `env` validado en lugar de
 * leer `process.env` directamente. La carga de `dotenv` se realiza en los
 * puntos de entrada (`server.ts`, scripts de CLI y `prisma.config.ts`).
 */

const NODE_ENVS = ['development', 'test', 'production'] as const;
const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

/**
 * Valida que la URL sea absoluta y use el protocolo de PostgreSQL.
 *
 * Se implementa con un único `refine` (en lugar de `z.url().refine(...)`)
 * porque en Zod 4 los checks adicionales se ejecutan aunque el check
 * anterior falle; validar de forma defensiva evita que `new URL()` lance
 * un error sin envolver con entradas inválidas.
 */
const databaseUrlSchema = z.string().refine(isPostgreSqlUrl, {
  message: 'DATABASE_URL debe ser una URL válida con protocolo postgresql:// o postgres://',
});

function isPostgreSqlUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'postgresql:' || protocol === 'postgres:';
  } catch {
    return false;
  }
}

/**
 * Lista de orígenes CORS separados por comas.
 * Una cadena vacía o sin definir se interpreta como lista vacía.
 */
const corsOriginsSchema = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .refine((origins) => origins.every((origin) => z.url().safeParse(origin).success), {
    message: 'CORS_ORIGINS debe contener URLs válidas separadas por comas',
  });

const envSchema = z.object({
  /** Entorno de ejecución. */
  NODE_ENV: z.enum(NODE_ENVS).default('development'),

  /** Puerto del servidor HTTP. */
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  /** URL de conexión a PostgreSQL. Obligatoria y sin valor por defecto. */
  DATABASE_URL: databaseUrlSchema,

  /** Nivel de logs de Pino. */
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),

  /** Orígenes CORS permitidos (ver `corsOriginsSchema`). */
  CORS_ORIGINS: corsOriginsSchema,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Los mensajes se construyen solo con el nombre de la variable y la causa,
  // nunca con el valor recibido, para evitar exponer secretos.
  const issues = parsedEnv.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Configuración de entorno inválida:\n${issues}`);
}

export const env = parsedEnv.data;

export type Env = z.infer<typeof envSchema>;

export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
export const isProduction = env.NODE_ENV === 'production';
