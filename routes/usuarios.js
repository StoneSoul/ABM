const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Rutas existentes
router.post('/crear', usuariosController.crearUsuario);
router.post('/modificar', usuariosController.modificarUsuario);
router.post('/wp-password-change', usuariosController.passwordCambiadaDesdeWp);

// Nueva ruta para obtener todos los usuarios
router.get('/', usuariosController.listarUsuarios);

module.exports = router;
