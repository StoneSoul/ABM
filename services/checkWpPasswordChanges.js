#!/usr/bin/env node
const mysql = require('mysql2/promise');
const { actualizarClave } = require('./suiteSyncService');
const { pool: abmPool } = require('../db');

const wpConfig = {
  host: process.env.WP_HOST,
  user: process.env.WP_USER,
  password: process.env.WP_PASS,
  database: process.env.WP_DB,
};

const wpPool = mysql.createPool(wpConfig);

async function checkChanges() {
  console.log('Iniciando verificación de cambios en WordPress...');
  const wpConn = wpPool;
  const abmConn = abmPool;

  const [wpUsers] = await wpConn.execute(`
    SELECT u.ID AS user_id,
           u.user_login AS username,
           (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'abm_last_pwd_change') AS changed_at,
           (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'abm_last_pwd_changed_by') AS changed_by,
           (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'abm_last_pwd_hash') AS password_hash
    FROM wp_users u
    WHERE EXISTS (
      SELECT 1 FROM wp_usermeta
      WHERE user_id = u.ID AND meta_key = 'abm_last_pwd_hash' AND meta_value != ''
    )
  `);

  for (const row of wpUsers) {
    if (!row.password_hash) continue;

    const changedAt = row.changed_at || new Date().toISOString();

    // Evitar duplicados si ya existe un registro para este cambio
    const [exists] = await abmConn.execute(
      'SELECT 1 FROM password_logs WHERE username = ? AND changed_at = ? LIMIT 1',
      [row.username, changedAt]
    );
    if (exists.length) {
      await wpConn.execute(
        'UPDATE wp_usermeta SET meta_value = "" WHERE user_id = ? AND meta_key = "abm_last_pwd_hash"',
        [row.user_id]
      );
      continue;
    }

    try {
      await abmConn.execute(
        'UPDATE usuarios SET password = ?, fecha_modificacion = NOW() WHERE username = ?',
        [row.password_hash, row.username]
      );

      await actualizarClave({ username: row.username, password: row.password_hash });

      await abmConn.execute(
        'INSERT INTO password_logs (username, password, changed_by, changed_at) VALUES (?, ?, ?, ?)',
        [row.username, row.password_hash, row.changed_by || 'user', changedAt]
      );

      await wpConn.execute(
        'UPDATE wp_usermeta SET meta_value = "" WHERE user_id = ? AND meta_key = "abm_last_pwd_hash"',
        [row.user_id]
      );

      console.log(`✔ Clave sincronizada para ${row.username}`);
    } catch (err) {
      console.error(`Error procesando ${row.username}:`, err);
    }
  }

  // No cerramos los pools para poder reutilizarlos
  console.log('✔ Verificación de cambios completada');
}

module.exports = { checkChanges };

if (require.main === module) {
  require('dotenv').config();
  checkChanges()
    .then(() => console.log('✔ Sincronización finalizada'))
    .catch((err) => {
      console.error('❌ Error verificando cambios:', err);
      process.exit(1);
    });
}
