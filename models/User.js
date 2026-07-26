const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: function() { return this.provider === 'local'; }
  },
  googleId: {
    type: String
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profileImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  },
  role: {
    type: String,
    enum: ['customer', 'manager', 'chef', 'cashier', 'waiter', 'admin'],
    default: 'customer'
  },
  loyaltyPoints: {
    type: Number,
    default: 150
  },
  savedAddresses: [{
    label: String,
    street: String,
    city: String,
    zip: String
  }],
  wishlist: [{
    type: String
  }],
  employeeDetails: {
    department: String,
    shift: String,
    joinDate: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  if (this.password === candidatePassword) return true;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
