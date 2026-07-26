const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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

const cartSchema = new mongoose.Schema({
  tableNum: {
    type: Number,
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);
