const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const {
  crearUsuarioValidator,
  modificarUsuarioValidator,
  validar,
} = require('../middlewares/usuariosValidation');

// Rutas existentes
router.post(
  '/crear',
  crearUsuarioValidator,
  validar,
  usuariosController.crearUsuario
);
router.post(
  '/modificar',
  modificarUsuarioValidator,
  validar,
  usuariosController.modificarUsuario
);
router.post('/wp-password-change', usuariosController.passwordCambiadaDesdeWp);

// Nueva ruta para obtener todos los usuarios
router.get('/', usuariosController.listarUsuarios);

module.exports = router;
