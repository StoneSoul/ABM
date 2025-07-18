const express = require('express');
const bodyParser = require('body-parser');
const usuariosRouter = require('./routes/usuarios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/api/usuarios', usuariosRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor ABM corriendo en puerto ${PORT}`));
