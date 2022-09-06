const { ObjectId } = require('mongoose').Types;
const Pet = require('../models/Pet');

// helpers
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

module.exports = class PetController {
  // create a pet
  static async create(req, res) {
    const {
      name, age, weight, type, specificType, sex, bio, latLong, state, city, district,
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

    if (!age) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }

    if (!weight) {
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

    // create a pet
    const pet = new Pet({
      name,
      type,
      specificType,
      sex,
      age,
      weight,
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
      res.status(201).json({
        message: 'Pet cadastrado com sucesso!',
        newPet,
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  // get all pets
  static async getAll(req, res) {
    const pets = await Pet.find().sort('-createdAt');

    res.status(200).json({
      pets,
    });
  }

  static async getAllUserPets(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token);

    const pets = await Pet.find({ 'user._id': user._id }).sort('-createdAt');

    res.status(200).json({
      pets,
    });
  }

  //   static async getAllUserAdoptions(req, res) {
  //     const token = getToken(req);
  //     const user = await getUserByToken(token);

  //     const pets = await Pet.find({ 'adopter._id': user._id }).sort('-createdAt');

  //     res.status(200).json({
  //       pets,
  //     });
  //   }

  static async getPetById(req, res) {
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

    res.status(200).json({
      pet,
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
      res.status(200).json({
        message: 'Pet removido com sucesso!',
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  static async updatePet(req, res) {
    const { id } = req.params;

    const {
      name, age, weight, type, specificType, sex, bio, latLong, state, city, district,
    } = req.body;

    const images = req.files;

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

    if (!age) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }
    updatedData.age = age;

    if (!weight) {
      res.status(422).json({ message: 'O peso é obrigatório!' });
      return;
    }
    updatedData.weight = weight;

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

    if (images.length === 0) {
      res.status(422).json({ message: 'A imagem é obrigatória!' });
      return;
    }
    updatedData.images = [];
    images.map((image) => updatedData.images.push(image.filename));

    try {
      await Pet.findByIdAndUpdate(id, updatedData);
      res.status(200).json({
        message: 'Pet atualizado com sucesso!',
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  //   static async schedule(req, res) {
  //     const { id } = req.params;

  //     // check if pet exists
  //     const pet = await Pet.findOne({ _id: id });

  //     if (!pet) {
  //       res.status(404).json({ message: 'Pet não encontrado!' });
  //       return;
  //     }

  //     // check if user registered the pet
  //     console.log('oi');
  //     const token = getToken(req);
  //     console.log(token);
  //     const user = await getUserByToken(token);
  //     console.log(user);

  //     if (pet.user._id.equals(user._id)) {
  //       res.status(422)
  //    .json({ message: 'Você não pode agendar uma visita com seu próprio pet!' });
  //       return;
  //     }

  //     // check if user has already scheduled a visit
  //     if (pet.adopter) {
  //       if (pet.adopter._id.equals(user._id)) {
  //         res.status(422).json({ message: 'Você já agendou uma visita para este pet!' });
  //         return;
  //       }
  //     }

  //     // add user to pet
  //     pet.adopter = {
  //       _id: user._id,
  //       name: user.name,
  //       image: user.image,
  //     };

  //     try {
  //       await Pet.findByIdAndUpdate(id, pet);
  //       res.status(200).json({
  //         message: `A visita foi agendada com sucesso,
  //       entre em contato com ${pet.user.name} pelo telefone ${pet.user.phone}.`,
  //       });
  //     } catch (error) {
  //       res.status(500).json({ message: error });
  //     }
  //   }

  //   static async concludeAdoption(req, res) {
  //     const { id } = req.params;

  //     // check if pet exists
  //     const pet = await Pet.findOne({ _id: id });

  //     if (!pet) {
  //       res.status(404).json({ message: 'Pet não encontrado!' });
  //       return;
  //     }

  //     // check if user is logged and pet owner
  //     const token = getToken(req);
  //     const user = await getUserByToken(token);

  //     if (pet.user._id.toString() !== user._id.toString()) {
  //       res.status(422).json({
  //       message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!'
  //     });
  //       return;
  //     }

  //     pet.available = false;

//     try {
//       await Pet.findByIdAndUpdate(id, pet);
//       res.status(200).json({
//         message: 'Parabéns! O ciclo de adoção foi finalizado com sucesso!',
//       });
//     } catch (error) {
//       res.status(500).json({ message: error });
//     }
//   }
};
