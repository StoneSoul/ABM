const mysql = require('mysql2/promise');
const axios = require('axios');
const SUITE_API = process.env.SUITE_API;
const { syncToWordpress, actualizarEstado: actualizarEstadoWp } = require('../services/wpSyncService');
const { syncToSuite, actualizarClave, actualizarEstado: actualizarEstadoSuite } = require('../services/suiteSyncService');

async function registrarCambioClave(username, changedBy) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });
  await connection.execute(
    'INSERT INTO password_logs (username, changed_by, changed_at) VALUES (?, ?, NOW())',
    [username, changedBy]
  );
  await connection.end();
}

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
    if (datos.password) {
      await registrarCambioClave(datos.username, 'admin');
    }
    res.json({ mensaje: 'Usuario modificado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.obtenerUsuario = async (req, res, next) => {
  try {
    const { username } = req.params;
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });
    const [rows] = await connection.execute(
      `SELECT username, email, rol, cod_profesional, nombre, apellido, alias
       FROM usuarios WHERE username = ?`,
      [username]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.obtenerRolesSuite = async (req, res, next) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME_SUITE,
      port: process.env.DB_PORT || 3306
    });
    
    const [rows] = await connection.execute(
      `SELECT idrol AS value, CONCAT(idrol, ' : ', nombre) AS label, 'idrol' AS name FROM imc_suite_prueba.rol`
    );

    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error('❌ Error al obtener roles:', error);
    next(error);
  }
};

exports.passwordCambiadaDesdeWp = async (req, res, next) => {
  try {
    const { username, new_password, password, changed_by } = req.body;
    const clave = new_password || password;
    await actualizarClave({ username, password: clave });
    await registrarCambioClave(username, changed_by || 'user');
    res.json({ mensaje: 'Clave actualizada en Suite' });
  } catch (error) {
    console.error('Error actualizando clave desde WP:', error);
    next(error);
  }
};

// ✅ NUEVA FUNCIÓN PARA LISTAR USUARIOS
exports.listarUsuarios = async (req, res, next) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    const [rows] = await connection.execute(
      `SELECT username, email, nombre_completo, rol, cod_profesional, estado
       FROM usuarios
       ORDER BY fecha_alta DESC`
    );

    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    next(error);
  }
};

exports.cambiarEstado = async (req, res, next) => {
  try {
    const { username, estado } = req.body;
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    await connection.execute(
      'UPDATE usuarios SET estado = ? WHERE username = ?',
      [estado, username]
    );
    await actualizarEstadoWp({ username, estado });
    await actualizarEstadoSuite({ username, estado });
    res.json({ mensaje: 'Estado actualizado' });
    await connection.end();
  } catch (error) {
    console.error('❌ Error al cambiar estado del usuario:', error);
    next(error);
  }
};
