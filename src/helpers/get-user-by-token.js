const jwt = require('jsonwebtoken');

const User = require('../models/User');

// get user by jwt token
const getUserByToken = async (token) => {
  const decoded = jwt.verify(token, 'nossosecret');

  const userId = decoded.id;

  const user = await User.findOne({ _id: userId });

  return user;
};

module.exports = getUserByToken;
