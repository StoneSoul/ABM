const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const usuariosRouter = require('./routes/usuarios');
const authRouter = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');
require('dotenv').config();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'abm-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor ABM corriendo en puerto ${PORT}`));
