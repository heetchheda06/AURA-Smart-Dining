const Ingredient = require('../models/Ingredient');

const defaultIngredients = [
  { _id: 'ing_01', ingredient_id: 'ING-01', name: 'Fresh Paneer (Cottage Cheese)', category: 'Dairy', initial_stock: 30, current_stock: 3, quantity: 3, reorder_threshold: 5, minThreshold: 5, maxCapacity: 40, unit: 'kg', cost_per_unit: 320, shelf_life_days: 7, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_02', ingredient_id: 'ING-02', name: 'Boneless Chicken Breast', category: 'Poultry', initial_stock: 50, current_stock: 4, quantity: 4, reorder_threshold: 8, minThreshold: 8, maxCapacity: 60, unit: 'kg', cost_per_unit: 260, shelf_life_days: 5, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_03', ingredient_id: 'ING-03', name: 'Mozzarella Cheese', category: 'Dairy', initial_stock: 25, current_stock: 0, quantity: 0, reorder_threshold: 5, minThreshold: 5, maxCapacity: 30, unit: 'kg', cost_per_unit: 450, shelf_life_days: 15, status: 'out_of_stock', is_low_stock: true },
  { _id: 'ing_04', ingredient_id: 'ING-04', name: 'Basmati Biryani Rice', category: 'Grains', initial_stock: 100, current_stock: 45, quantity: 45, reorder_threshold: 15, minThreshold: 15, maxCapacity: 150, unit: 'kg', cost_per_unit: 140, shelf_life_days: 180, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_05', ingredient_id: 'ING-05', name: 'Fresh Capsicum & Bell Peppers', category: 'Produce', initial_stock: 20, current_stock: 2, quantity: 2, reorder_threshold: 4, minThreshold: 4, maxCapacity: 25, unit: 'kg', cost_per_unit: 90, shelf_life_days: 6, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_06', ingredient_id: 'ING-06', name: 'Amul Butter', category: 'Dairy', initial_stock: 35, current_stock: 18, quantity: 18, reorder_threshold: 6, minThreshold: 6, maxCapacity: 40, unit: 'kg', cost_per_unit: 520, shelf_life_days: 60, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_07', ingredient_id: 'ING-07', name: 'Garlic Cloves', category: 'Produce', initial_stock: 15, current_stock: 1, quantity: 1, reorder_threshold: 3, minThreshold: 3, maxCapacity: 20, unit: 'kg', cost_per_unit: 180, shelf_life_days: 20, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_08', ingredient_id: 'ING-08', name: 'Sweet Corn Kernels', category: 'Produce', initial_stock: 25, current_stock: 14, quantity: 14, reorder_threshold: 5, minThreshold: 5, maxCapacity: 35, unit: 'kg', cost_per_unit: 110, shelf_life_days: 30, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_09', ingredient_id: 'ING-09', name: 'Refined Cooking Oil', category: 'Pantry', initial_stock: 60, current_stock: 22, quantity: 22, reorder_threshold: 10, minThreshold: 10, maxCapacity: 80, unit: 'liters', cost_per_unit: 130, shelf_life_days: 365, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_10', ingredient_id: 'ING-10', name: 'Whole Wheat Flour (Atta)', category: 'Grains', initial_stock: 80, current_stock: 0, quantity: 0, reorder_threshold: 12, minThreshold: 12, maxCapacity: 100, unit: 'kg', cost_per_unit: 45, shelf_life_days: 90, status: 'out_of_stock', is_low_stock: true },
  { _id: 'ing_11', ingredient_id: 'ING-11', name: 'Garam Masala & Indian Spices', category: 'Spices', initial_stock: 10, current_stock: 4, quantity: 4, reorder_threshold: 2, minThreshold: 2, maxCapacity: 15, unit: 'kg', cost_per_unit: 650, shelf_life_days: 180, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_12', ingredient_id: 'ING-12', name: 'Fresh Tomatoes', category: 'Produce', initial_stock: 40, current_stock: 3, quantity: 3, reorder_threshold: 6, minThreshold: 6, maxCapacity: 50, unit: 'kg', cost_per_unit: 40, shelf_life_days: 5, status: 'low_stock', is_low_stock: true }
];

// @desc    Get all ingredients
// @route   GET /api/inventory
// @access  Public / Manager
exports.getIngredients = async (req, res, next) => {
  try {
    let ingredients = await Ingredient.find().sort({ status: 1, name: 1 });
    if (!ingredients || ingredients.length === 0) {
      try {
        await Ingredient.insertMany(defaultIngredients.map(item => {
          const { _id, ...rest } = item;
          return rest;
        }));
        ingredients = await Ingredient.find().sort({ status: 1, name: 1 });
      } catch (seedErr) {
        ingredients = defaultIngredients;
      }
    }
    res.status(200).json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      count: defaultIngredients.length,
      data: defaultIngredients
    });
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
