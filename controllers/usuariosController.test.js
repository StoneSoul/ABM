const { listarUsuarios } = require('./usuariosController');
const { pool } = require('../db');

jest.mock('../db', () => ({ pool: { execute: jest.fn() } }));

describe('listarUsuarios', () => {
  const res = { json: jest.fn() };
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    res.json.mockReturnValue(undefined);
    pool.execute.mockResolvedValue([[]]);
  });

  test('usa paginación por defecto', async () => {
    await listarUsuarios({ query: {} }, res, next);
    expect(pool.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['%', '%', 10, 0])
    );
  });

  test('aplica parámetros de paginación', async () => {
    await listarUsuarios({ query: { page: '2', limit: '5', search: 'john' } }, res, next);
    expect(pool.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['%john%', '%john%', 5, 5])
    );
  });
});
