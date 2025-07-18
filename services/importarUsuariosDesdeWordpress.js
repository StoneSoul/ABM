const sql = require('mssql');
const phpUnserialize = require('php-serialize').unserialize;

// Configuración conexión a WordPress
const wpConfig = {
  user: 'wp_user',
  password: 'wp_password',
  server: '192.168.14.69', // IP del servidor de WordPress
  database: 'wordpress',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Configuración conexión al ABM
const abmConfig = {
  user: 'admin',
  password: 'Imc233',
  server: '192.168.14.69', // IP del servidor del ABM
  database: 'abm_usuarios',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function importarUsuarios() {
  try {
    const wpPool = await sql.connect(wpConfig);

    const result = await wpPool.request().query(\`
      SELECT 
        u.user_login AS username,
        u.user_email AS email,
        r.meta_value AS rol_serializado,
        p.meta_value AS cod_profesional,
        f.meta_value AS first_name,
        l.meta_value AS last_name,
        n.meta_value AS nickname
      FROM wp_users u
      LEFT JOIN wp_usermeta r ON u.ID = r.user_id AND r.meta_key = 'wp_capabilities'
      LEFT JOIN wp_usermeta p ON u.ID = p.user_id AND p.meta_key = 'professional_code'
      LEFT JOIN wp_usermeta f ON u.ID = f.user_id AND f.meta_key = 'first_name'
      LEFT JOIN wp_usermeta l ON u.ID = l.user_id AND l.meta_key = 'last_name'
      LEFT JOIN wp_usermeta n ON u.ID = n.user_id AND n.meta_key = 'nickname';
    \`);

    const abmPool = await sql.connect(abmConfig);

    for (const row of result.recordset) {
      let rol = '';
      try {
        const roles = phpUnserialize(row.rol_serializado || 'a:0:{}');
        rol = Object.keys(roles)[0] || '';
      } catch (e) {
        console.warn('Error deserializando rol:', row.username);
      }

      await abmPool.request()
        .input('username', sql.NVarChar, row.username)
        .input('email', sql.NVarChar, row.email)
        .input('nombre_completo', sql.NVarChar, (row.first_name || '') + ' ' + (row.last_name || ''))
        .input('rol', sql.NVarChar, rol)
        .input('cod_profesional', sql.NVarChar, row.cod_profesional || '')
        .input('estado', sql.Bit, 1)
        .query(\`
          IF NOT EXISTS (SELECT 1 FROM usuarios WHERE username = @username)
          INSERT INTO usuarios (username, email, nombre_completo, rol, cod_profesional, estado, fecha_alta, fecha_modificacion)
          VALUES (@username, @email, @nombre_completo, @rol, @cod_profesional, @estado, GETDATE(), GETDATE());
        \`);

      console.log('Importado:', row.username);
    }

    console.log('✅ Importación finalizada');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

importarUsuarios();
