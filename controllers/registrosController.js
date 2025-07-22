const mysql = require('mysql2/promise');

exports.listarRegistros = async (req, res, next) => {
  try {
    const { q } = req.query;
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });
    let query = 'SELECT username, changed_by, changed_at FROM password_logs';
    const params = [];
    if (q) {
      query += ' WHERE username LIKE ?';
      params.push(`%${q}%`);
    }
    query += ' ORDER BY changed_at DESC';
    const [rows] = await connection.execute(query, params);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    next(error);
  }
};
