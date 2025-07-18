const axios = require('axios');
const SUITE_API = process.env.SUITE_API;

exports.syncToSuite = async ({ username, password, email, rol }) => {
  try {
    await axios.post(`${SUITE_API}/create`, {
      username,
      password,
      email,
      rol,
    });
  } catch (error) {
    console.error('Error sincronizando con Suite:', error.response?.data || error);
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
