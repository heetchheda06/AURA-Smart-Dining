const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  ingredient_id: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  category: {
    type: String,
    default: 'Pantry'
  },
  unit: {
    type: String,
    required: true,
    default: 'kg'
  },
  initial_stock: {
    type: Number,
    default: 50
  },
  current_stock: {
    type: Number,
    required: true,
    default: 10
  },
  quantity: {
    type: Number,
    default: 10
  },
  reorder_threshold: {
    type: Number,
    default: 5
  },
  minThreshold: {
    type: Number,
    default: 5
  },
  maxCapacity: {
    type: Number,
    default: 100
  },
  cost_per_unit: {
    type: Number,
    default: 100
  },
  shelf_life_days: {
    type: Number,
    default: 30
  },
  is_low_stock: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-calculate status before save
ingredientSchema.pre('save', function(next) {
  const stock = this.current_stock !== undefined ? this.current_stock : this.quantity;
  const thresh = this.reorder_threshold !== undefined ? this.reorder_threshold : this.minThreshold;
  this.quantity = stock;
  this.minThreshold = thresh;

  if (stock <= 0) {
    this.status = 'out_of_stock';
    this.is_low_stock = true;
  } else if (stock <= thresh) {
    this.status = 'low_stock';
    this.is_low_stock = true;
  } else {
    this.status = 'in_stock';
    this.is_low_stock = false;
  }
  next();
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
