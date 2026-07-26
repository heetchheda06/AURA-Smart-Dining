const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  num: {
    type: Number,
    required: true,
    unique: true
  },
  seats: {
    type: Number,
    required: true
  },
  zone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['free', 'occupied', 'reserved', 'queued'],
    default: 'free'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
