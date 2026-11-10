import { Router } from 'express';
import { checkReadiness } from './readiness.service.js';

export const healthRouter: Router = Router();

/**
 * GET /health
 *
 * Verifica únicamente que el proceso HTTP responde. No consulta dependencias
 * externas: sirve para liveness probes y para comprobar el despliegue.
 */
healthRouter.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'enterprise-order-management',
  });
});

/**
 * GET /ready
 *
 * Verifica que las dependencias esenciales estén disponibles (actualmente
 * PostgreSQL). Responde 200 cuando todo está disponible y 503 cuando alguna
 * dependencia no lo está, sin exponer detalles internos de conexión.
 */
healthRouter.get('/ready', async (_request, response) => {
  const readiness = await checkReadiness();
  const statusCode = readiness.ready ? 200 : 503;

  response.status(statusCode).json({
    status: readiness.ready ? 'ok' : 'unavailable',
    checks: readiness.checks,
  });
});
