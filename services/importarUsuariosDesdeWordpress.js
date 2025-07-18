const mysql = require('mysql2/promise');
const { unserialize } = require('php-serialize');

// Configuración conexión a WordPress (Hostinger)
const wpConfig = {
  host: '193.203.175.223',
  user: 'u154911466_RXlkX',
  password: 'rDcxAmPF4u',
  database: 'u154911466_7PmpE',
};

// Configuración conexión al ABM (MySQL)
const abmConfig = {
  host: '192.168.14.69',
  user: 'admin',
  password: 'Imc233',
  database: 'abm_usuarios',
};

async function importarUsuarios() {
  try {
    const wpConn = await mysql.createConnection(wpConfig);
    const abmConn = await mysql.createConnection(abmConfig);

    const [rows] = await wpConn.execute(`
      SELECT 
        u.ID,
        u.user_login AS username,
        u.user_email AS email,
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

      const nombreCompleto = `${row.first_name || ''} ${row.last_name || ''}`.trim();

      await abmConn.execute(`
        INSERT INTO usuarios 
          (username, email, nombre_completo, rol, cod_profesional, estado, fecha_alta, fecha_modificacion)
        SELECT ?, ?, ?, ?, ?, 1, NOW(), NOW()
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1 FROM usuarios WHERE username = ?
        )
      `, [
        row.username,
        row.email,
        nombreCompleto,
        rol,
        row.cod_profesional || '',
        row.username
      ]);

      console.log('✅ Importado:', row.username);
    }

    await wpConn.end();
    await abmConn.end();
    console.log('\n✅✅ Importación finalizada correctamente');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error general:', err);
    process.exit(1);
  }
}

importarUsuarios();
