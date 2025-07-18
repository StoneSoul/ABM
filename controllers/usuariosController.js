const sql = require('mssql');
const { syncToWordpress } = require('../services/wpSyncService');
const { syncToSuite, actualizarClave } = require('../services/suiteSyncService');

exports.crearUsuario = async (req, res, next) => {
  try {
    const datos = req.body;

    if (!datos.alias) {
      datos.alias = datos.username;
    }

    await syncToWordpress(datos);
    await syncToSuite(datos);

    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error creando usuario:', error);
    next(error);
  }
};

exports.modificarUsuario = async (req, res, next) => {
  try {
    const datos = req.body;
    await syncToWordpress(datos);
    await syncToSuite(datos);
    res.json({ mensaje: 'Usuario modificado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.passwordCambiadaDesdeWp = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    await actualizarClave({ username, password });
    res.json({ mensaje: 'Clave actualizada en Suite' });
  } catch (error) {
    console.error('Error actualizando clave desde WP:', error);
    next(error);
  }
};

// ✅ NUEVA FUNCIÓN PARA LISTAR USUARIOS
exports.listarUsuarios = async (req, res, next) => {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      server: process.env.DB_HOST,
      database: process.env.DB_NAME,
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    });

    const result = await pool.request().query(`
      SELECT username, email, nombre_completo, rol, cod_profesional, estado
      FROM usuarios
      ORDER BY fecha_alta DESC
    `);

    res.json(result.recordset);
    pool.close();
  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    next(error);
  }
};
