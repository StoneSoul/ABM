const axios = require('axios');
const WP_API = process.env.WP_API;

exports.syncToWordpress = async ({
  username,
  password,
  email,
  rol,
  cod_profesional,
  nombre,
  apellido,
  alias
}) => {
  try {
    await axios.post(`${WP_API}/create-user`, {
      username,
      password,
      email,
      rol,
      cod_profesional,
      nombre,
      apellido,
      alias: alias || username // si no viene alias, usa username
    });
  } catch (error) {
    console.error('Error sincronizando con WordPress:', error.response?.data || error);
    throw error;
  }
};
