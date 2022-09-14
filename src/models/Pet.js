const mongoose = require('../db/conn');

const { Schema } = mongoose;

const Pet = mongoose.model(
  'Pet',
  new Schema({
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    specificType: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      required: true,
    },
    years: {
      type: Number,
      required: true,
    },
    months: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    images: {
      type: Array,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    latLong: {
      type: Array,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
    },
    user: Object,
  }, { timestamps: true }),
);

module.exports = Pet;
