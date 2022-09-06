const getToken = (req) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    [, token] = authHeader.split(' ');
  } else {
    token = undefined;
  }

  return token;
};

module.exports = getToken;
