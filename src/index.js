require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Config JSON response
app.use(express.json());

// Solve CORS

const whiteList = [
  'https://petiapp.netlify.app',
  'https://peti.pt',
  'http://localhost:3000',
];

const corsOptions = {
  originorigin(origin, callback) {
    if (whiteList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://peti.pt');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );
  res.setHeader('content-type', 'application/json');
  next();
});

app.use(helmet());

// Public folder for images
app.use(express.static('public'));

// Routes
const UserRoutes = require('./routes/UserRoutes');
const PetRoutes = require('./routes/PetRoutes');

app.use('/users', UserRoutes);
app.use('/pets', PetRoutes);

app.listen(Number(process.env.APP_PORT));
