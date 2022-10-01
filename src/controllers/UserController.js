const { ObjectId } = require('mongoose').Types;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../helpers/sendEmail');
const User = require('../models/User');
const LinkToken = require('../models/LinkToken');

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
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      const user = await new User({
        name,
        email,
        phone,
        password: passwordHash,
      }).save();

      const token = await new LinkToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString('hex'),
      }).save();

      const html = `<h1>Olá ${user.name}, obrigado por se registrar na petí.</h1><br/>
      <br/>
      <p>Acesse o link abaixo para confirmar seu email e realizar seu primeiro login.</p><br/>
      <br/>
      <p>${process.env.APP_URL}login/${user.id}/verify/${token.token}<p>
      <br/>
      <p>Muito obrigado,</p><br/>
      <p>Equipe petí.</p><br/>`;

      await sendEmail(user.email, 'Verificação de email', html);

      res.status(200).json({ message: `Um email de confirmação foi enviado para ${user.email}. Acesse o link no corpo da mensagem para ativar sua conta e realizar seu primeiro acesso.` });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async activateAccount(req, res) {
    const { id } = req.params;
    try {
      const user = await User.findOne({ _id: id });
      if (!user) {
        return res.status(401).send({ message: 'Link inválido' });
      }

      const token = await LinkToken.findOne({
        userId: user._id,
        token: req.params.token,
      });

      if (!token) {
        return res.status(401).send({ message: 'Link inválido' });
      }

      user.active = true;

      await User.findByIdAndUpdate(user._id, user);
      await token.remove();

      return res.status(200).send({ message: `O email ${user.email} foi verificado com sucesso. Insira suas informações abaixo para realizar seu login.` });
    } catch (error) {
      return res.status(500).send({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
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

    if (!user.active) {
      let token = await LinkToken.findOne({ userId: user._id });
      if (!token) {
        token = await new LinkToken({
          userId: user._id,
          token: crypto.randomBytes(32).toString('hex'),
        }).save();
        const url = `${process.env.APP_URL}login/${user.id}/verify/${token.token}`;
        await sendEmail(user.email, 'Verificação de email', url);
      }

      res
        .status(401)
        .send({ message: `Um email de confirmação foi enviado para ${user.email}. Acesse o link no corpo da mensagem para ativar sua conta e realizar seu primeiro acesso.` });
      return;
    }

    await createUserToken(user, req, res);
  }

  static async resetPasswordEmail(req, res) {
    const { email } = req.body;

    if (!email) {
      res
        .status(422)
        .json({ message: 'O email é obrigatório' });
      return;
    }

    try {
      const user = await User.findOne({ email });

      if (!user) {
        res
          .status(422)
          .json({ message: 'Email não cadastrado!' });
        return;
      }

      let token = await LinkToken.findOne({ userId: user._id });
      if (!token) {
        token = await new LinkToken({
          userId: user._id,
          token: crypto.randomBytes(32).toString('hex'),
        }).save();
      }

      const html = `<h1>Olá ${user.name}.</h1><br/>
      <br/>
      <p>Acesse o link abaixo para redefinir sua senha.</p><br/>
      <br/>
      <p>${process.env.APP_URL}forgotmypassword/${user._id}/${token.token}/<p>
      <br/>
      <p>Muito obrigado,</p><br/>
      <p>Equipe petí.</p><br/>`;
      await sendEmail(user.email, 'Password Reset', html);

      res
        .status(200)
        .send({ message: `Link para recuperação de senha foi enviado para ${user.email}. Acesse o link no corpo da mensagem para atualizar sua senha.` });
    } catch (error) {
      res.status(500).send({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async resetPasswordLink(req, res) {
    const { id } = req.params;

    try {
      const user = await User.findOne({ _id: id });
      if (!user) {
        return res.status(404).send({ message: 'Link inválido' });
      }

      const token = await LinkToken.findOne({
        userId: user._id,
        token: req.params.token,
      });
      if (!token) {
        return res.status(404).send({ message: 'Link inválido' });
      }

      return res.status(200).send({ message: 'Preencha os campos abaixo para atualizar sua senha' });
    } catch (error) {
      return res.status(500).send({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async resetPassword(req, res) {
    const { id, password, confirmpassword } = req.body;
    let passwordHash;

    if (password && password !== confirmpassword) {
      res.status(422).json({ error: 'As senhas não conferem.' });
    } else if (password && password === confirmpassword) {
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      passwordHash = await bcrypt.hash(password, salt);
    } else {
      return res.status(404).send({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }

    try {
      const user = await User.findOne({ _id: id });
      if (!user) {
        return res.status(404).send({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      }

      const token = await LinkToken.findOne({
        userId: user._id,
        token: req.body.token,
      });
      if (!token) {
        return res.status(404).send({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      }

      if (!user.active) {
        user.active = true;
      }

      user.password = passwordHash;
      await User.findByIdAndUpdate(user._id, user);
      await token.remove();

      return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async checkUser(req, res) {
    let currentUser;

    if (req.headers.authorization) {
      try {
        const token = getToken(req);
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        currentUser = await User.findById(decoded.id).select('-password');
      } catch (error) {
        res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      }
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
      await User.findByIdAndUpdate(user._id, user);
      res.status(200).json({
        message: `${msg}`,
      });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async getAllUserFavorites(req, res) {
    // check if user is logged
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (!user) {
      res.status(422).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      return;
    }

    const { favorites } = user;

    try {
      const petsFilter = await Promise.all(favorites.map((item) => getPetById(item)));
      const pets = petsFilter.filter((item) => item !== null);
      user.favorites = pets.map((item) => item._id.toString());
      await User.findByIdAndUpdate(user._id, user);
      res.status(200).json({ pets });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
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
      return res.status(401).json({ message: 'Acesso negado!' });
    }

    const {
      name, phone, password, confirmpassword,
    } = req.body;

    if (req.file) {
      user.image = req.file.filename;
    }

    // validations
    if (name) {
      user.name = name;
    }

    if (phone) {
      user.phone = phone;
    }

    if (password && password !== confirmpassword) {
      res.status(401).json({ error: 'As senhas não conferem.' });
    } else if (password && password === confirmpassword) {
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const passwordHash = await bcrypt.hash(password, salt);
      user.password = passwordHash;
    }

    try {
      // returns user updated data
      await User.findByIdAndUpdate(user._id, user);

      return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }
};
