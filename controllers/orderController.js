const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Table = require('../models/Table');
const Notification = require('../models/Notification');

// @desc    Place order from active table cart
// @route   POST /api/orders
// @access  Private (Customer/Guest)
exports.placeOrder = async (req, res, next) => {
  try {
    const tableNum = req.user.tableNum || req.body.tableNum;
    if (!tableNum) {
      return res.status(400).json({ success: false, message: 'Table number is required to place an order.' });
    }

    // 1. Fetch table cart or use body items fallback
    let cartItems = [];
    const dbCart = await Cart.findOne({ tableNum });
    if (dbCart && dbCart.items && dbCart.items.length > 0) {
      cartItems = dbCart.items;
    } else if (req.body.items && req.body.items.length > 0) {
      cartItems = req.body.items.map(item => ({
        menuItem: item.menuItemId || item._id,
        name: item.name,
        price: item.price,
        qty: item.qty || 1,
        addedBy: item.addedBy || (req.user ? req.user.name : 'Guest')
      }));
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your table cart is empty. Add items first.' });
    }

    // 2. Calculate prices
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.10; // 10% GST & Service
    const total = subtotal + tax;

    // 3. Setup user references
    const isGuestUser = req.user ? req.user.isGuest : true;
    const sessionType = isGuestUser ? 'guest' : 'member';
    const userRef = req.user && !req.user.isGuest ? req.user._id : undefined;
    const guestRef = req.user && req.user.isGuest ? req.user._id : undefined;

    // 4. Create order record
    const order = await Order.create({
      tableNum,
      items: cartItems.map(item => ({
        menuItem: item.menuItem,
        name: item.name,
        price: item.price,
        qty: item.qty,
        addedBy: item.addedBy
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

    // 5. Clear table cart if exists
    if (dbCart) {
      dbCart.items = [];
      await dbCart.save();
    }

    // 6. Set Table status to occupied
    await Table.findOneAndUpdate({ num: tableNum }, { status: 'occupied' });

    // 7. Create admin/waiter notification
    await Notification.create({
      recipientRole: 'waiter',
      tableNum,
      message: `🛎️ New Order placed by Table #${tableNum} - Total: ₹${total.toLocaleString('en-IN')}`
    });

    // 8. Socket notifications
    const io = req.app.get('io');
    if (io) {
      // Notify table members that order is placed
      io.to(`table_room_${tableNum}`).emit('order:placed', order);
      io.to(`table_room_${tableNum}`).emit('cart:updated', dbCart || { tableNum, items: [] }); // Sync empty cart
      
      // Notify waitstaff and admin
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
