const hasher = require('wordpress-hash-node');

exports.hashPassword = (password) => {
  return hasher.HashPassword(password);
};
