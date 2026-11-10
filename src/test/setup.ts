// Variables de entorno para las pruebas.
//
// `DATABASE_URL` es un valor de respaldo: las pruebas no necesitan una base
// de datos real porque los clientes externos (como Prisma) se simulan con
// mocks. Los scripts de integración con PostgreSQL real se documentan en
// el README.
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/eoms_test?schema=public';

process.env.NODE_ENV ??= 'test';

// Reduce el ruido de logs durante las pruebas; los errores graves siguen
// siendo visibles para detectar fallos en los caminos de error.
process.env.LOG_LEVEL ??= 'error';
