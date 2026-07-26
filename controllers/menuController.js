const Menu = require('../models/Menu');
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, icon } = req.body;
    const category = await Category.create({ name, slug, icon });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get menu items (with search & category filters)
// @route   GET /api/menu
// @access  Public
exports.getMenuItems = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { desc: { $regex: search, $options: 'i' } }
      ];
    }

    const menuItems = await Menu.find(query);
    res.status(200).json({ success: true, count: menuItems.length, data: menuItems });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a menu item
// @route   POST /api/menu
// @access  Private/Admin
exports.createMenuItem = async (req, res, next) => {
  try {
    const { name, category, price, rating, prep, tag, desc } = req.body;
    let imageUrl = req.body.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';

    // If file is uploaded via multer/cloudinary
    if (req.file) {
      imageUrl = req.file.path;
    }

    const menuItem = await Menu.create({
      name,
      category,
      price: Number(price),
      rating,
      prep,
      tag,
      image: imageUrl,
      desc
    });

    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin
exports.updateMenuItem = async (req, res, next) => {
  try {
    let updateFields = { ...req.body };
    if (req.file) {
      updateFields.image = req.file.path;
    }

    if (updateFields.price) {
      updateFields.price = Number(updateFields.price);
    }

    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    await menuItem.deleteOne();
    res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
