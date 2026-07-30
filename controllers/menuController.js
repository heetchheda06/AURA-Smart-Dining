const Menu = require('../models/Menu');
const Category = require('../models/Category');
const { menuItems: fallbackMenu } = require('../seed/seeder');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    let categories = await Category.find().catch(() => []);
    if (!categories || categories.length === 0) {
      categories = [
        { _id: 'cat-1', name: "Starters & Appetizers", slug: "starters-appetizers", icon: "fa-solid fa-fire-flame-curved" },
        { _id: 'cat-2', name: "Soups & Salads", slug: "soups-salads", icon: "fa-solid fa-bowl-food" },
        { _id: 'cat-3', name: "Main Course - Indian", slug: "main-course-indian", icon: "fa-solid fa-pepper-hot" },
        { _id: 'cat-4', name: "Main Course - Asian & Chinese", slug: "main-course-asian-chinese", icon: "fa-solid fa-bowl-rice" },
        { _id: 'cat-5', name: "Main Course - Italian & Continental", slug: "main-course-italian-continental", icon: "fa-solid fa-pizza-slice" },
        { _id: 'cat-6', name: "Burgers & Sandwiches", slug: "burgers-sandwiches", icon: "fa-solid fa-burger" },
        { _id: 'cat-7', name: "Breads & Rice", slug: "breads-rice", icon: "fa-solid fa-bread-slice" },
        { _id: 'cat-8', name: "Desserts", slug: "desserts", icon: "fa-solid fa-cake-candles" },
        { _id: 'cat-9', name: "Beverages & Drinks", slug: "beverages-drinks", icon: "fa-solid fa-wine-glass" }
      ];
    }
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(200).json({ success: true, data: [] });
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

    let menuItems = await Menu.find(query).lean().catch(() => []);

    // Create a dictionary from fallbackMenu for quick lookup by dish_id or name
    const fallbackDict = {};
    (fallbackMenu || []).forEach(f => {
      if (f._id) fallbackDict[f._id] = f;
      if (f.name) fallbackDict[f.name.toLowerCase()] = f;
    });

    if (menuItems && menuItems.length > 0) {
      menuItems = menuItems.map(item => {
        const fb = fallbackDict[item.dish_id] || fallbackDict[(item.name || '').toLowerCase()] || {};
        const isJain = item.isJain !== undefined ? item.isJain : (fb.isJain || false);
        const jainAvailable = item.jainAvailable !== undefined ? item.jainAvailable : (fb.jainAvailable || false);
        const ingredients = fb.ingredients || item.ingredients || '';
        const desc = fb.desc || item.desc || (ingredients ? `Ingredients: ${ingredients}` : '');

        return {
          ...item,
          ingredients,
          desc,
          isJain,
          jainAvailable
        };
      });
    } else {
      let filtered = fallbackMenu || [];
      if (category && category !== 'all') {
        filtered = filtered.filter(item => item.category === category);
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(item => item.name.toLowerCase().includes(s) || (item.ingredients && item.ingredients.toLowerCase().includes(s)));
      }
      menuItems = filtered.map((item, idx) => ({
        _id: item._id || item.dish_id || `dsh-${idx}`,
        dish_id: item._id || item.dish_id || `dsh-${idx}`,
        name: item.name,
        category: item.category,
        cuisine: item.cuisine || 'Indian',
        dietary_type: item.dietary_type || 'Veg',
        isJain: !!item.isJain,
        jainAvailable: !!item.jainAvailable,
        price: item.price,
        prep_time_minutes: item.prep_time_minutes || 15,
        rating: item.rating || 4.8,
        prep: item.prep || `${item.prep_time_minutes || 15} mins`,
        tag: item.tag || (item.tags ? item.tags.split(',')[0] : 'popular'),
        image: item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        ingredients: item.ingredients || '',
        desc: item.desc || (item.ingredients ? `Ingredients: ${item.ingredients}` : 'Chef special delicacy cooked to perfection.')
      }));
    }

    res.status(200).json({ success: true, count: menuItems.length, data: menuItems });
  } catch (error) {
    console.error("Menu fetch error:", error);
    res.status(200).json({ success: true, count: fallbackMenu.length, data: fallbackMenu });
  }
};

// @desc    Create a menu item
// @route   POST /api/menu
// @access  Private/Admin
exports.createMenuItem = async (req, res, next) => {
  try {
    const { name, category, price, rating, prep, tag, desc } = req.body;
    let imageUrl = req.body.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';

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
    let menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (req.file) {
      req.body.image = req.file.path;
    }

    menuItem = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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
