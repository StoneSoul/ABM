require('dotenv').config();
process.env.TZ = process.env.TZ || 'America/Argentina/Cordoba';

const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const usuariosRouter = require('./routes/usuarios');
const authRouter = require('./routes/auth');
const registrosRouter = require('./routes/registros');
const errorHandler = require('./middlewares/errorHandler');
const { checkChanges: checkWpPasswordChanges } = require('./services/checkWpPasswordChanges');

const ensureLoggedIn = (req, res, next) => {
  const publicPaths = [
    '/login.html',
    '/api/auth/login',
    '/logo.png',
    '/fondo-imc.png',
    '/favicon.png',
    '/styles.css',
    '/api/usuarios/wp-password-change',
  ];
  if (req.session && req.session.authenticated) {
    return next();
  }
  if (
    publicPaths.includes(req.path) ||
    req.path.startsWith('/api/auth/login') ||
    req.path.startsWith('/api/usuarios/wp-password-change')
  ) {
    return next();
  }
  return res.redirect('/login.html');
};
require('dotenv').config();

const intervalMs = parseInt(process.env.WP_SYNC_INTERVAL, 10) || 60000;
setInterval(async () => {
  try {
    await checkWpPasswordChanges();
  } catch (err) {
    console.error('Error al sincronizar contraseñas desde WordPress:', err);
  }
}, intervalMs);

const app = express();

const parseBoolean = (value, defaultValue) => {
  if (typeof value === 'undefined') {
    return defaultValue;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }

  return Boolean(value);
};

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'abm-secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: parseBoolean(
        process.env.SESSION_COOKIE_SECURE,
        process.env.NODE_ENV === 'production'
      ),
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.tailwindcss.com', "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    originAgentCluster: false,
    hsts: false,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(ensureLoggedIn);
app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/registros', registrosRouter);
app.get('/', (req, res) => res.redirect('/login.html'));
app.use(errorHandler);

const PORT = process.env.PORT || 3003;
// Mostrar el puerto solo en modo debug para no contaminar los logs de producción
if (process.env.DEBUG) {
  app.listen(PORT, () =>
    console.log(`Servidor ABM corriendo en puerto ${PORT}`)
  );
} else {
  app.listen(PORT, '0.0.0.0');
}
