const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const {
  crearUsuarioValidator,
  modificarUsuarioValidator,
  validar,
} = require('../middlewares/usuariosValidation');
const auth = require('../middlewares/authMiddleware');
const wpToken = require('../middlewares/wpTokenMiddleware');

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
router.post('/wp-password-change', wpToken, usuariosController.passwordCambiadaDesdeWp);
router.post('/estado', auth, usuariosController.cambiarEstado);
router.get('/:username', auth, usuariosController.obtenerUsuario);
router.get('/', auth, usuariosController.listarUsuarios);

module.exports = router;
