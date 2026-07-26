const Ingredient = require('../models/Ingredient');

// @desc    Get all ingredients
// @route   GET /api/inventory
// @access  Public / Manager
exports.getIngredients = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find().sort({ status: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ingredient stock quantity
// @route   PUT /api/inventory/:id
// @access  Private (Manager/Admin)
exports.updateIngredient = async (req, res, next) => {
  try {
    const { quantity, minThreshold, maxCapacity } = req.body;
    let ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    if (quantity !== undefined) ingredient.quantity = Number(quantity);
    if (minThreshold !== undefined) ingredient.minThreshold = Number(minThreshold);
    if (maxCapacity !== undefined) ingredient.maxCapacity = Number(maxCapacity);
    ingredient.lastRestocked = new Date();

    await ingredient.save();

    // Broadcast inventory update via socket if available
    const io = req.app.get('io');
    if (io) {
      io.emit('inventory:updated', ingredient);
    }

    res.status(200).json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restock ingredient quantity (add delta)
// @route   POST /api/inventory/:id/restock
// @access  Private (Manager/Admin)
exports.restockIngredient = async (req, res, next) => {
  try {
    const { deltaAmount = 5 } = req.body;
    let ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    ingredient.quantity = Math.max(0, ingredient.quantity + Number(deltaAmount));
    ingredient.lastRestocked = new Date();
    await ingredient.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('inventory:updated', ingredient);
    }

    res.status(200).json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new ingredient
// @route   POST /api/inventory
// @access  Private (Manager/Admin)
exports.addIngredient = async (req, res, next) => {
  try {
    const { name, category, quantity, unit, minThreshold, maxCapacity } = req.body;

    const existing = await Ingredient.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ingredient already exists.' });
    }

    const ingredient = await Ingredient.create({
      name: name.trim(),
      category: category || 'Produce',
      quantity: Number(quantity) || 10,
      unit: unit || 'kg',
      minThreshold: Number(minThreshold) || 5,
      maxCapacity: Number(maxCapacity) || 50
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('inventory:updated', ingredient);
    }

    res.status(201).json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    next(error);
  }
};
