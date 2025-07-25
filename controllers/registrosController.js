const { pool } = require('../db');

exports.listarRegistros = async (req, res, next) => {
  try {
    const { q } = req.query;
    let query = 'SELECT username, changed_by, changed_at FROM password_logs';
    const params = [];
    if (q) {
      query += ' WHERE username LIKE ?';
      params.push(`%${q}%`);
    }
    query += ' ORDER BY changed_at DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    next(error);
  }
};
