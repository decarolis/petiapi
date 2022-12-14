const mongoose = require('../db/conn');

const { Schema } = mongoose;

const LinkToken = mongoose.model(
  'Token',
  new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true,
    },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 },
  }),
);

module.exports = LinkToken;
