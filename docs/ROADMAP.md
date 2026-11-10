# EOMS — Roadmap de implementación

## Fase 0. Definición y configuración

**Objetivo:** preparar el entorno y establecer las reglas del proyecto.

- [ ] Crear repositorio GitHub.
- [ ] Crear ramas `main` y `develop`.
- [ ] Crear README.md.
- [ ] Crear estructura de documentación.
- [ ] Inicializar Node.js y TypeScript.
- [ ] Configurar Express.
- [ ] Configurar ESLint u Oxlint y Prettier.
- [ ] Configurar variables de entorno.
- [ ] Crear Docker Compose.
- [ ] Configurar PostgreSQL.

**Criterio de aceptación:** aplicación ejecutándose localmente, configuración reproducible y primera integración mediante PR.

## Fase 1. Arquitectura y persistencia

**Objetivo:** implementar la base de la aplicación.

- [ ] Definir arquitectura modular.
- [ ] Separar dominio, aplicación e infraestructura.
- [ ] Diseñar modelo de datos.
- [ ] Configurar Prisma.
- [ ] Crear migraciones.
- [ ] Implementar repositorios.
- [ ] Implementar transacciones.
- [ ] Configurar manejo centralizado de errores.

**Criterio de aceptación:** operaciones de persistencia funcionales, sin acoplar las reglas de negocio a Prisma.

## Fase 2. API REST y reglas de negocio

**Objetivo:** construir las funcionalidades principales.

- [ ] CRUD de clientes.
- [ ] CRUD de productos.
- [ ] Gestión de inventario.
- [ ] Creación de pedidos.
- [ ] Validaciones de negocio.
- [ ] Paginación y filtros.
- [ ] Documentación OpenAPI/Swagger.
- [ ] Pruebas unitarias e integración.

**Criterio de aceptación:** API REST funcional y documentada.

## Fase 3. Seguridad — OWASP

**Objetivo:** proteger la aplicación y sus recursos.

- [ ] Autenticación.
- [ ] Hash de contraseñas.
- [ ] JWT y expiración.
- [ ] Autorización RBAC.
- [ ] Protección contra IDOR/BOLA.
- [ ] Validación de entradas.
- [ ] Protección contra inyección.
- [ ] Rate limiting.
- [ ] Configuración segura de CORS y Helmet.
- [ ] Gestión de secretos.
- [ ] Logs de auditoría.
- [ ] Pruebas de seguridad.

**Criterio de aceptación:** controles de seguridad demostrables y documentados.

## Fase 4. Apache Kafka

**Objetivo:** implementar comunicación orientada a eventos.

- [ ] Configurar Kafka en Docker.
- [ ] Crear topics.
- [ ] Implementar Producer.
- [ ] Implementar Consumer.
- [ ] Configurar Consumer Groups.
- [ ] Entender particiones y offsets.
- [ ] Implementar evento `order.created`.
- [ ] Crear Inventory Worker.
- [ ] Crear Notification Worker.
- [ ] Implementar idempotencia.
- [ ] Implementar reintentos.
- [ ] Implementar Dead Letter Queue.
- [ ] Implementar Transactional Outbox.
- [ ] Documentar garantías de entrega y orden.

**Criterio de aceptación:** flujo completo de procesamiento de pedidos mediante eventos, con manejo de fallos.

## Fase 5. GraphQL

**Objetivo:** incorporar consultas flexibles.

- [ ] Configurar GraphQL.
- [ ] Diseñar schema.
- [ ] Implementar Types.
- [ ] Implementar Queries.
- [ ] Implementar Mutations.
- [ ] Implementar Resolvers.
- [ ] Integrar autenticación y autorización.
- [ ] Resolver problema N+1 con DataLoader.
- [ ] Implementar paginación.
- [ ] Limitar complejidad de consultas.

**Criterio de aceptación:** consulta de pedidos con clientes y productos, respetando los permisos.

## Fase 6. Integraciones y Azure

**Objetivo:** preparar la solución para entornos empresariales.

- [ ] Integrar API externa.
- [ ] Diseñar manejo de timeouts y reintentos.
- [ ] Entender Azure API Management.
- [ ] Implementar un ejemplo con Azure Functions.
- [ ] Estudiar Azure Service Bus.
- [ ] Comparar Kafka, Event Hubs y Service Bus.
- [ ] Contenerizar API y workers.
- [ ] Estudiar AKS.
- [ ] Configurar Azure Key Vault.
- [ ] Crear pipeline CI/CD con Azure DevOps.
- [ ] Documentar estrategia de despliegue.

**Criterio de aceptación:** arquitectura de despliegue documentada y pipeline de integración continua.

## Fase 7. Observabilidad y calidad

**Objetivo:** asegurar mantenibilidad y operación.

- [ ] Logs estructurados.
- [ ] Métricas.
- [ ] Health checks.
- [ ] Manejo de errores.
- [ ] Pruebas de integración.
- [ ] Pruebas de carga.
- [ ] Monitoreo.
- [ ] Documentación técnica final.

**Criterio de aceptación:** aplicación verificable, observable y documentada.

---

## Reglas de avance

Cada fase se implementa en ramas independientes.

Una funcionalidad se considera terminada cuando:

1. Cumple su objetivo funcional.
2. Tiene validaciones y manejo de errores.
3. Incluye pruebas apropiadas.
4. Cumple los criterios de seguridad aplicables.
5. Tiene documentación cuando corresponde.
6. Pasa revisión antes de su integración.

El roadmap se actualizará durante el desarrollo. Las decisiones arquitectónicas importantes se registrarán en documentos ADR (Architecture Decision Records).
