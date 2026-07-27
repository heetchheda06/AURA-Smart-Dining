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
  { _id: 'ing_12', ingredient_id: 'ING-12', name: 'Fresh Tomatoes', category: 'Produce', initial_stock: 40, current_stock: 3, quantity: 3, reorder_threshold: 6, minThreshold: 6, maxCapacity: 50, unit: 'kg', cost_per_unit: 40, shelf_life_days: 5, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_13', ingredient_id: 'ING-13', name: 'Fresh Goat Mutton', category: 'Meat', initial_stock: 30, current_stock: 2, quantity: 2, reorder_threshold: 5, minThreshold: 5, maxCapacity: 40, unit: 'kg', cost_per_unit: 720, shelf_life_days: 4, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_14', ingredient_id: 'ING-14', name: 'Tiger Prawns & Seafood', category: 'Seafood', initial_stock: 20, current_stock: 0, quantity: 0, reorder_threshold: 4, minThreshold: 4, maxCapacity: 25, unit: 'kg', cost_per_unit: 850, shelf_life_days: 3, status: 'out_of_stock', is_low_stock: true },
  { _id: 'ing_15', ingredient_id: 'ING-15', name: 'Red Onions', category: 'Produce', initial_stock: 100, current_stock: 55, quantity: 55, reorder_threshold: 20, minThreshold: 20, maxCapacity: 120, unit: 'kg', cost_per_unit: 35, shelf_life_days: 30, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_16', ingredient_id: 'ING-16', name: 'Fresh Ginger Root', category: 'Produce', initial_stock: 15, current_stock: 2, quantity: 2, reorder_threshold: 3, minThreshold: 3, maxCapacity: 20, unit: 'kg', cost_per_unit: 140, shelf_life_days: 15, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_17', ingredient_id: 'ING-17', name: 'Fresh Cooking Cream', category: 'Dairy', initial_stock: 25, current_stock: 12, quantity: 12, reorder_threshold: 5, minThreshold: 5, maxCapacity: 30, unit: 'liters', cost_per_unit: 220, shelf_life_days: 10, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_18', ingredient_id: 'ING-18', name: 'Pure Cow Desi Ghee', category: 'Dairy', initial_stock: 20, current_stock: 8, quantity: 8, reorder_threshold: 4, minThreshold: 4, maxCapacity: 25, unit: 'kg', cost_per_unit: 680, shelf_life_days: 180, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_19', ingredient_id: 'ING-19', name: 'All-Purpose Flour (Maida)', category: 'Grains', initial_stock: 60, current_stock: 35, quantity: 35, reorder_threshold: 10, minThreshold: 10, maxCapacity: 80, unit: 'kg', cost_per_unit: 40, shelf_life_days: 120, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_20', ingredient_id: 'ING-20', name: 'Fresh Spinach (Palak)', category: 'Produce', initial_stock: 18, current_stock: 1, quantity: 1, reorder_threshold: 3, minThreshold: 3, maxCapacity: 22, unit: 'kg', cost_per_unit: 45, shelf_life_days: 3, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_21', ingredient_id: 'ING-21', name: 'Button Mushrooms', category: 'Produce', initial_stock: 15, current_stock: 0, quantity: 0, reorder_threshold: 3, minThreshold: 3, maxCapacity: 20, unit: 'kg', cost_per_unit: 180, shelf_life_days: 5, status: 'out_of_stock', is_low_stock: true },
  { _id: 'ing_22', ingredient_id: 'ING-22', name: 'Spicy Green Chillies', category: 'Produce', initial_stock: 10, current_stock: 4, quantity: 4, reorder_threshold: 2, minThreshold: 2, maxCapacity: 12, unit: 'kg', cost_per_unit: 60, shelf_life_days: 10, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_23', ingredient_id: 'ING-23', name: 'Fresh Coriander (Dhania)', category: 'Produce', initial_stock: 8, current_stock: 1, quantity: 1, reorder_threshold: 2, minThreshold: 2, maxCapacity: 10, unit: 'kg', cost_per_unit: 50, shelf_life_days: 4, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_24', ingredient_id: 'ING-24', name: 'Fresh Mint (Pudina)', category: 'Produce', initial_stock: 6, current_stock: 3, quantity: 3, reorder_threshold: 1, minThreshold: 1, maxCapacity: 8, unit: 'kg', cost_per_unit: 70, shelf_life_days: 4, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_25', ingredient_id: 'ING-25', name: 'Potatoes (Aloo)', category: 'Produce', initial_stock: 90, current_stock: 48, quantity: 48, reorder_threshold: 15, minThreshold: 15, maxCapacity: 100, unit: 'kg', cost_per_unit: 25, shelf_life_days: 45, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_26', ingredient_id: 'ING-26', name: 'Fresh Cauliflower (Gobi)', category: 'Produce', initial_stock: 25, current_stock: 2, quantity: 2, reorder_threshold: 4, minThreshold: 4, maxCapacity: 30, unit: 'kg', cost_per_unit: 35, shelf_life_days: 6, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_27', ingredient_id: 'ING-27', name: 'Green Peas (Matar)', category: 'Produce', initial_stock: 20, current_stock: 11, quantity: 11, reorder_threshold: 4, minThreshold: 4, maxCapacity: 25, unit: 'kg', cost_per_unit: 80, shelf_life_days: 14, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_28', ingredient_id: 'ING-28', name: 'Fresh Lemons', category: 'Produce', initial_stock: 12, current_stock: 0, quantity: 0, reorder_threshold: 2, minThreshold: 2, maxCapacity: 15, unit: 'kg', cost_per_unit: 120, shelf_life_days: 14, status: 'out_of_stock', is_low_stock: true },
  { _id: 'ing_29', ingredient_id: 'ING-29', name: 'Farm Fresh Poultry Eggs', category: 'Poultry', initial_stock: 200, current_stock: 95, quantity: 95, reorder_threshold: 30, minThreshold: 30, maxCapacity: 250, unit: 'units', cost_per_unit: 7, shelf_life_days: 21, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_30', ingredient_id: 'ING-30', name: 'Whole Milk Yogurt (Dahi)', category: 'Dairy', initial_stock: 35, current_stock: 18, quantity: 18, reorder_threshold: 6, minThreshold: 6, maxCapacity: 40, unit: 'kg', cost_per_unit: 65, shelf_life_days: 7, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_31', ingredient_id: 'ING-31', name: 'Cashew Nut Paste', category: 'Nuts', initial_stock: 10, current_stock: 1, quantity: 1, reorder_threshold: 2, minThreshold: 2, maxCapacity: 12, unit: 'kg', cost_per_unit: 800, shelf_life_days: 60, status: 'low_stock', is_low_stock: true },
  { _id: 'ing_32', ingredient_id: 'ING-32', name: 'Dark Chocolate & Cocoa', category: 'Bakery', initial_stock: 15, current_stock: 7, quantity: 7, reorder_threshold: 3, minThreshold: 3, maxCapacity: 20, unit: 'kg', cost_per_unit: 420, shelf_life_days: 180, status: 'in_stock', is_low_stock: false },
  { _id: 'ing_33', ingredient_id: 'ING-33', name: 'Espresso Coffee Beans', category: 'Beverages', initial_stock: 12, current_stock: 0, quantity: 0, reorder_threshold: 2, minThreshold: 2, maxCapacity: 15, unit: 'kg', cost_per_unit: 950, shelf_life_days: 90, status: 'out_of_stock', is_low_stock: true }
];

let memoryIngredients = [...defaultIngredients];

// @desc    Get all ingredients
// @route   GET /api/inventory
// @access  Public / Manager
exports.getIngredients = async (req, res, next) => {
  try {
    let ingredients = [];
    try {
      ingredients = await Promise.race([
        Ingredient.find().sort({ status: 1, name: 1 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 3000))
      ]);
    } catch (e) {
      console.warn('⚠️ Inventory DB fetch failed, using RAM fallback.');
    }

    if (!ingredients || ingredients.length === 0) {
      ingredients = memoryIngredients;
    } else {
      memoryIngredients = ingredients.map(i => (i.toObject ? i.toObject() : i));
    }

    res.status(200).json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      count: memoryIngredients.length,
      data: memoryIngredients
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
