import { describe, expect, it } from 'vitest';
import { HttpError } from './http-error.js';

describe('HttpError', () => {
  it('expone statusCode, message y code explícitos', () => {
    const error = new HttpError(404, 'Order not found', 'ORDER_NOT_FOUND');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Order not found');
    expect(error.code).toBe('ORDER_NOT_FOUND');
  });

  it('deriva un code por defecto a partir del statusCode', () => {
    const error = new HttpError(409, 'El pedido ya existe');

    expect(error.code).toBe('CONFLICT');
  });

  it('usa un code genérico para estados sin mapeo conocido', () => {
    const error = new HttpError(418, "I'm a teapot");

    expect(error.code).toBe('HTTP_ERROR');
  });

  it('preserva el prototipo y el nombre de la clase', () => {
    const error = new HttpError(400, 'Petición inválida');

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('HttpError');
    expect(Object.getPrototypeOf(error)).toBe(HttpError.prototype);
  });

  it('conserva el stack trace para diagnóstico interno', () => {
    const error = new HttpError(500, 'Fallo interno');

    expect(error.stack).toContain('HttpError');
  });
});
