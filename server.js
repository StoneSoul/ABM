const express = require('express');
const path = require('path');
const session = require('express-session');
const usuariosRouter = require('./routes/usuarios');
const authRouter = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');

const ensureLoggedIn = (req, res, next) => {
  const publicPaths = ['/login.html', '/api/auth/login'];
  if (req.session && req.session.authenticated) {
    return next();
  }
  if (publicPaths.includes(req.path) || req.path.startsWith('/api/auth/login')) {
    return next();
  }
  return res.redirect('/login.html');
};
require('dotenv').config();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'abm-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.json());
app.use(ensureLoggedIn);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.get('/', (req, res) => res.redirect('/login.html'));
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
// Mostrar el puerto solo en modo debug para no contaminar los logs de producción
if (process.env.DEBUG) {
  app.listen(PORT, () =>
    console.log(`Servidor ABM corriendo en puerto ${PORT}`)
  );
} else {
  app.listen(PORT);
}
