const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Table = require('../models/Table');
const Notification = require('../models/Notification');

// ── In-Memory Order Store (fallback when MongoDB is not connected) ─────────────
// This keeps orders alive in RAM so Chef/Cashier dashboards work even without DB
const memoryOrders = [];
let memoryOrderIdCounter = 1;

const isDBConnected = () => mongoose.connection.readyState === 1;

const createMemoryOrder = (data) => {
  const order = {
    _id: `mem_order_${Date.now()}_${memoryOrderIdCounter++}`,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryOrders.unshift(order); // newest first
  // Keep only last 100 orders in memory
  if (memoryOrders.length > 100) memoryOrders.pop();
  return order;
};

// @desc    Place order from active table cart
// @route   POST /api/orders
// @access  Public / Private (Customer/Guest)
exports.placeOrder = async (req, res, next) => {
  const tableNum = req.user?.tableNum || req.body?.tableNum;
  if (!tableNum) {
    return res.status(400).json({ success: false, message: 'Table number is required to place an order.' });
  }

  // 1. Build cart items from request body (frontend always sends them)
  let cartItems = [];

  if (req.body.items && req.body.items.length > 0) {
    cartItems = req.body.items.map(item => ({
      menuItem: item.menuItemId || item._id || item.menuItem || new mongoose.Types.ObjectId().toString(),
      name: item.name || 'Menu Item',
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
      addedBy: item.addedBy || (req.user?.name) || 'Guest'
    }));
  }

  if (cartItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before ordering.' });
  }

  // 2. Calculate bill
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(subtotal * 0.10 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const isGuestUser = req.user ? req.user.isGuest : true;
  const sessionType = isGuestUser ? 'guest' : 'member';

  // 3. Emit socket FIRST — kitchen gets notified immediately regardless of DB
  const io = req.app.get('io');

  // 4. Try MongoDB — but don't wait forever
  let order;
  let savedToDb = false;

  if (isDBConnected()) {
    try {
      const isValidObjId = (id) => id && mongoose.isValidObjectId(String(id)) && typeof id === 'object';
      const userRef = (!isGuestUser && isValidObjId(req.user?._id)) ? req.user._id : undefined;
      const guestRef = (isGuestUser && isValidObjId(req.user?._id)) ? req.user._id : undefined;

      order = await Promise.race([
        Order.create({
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
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB write timeout')), 8000))
      ]);
      savedToDb = true;

      // Background cleanup — non-blocking
      Cart.findOne({ tableNum }).then(cart => {
        if (cart) { cart.items = []; cart.save().catch(() => {}); }
      }).catch(() => {});
      Table.findOneAndUpdate({ num: tableNum }, { status: 'occupied' }).catch(() => {});
      Notification.create({
        recipientRole: 'waiter',
        tableNum,
        message: `🛎️ New Order at Table #${tableNum} — ₹${total.toLocaleString('en-IN')}`
      }).catch(() => {});

    } catch (dbErr) {
      console.warn(`⚠️ DB write failed (${dbErr.message}), falling back to in-memory order.`);
      savedToDb = false;
    }
  }

  // 5. Fallback: create in-memory order if DB write failed or DB not connected
  if (!savedToDb) {
    order = createMemoryOrder({
      tableNum,
      items: cartItems,
      subtotal,
      tax,
      total,
      status: 'pending',
      sessionType,
      paymentStatus: 'unpaid'
    });
    console.log(`📋 Order stored in memory (DB unavailable): Table #${tableNum} ₹${total}`);
  }

  // 6. Socket notifications (always fires — whether DB or memory)
  if (io) {
    // Global broadcasts to all open staff/admin portals
    io.emit('order:placed', order);
    io.emit('chef:new_order', { order });
    io.emit('admin:new_order', { tableNum, orderId: order._id, total, order });
    io.emit('waiter:new_order', { tableNum, orderId: order._id, total, order });

    // Table room specific broadcasts
    io.to(`table_room_${tableNum}`).emit('order:placed', order);
    io.to(`table_room_${tableNum}`).emit('cart:updated', { tableNum, items: [] });
  }

  res.status(201).json({ success: true, data: order, savedToDb });
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderDetails = async (req, res, next) => {
  try {
    // Check memory first
    const memOrder = memoryOrders.find(o => o._id === req.params.id);
    if (memOrder) return res.status(200).json({ success: true, data: memOrder });

    if (!isDBConnected()) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id).populate('items.menuItem');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Waiter/Admin/Chef)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Check memory orders first
    const memIdx = memoryOrders.findIndex(o => o._id === req.params.id);
    if (memIdx !== -1) {
      memoryOrders[memIdx].status = status;
      memoryOrders[memIdx].updatedAt = new Date();
      const order = memoryOrders[memIdx];
      const io = req.app.get('io');
      if (io) {
        io.emit('order:status_updated', {
          orderId: order._id,
          tableNum: order.tableNum,
          status: order.status,
          message: `🍳 Order #${order.tableNum} status updated to: ${status}`,
          order
        });
        io.to(`table_room_${order.tableNum}`).emit('order:status_updated', {
          orderId: order._id,
          tableNum: order.tableNum,
          status: order.status,
          message: `🍳 Your order status updated to: ${status}`,
          order
        });
        if (status === 'completed') io.emit('table:status_changed', { num: order.tableNum, status: 'free' });
      }
      return res.status(200).json({ success: true, data: order });
    }

    if (!isDBConnected()) {
      return res.status(503).json({ success: false, message: 'Database not available.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    if (status === 'completed') {
      order.paymentStatus = 'paid';
      await Table.findOneAndUpdate({ num: order.tableNum }, { status: 'free' });
    }
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order:status_updated', {
        orderId: order._id,
        tableNum: order.tableNum,
        status: order.status,
        message: `🍳 Order #${order.tableNum} status updated to: ${status}`,
        order
      });
      io.to(`table_room_${order.tableNum}`).emit('order:status_updated', {
        orderId: order._id,
        tableNum: order.tableNum,
        status: order.status,
        message: `🍳 Your order status updated to: ${status}`,
        order
      });
      if (status === 'completed') io.emit('table:status_changed', { num: order.tableNum, status: 'free' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders (all staff views + customer history)
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    // Always include memory orders (they're always available)
    let allOrders = [...memoryOrders];

    // Merge with DB orders if connected
    if (isDBConnected()) {
      try {
        let query = {};
        if (req.user?.role === 'customer') {
          if (req.user.isGuest) {
            query = { tableNum: req.user.tableNum };
          } else {
            query = { userRef: req.user._id };
          }
        }
        const dbOrders = await Promise.race([
          Order.find(query).sort({ createdAt: -1 }).limit(100),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
        ]);
        // Merge: DB orders + memory orders, deduplicate by _id
        const dbIds = new Set(dbOrders.map(o => o._id.toString()));
        const memOnly = allOrders.filter(o => !dbIds.has(o._id.toString()));
        allOrders = [...memOnly, ...dbOrders];
      } catch (e) {
        console.warn('DB orders query timed out, returning memory orders only.');
      }
    }

    res.status(200).json({ success: true, count: allOrders.length, data: allOrders });
  } catch (error) {
    next(error);
  }
};

// @desc    Split bill per person
// @route   GET /api/orders/:id/split/:count
// @access  Private
exports.splitBill = async (req, res, next) => {
  try {
    const memOrder = memoryOrders.find(o => o._id === req.params.id);
    const order = memOrder || (isDBConnected() ? await Order.findById(req.params.id) : null);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

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

exports.memoryOrders = memoryOrders;
