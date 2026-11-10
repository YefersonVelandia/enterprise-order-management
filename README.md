# Enterprise Order Management System (EOMS)

Plataforma backend empresarial para la gestión de clientes, productos y pedidos, desarrollada con Node.js, TypeScript y PostgreSQL.

El proyecto tiene como objetivo implementar una arquitectura modular, escalable y mantenible, integrando comunicación síncrona mediante APIs REST y GraphQL, y comunicación asíncrona mediante Apache Kafka.

También contempla prácticas de seguridad, pruebas automatizadas, observabilidad y despliegue en Microsoft Azure.

## Objetivos

- Construir APIs RESTful con Node.js y Express.
- Aplicar principios SOLID, Clean Code y separación de responsabilidades.
- Implementar persistencia con PostgreSQL y Prisma ORM.
- Diseñar flujos de procesamiento asíncrono con Apache Kafka.
- Implementar consultas GraphQL.
- Aplicar controles de seguridad basados en OWASP Top 10.
- Integrar servicios y APIs externas.
- Implementar pruebas unitarias y de integración.
- Preparar la aplicación para despliegue en Azure.
- Documentar decisiones y arquitectura del sistema.

## Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Runtime | Node.js |
| Lenguaje | TypeScript |
| Backend | Express |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Mensajería | Apache Kafka |
| API | REST y GraphQL |
| Validación | Zod |
| Seguridad | OWASP, Helmet, JWT |
| Testing | Vitest |
| Contenedores | Docker |
| Cloud | Microsoft Azure |
| CI/CD | Azure DevOps |

## Arquitectura

Se utilizará una arquitectura modular con separación entre dominio, aplicación e infraestructura.

Los procesos de consumo de eventos se ejecutarán de forma independiente de la API HTTP.

### Módulos principales

- Auth: autenticación y autorización.
- Customers: administración de clientes.
- Products: administración de productos e inventario.
- Orders: gestión de pedidos.
- Notifications: procesamiento de notificaciones.
- Infrastructure: persistencia, mensajería y servicios externos.

## Procesamiento de eventos

La creación de pedidos generará eventos de negocio que serán publicados en Kafka.

Los consumidores procesarán independientemente las operaciones de inventario y notificaciones.

Se contemplan mecanismos de idempotencia, reintentos, manejo de errores y Transactional Outbox.

## Estructura de documentación

- `docs/ROADMAP.md`: etapas y objetivos de desarrollo.
- `docs/architecture/`: arquitectura, diagramas y decisiones técnicas.
- `docs/security/`: análisis de riesgos y controles OWASP.
- `docs/api/`: documentación de APIs.
- `docs/operations/`: ejecución, despliegue y monitoreo.

## Git workflow

Se utilizará Git Flow de forma manual, sin instalar extensiones adicionales.

- `main`: versiones estables.
- `develop`: integración de funcionalidades.
- `feature/*`: nuevas funcionalidades.
- `bugfix/*`: correcciones.
- `release/*`: preparación de versiones.
- `hotfix/*`: correcciones urgentes de producción.

Las funcionalidades se integrarán mediante Pull Requests hacia `develop`. Las versiones aprobadas pasarán de `develop` a `main` mediante un Pull Request.

## Ejecución

Los requisitos de instalación, variables de entorno, servicios Docker y comandos de ejecución se documentarán a medida que se implementen las primeras etapas.

## Estado del proyecto

En desarrollo.

Este proyecto tiene un enfoque práctico y educativo, orientado al diseño de soluciones backend empresariales y al fortalecimiento de conocimientos en Node.js, arquitectura orientada a eventos, seguridad y Azure.