const { ObjectId } = require('mongoose').Types;
const fsExtra = require('fs-extra');
const path = require('path');
const Pet = require('../models/Pet');

// helpers
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

module.exports = class PetController {
  // create a pet
  static async create(req, res) {
    const {
      name,
      years,
      months,
      weightKg,
      weightG,
      type,
      specificType,
      sex,
      bio,
      latLong,
      state,
      city,
      district,
    } = req.body;

    const images = req.files;

    const active = true;

    // validations
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório!' });
      return;
    }

    if (!type) {
      res.status(422).json({ message: 'O tipo é obrigatório!' });
      return;
    }

    if (!specificType) {
      res.status(422).json({ message: 'O tipo específico é obrigatório!' });
      return;
    }

    if (!sex) {
      res.status(422).json({ message: 'O sexo é obrigatório!' });
      return;
    }

    if (!years) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }

    if (!months) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }

    if (!weightKg) {
      res.status(422).json({ message: 'O peso é obrigatório!' });
      return;
    }

    if (!weightG) {
      res.status(422).json({ message: 'O peso é obrigatório!' });
      return;
    }

    if (!bio) {
      res.status(422).json({ message: 'A bio é obrigatória!' });
      return;
    }

    if (!latLong) {
      res.status(422).json({ message: 'A seleção de um local no mapa é obrigatória!' });
      return;
    }

    if (!state) {
      res.status(422).json({ message: 'Escolha um lugar dentro de Portugal' });
      return;
    }

    if (images.length === 0) {
      res.status(422).json({ message: 'A imagem é obrigatória!' });
      return;
    }

    // get pet owner
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (!user) {
      res.status(422).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      return;
    }

    // create a pet
    const pet = new Pet({
      name,
      type,
      specificType,
      sex,
      years,
      months,
      weightKg,
      weightG,
      bio,
      latLong,
      state,
      city,
      district,
      active,
      images: [],
      user: {
        _id: user._id,
        name: user.name,
        image: user.image,
        phone: user.phone,
      },
    });

    images.map((image) => pet.images.push(image.filename));

    try {
      const newPet = await pet.save();
      await fsExtra.rename(path.resolve(__dirname, '..', '..', 'public', 'images', 'pets', 'newFolder'), path.resolve(__dirname, '..', '..', 'public', 'images', 'pets', newPet._id.toString()));
      res.status(201).json({
        message: 'Pet cadastrado com sucesso!',
        newPet,
      });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  // get all pets
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page, 10) - 1 || 0;
      const search = req.query.search || '';
      const sort = { createdAt: parseInt(req.query.sort, 10) || -1 };
      const limit = 4;

      const pets = await Pet.find({ name: { $regex: search, $options: 'i' } })
        .sort(sort)
        .skip(page * limit)
        .limit(limit);

      const total = await Pet.countDocuments({
        name: { $regex: search, $options: 'i' },
      });

      // const pets = await Pet.find().select('-user').sort('-createdAt');
      res.status(200).json({
        total, pets,
      });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async getAllUserPets(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (!user) {
      res.status(422).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      return;
    }

    try {
      const pets = await Pet.find({ 'user._id': user._id }).sort('-createdAt');
      res.status(200).json({
        pets,
      });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async getPetById(req, res) {
    const { id } = req.params;

    // check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID inválido!' });
      return;
    }

    // check user
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (!user) {
      res.status(422).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      return;
    }

    // check if pet exists
    const pet = await Pet.findOne({ _id: id });

    // check if user is the owner
    const isOwner = pet.user._id.toString() === user.id.toString();

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    res.status(200).json({
      pet, isOwner,
    });
  }

  static async removePetById(req, res) {
    const { id } = req.params;

    // check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID inválido!' });
      return;
    }

    // check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    // check if user is logged and pet owner
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }

    try {
      await Pet.findByIdAndRemove(id);
      fsExtra.removeSync(path.resolve(__dirname, '..', '..', 'public', 'images', 'pets', id));

      res.status(200).json({
        message: 'Pet removido com sucesso!',
      });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }

  static async updatePet(req, res) {
    const { id } = req.params;

    const {
      name,
      years,
      months,
      weightKg,
      weightG,
      type,
      specificType,
      sex,
      bio,
      latLong,
      state,
      city,
      district,
    } = req.body;

    const images = [];
    if (req.files.length > 0) {
      req.files.map((image) => images.push(image.filename));
    }

    const updatedData = {};

    // check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID inválido!' });
      return;
    }

    // check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    // check if user is logged and pet owner
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
      return;
    }

    // validations
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório!' });
      return;
    }
    updatedData.name = name;

    if (!type) {
      res.status(422).json({ message: 'O tipo é obrigatório!' });
      return;
    }
    updatedData.type = type;

    if (!specificType) {
      res.status(422).json({ message: 'O tipo específico é obrigatório!' });
      return;
    }
    updatedData.specificType = specificType;

    if (!sex) {
      res.status(422).json({ message: 'O sexo é obrigatório!' });
      return;
    }
    updatedData.sex = sex;

    if (!years) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }
    updatedData.years = years;

    if (!months) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }
    updatedData.months = months;

    if (!weightKg) {
      res.status(422).json({ message: 'O peso é obrigatório!' });
      return;
    }
    updatedData.weightKg = weightKg;

    if (!weightG) {
      res.status(422).json({ message: 'O peso é obrigatório!' });
      return;
    }
    updatedData.weightG = weightG;

    if (!bio) {
      res.status(422).json({ message: 'A bio é obrigatória!' });
      return;
    }
    updatedData.bio = bio;

    if (!latLong) {
      res.status(422).json({ message: 'A seleção de um local no mapa é obrigatória!' });
      return;
    }
    updatedData.latLong = latLong;

    if (!state) {
      res.status(422).json({ message: 'Escolha um lugar dentro de Portugal' });
      return;
    }
    updatedData.state = state;
    updatedData.city = city;
    updatedData.district = district;

    if (images.length > 0) {
      updatedData.images = [];
      images.map((image) => updatedData.images.push(image));
    }

    try {
      await Pet.findByIdAndUpdate(id, updatedData);
      res.status(200).json({
        message: 'Pet atualizado com sucesso!',
      });
    } catch (error) {
      res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
  }
};
