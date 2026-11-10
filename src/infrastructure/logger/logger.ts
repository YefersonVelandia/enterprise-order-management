import pino, { type DestinationStream, type Level, type Logger } from 'pino';
import { env } from '../../config/env.js';

/**
 * Rutas de campos sensibles que Pino redacta en cualquier objeto registrado.
 *
 * Incluye tanto campos de negocio habituales (contraseñas, tokens) como las
 * rutas que usan los serializadores por defecto de pino-http
 * (`req.headers.*`, `res.headers.*`).
 */
const REDACT_PATHS: ReadonlyArray<string> = [
  'password',
  '*.password',
  'token',
  '*.token',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
  'secret',
  '*.secret',
  'apiKey',
  '*.apiKey',
  'authorization',
  '*.authorization',
  'cookie',
  '*.cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers.set-cookie',
];

export interface CreateLoggerOptions {
  /** Nivel de log; por defecto usa `LOG_LEVEL` del entorno. */
  level?: Level;
  /** Destino de los logs; por defecto stdout. */
  destination?: DestinationStream;
}

/**
 * Crea un logger Pino con la configuración transversal del proyecto:
 * JSON estructurado, nivel configurable y redacción de datos sensibles.
 *
 * Se expone como fábrica para poder inyectar destinos alternativos en
 * pruebas sin acoplarlas al stdout del proceso.
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
  return pino(
    {
      level: options.level ?? env.LOG_LEVEL,
      redact: { paths: [...REDACT_PATHS], censor: '[REDACTED]' },
    },
    options.destination,
  );
}

/** Logger centralizado de la aplicación. */
export const logger: Logger = createLogger();
