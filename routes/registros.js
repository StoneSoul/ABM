const express = require('express');
const router = express.Router();
const registrosController = require('../controllers/registrosController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, registrosController.listarRegistros);

module.exports = router;
