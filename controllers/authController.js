const hasher = require('wordpress-hash-node');
const { pool } = require('../db');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT password, rol FROM usuarios WHERE username = ? AND estado = 1',
      [username]
    );

    if (rows.length === 0) {
      throw new Error('No autorizado');
    }

    const { password: hash, rol } = rows[0];
    const adminRoles = ['administrator', 'administrador', 'admin'];

    if (!adminRoles.includes(rol) || !hasher.CheckPassword(password, hash)) {
      throw new Error('No autorizado');
    }

    req.session.authenticated = true;
    req.session.user = username;
    res.json({ mensaje: 'Autenticado' });
  } catch (error) {
    console.error('Error de login:', error.message);
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ mensaje: 'Sesión finalizada' });
  });
};
