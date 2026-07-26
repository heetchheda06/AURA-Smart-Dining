const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  addedBy: {
    type: String,
    required: true,
    default: 'You'
  }
});

const orderSchema = new mongoose.Schema({
  tableNum: {
    type: Number,
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'served', 'completed', 'cancelled'],
    default: 'pending'
  },
  sessionType: {
    type: String,
    enum: ['guest', 'member'],
    required: true
  },
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  }
}, {
  timestamps: true,
  bufferCommands: false,      // ← Don't buffer — fail fast if not connected
  bufferTimeoutMS: 8000       // ← 8s max wait if buffering is ever enabled
});

module.exports = mongoose.model('Order', orderSchema);
