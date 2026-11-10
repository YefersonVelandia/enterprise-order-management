# Enterprise Order Management System (EOMS)

Plataforma backend empresarial para la gestión de clientes, productos y pedidos, desarrollada con Node.js, TypeScript, Express 5 y PostgreSQL.

El proyecto tiene como objetivo implementar una arquitectura modular, escalable y mantenible, integrando comunicación síncrona mediante APIs REST y GraphQL, y comunicación asíncrona mediante Apache Kafka.

## Estado actual

Este repositorio se encuentra en la **fase de configuración e infraestructura base** (Fases 0 y parte de la 1 del [roadmap](docs/ROADMAP.md)). La lógica de negocio todavía no está implementada.

**Implementado:**

- Configuración centralizada y validada de variables de entorno (Zod).
- Servidor Express 5 con ciclo de vida completo (arranque, SIGINT/SIGTERM, cierre controlado de conexiones externas).
- Logging estructurado JSON con Pino + pino-http (requestId, redacción de datos sensibles).
- Manejo centralizado de errores con respuestas JSON consistentes.
- Seguridad HTTP: Helmet, límite de tamaño de JSON, CORS basado en variables de entorno.
- Health checks: `GET /health` (liveness) y `GET /ready` (readiness con verificación de PostgreSQL).
- Cliente Prisma 7 centralizado con driver adapter `@prisma/adapter-pg`.
- Pruebas unitarias y HTTP con Vitest + Supertest.

**Pendiente (fuera del alcance de esta etapa):**

- Módulos de negocio: productos, inventario, clientes y pedidos.
- Autenticación y autorización (JWT, RBAC), rate limiting.
- Modelo de datos, migraciones y repositorios.
- Apache Kafka, GraphQL, integraciones externas y despliegue en Azure.

## Stack tecnológico

| Categoría     | Tecnología                      |
| ------------- | ------------------------------- |
| Runtime       | Node.js                         |
| Lenguaje      | TypeScript (modo estricto)      |
| Backend       | Express 5                       |
| Base de datos | PostgreSQL                      |
| ORM           | Prisma 7 (`@prisma/adapter-pg`) |
| Validación    | Zod                             |
| Logging       | Pino + pino-http                |
| Testing       | Vitest + Supertest              |
| Contenedores  | Docker Compose                  |

## Requisitos del entorno

- **Node.js** ≥ 22 (recomendado: 24 LTS).
- **pnpm** 12.18.0 (versión fijada en `package.json` mediante `packageManager`; Node la activa automáticamente con Corepack).
- **Docker** (solo necesario para levantar PostgreSQL).

## Instalación

```bash
pnpm install
```

## Variables de entorno

Copia el ejemplo y completa los valores:

```bash
cp .env.example .env
```

| Variable       | Requerida | Por defecto   | Descripción                                                                                               |
| -------------- | --------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`     | No        | `development` | `development` \| `test` \| `production`                                                                   |
| `PORT`         | No        | `3000`        | Puerto del servidor HTTP (1-65535)                                                                        |
| `DATABASE_URL` | **Sí**    | —             | URL de PostgreSQL (`postgresql://` o `postgres://`). Sin valor por defecto a propósito.                   |
| `LOG_LEVEL`    | No        | `info`        | `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal`                                              |
| `CORS_ORIGINS` | No        | (vacío)       | Lista de orígenes separados por comas. Vacío en producción deshabilita CORS (nunca se usa `*` implícito). |

> La aplicación falla al arrancar con un mensaje claro si alguna variable es inválida. El mensaje nunca incluye los valores recibidos, para no exponer secretos.

## PostgreSQL con Docker Compose

```bash
docker compose up -d postgres
```

Esto levanta `postgres:18.6` en el puerto `5432` (usuario `postgres`, contraseña `postgres`, base de datos `eoms`). Después configura `DATABASE_URL` en `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eoms
```

Verifica la conectividad:

```bash
pnpm db:check
```

## Comandos

| Comando             | Descripción                                         |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Servidor de desarrollo con recarga (`tsx watch`).   |
| `pnpm build`        | Compila a `dist/` (`tsc`).                          |
| `pnpm start`        | Ejecuta el build compilado (`node dist/server.js`). |
| `pnpm typecheck`    | Validación de tipos sin emitir (`tsc --noEmit`).    |
| `pnpm lint`         | ESLint.                                             |
| `pnpm lint:fix`     | ESLint con correcciones automáticas.                |
| `pnpm format`       | Formatea todo el proyecto con Prettier.             |
| `pnpm format:check` | Verifica el formato sin modificar.                  |
| `pnpm test`         | Ejecuta todas las pruebas una vez.                  |
| `pnpm test:watch`   | Pruebas en modo watch.                              |
| `pnpm db:generate`  | Genera el cliente Prisma.                           |
| `pnpm db:validate`  | Valida `prisma/schema.prisma`.                      |
| `pnpm db:check`     | Comprueba la conectividad con PostgreSQL.           |

Tras editar `prisma/schema.prisma`, ejecuta `pnpm prisma migrate dev` y `pnpm db:generate` para crear la migración y regenerar el cliente.

## Health checks

**Liveness** — verifica únicamente que el proceso HTTP responde (no consulta dependencias):

```bash
curl http://localhost:3000/health
# { "status": "ok", "service": "enterprise-order-management" }
```

**Readiness** — verifica que las dependencias esenciales estén disponibles (actualmente PostgreSQL mediante `SELECT 1` con el cliente Prisma centralizado):

```bash
curl http://localhost:3000/ready
# 200: { "status": "ok", "checks": [{ "name": "database", "status": "up" }] }
# 503: { "status": "unavailable", "checks": [{ "name": "database", "status": "down" }] }
```

La respuesta de `/ready` nunca incluye detalles internos de conexión (host, credenciales o mensajes de error); los fallos se registran solo en el log interno.

Cada solicitud recibe un `x-request-id` (propagado si el cliente envía ese encabezado, generado como UUID en caso contrario) para correlación entre logs y respuestas.

## Estructura del proyecto

```
src/
├── app.ts                          # Ensamblado de la app Express (middleware + rutas)
├── server.ts                        # Punto de entrada: arranque y ciclo de vida del proceso
├── config/
│   └── env.ts                       # Validación centralizada de variables de entorno (Zod)
├── common/
│   └── errors/
│       └── http-error.ts            # Clase HttpError y forma del cuerpo de error
├── middlewares/
│   ├── not-found.middleware.ts      # 404 JSON para rutas inexistentes
│   └── error-handler.middleware.ts  # Manejo centralizado de errores
├── infrastructure/
│   ├── database/
│   │   └── prisma-client.ts         # Cliente Prisma centralizado + desconexión
│   └── logger/
│       ├── logger.ts                # Fábrica y instancia del logger Pino
│       └── http-logger.ts           # Middleware pino-http (requestId, niveles)
├── modules/
│   └── health/
│       ├── health.router.ts         # Rutas /health y /ready
│       └── readiness.service.ts     # Comprobaciones de dependencias
├── scripts/
│   └── check-database.ts            # Script CLI de verificación de PostgreSQL
└── test/
    └── setup.ts                     # Variables de entorno para pruebas
```

Convenciones:

- ESM + TypeScript `NodeNext`: los imports relativos incluyen la extensión `.js`.
- Tests colocados junto al código (`src/**/*.spec.ts`).
- Comentarios y documentación en español.
- Los módulos de negocio vivirán en `src/modules/<modulo>/` con su router y servicios; la infraestructura puede evolucionar sin que la lógica dependa directamente de Express o Prisma.

## Pruebas

```bash
pnpm test        # ejecución única
pnpm test:watch  # modo observación
```

Suites actuales:

- **Unitarias**: validación de entorno (`src/config/env.spec.ts`), `HttpError` (`src/common/errors/http-error.spec.ts`), redacción de logs (`src/infrastructure/logger/logger.spec.ts`).
- **HTTP**: aplicación ensamblada y rutas de salud (`src/app.spec.ts`, `src/modules/health/health.spec.ts`), middleware de errores (`src/middlewares/error-handler.spec.ts`).
- **Integración con PostgreSQL**: pendiente. Las pruebas HTTP de `/ready` simulan el cliente Prisma (`vi.mock`) para ser deterministas. Cuando exista modelo de datos, la estrategia recomendada es:
  1. Levantar una base de datos efímera para pruebas (por ejemplo, otro servicio en `docker-compose.yml` con `POSTGRES_DB=eoms_test`).
  2. Apuntar `DATABASE_URL` a esa base en un entorno de CI dedicado.
  3. Ejecutar las pruebas de integración en una suite separada (por ejemplo `pnpm test:integration`) para no acoplar el ciclo de desarrollo a una base en ejecución.

## Seguridad

Implementado en esta etapa:

- Helmet (CSP deshabilitada por tratarse de una API JSON; resto de cabeceras activas).
- Límite de tamaño del body JSON (`1mb`).
- CORS cerrado por defecto en producción y basado en `CORS_ORIGINS` (sin `*` implícito, sin credenciales).
- Redacción de datos sensibles en logs (contraseñas, tokens, cookies, `Authorization`).
- Respuestas de error sin stack traces ni detalles internos en producción.
- `DATABASE_URL` obligatoria y validada; los mensajes de error de configuración no exponen valores.

Pendiente (fase de seguridad del roadmap): autenticación JWT, RBAC, rate limiting, validación de esquemas de entrada por módulo, auditoría.

## Nota sobre la versión de TypeScript

El proyecto usa `typescript@~6.0.3` (línea JavaScript del compilador). `typescript-eslint` todavía no soporta TypeScript 7.x (el compilador nativo, que ya no expone la API JS que usa el tooling; seguimiento en [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)). Al publicarse el soporte, se puede volver a TS 7 sin cambios de código.

## Git workflow

Git Flow manual: ramas `feature/*` y `bugfix/*` desde `develop`; integración por Pull Request hacia `develop`; `main` solo para versiones estables.
