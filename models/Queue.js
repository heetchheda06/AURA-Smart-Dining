const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  partySize: {
    type: Number,
    required: true,
    default: 2
  },
  mobile: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['waiting', 'seated', 'cancelled'],
    default: 'waiting'
  },
  tableNumAssigned: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Queue', queueSchema);
