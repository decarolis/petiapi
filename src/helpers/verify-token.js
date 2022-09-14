const jwt = require('jsonwebtoken');
const getToken = require('./get-token');

// middleware to validate token
const checkToken = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Acesso Negado!' });
  }

  try {
    const verified = jwt.verify(token, 'nossosecret');
    req.user = verified;
    return next();
  } catch (err) {
    return res.status(400).json({ message: 'Token Inválido' });
  }
};

module.exports = checkToken;
