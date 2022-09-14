const multer = require('multer');
const path = require('path');

const aleatorio = () => Math.floor(Math.random() * 100 + 100);

// Destination to store the images
const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    let folder = '';

    if (req.baseUrl.includes('users')) {
      folder = 'users';
    } else if (req.baseUrl.includes('pets')) {
      folder = 'pets';
    }

    cb(null, path.resolve(__dirname, '..', '..', 'public', 'images', folder));
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}_${+aleatorio()}${path.extname(file.originalname)}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error('Por favor, envie apenas jpg ou png!'));
    }
    return cb(null, true);
  },
});

module.exports = { imageUpload };
