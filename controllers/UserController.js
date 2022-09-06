const { ObjectId } = require('mongoose').Types;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// helpers
const createUserToken = require('../helpers/create-user-token');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');
const getPetById = require('../helpers/get-pet-by-id');

module.exports = class UserController {
  static async register(req, res) {
    const {
      name, email, phone, password, confirmpassword,
    } = req.body;

    const image = 'defaultimage.jpg';

    const active = true;

    // validations
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório' });
      return;
    }

    if (!email) {
      res.status(422).json({ message: 'O email é obrigatório' });
      return;
    }

    if (!phone) {
      res.status(422).json({ message: 'O telefone é obrigatório' });
      return;
    }

    if (!image) {
      res.status(422).json({ message: 'A imagem é obrigatória' });
      return;
    }

    if (!password) {
      res.status(422).json({ message: 'A senha é obrigatória' });
      return;
    }
    if (!confirmpassword) {
      res.status(422).json({ message: 'A confirmação de senha é obrigatória' });
      return;
    }

    if (password !== confirmpassword) {
      res
        .status(422)
        .json({
          message: 'A senha e a confirmação de senha precisam ser iguais',
        });
      return;
    }

    // check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(422).json({ message: 'Email já cadastrado!' });
      return;
    }

    // create a password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // create a user
    const user = new User({
      name,
      email,
      phone,
      image,
      active,
      password: passwordHash,
    });

    try {
      const newUser = await user.save();
      await createUserToken(newUser, req, res);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    // validations
    if (!email) {
      res.status(422).json({ message: 'O email é obrigatório' });
      return;
    }

    if (!password) {
      res.status(422).json({ message: 'A senha é obrigatória' });
      return;
    }

    // check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      res
        .status(422)
        .json({ message: 'Credenciais inválidas!' });
      return;
    }

    // check if password match with db password
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      res.status(422).json({ message: 'Credenciais inválidas!' });
      return;
    }

    await createUserToken(user, req, res);
  }

  static async checkUser(req, res) {
    let currentUser;

    if (req.headers.authorization) {
      const token = getToken(req);
      const decoded = jwt.verify(token, 'nossosecret');

      currentUser = await User.findById(decoded.id).select('-password');
    } else {
      currentUser = null;
    }

    res.status(200).send(currentUser);
  }

  static async addPetToFav(req, res) {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID inválido!' });
      return;
    }

    const token = getToken(req);
    const user = await getUserByToken(token);

    if (!user) {
      res.status(401).json({ message: 'Faça login para adicionar aos favoritos!' });
      return;
    }

    const pet = await getPetById(id);

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    if (pet.user._id.equals(user._id)) {
      res.status(422)
        .json({ message: 'Você não pode favoritar seu próprio pet!' });
      return;
    }

    // check if user has already favorited pet
    let msg = '';
    if (user.favorites.indexOf(id) >= 0) {
      user.favorites.splice(user.favorites.indexOf(id), 1);
      msg = `${pet.name} foi removido(a) dos favoritos com sucesso.`;
    } else {
      user.favorites.push(id);
      msg = `${pet.name} foi adicionado(a) aos favoritos com sucesso.`;
    }

    try {
      await User.findByIdAndUpdate(
        { _id: user.id },
        { $set: user },
        { new: true },
      );
      res.status(200).json({
        message: `${msg}`,
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  static async getAllFavorites(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token);

    const { favorites } = user;

    const favPets = await Promise.all(favorites.map((item) => getPetById(item)));

    res.status(200).json({ favPets });
  }

  static async getUserById(req, res) {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(422).json({ message: 'Usuário não encontrado!' });
      return;
    }

    res.status(200).json({ user });
  }

  static async editUser(req, res) {
    // check if user exists
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (!user) {
      return res.status(401).json({ message: 'acesso Negado!' });
    }

    const {
      name, phone,
    } = req.body;

    if (req.file) {
      user.image = req.file.filename;
    }
    // validations
    if (!name) {
      return res.status(422).json({ message: 'O nome é obrigatório' });
    }
    user.name = name;

    if (!phone) {
      return res.status(422).json({ message: 'O telefone é obrigatório' });
    }
    user.phone = phone;

    try {
      // returns user updated data
      await User.findOneAndUpdate(
        { _id: user.id },
        { $set: user },
        { new: true },
      );

      return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  }
};
