const Cart = require('../models/Cart');
const Menu = require('../models/Menu');

// Helper to broadcast cart updates
const broadcastCartUpdate = (req, tableNum, cart) => {
  const io = req.app.get('io');
  if (io) {
    // Broadcast to everyone in the table room
    io.to(`table_room_${tableNum}`).emit('cart:updated', cart);
  }
};

// @desc    Get cart for a specific table
// @route   GET /api/cart/:tableNum
// @access  Public
exports.getCart = async (req, res, next) => {
  try {
    const tableNum = Number(req.params.tableNum);
    let cart = await Cart.findOne({ tableNum }).populate('items.menuItem');
    
    if (!cart) {
      cart = await Cart.create({ tableNum, items: [] });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to collaborative table cart
// @route   POST /api/cart/:tableNum/add
// @access  Public
exports.addToCart = async (req, res, next) => {
  try {
    const tableNum = Number(req.params.tableNum);
    const { menuItemId, name, price, addedBy } = req.body;

    let cart = await Cart.findOne({ tableNum });
    if (!cart) {
      cart = await Cart.create({ tableNum, items: [] });
    }

    // Check if item already in cart
    const existingIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);

    if (existingIndex > -1) {
      cart.items[existingIndex].qty += 1;
    } else {
      cart.items.push({
        menuItem: menuItemId,
        name,
        price: Number(price),
        qty: 1,
        addedBy: addedBy || 'Someone'
      });
    }

    await cart.save();
    
    // Fetch populated cart for sync and response
    const populatedCart = await Cart.findOne({ tableNum }).populate('items.menuItem');
    broadcastCartUpdate(req, tableNum, populatedCart);

    res.status(200).json({ success: true, data: populatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item quantity in table cart
// @route   POST /api/cart/:tableNum/update
// @access  Public
exports.updateQty = async (req, res, next) => {
  try {
    const tableNum = Number(req.params.tableNum);
    const { menuItemId, delta } = req.body;

    const cart = await Cart.findOne({ tableNum });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found for this table' });
    }

    const itemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);

    if (itemIndex > -1) {
      cart.items[itemIndex].qty += Number(delta);
      
      // If quantity is 0 or less, remove item
      if (cart.items[itemIndex].qty <= 0) {
        cart.items.splice(itemIndex, 1);
      }
      
      await cart.save();
    }

    const populatedCart = await Cart.findOne({ tableNum }).populate('items.menuItem');
    broadcastCartUpdate(req, tableNum, populatedCart);

    res.status(200).json({ success: true, data: populatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear collaborative table cart
// @route   POST /api/cart/:tableNum/clear
// @access  Public
exports.clearCart = async (req, res, next) => {
  try {
    const tableNum = Number(req.params.tableNum);
    
    let cart = await Cart.findOne({ tableNum });
    if (cart) {
      cart.items = [];
      await cart.save();
    } else {
      cart = await Cart.create({ tableNum, items: [] });
    }

    broadcastCartUpdate(req, tableNum, cart);

    res.status(200).json({ success: true, message: 'Cart cleared successfully', data: cart });
  } catch (error) {
    next(error);
  }
};
