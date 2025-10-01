const axios = require('axios');
const { pool } = require('../db');
const SUITE_API = process.env.SUITE_API;
const { syncToWordpress, actualizarEstado: actualizarEstadoWp } = require('../services/wpSyncService');
const { syncToSuite, actualizarClave, actualizarEstado: actualizarEstadoSuite, actualizarUsuario } = require('../services/suiteSyncService');
const { hashPassword } = require('../services/passwordHashService');

async function registrarCambioClave(username, password, changedBy) {
  await pool.execute(
    'INSERT INTO password_logs (username, password, changed_by, changed_at) VALUES (?, ?, ?, NOW())',
    [username, password, changedBy]
  );
}

async function actualizarPassword(username, password) {
  await pool.execute(
    'UPDATE usuarios SET password = ?, fecha_modificacion = NOW() WHERE username = ?',
    [password, username]
  );
}

exports.crearUsuario = async (req, res, next) => {
  try {
    const datos = req.body;

    if (Array.isArray(datos.rol_suite)) {
      datos.rol_suite = datos.rol_suite.filter((r) => r).join(',');
    }

    datos.alias = `${datos.nombre || ''} ${datos.apellido || ''}`.trim() || datos.alias || datos.username;

    if (datos.password) {
      datos.password = hashPassword(datos.password);
    }

    await syncToWordpress(datos);
    await syncToSuite(datos);

    await pool.execute(
      `INSERT INTO usuarios (username, password, email, rol, cod_profesional, nombre, apellido, nombre_completo, rol_suite, estado, fecha_alta, fecha_modificacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE password=VALUES(password), email=VALUES(email), rol=VALUES(rol), cod_profesional=VALUES(cod_profesional), nombre=VALUES(nombre), apellido=VALUES(apellido), nombre_completo=VALUES(nombre_completo), rol_suite=VALUES(rol_suite), fecha_modificacion=NOW()`,
      [
        datos.username,
        datos.password,
        datos.email,
        datos.rol,
        datos.cod_profesional || '',
        datos.nombre || '',
        datos.apellido || '',
        datos.alias || datos.username,
        datos.rol_suite || '',
      ]
    );
    await registrarCambioClave(datos.username, datos.password, 'admin');

    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error creando usuario:', error);
    next(error);
  }
};

exports.modificarUsuario = async (req, res, next) => {
  try {
    const datos = { ...req.body };
    const username = (datos.username || req.params.username || '').trim();

    if (!username) {
      return res.status(400).json({ mensaje: 'El nombre de usuario es obligatorio' });
    }

    datos.username = username;

    if (Array.isArray(datos.rol_suite)) {
      datos.rol_suite = datos.rol_suite.filter((r) => r).join(',');
    }

    // Filtrar campos vacíos para evitar sobreescribir con valores en blanco
    Object.keys(datos).forEach((key) => {
      if (datos[key] === '' || datos[key] === null || datos[key] === undefined) {
        delete datos[key];
      }
    });

    const actualizaciones = [];
    const valores = [];

    const campos = {
      email: 'email',
      rol: 'rol',
      rol_suite: 'rol_suite',
      cod_profesional: 'cod_profesional',
      nombre: 'nombre',
      apellido: 'apellido',
      alias: 'nombre_completo',
    };

    for (const [campo, columna] of Object.entries(campos)) {
      if (
        Object.prototype.hasOwnProperty.call(datos, campo) &&
        datos[campo] !== undefined &&
        datos[campo] !== null &&
        String(datos[campo]).trim() !== ''
      ) {
        const valor = typeof datos[campo] === 'string' ? datos[campo].trim() : datos[campo];
        actualizaciones.push(`${columna} = ?`);
        valores.push(valor);
      }
    }

    if (datos.password && datos.password.trim() !== '') {
      datos.password = hashPassword(datos.password);
      actualizaciones.push('password = ?');
      valores.push(datos.password);
    }

    if (actualizaciones.length === 0) {
      return res.status(400).json({ mensaje: 'No hay datos para actualizar' });
    }

    valores.push(username);

    const query = `UPDATE usuarios SET ${actualizaciones.join(', ')}, fecha_modificacion = NOW() WHERE username = ?`;

    await syncToWordpress(datos);
    await actualizarUsuario(datos);
    await pool.execute(query, valores);

    if (datos.password && datos.password.trim() !== '') {
      await registrarCambioClave(username, datos.password, 'admin');
      await actualizarPassword(username, datos.password);
    }

    res.json({ mensaje: 'Usuario modificado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.obtenerUsuario = async (req, res, next) => {
  try {
    const usernameParam = (req.params.username || '').trim();
    const [rows] = await pool.execute(
      `SELECT username, password, email, rol, rol_suite, cod_profesional, nombre, apellido, nombre_completo AS alias
       FROM usuarios WHERE username = ?`,
      [usernameParam]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.obtenerRolSuiteUsuario = async (req, res, next) => {
  try {
    const usernameParam = (req.params.username || '').trim();
    const [rows] = await pool.execute(
      'SELECT rol_suite FROM usuarios WHERE username = ?',
      [usernameParam]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ rol_suite: rows[0].rol_suite });
  } catch (error) {
    next(error);
  }
};

exports.obtenerRolesSuite = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT idrol AS value, nombre AS label FROM imc_suite.rol`
    );

    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener roles:', error);
    next(error);
  }
};

exports.passwordCambiadaDesdeWp = async (req, res, next) => {
  try {
    const { username, password_hash, changed_by } = req.body;
    await actualizarClave({ username, password: password_hash });
    await registrarCambioClave(username, password_hash, changed_by || 'user');
    await actualizarPassword(username, password_hash);
    res.json({ mensaje: 'Clave actualizada en Suite' });
  } catch (error) {
    console.error('Error actualizando clave desde WP:', error);
    next(error);
  }
};

exports.listarUsuarios = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const searchValue = req.query.search ? req.query.search.trim() : '';
    const search = searchValue ? `%${searchValue}%` : '%';
    const searchParams = [search, search, search, search, search, search];

    // Conteo total de usuarios filtrados
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM usuarios
       WHERE username LIKE ? OR email LIKE ? OR nombre LIKE ? OR apellido LIKE ? OR nombre_completo LIKE ? OR cod_profesional LIKE ?`,
      searchParams
    );
    const total = (countRows && countRows[0] && countRows[0].total) || 0;

    const [rows] = await pool.execute(
      `SELECT username, email, nombre_completo, rol, rol_suite, cod_profesional, estado
       FROM usuarios
       WHERE username LIKE ? OR email LIKE ? OR nombre LIKE ? OR apellido LIKE ? OR nombre_completo LIKE ? OR cod_profesional LIKE ?
       ORDER BY fecha_alta DESC
       LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    );

    res.json({ datos: rows, pagina: page, limite: limit, total });
  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    next(error);
  }
};
exports.cambiarEstado = async (req, res, next) => {
  try {
    const { username, estado } = req.body;
    await pool.execute(
      'UPDATE usuarios SET estado = ? WHERE username = ?',
      [estado, username]
    );
    await actualizarEstadoWp({ username, estado });
    await actualizarEstadoSuite({ username, estado });
    res.json({ mensaje: 'Estado actualizado' });
  } catch (error) {
    console.error('❌ Error al cambiar estado del usuario:', error);
    next(error);
  }
};
