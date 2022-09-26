const jwt = require('jsonwebtoken');

const createUserToken = async (user, req, res) => {
  // create token
  const token = jwt.sign({
    email: user.email,
    id: user._id,
  }, process.env.TOKEN_SECRET);
  // return token
  try {
    res.status(200).json({
      message: 'Você está autenticado',
      token,
      userId: user._id,
    });
  } catch (error) {
    res.status(422).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
  }
};

module.exports = createUserToken;
