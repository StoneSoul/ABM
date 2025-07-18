const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

router.post('/crear', usuariosController.crearUsuario);
router.post('/modificar', usuariosController.modificarUsuario);
router.post('/wp-password-change', usuariosController.passwordCambiadaDesdeWp);

module.exports = router;
