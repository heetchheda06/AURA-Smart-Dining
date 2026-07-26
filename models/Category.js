const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  icon: {
    type: String,
    required: true,
    default: 'fa-solid fa-utensils'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
