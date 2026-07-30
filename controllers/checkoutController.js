const Session = require('../models/Session');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// Helper in-memory store for fallback if MongoDB is not connected
const inMemorySessions = new Map();

// Helper to broadcast socket events
const broadcastSessionUpdate = (req, eventName, payload) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(eventName, payload);
    if (payload.tableNum) {
      io.to(`table_room_${payload.tableNum}`).emit(eventName, payload);
    }
  }
};

// 1. Request Bill & Generate Live Summary
exports.requestBill = async (req, res) => {
  try {
    const { tableNum, customerName, loginType } = req.body;
    const num = Number(tableNum);

    let orders = [];
    let itemsMap = new Map();
    let subtotal = 0;

    if (mongoose.connection.readyState === 1) {
      orders = await Order.find({ tableNum: num, status: { $ne: 'cancelled' } });
    }

    if (orders.length > 0) {
      orders.forEach(ord => {
        if (ord.items && ord.items.length > 0) {
          ord.items.forEach(item => {
            const key = item.name;
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.qty) || 1;
            if (itemsMap.has(key)) {
              const existing = itemsMap.get(key);
              existing.qty += itemQty;
              existing.subtotal += itemPrice * itemQty;
            } else {
              itemsMap.set(key, {
                name: item.name,
                price: itemPrice,
                qty: itemQty,
                subtotal: itemPrice * itemQty
              });
            }
            subtotal += itemPrice * itemQty;
          });
        }
      });
    }

    // Default sample fallback items if no orders placed yet
    if (subtotal === 0) {
      const defaultItems = [
        { name: 'Truffle Mushroom Risotto', price: 450, qty: 1, subtotal: 450 },
        { name: 'Artisan Garlic Bread', price: 180, qty: 1, subtotal: 180 },
        { name: 'Craft Berry Mocktail', price: 220, qty: 2, subtotal: 440 }
      ];
      defaultItems.forEach(it => itemsMap.set(it.name, it));
      subtotal = 1070;
    }

    const items = Array.from(itemsMap.values());
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const discount = 0;
    const grandTotal = subtotal + tax - discount;
    const orderId = `ORD_${num}_${Date.now().toString().slice(-6)}`;

    let session;
    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum: num, status: { $ne: 'Vacated' } });
      if (!session) {
        session = new Session({ tableNum: num });
      }
      session.customerName = customerName || session.customerName || 'Customer';
      session.loginType = loginType || session.loginType || 'guest';
      session.status = 'Checkout Requested';
      session.orderId = orderId;
      session.items = items;
      session.subtotal = subtotal;
      session.tax = tax;
      session.discount = discount;
      session.grandTotal = grandTotal;
      session.billRequestedAt = new Date();
      await session.save();
    } else {
      session = {
        tableNum: num,
        customerName: customerName || 'Customer',
        loginType: loginType || 'guest',
        status: 'Checkout Requested',
        orderId,
        items,
        subtotal,
        tax,
        discount,
        grandTotal,
        paymentMethod: 'pending',
        paymentStatus: 'unpaid',
        billRequestedAt: new Date()
      };
      inMemorySessions.set(num, session);
    }

    broadcastSessionUpdate(req, 'session:updated', session);

    return res.status(200).json({
      success: true,
      message: 'Bill generated successfully.',
      session
    });

  } catch (error) {
    console.error("requestBill error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Select Payment Method (Cash vs Online Demo)
exports.selectPaymentMethod = async (req, res) => {
  try {
    const { tableNum, paymentMethod } = req.body;
    const num = Number(tableNum);

    let session;
    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum: num, status: { $ne: 'Vacated' } });
    } else {
      session = inMemorySessions.get(num);
    }

    if (!session) {
      session = { tableNum: num, customerName: 'Customer', subtotal: 500, tax: 25, grandTotal: 525, items: [] };
    }

    session.paymentMethod = paymentMethod;
    session.paymentStartedAt = new Date();

    if (paymentMethod === 'cash') {
      session.status = 'Awaiting Cash Payment';
      session.paymentStatus = 'awaiting_cash';
      session.cashTimerEndAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes countdown
    } else {
      session.status = 'Awaiting Demo Online Payment';
      session.paymentStatus = 'unpaid';
    }

    if (mongoose.connection.readyState === 1 && typeof session.save === 'function') {
      await session.save();
    } else {
      inMemorySessions.set(num, session);
    }

    broadcastSessionUpdate(req, 'session:updated', session);

    return res.status(200).json({
      success: true,
      message: `Payment method ${paymentMethod} selected.`,
      session
    });

  } catch (error) {
    console.error("selectPaymentMethod error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Process Demo Online Payment
exports.processDemoPayment = async (req, res) => {
  try {
    const { tableNum, paymentMethod, cardOrUpiDetails } = req.body;
    const num = Number(tableNum);

    let session;
    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum: num, status: { $ne: 'Vacated' } });
    } else {
      session = inMemorySessions.get(num);
    }

    const demoTxnId = `TXN_DEMO_${Math.floor(100000 + Math.random() * 900000)}`;

    if (!session) {
      session = {
        tableNum: num,
        customerName: 'Customer',
        grandTotal: 525,
        items: []
      };
    }

    session.paymentMethod = paymentMethod || 'demo_upi';
    session.paymentStatus = 'paid';
    session.status = 'Payment Completed';
    session.demoTransactionId = demoTxnId;
    session.paymentCompletedAt = new Date();
    session.vacatingTimerEndAt = new Date(Date.now() + 5 * 60 * 1000); // 5:00 vacating timer

    if (mongoose.connection.readyState === 1) {
      if (typeof session.save === 'function') {
        await session.save();
      }
      // Update orders for table
      await Order.updateMany(
        { tableNum: num },
        { $set: { paymentStatus: 'paid', status: 'completed' } }
      ).catch(() => null);
    } else {
      inMemorySessions.set(num, session);
    }

    broadcastSessionUpdate(req, 'session:updated', session);
    broadcastSessionUpdate(req, 'session:payment_completed', session);

    return res.status(200).json({
      success: true,
      message: 'Demo payment completed successfully.',
      session,
      demoTransactionId: demoTxnId
    });

  } catch (error) {
    console.error("processDemoPayment error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Cashier Action: Mark Cash Received
exports.markCashReceived = async (req, res) => {
  try {
    const { tableNum } = req.body;
    const num = Number(tableNum);

    let session;
    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum: num, status: { $ne: 'Vacated' } });
    } else {
      session = inMemorySessions.get(num);
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found for table.' });
    }

    session.paymentMethod = 'cash';
    session.paymentStatus = 'paid';
    session.status = 'Payment Completed';
    session.demoTransactionId = `CASH_REC_${Date.now().toString().slice(-6)}`;
    session.paymentCompletedAt = new Date();
    session.vacatingTimerEndAt = new Date(Date.now() + 5 * 60 * 1000); // 5:00 vacating timer

    if (mongoose.connection.readyState === 1 && typeof session.save === 'function') {
      await session.save();
      await Order.updateMany(
        { tableNum: num },
        { $set: { paymentStatus: 'paid', status: 'completed' } }
      ).catch(() => null);
    } else {
      inMemorySessions.set(num, session);
    }

    broadcastSessionUpdate(req, 'session:updated', session);
    broadcastSessionUpdate(req, 'session:payment_completed', session);

    return res.status(200).json({
      success: true,
      message: `Cash payment received for Table #${num}.`,
      session
    });

  } catch (error) {
    console.error("markCashReceived error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Waiter Action: Update Cleaning Status
exports.updateCleaningStatus = async (req, res) => {
  try {
    const { tableNum, cleaningStatus } = req.body; // 'in_progress' | 'completed'
    const num = Number(tableNum);

    let session;
    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum: num, status: { $ne: 'Vacated' } });
    } else {
      session = inMemorySessions.get(num);
    }

    if (cleaningStatus === 'in_progress') {
      if (session) {
        session.status = 'Cleaning In Progress';
        session.cleaningStartedAt = new Date();
      }
    } else if (cleaningStatus === 'completed') {
      if (session) {
        session.status = 'Vacated';
        session.cleaningCompletedAt = new Date();
        session.tableVacatedAt = new Date();
      }

      // Free table & clear cart
      if (mongoose.connection.readyState === 1) {
        await Table.findOneAndUpdate(
          { num },
          { $set: { status: 'free', currentCustomer: '', loginType: '', userId: '' } }
        ).catch(() => null);
        await Cart.findOneAndDelete({ tableNum: num }).catch(() => null);
      }
    }

    if (session && mongoose.connection.readyState === 1 && typeof session.save === 'function') {
      await session.save();
    } else if (session) {
      inMemorySessions.set(num, session);
    }

    broadcastSessionUpdate(req, 'session:updated', session);
    if (cleaningStatus === 'completed') {
      broadcastSessionUpdate(req, 'session:vacated', { tableNum: num });
    }

    return res.status(200).json({
      success: true,
      message: `Table #${num} cleaning status updated to ${cleaningStatus}.`,
      session
    });

  } catch (error) {
    console.error("updateCleaningStatus error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Manager Override / Reopen Session
exports.reopenSession = async (req, res) => {
  try {
    const { tableNum } = req.body;
    const num = Number(tableNum);

    let session;
    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum: num });
    } else {
      session = inMemorySessions.get(num);
    }

    if (session) {
      session.status = 'Active';
      session.paymentStatus = 'unpaid';
      if (mongoose.connection.readyState === 1 && typeof session.save === 'function') {
        await session.save();
      } else {
        inMemorySessions.set(num, session);
      }
    }

    broadcastSessionUpdate(req, 'session:updated', session);
    broadcastSessionUpdate(req, 'session:reopened', { tableNum: num });

    return res.status(200).json({
      success: true,
      message: `Session for Table #${num} reopened.`,
      session
    });

  } catch (error) {
    console.error("reopenSession error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Manager Force End Session
exports.forceEndSession = async (req, res) => {
  try {
    const { tableNum } = req.body;
    const num = Number(tableNum);

    let session;
    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum: num });
      if (session) {
        session.status = 'Vacated';
        session.tableVacatedAt = new Date();
        await session.save();
      }
      await Table.findOneAndUpdate(
        { num },
        { $set: { status: 'free', currentCustomer: '', loginType: '', userId: '' } }
      ).catch(() => null);
      await Cart.findOneAndDelete({ tableNum: num }).catch(() => null);
    } else {
      inMemorySessions.delete(num);
    }

    broadcastSessionUpdate(req, 'session:vacated', { tableNum: num });

    return res.status(200).json({
      success: true,
      message: `Session for Table #${num} force-ended.`
    });

  } catch (error) {
    console.error("forceEndSession error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Get All Active Sessions for Staff & Manager Dashboards
exports.getSessions = async (req, res) => {
  try {
    let sessions = [];
    if (mongoose.connection.readyState === 1) {
      sessions = await Session.find({ status: { $ne: 'Vacated' } }).sort({ updatedAt: -1 });
    } else {
      sessions = Array.from(inMemorySessions.values()).filter(s => s.status !== 'Vacated');
    }

    return res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error("getSessions error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Get Live Session for Customer Table
exports.getSessionByTable = async (req, res) => {
  try {
    const tableNum = Number(req.params.tableNum);
    let session = null;

    if (mongoose.connection.readyState === 1) {
      session = await Session.findOne({ tableNum, status: { $ne: 'Vacated' } });
    } else {
      session = inMemorySessions.get(tableNum) || null;
    }

    return res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error("getSessionByTable error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
