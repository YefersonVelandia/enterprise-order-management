import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, isDevelopment, isProduction } from './config/env.js';
import { httpLogger } from './infrastructure/logger/http-logger.js';
import { healthRouter } from './modules/health/health.router.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

/**
 * Resuelve los orígenes CORS permitidos a partir de la configuración.
 *
 * - `CORS_ORIGINS` definido: solo se permiten esos orígenes en cualquier entorno.
 * - Sin `CORS_ORIGINS` en desarrollo: se permiten orígenes localhost para
 *   facilitar el trabajo con clientes locales (por ejemplo, un frontend).
 * - Sin `CORS_ORIGINS` en producción: CORS queda deshabilitado; nunca se
 *   permite `*` de forma implícita.
 */
function resolveCorsOrigins(): Array<string | RegExp> {
  if (env.CORS_ORIGINS.length > 0) {
    return env.CORS_ORIGINS;
  }

  if (isDevelopment) {
    return [/^https?:\/\/localhost(?::\d+)?$/];
  }

  return [];
}

/**
 * Construye la aplicación Express con el middleware transversal y las rutas.
 *
 * Se expone como fábrica para poder construir instancias aisladas en
 * pruebas; la instancia por defecto se exporta al final del módulo.
 */
export function createApp(): Express {
  const app = express();

  // Seguridad HTTP. Se deshabilita CSP porque la API solo sirve JSON y no
  // documentos HTML; el resto de cabeceras de Helmet quedan activas.
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS basado en variables de entorno. `credentials` permanece en false
  // porque la API todavía no usa cookies ni autenticación de navegador.
  app.use(cors({ origin: resolveCorsOrigins(), credentials: false }));

  // Logging estructurado de solicitudes y respuestas HTTP.
  app.use(httpLogger);

  // Parsing de JSON con límite de tamaño para mitigar payloads excesivos.
  app.use(express.json({ limit: '1mb' }));

  // TODO(rate-limit): insertar aquí el rate limiting global cuando se
  // implemente (fase de seguridad del roadmap).

  // Rutas de la aplicación.
  app.use(healthRouter);

  // Manejo de rutas inexistentes y de errores de forma centralizada.
  app.use(notFoundHandler);
  app.use(errorHandler({ exposeDetails: !isProduction }));

  return app;
}

const app = createApp();

export default app;
