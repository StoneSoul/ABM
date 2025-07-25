const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { pool: abmPool } = require('../db');
const { unserialize } = require('php-serialize');

// Conexión a WordPress
const wpConfig = {
  host: process.env.WP_HOST,
  user: process.env.WP_USER,
  password: process.env.WP_PASS,
  database: process.env.WP_DB,
};

const wpPool = mysql.createPool(wpConfig);

async function importarUsuarios() {
  try {
    const wpConn = wpPool;
    const abmConn = abmPool;

    const [rows] = await wpConn.execute(`
      SELECT 
        u.ID,
        u.user_login AS username,
        u.user_email AS email,
        u.user_pass AS password,
        (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'wp_capabilities') AS rol_serializado,
        (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'professional_code') AS cod_profesional,
        (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'first_name') AS first_name,
        (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'last_name') AS last_name
      FROM wp_users u
    `);

    for (const row of rows) {
      let rol = '';
      try {
        const roles = unserialize(row.rol_serializado || 'a:0:{}');
        rol = Object.keys(roles)[0] || '';
      } catch (e) {
        console.warn('⚠️ Error deserializando rol:', row.username);
      }

      const nombre = row.first_name || '';
      const apellido = row.last_name || '';
      const nombreCompleto = `${nombre} ${apellido}`.trim();

      // Insertar o actualizar usuario
      await abmConn.execute(`
        INSERT INTO usuarios 
          (username, email, password, rol, cod_profesional, nombre, apellido, nombre_completo, estado, fecha_alta, fecha_modificacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          password = VALUES(password),
          rol = VALUES(rol),
          cod_profesional = VALUES(cod_profesional),
          nombre = VALUES(nombre),
          apellido = VALUES(apellido),
          nombre_completo = VALUES(nombre_completo),
          fecha_modificacion = NOW()
      `, [
        row.username,
        row.email,
        row.password,
        rol,
        row.cod_profesional || '',
        nombre,
        apellido,
        nombreCompleto
      ]);

      console.log('✅ Importado:', row.username);
    }

    console.log('\n✅✅ Importación finalizada correctamente');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error general:', err);
    process.exit(1);
  }
}

importarUsuarios();
