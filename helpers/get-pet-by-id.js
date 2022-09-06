const Pet = require('../models/Pet');

// get user by jwt token
const getPetById = async (id) => {
  const pet = await Pet.findOne({ _id: id });

  return pet;
};

module.exports = getPetById;
