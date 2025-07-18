const axios = require('axios');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    await axios.post(`${process.env.WP_API}/admin-login`, { username, password });
    req.session.authenticated = true;
    res.json({ mensaje: 'Autenticado' });
  } catch (error) {
    console.error('Error de login:', error.response?.data || error.message);
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ mensaje: 'Sesión finalizada' });
  });
};
