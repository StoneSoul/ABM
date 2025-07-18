const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const usuariosRouter = require('./routes/usuarios');
const errorHandler = require('./middlewares/errorHandler');
require('dotenv').config();

const app = express();

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use('/api/usuarios', usuariosRouter);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor ABM corriendo en puerto ${PORT}`));
