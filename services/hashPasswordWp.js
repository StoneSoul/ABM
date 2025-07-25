#!/usr/bin/env node
require('dotenv').config();

const mysql = require('mysql2/promise');
const hasher = require('wordpress-hash-node');

const { actualizarClave } = require('./suiteSyncService');
const { pool } = require('../db');

async function hashClavesNoHasheadas() {
  console.log('🔐 Buscando claves sin hash para convertir...');

  const [usuarios] = await pool.execute(`
    SELECT username, password FROM usuarios
    WHERE password NOT LIKE '$P$%' AND password IS NOT NULL AND password != ''
  `);

  for (const usuario of usuarios) {
    const { username, password } = usuario;

    try {
      const hashed = hasher.HashPassword(password); // ✅ FUNCIONA ASÍ

      await pool.execute(
        'UPDATE usuarios SET password = ?, fecha_modificacion = NOW() WHERE username = ?',
        [hashed, username]
      );

      await pool.execute(
        'INSERT INTO password_logs (username, password, changed_by, changed_at) VALUES (?, ?, ?, NOW())',
        [username, hashed, 'hashPasswordWp']
      );

      await actualizarClave({ username, password: hashed });

      console.log(`✔ ${username} → hash aplicado`);
    } catch (err) {
      console.error(`❌ Error procesando ${username}:`, err.message);
    }
  }

  console.log('✅ Hashing finalizado');
}

hashClavesNoHasheadas().catch(err => {
  console.error('❌ Error general:', err);
  process.exit(1);
});
