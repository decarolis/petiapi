const router = require('express').Router();
const UserController = require('../controllers/UserController');

// middleware
const verifyToken = require('../helpers/verify-token');
const { uploadImage } = require('../helpers/image-upload');

router.post('/register', UserController.register);
router.get('/activate/:id/verify/:token', UserController.activateAccount);
router.post('/login', UserController.login);
router.post('/reset', UserController.resetPasswordEmail);
router.patch('/reset', UserController.resetPassword);
router.get('/reset/:id/:token', UserController.resetPasswordLink);
router.get('/favorites', verifyToken, UserController.getAllUserFavorites);
router.get('/checkuser', UserController.checkUser);
router.get('/:id', UserController.getUserById);
router.patch('/favorites/:id', verifyToken, UserController.addPetToFav);
router.patch('/edit', verifyToken, uploadImage, UserController.editUser);

module.exports = router;
