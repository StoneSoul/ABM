const { body, validationResult } = require('express-validator');

const crearUsuarioValidator = [
  body('username').notEmpty().withMessage('El nombre de usuario es obligatorio'),
  body('password').notEmpty().withMessage('La contrase\u00f1a es obligatoria'),
  body('email').isEmail().withMessage('Email no v\u00e1lido'),
];

const modificarUsuarioValidator = [
  body('username')
    .if((value, { req }) => !req.params.username)
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email no válido'),
];

const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

module.exports = {
  crearUsuarioValidator,
  modificarUsuarioValidator,
  validar,
};
