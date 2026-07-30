const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  dish_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    default: 'Indian'
  },
  dietary_type: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Vegan'],
    default: 'Veg'
  },
  price: {
    type: Number,
    required: true
  },
  prep_time_minutes: {
    type: Number,
    default: 15
  },
  calories: {
    type: Number,
    default: 300
  },
  ingredients: {
    type: String,
    required: true
  },
  tags: {
    type: String,
    default: ''
  },
  is_available: {
    type: Boolean,
    default: true
  },
  spiciness: {
    type: String,
    default: 'Low'
  },
  isJain: {
    type: Boolean,
    default: false
  },
  jainAvailable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Menu', menuSchema);
