const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Table = require('../models/Table');
const Notification = require('../models/Notification');

// ── Helper: Wait up to maxMs for MongoDB to be fully connected ────────────────
const waitForDB = (maxMs = 15000) => {
  return new Promise((resolve, reject) => {
    // readyState 1 = connected
    if (mongoose.connection.readyState === 1) return resolve();

    const interval = 300; // poll every 300ms
    let waited = 0;

    const timer = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(timer);
        return resolve();
      }
      waited += interval;
      if (waited >= maxMs) {
        clearInterval(timer);
        reject(new Error(`Database not connected after ${maxMs / 1000}s. Please try again in a moment.`));
      }
    }, interval);
  });
};

// @desc    Place order from active table cart
// @route   POST /api/orders
// @access  Private (Customer/Guest)
exports.placeOrder = async (req, res, next) => {
  try {
    const tableNum = req.user?.tableNum || req.body?.tableNum;
    if (!tableNum) {
      return res.status(400).json({ success: false, message: 'Table number is required to place an order.' });
    }

    // 1. Use body items FIRST (frontend always sends them) — no DB blocking
    let cartItems = [];
    let dbCart = null;

    if (req.body.items && req.body.items.length > 0) {
      // Frontend sent items directly — use immediately, no Cart DB lookup needed
      cartItems = req.body.items.map(item => ({
        menuItem: item.menuItemId || item._id || item.menuItem || '000000000000000000000000',
        name: item.name,
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1,
        addedBy: item.addedBy || (req.user ? req.user.name : 'Guest')
      }));

      // Fire-and-forget: try to also clear Cart in background (won't block order)
      Cart.findOne({ tableNum }).then(cart => {
        if (cart && cart.items && cart.items.length > 0) {
          cart.items = [];
          cart.save().catch(() => {});
        }
      }).catch(() => {});

    } else {
      // Fallback: try Cart DB with timeout
      try {
        dbCart = await Promise.race([
          Cart.findOne({ tableNum }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cart lookup timeout')), 4000))
        ]);
      } catch (e) {
        // Cart timed out or failed — continue without it
        dbCart = null;
      }

      if (dbCart && dbCart.items && dbCart.items.length > 0) {
        cartItems = dbCart.items;
      }
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before ordering.' });
    }

    // 2. Calculate prices
    const subtotal = cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
    const tax = Math.round(subtotal * 0.10 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // 3. Session type
    const isGuestUser = req.user ? req.user.isGuest : true;
    const sessionType = isGuestUser ? 'guest' : 'member';

    // Only set refs if they are valid MongoDB ObjectIds
    const isValidId = (id) => id && mongoose.isValidObjectId(String(id)) && typeof id === 'object';
    const userRef = (!isGuestUser && isValidId(req.user?._id)) ? req.user._id : undefined;
    const guestRef = (isGuestUser && isValidId(req.user?._id)) ? req.user._id : undefined;

    // 4. Wait for DB to be ready (handles cold-start connection delay on Render)
    await waitForDB(15000);

    // 5. Create order
    const order = await Order.create({
      tableNum,
      items: cartItems.map(item => ({
        menuItem: mongoose.isValidObjectId(item.menuItem) ? item.menuItem : new mongoose.Types.ObjectId(),
        name: item.name || 'Menu Item',
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1,
        addedBy: item.addedBy || 'Guest'
      })),
      subtotal,
      tax,
      total,
      status: 'pending',
      sessionType,
      userRef,
      guestRef,
      paymentStatus: 'unpaid'
    });

    // 5. Update table status (non-blocking)
    Table.findOneAndUpdate({ num: tableNum }, { status: 'occupied' }).catch(() => {});

    // 6. Create notification (non-blocking)
    Notification.create({
      recipientRole: 'waiter',
      tableNum,
      message: `🛎️ New Order placed at Table #${tableNum} — Total: ₹${total.toLocaleString('en-IN')}`
    }).catch(() => {});

    // 7. Socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`table_room_${tableNum}`).emit('order:placed', order);
      io.to(`table_room_${tableNum}`).emit('cart:updated', { tableNum, items: [] });
      io.to('staff_room').emit('waiter:new_order', { tableNum, orderId: order._id, total });
      io.to('admin_room').emit('admin:new_order', { tableNum, orderId: order._id, total });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItem');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Waiter/Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    
    // If order is completed, mark payment as paid (simple system assumption for testing, or can be separate check)
    if (status === 'completed') {
      order.paymentStatus = 'paid';
      
      // Free table when diner finishes session (Admin can also do this)
      await Table.findOneAndUpdate({ num: order.tableNum }, { status: 'free' });
    }

    await order.save();

    // Create notifications for table customers
    const io = req.app.get('io');
    if (io) {
      // Send real-time order status update to table
      io.to(`table_room_${order.tableNum}`).emit('order:status_updated', {
        orderId: order._id,
        status: order.status,
        message: `🍳 Your order status updated to: ${status}`
      });
      
      // If table became free, sync table status with floor plan
      if (status === 'completed') {
        io.emit('table:status_changed', { num: order.tableNum, status: 'free' });
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders (Customer order history or Waiter/Admin view)
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    let query = {};

    // Customers see only their current table orders or user orders
    if (req.user.role === 'customer') {
      if (req.user.isGuest) {
        query = { tableNum: req.user.tableNum, guestRef: req.user._id };
      } else {
        query = { userRef: req.user._id };
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Split bill per person
// @route   GET /api/orders/:id/split/:count
// @access  Private
exports.splitBill = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const splitCount = Number(req.params.count) || 1;
    const splitAmount = order.total / splitCount;

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        total: order.total,
        splitCount,
        splitAmount,
        formattedAmount: `₹${splitAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
      }
    });
  } catch (error) {
    next(error);
  }
};
