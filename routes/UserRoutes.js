const router = require('express').Router();
const UserController = require('../controllers/UserController');

// middleware
const verifyToken = require('../helpers/verify-token');
const { imageUpload } = require('../helpers/image-upload');

router.post('/register', imageUpload.single('image'), UserController.register);
router.post('/login', UserController.login);
router.get('/favorites', UserController.getAllFavorites);
router.get('/checkuser', UserController.checkUser);
router.get('/:id', UserController.getUserById);
router.patch('/favorites/:id', UserController.addPetToFav);
router.patch('/edit/:id', verifyToken, imageUpload.single('image'), UserController.editUser);

module.exports = router;
