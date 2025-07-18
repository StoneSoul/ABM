const axios = require('axios');
const WP_API = process.env.WP_API;

exports.syncToWordpress = async ({ username, password, email, rol, cod_profesional }) => {
  try {
    await axios.post(`${WP_API}/create-user`, {
      username,
      password,
      email,
      rol,
      cod_profesional,
    });
  } catch (error) {
    console.error('Error sincronizando con WordPress:', error.response?.data || error);
    throw error;
  }
};
