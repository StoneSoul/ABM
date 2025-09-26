const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const SUITE_API = process.env.SUITE_API;


exports.syncToSuite = async ({ username, password, rol_suite, nombre, apellido, firma, matricula }) => {
  try {
    await axios.post(`${SUITE_API}/create`, {
      username,
      password,
      rol_suite,
      nombre,
      apellido,
      firma,
      matricula
    });
  } catch (error) {
    console.error('Error sincronizando con Suite:', error.response?.data || error);
    throw error;
  }
};

exports.actualizarUsuario = async ({ username, firma, matricula }) => {
  try {
    const payload = { username, firma, matricula };
    await axios.post(`${SUITE_API}/update-user`, payload);
  } catch (error) {
    console.error('Error actualizando el usuario con Suite:', error.response?.data || error);
    throw error;
  }
};

exports.actualizarClave = async ({ username, password }) => {
  try {
    await axios.post(`${SUITE_API}/update-password`, {
      username,
      password,
    });
  } catch (error) {
    console.error('Error actualizando clave en Suite:', error.response?.data || error);
    throw error;
  }
};

exports.actualizarEstado = async ({ username, estado }) => {
  try {
    await axios.post(`${SUITE_API}/update-status`, {
      username,
      estado,
    });
  } catch (error) {
    console.error('Error actualizando estado en Suite:', error.response?.data || error);
    throw error;
  }
};
