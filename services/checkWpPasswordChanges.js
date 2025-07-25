#!/usr/bin/env node
const mysql = require('mysql2/promise');
const { actualizarClave } = require('./suiteSyncService');

const wpConfig = {
  host: process.env.WP_HOST,
  user: process.env.WP_USER,
  password: process.env.WP_PASS,
  database: process.env.WP_DB,
};

const abmConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

async function checkChanges() {
  console.log('Iniciando verificación de cambios en WordPress...');
  const wpConn = await mysql.createConnection(wpConfig);
  const abmConn = await mysql.createConnection(abmConfig);

  const [wpUsers] = await wpConn.execute(`
    SELECT 
      u.ID AS user_id,
      u.user_login AS username,
      pwd.meta_value AS password_hash,
      ch.meta_value AS changed_at,
      bywho.meta_value AS changed_by
    FROM wp_users u
    JOIN wp_usermeta pwd ON pwd.user_id = u.ID AND pwd.meta_key = 'abm_last_pwd_hash' AND pwd.meta_value != ''
    LEFT JOIN wp_usermeta ch ON ch.user_id = u.ID AND ch.meta_key = 'abm_last_pwd_change'
    LEFT JOIN wp_usermeta bywho ON bywho.user_id = u.ID AND bywho.meta_key = 'abm_last_pwd_changed_by'
  `);

  for (const row of wpUsers) {
    const changedAt = row.changed_at || new Date().toISOString();
    const changedBy = row.changed_by || 'user';

    // Insertar en password_logs
    await abmConn.execute(
      'INSERT INTO password_logs (username, password, changed_by, changed_at) VALUES (?, ?, ?, ?)',
      [row.username, row.password_hash, changedBy, changedAt]
    );

    // Actualizar contraseña en usuarios
    await abmConn.execute(
      'UPDATE usuarios SET password = ?, fecha_modificacion = NOW() WHERE username = ?',
      [row.password_hash, row.username]
    );

    // Enviar a suite
    await actualizarClave({ username: row.username, password: row.password_hash });

    // Limpiar hash en WordPress
    await wpConn.execute(
      'UPDATE wp_usermeta SET meta_value = "" WHERE user_id = ? AND meta_key = "abm_last_pwd_hash"',
      [row.user_id]
    );

    console.log(`✅ Sincronizado ${row.username}`);
  }

  await wpConn.end();
  await abmConn.end();
  console.log('Verificación de cambios completada');
}

module.exports = { checkChanges };

if (require.main === module) {
  require('dotenv').config();
  checkChanges()
    .then(() => console.log('Sincronización finalizada'))
    .catch((err) => {
      console.error('Error verificando cambios:', err);
      process.exit(1);
    });
}
