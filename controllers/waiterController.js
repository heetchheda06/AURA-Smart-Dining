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

    const request = await WaiterRequest.create({
      tableNum: Number(tableNum),
      serviceName,
      status: 'pending'
    });

    // Create Notification
    await Notification.create({
      recipientRole: 'waiter',
      tableNum: Number(tableNum),
      message: `🛎️ Table #${tableNum} requested: ${serviceName}`
    });

    // Broadcast Socket Event
    const io = req.app.get('io');
    if (io) {
      // Notify staff
      io.to('staff_room').emit('waiter:request_new', request);
      // Notify table
      io.to(`table_room_${tableNum}`).emit('waiter:call_acknowledged', {
        message: `🛎️ Request "${serviceName}" dispatched to Floor Host.`
      });
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active waiter requests
// @route   GET /api/waiter/requests
// @access  Private (Waiter/Admin)
exports.getWaiterRequests = async (req, res, next) => {
  try {
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
