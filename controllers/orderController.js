const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Table = require('../models/Table');
const Notification = require('../models/Notification');

const { generateHistoricalOrders } = require('../seed/historicalOrdersSeeder');

// ── In-Memory Order Store (fallback when MongoDB is not connected) ─────────────
const memoryOrders = generateHistoricalOrders();
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
  if (memoryOrders.length > 100) memoryOrders.pop();
  return order;
};

// Helper: Consolidate active unpaid orders for the same table into ONE single bill
const consolidateUnpaidOrdersPerTable = async (ordersList) => {
  if (!ordersList || ordersList.length === 0) return ordersList;

  const unpaidByTable = new Map();
  const result = [];

  // Auto-heal customerName on all orders if currently 'AURA Customer', 'AURA Member', etc.
  ordersList.forEach(o => {
    if (o && o.items && o.items.length > 0) {
      const realItemUser = o.items.find(i => 
        i.addedBy && 
        i.addedBy !== 'You' && 
        i.addedBy !== 'Guest' && 
        i.addedBy !== 'AURA Customer' && 
        i.addedBy !== 'AURA Member' &&
        i.addedBy !== 'Registered Customer'
      )?.addedBy;

      if (realItemUser && (!o.customerName || o.customerName === 'AURA Customer' || o.customerName === 'AURA Member' || o.customerName === 'Registered Customer' || o.customerName === 'Guest Customer')) {
        o.customerName = realItemUser;
        if (isDBConnected() && o._id && mongoose.isValidObjectId(String(o._id))) {
          Order.updateOne({ _id: o._id }, { customerName: realItemUser }).catch(() => {});
        }
      }
    }
  });

  ordersList.forEach(order => {
    const isUnpaid = order && order.paymentStatus !== 'paid' && !['completed', 'cancelled'].includes(String(order.status).toLowerCase());
    if (isUnpaid && order.tableNum) {
      const key = Number(order.tableNum);
      if (!unpaidByTable.has(key)) {
        unpaidByTable.set(key, []);
      }
      unpaidByTable.get(key).push(order);
    } else if (order) {
      result.push(order);
    }
  });

  for (const [tNum, group] of unpaidByTable.entries()) {
    if (group.length === 1) {
      result.push(group[0]);
    } else if (group.length > 1) {
      // Sort oldest first (so primary order ID remains stable)
      group.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      const primary = { ...group[0] };
      const duplicates = group.slice(1);

      if (primary.items) {
        primary.items = [...primary.items];
      } else {
        primary.items = [];
      }

      duplicates.forEach(dup => {
        (dup.items || []).forEach(dupItem => {
          const matchIdx = primary.items.findIndex(pItem => 
            String(pItem.menuItem || pItem._id) === String(dupItem.menuItem) ||
            (pItem.name && dupItem.name && pItem.name.trim().toLowerCase() === dupItem.name.trim().toLowerCase())
          );
          if (matchIdx > -1) {
            primary.items[matchIdx].qty = (primary.items[matchIdx].qty || 1) + (dupItem.qty || 1);
          } else {
            primary.items.push(dupItem);
          }
        });
      });

      const subtotal = primary.items.reduce((sum, i) => sum + ((i.price || 0) * (i.qty || 1)), 0);
      const tax = Math.round(subtotal * 0.10 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      primary.subtotal = subtotal;
      primary.tax = tax;
      primary.total = total;
      primary.updatedAt = new Date();

      // Save primary in DB & delete duplicates
      if (isDBConnected()) {
        try {
          if (mongoose.isValidObjectId(String(primary._id))) {
            await Order.findByIdAndUpdate(primary._id, {
              items: primary.items,
              subtotal,
              tax,
              total
            });
          }
          const dupDbIds = duplicates.map(d => d._id).filter(id => id && mongoose.isValidObjectId(String(id)));
          if (dupDbIds.length > 0) {
            await Order.deleteMany({ _id: { $in: dupDbIds } });
          }
        } catch (e) {}
      }

      // Sync memoryOrders
      const primaryMemIdx = memoryOrders.findIndex(m => String(m._id) === String(primary._id));
      if (primaryMemIdx !== -1) {
        memoryOrders[primaryMemIdx] = primary;
      }
      duplicates.forEach(dup => {
        const dupMemIdx = memoryOrders.findIndex(m => String(m._id) === String(dup._id));
        if (dupMemIdx !== -1) {
          memoryOrders.splice(dupMemIdx, 1);
        }
      });

      result.push(primary);
    }
  }

  return result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

// @desc    Place order from active table cart
// @route   POST /api/orders
// @access  Public / Private (Customer/Guest)
exports.placeOrder = async (req, res, next) => {
  const tableNum = Number(req.user?.tableNum || req.body?.tableNum);
  if (!tableNum) {
    return res.status(400).json({ success: false, message: 'Table number is required to place an order.' });
  }

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

  const itemAddedBy = cartItems.find(i => 
    i.addedBy && 
    i.addedBy !== 'You' && 
    i.addedBy !== 'Guest' && 
    i.addedBy !== 'AURA Customer' && 
    i.addedBy !== 'AURA Member' &&
    i.addedBy !== 'Registered Customer'
  )?.addedBy;

  const validUserName = (req.user?.name && req.user.name !== 'AURA Customer' && req.user.name !== 'AURA Member' && req.user.name !== 'Registered Customer') ? req.user.name : null;
  const validBodyName = (req.body?.customerName && req.body.customerName !== 'AURA Customer' && req.body.customerName !== 'AURA Member' && req.body.customerName !== 'Registered Customer') ? req.body.customerName : null;

  const custName = validUserName || validBodyName || itemAddedBy || 'Guest Diner';
  const isGuestUser = req.user ? req.user.isGuest : true;
  const sessionType = isGuestUser ? 'guest' : 'member';

  let order = null;
  let isMerged = false;

  // Check for existing UNPAID active order for this table
  let existingDbOrder = null;
  if (isDBConnected()) {
    try {
      existingDbOrder = await Order.findOne({
        tableNum,
        paymentStatus: 'unpaid',
        status: { $nin: ['completed', 'cancelled'] }
      });
    } catch (e) {}
  }

  let existingMemOrder = memoryOrders.find(o => 
    Number(o.tableNum) === tableNum && 
    o.paymentStatus === 'unpaid' && 
    !['completed', 'cancelled'].includes(String(o.status).toLowerCase())
  );

  const existingOrder = existingDbOrder || existingMemOrder;

  if (existingOrder) {
    isMerged = true;
    const nextRound = (existingOrder.roundsCount || 1) + 1;
    existingOrder.roundsCount = nextRound;
    existingOrder.status = 'pending'; // Re-activate ticket in kitchen active queue for new round!

    // Append or increment item quantities in existing unpaid bill for this table
    cartItems.forEach(newItem => {
      existingOrder.items.push({
        menuItem: newItem.menuItem,
        name: newItem.name,
        price: newItem.price,
        qty: newItem.qty,
        addedBy: newItem.addedBy,
        round: nextRound,
        itemStatus: 'pending'
      });
    });

    const subtotal = existingOrder.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const tax = Math.round(subtotal * 0.10 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    existingOrder.subtotal = subtotal;
    existingOrder.tax = tax;
    existingOrder.total = total;
    existingOrder.customerName = custName;
    existingOrder.updatedAt = new Date();

    if (existingDbOrder) {
      try {
        await existingDbOrder.save();
        order = existingDbOrder;
      } catch (e) {
        order = existingOrder;
      }
    } else {
      order = existingOrder;
    }

    const plain = order.toObject ? order.toObject() : order;
    const memIdx = memoryOrders.findIndex(o => String(o._id) === String(plain._id));
    if (memIdx !== -1) {
      memoryOrders[memIdx] = plain;
    } else {
      memoryOrders.unshift(plain);
    }
  } else {
    // Create new order as no active unpaid order exists for this table
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.10 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    if (isDBConnected()) {
      try {
        const isValidObjId = (id) => id && mongoose.isValidObjectId(String(id)) && typeof id === 'object';
        const userRef = (!isGuestUser && isValidObjId(req.user?._id)) ? req.user._id : undefined;
        const guestRef = (isGuestUser && isValidObjId(req.user?._id)) ? req.user._id : undefined;

        order = await Order.create({
          tableNum,
          roundsCount: 1,
          customerName: custName,
          items: cartItems.map(item => ({
            menuItem: item.menuItem,
            name: item.name,
            price: item.price,
            qty: item.qty,
            addedBy: item.addedBy,
            round: 1,
            itemStatus: 'pending'
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
      } catch (dbErr) {
        order = null;
      }
    }

    if (!order) {
      order = createMemoryOrder({
        tableNum,
        roundsCount: 1,
        customerName: custName,
        items: cartItems.map(item => ({ ...item, round: 1, itemStatus: 'pending' })),
        subtotal,
        tax,
        total,
        status: 'pending',
        sessionType,
        paymentStatus: 'unpaid'
      });
    } else {
      const plainOrder = order.toObject ? order.toObject() : order;
      const exists = memoryOrders.some(o => String(o._id) === String(plainOrder._id));
      if (!exists) {
        memoryOrders.unshift(plainOrder);
        if (memoryOrders.length > 100) memoryOrders.pop();
      }
    }
  }

  // Cleanup cart & ensure table is marked occupied with live customer name
  Cart.findOne({ tableNum }).then(cart => {
    if (cart) { cart.items = []; cart.save().catch(() => {}); }
  }).catch(() => {});
  Table.findOneAndUpdate({ num: tableNum }, { status: 'occupied', currentCustomer: custName }).catch(() => {});

  // Socket notifications
  const io = req.app.get('io');
  if (io) {
    const plain = order.toObject ? order.toObject() : order;
    io.emit('order:placed', plain);
    io.emit('chef:new_order', { order: plain, isMerged });
    io.emit('admin:new_order', { tableNum, orderId: plain._id, total: plain.total, order: plain });
    io.emit('waiter:new_order', { tableNum, orderId: plain._id, total: plain.total, order: plain });

    io.to(`table_room_${tableNum}`).emit('order:placed', plain);
    io.to(`table_room_${tableNum}`).emit('cart:updated', { tableNum, items: [] });
  }

  res.status(201).json({ success: true, data: order, isMerged });
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderDetails = async (req, res, next) => {
  try {
    const memOrder = memoryOrders.find(o => String(o._id) === String(req.params.id));
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
    const tableNumToFree = req.body.tableNum;

    const memIdx = memoryOrders.findIndex(o => String(o._id) === String(req.params.id));
    if (memIdx !== -1) {
      memoryOrders[memIdx].status = status;
      memoryOrders[memIdx].updatedAt = new Date();
      if (status === 'completed') {
        memoryOrders[memIdx].paymentStatus = 'paid';
      }
      const order = memoryOrders[memIdx];
      const targetTableNum = Number(order.tableNum || tableNumToFree);

      if (status === 'completed' && targetTableNum) {
        if (isDBConnected()) {
          Table.findOneAndUpdate(
            { num: targetTableNum },
            { status: 'free', currentCustomer: '', loginType: '', userId: '', occupiedAt: null }
          ).catch(() => {});
        }
      }

      const io = req.app.get('io');
      if (io) {
        io.emit('order:status_updated', {
          orderId: order._id,
          tableNum: targetTableNum,
          status: order.status,
          message: `🍳 Order #${targetTableNum} status updated to: ${status}`,
          order
        });
        io.to(`table_room_${targetTableNum}`).emit('order:status_updated', {
          orderId: order._id,
          tableNum: targetTableNum,
          status: order.status,
          message: `🍳 Your order status updated to: ${status}`,
          order
        });
        if (status === 'completed') {
          io.emit('table:status_changed', { num: targetTableNum, status: 'free', currentCustomer: '' });
          io.emit('payment:completed', { tableNum: targetTableNum, orderId: order._id });
        }
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
      await Table.findOneAndUpdate(
        { num: order.tableNum },
        { status: 'free', currentCustomer: '', loginType: '', userId: '', occupiedAt: null }
      ).catch(() => {});
    }
    await order.save();

    const dbMemIdx = memoryOrders.findIndex(o => String(o._id) === String(order._id));
    if (dbMemIdx !== -1) {
      memoryOrders[dbMemIdx].status = status;
      if (status === 'completed') memoryOrders[dbMemIdx].paymentStatus = 'paid';
    }

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
      if (status === 'completed') {
        io.emit('table:status_changed', { num: order.tableNum, status: 'free', currentCustomer: '' });
        io.emit('payment:completed', { tableNum: order.tableNum, orderId: order._id });
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders (with single consolidated bill per table session)
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    const user = req.user;
    const isStaff = user && ['admin', 'cashier', 'manager', 'chef', 'waiter'].includes(user.role);
    const isMemberCustomer = user && !user.isGuest && !isStaff;
    const isGuestCustomer = user && user.isGuest;

    let allOrders = [];

    // ─── STAFF ROLES: See ALL orders ─────────────────────────────────────────
    if (isStaff) {
      allOrders = [...memoryOrders];
      if (isDBConnected()) {
        try {
          const dbOrders = await Promise.race([
            Order.find({}).sort({ createdAt: -1 }).limit(200).lean(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
          ]);
          const dbIds = new Set(dbOrders.map(o => String(o._id)));
          const memOnly = allOrders.filter(o => !dbIds.has(String(o._id)));
          allOrders = [...dbOrders, ...memOnly];
        } catch (e) {
          console.warn('DB orders query timed out, returning memory orders only.');
        }
      }
    }

    // ─── MEMBER CUSTOMER: See ONLY their own orders ───────────────────────────
    else if (isMemberCustomer) {
      const userName = user.name;
      const userId = user._id;

      allOrders = memoryOrders.filter(o =>
        (o.customerName && o.customerName.trim().toLowerCase() === userName.trim().toLowerCase()) ||
        (o.userRef && String(o.userRef) === String(userId)) ||
        (o.sessionType === 'member' && o.customerName && o.customerName.trim().toLowerCase() === userName.trim().toLowerCase())
      );

      if (isDBConnected()) {
        try {
          const dbOrders = await Promise.race([
            Order.find({
              $or: [
                { userRef: userId },
                { customerName: { $regex: new RegExp(`^${userName.trim()}$`, 'i') } }
              ]
            }).sort({ createdAt: -1 }).limit(100).lean(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
          ]);
          const dbIds = new Set(dbOrders.map(o => String(o._id)));
          const memOnly = allOrders.filter(o => !dbIds.has(String(o._id)));
          allOrders = [...dbOrders, ...memOnly];
        } catch (e) {
          console.warn('DB member orders query timed out, returning memory orders only.');
        }
      }
    }

    // ─── GUEST CUSTOMER: See orders for their table ───────────────────────────
    else if (isGuestCustomer) {
      const tableNum = user.tableNum;
      allOrders = memoryOrders.filter(o => Number(o.tableNum) === Number(tableNum));
      if (isDBConnected()) {
        try {
          const dbOrders = await Promise.race([
            Order.find({ tableNum }).sort({ createdAt: -1 }).limit(50).lean(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
          ]);
          const dbIds = new Set(dbOrders.map(o => String(o._id)));
          const memOnly = allOrders.filter(o => !dbIds.has(String(o._id)));
          allOrders = [...dbOrders, ...memOnly];
        } catch (e) {}
      }
    }

    // Consolidate any active unpaid orders per table so there's always 1 unified bill per table session
    const consolidatedOrders = await consolidateUnpaidOrdersPerTable(allOrders);

    res.status(200).json({ success: true, count: consolidatedOrders.length, data: consolidatedOrders });
  } catch (error) {
    res.status(200).json({ success: true, count: 0, data: [] });
  }
};

// @desc    Split bill per person
// @route   GET /api/orders/:id/split/:count
// @access  Private
exports.splitBill = async (req, res, next) => {
  try {
    const memOrder = memoryOrders.find(o => String(o._id) === String(req.params.id));
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
exports.updateCustomerName = async (req, res, next) => {
  try {
    const { customerName } = req.body;
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    const newName = customerName.trim();
    const orderIdStr = String(req.params.id);

    // 1. Update in memory orders array
    const memOrder = memoryOrders.find(o => String(o._id) === orderIdStr);
    if (memOrder) {
      memOrder.customerName = newName;
      if (memOrder.items) {
        memOrder.items.forEach(i => {
          if (i.addedBy === 'Diner' || i.addedBy === 'Guest' || i.addedBy === 'You' || i.addedBy === 'AURA Customer' || i.addedBy === 'AURA Member') {
            i.addedBy = newName;
          }
        });
      }
    }

    // 2. Update MongoDB if connected
    if (isDBConnected()) {
      try {
        await Order.findByIdAndUpdate(orderIdStr, { customerName: newName });
      } catch (dbErr) {
        console.warn('DB name update warning:', dbErr.message);
      }
    }

    // 3. Emit Socket event if connected
    const io = req.app.get('io');
    if (io) {
      io.emit('order:customer_name_updated', {
        orderId: orderIdStr,
        customerName: newName
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer name updated successfully!',
      customerName: newName
    });
  } catch (error) {
    next(error);
  }
};

exports.memoryOrders = memoryOrders;
