const axios = require('axios');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificación local de usuario administrador
    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASS
    ) {
      req.session.authenticated = true;
      req.session.user = username;
      return res.json({ mensaje: 'Autenticado' });
    }

    await axios.post(`${process.env.WP_API}/admin-login`, { username, password }, {
      headers: {
        Authorization: `Bearer ${process.env.WP_TOKEN}`,
      },
    });
    req.session.authenticated = true;
    req.session.user = username;
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
