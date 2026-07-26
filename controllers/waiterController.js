const mongoose = require('mongoose');
const WaiterRequest = require('../models/WaiterRequest');
const Notification = require('../models/Notification');

// @desc    Call waiter / Table assistance
// @route   POST /api/waiter/call
// @access  Public
exports.callWaiter = async (req, res, next) => {
  try {
    const { tableNum, serviceName } = req.body;

    if (!tableNum || !serviceName) {
      return res.status(400).json({ success: false, message: 'Table number and service name are required.' });
    }

    const tNum = Number(tableNum);

    // Broadcast Socket Event IMMEDIATELY — before any DB write
    // This guarantees the toast shows on the customer side even if DB is slow
    const io = req.app.get('io');
    if (io) {
      io.to('staff_room').emit('waiter:request_new', { tableNum: tNum, serviceName, status: 'pending' });
      io.to(`table_room_${tNum}`).emit('waiter:call_acknowledged', {
        serviceName,
        message: `🛎️ A Floor Host has been notified for: "${serviceName}". We'll be right there!`
      });
    }

    // Respond to client immediately — don't make them wait for DB
    res.status(201).json({
      success: true,
      message: `🛎️ Waiter request "${serviceName}" sent for Table #${tableNum}.`
    });

    // DB writes happen in background — won't block the response
    if (mongoose.connection.readyState === 1) {
      WaiterRequest.create({
        tableNum: tNum,
        serviceName,
        status: 'pending'
      }).catch(err => console.warn('WaiterRequest save warning:', err.message));

      Notification.create({
        recipientRole: 'waiter',
        tableNum: tNum,
        message: `🛎️ Table #${tableNum} requested: ${serviceName}`
      }).catch(err => console.warn('Notification save warning:', err.message));
    }

  } catch (error) {
    // Even on error, try to send success — the socket already fired
    console.error('callWaiter error:', error.message);
    res.status(200).json({
      success: true,
      message: `🛎️ Waiter request sent for Table #${tableNum}.`
    });
  }
};

// @desc    Get active waiter requests
// @route   GET /api/waiter/requests
// @access  Private (Waiter/Admin)
exports.getWaiterRequests = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    const requests = await WaiterRequest.find({ status: { $ne: 'completed' } }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Update waiter request status (accept / complete)
// @route   PUT /api/waiter/requests/:id
// @access  Private (Waiter/Admin)
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await WaiterRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = status;
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.to('staff_room').emit('waiter:request_updated', request);
      if (status === 'completed') {
        io.to(`table_room_${request.tableNum}`).emit('waiter:request_completed', {
          message: `✅ Table assistance request "${request.serviceName}" has been resolved.`
        });
      }
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};
