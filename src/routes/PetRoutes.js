const router = require('express').Router();
const PetController = require('../controllers/PetController');

// middlewares
const verifyToken = require('../helpers/verify-token');
const { uploadImages } = require('../helpers/image-upload');

router.post('/create', verifyToken, uploadImages, PetController.create);
router.get('/', PetController.getAll);
router.get('/mypets', verifyToken, PetController.getAllUserPets);
router.get('/:id', PetController.getPetById);
router.delete('/:id', verifyToken, PetController.removePetById);
router.patch('/:id', verifyToken, uploadImages, PetController.updatePet);

module.exports = router;
