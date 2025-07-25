#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
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
  const wpConn = await mysql.createConnection(wpConfig);
  const abmConn = await mysql.createConnection(abmConfig);

  const [wpUsers] = await wpConn.execute(`
    SELECT u.ID AS user_id,
           u.user_login AS username,
           (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'abm_last_pwd_change') AS changed_at,
           (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'abm_last_pwd_changed_by') AS changed_by,
           (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'abm_last_pwd_hash') AS password_hash
    FROM wp_users u
  `);

  for (const row of wpUsers) {
    if (!row.changed_at) continue;
    const [last] = await abmConn.execute(
      'SELECT MAX(changed_at) AS last_at FROM password_logs WHERE username = ?',
      [row.username]
    );
    const lastAt = last[0].last_at;
    if (!lastAt || new Date(row.changed_at) > new Date(lastAt)) {
      await abmConn.execute(
        'INSERT INTO password_logs (username, password, changed_by, changed_at) VALUES (?, ?, ?, ?)',
        [row.username, row.password_hash || '', row.changed_by || 'user', row.changed_at]
      );
      if (row.password_hash) {
        await abmConn.execute(
          'UPDATE usuarios SET password = ?, fecha_modificacion = NOW() WHERE username = ?',
          [row.password_hash, row.username]
        );
        await actualizarClave({ username: row.username, password: row.password_hash });
        await wpConn.execute(
          'UPDATE wp_usermeta SET meta_value = "" WHERE user_id = ? AND meta_key = "abm_last_pwd_hash"',
          [row.user_id]
        );
      }
      console.log(`Registrado cambio para ${row.username}`);
    }
  }

  await wpConn.end();
  await abmConn.end();
}

module.exports = { checkChanges };

if (require.main === module) {
  checkChanges()
    .then(() => console.log('Sincronización finalizada'))
    .catch((err) => {
      console.error('Error verificando cambios:', err);
      process.exit(1);
    });
}
