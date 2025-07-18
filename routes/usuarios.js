const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const {
  crearUsuarioValidator,
  modificarUsuarioValidator,
  validar,
} = require('../middlewares/usuariosValidation');
const auth = require('../middlewares/authMiddleware');

router.post(
  '/crear',
  auth,
  crearUsuarioValidator,
  validar,
  usuariosController.crearUsuario
);
router.post(
  '/modificar',
  auth,
  modificarUsuarioValidator,
  validar,
  usuariosController.modificarUsuario
);
router.post('/wp-password-change', auth, usuariosController.passwordCambiadaDesdeWp);
router.post('/estado', auth, usuariosController.cambiarEstado);
router.get('/', auth, usuariosController.listarUsuarios);

module.exports = router;
