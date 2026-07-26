const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientRole: {
    type: String,
    enum: ['admin', 'waiter', 'customer'],
    required: true
  },
  tableNum: {
    type: Number
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
