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
      return cb(new multer.MulterError('EXTENSION'));
    }
    return cb(null, true);
  },
  limits: { fileSize: 2097152 },
});

const uploadImages = (req, res, next) => {
  const upload = imageUpload.array('images', 8);

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(422).json({ message: 'Escolha imagens com menos de 2MB' });
      }
      if (err.code === 'EXTENSION') {
        return res.status(422).json({ message: 'Escolha imagens .jpeg, .jpg ou .png' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(422).json({ message: 'Escolha no máximo 8 imagens' });
      }
      return res.status(422).json({ message: 'Houve um problema ao processar suas imagens, tente novamente mais tarde!' });
    } if (err) {
      return res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
    return next();
  });
};

const uploadImage = (req, res, next) => {
  const upload = imageUpload.single('image');
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(422).json({ message: 'Escolha uma imagem com menos de 2MB' });
      }
      if (err.code === 'EXTENSION') {
        return res.status(422).json({ message: 'Escolha uma imagem .jpeg, .jpg ou .png' });
      }
      return res.status(422).json({ message: 'Houve um problema ao processar sua imagem, tente novamente mais tarde!' });
    } if (err) {
      return res.status(500).json({ message: 'Houve um problema ao processar sua solicitação, tente novamente mais tarde!' });
    }
    return next();
  });
};

module.exports = { uploadImages, uploadImage };
