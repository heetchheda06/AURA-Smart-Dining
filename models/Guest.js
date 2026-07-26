const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Guest Customer'
  },
  mobile: {
    type: String,
    trim: true
  },
  tableNum: {
    type: Number,
    required: true
  },
  socketId: {
    type: String
  },
  sessionActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Guest', guestSchema);
