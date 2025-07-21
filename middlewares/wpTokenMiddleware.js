module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (token && token === process.env.WP_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'Token no válido' });
};
