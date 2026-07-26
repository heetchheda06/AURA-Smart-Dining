const Table = require('../models/Table');

// @desc    Get all tables (real-time status check for floor plan)
// @route   GET /api/tables
// @access  Public
exports.getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ num: 1 });
    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    next(error);
  }
};

// @desc    Update table status
// @route   PUT /api/tables/:num/status
// @access  Private (Waiter/Admin)
exports.updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const tableNum = Number(req.params.num);

    const table = await Table.findOne({ num: tableNum });
    if (!table) {
      return res.status(404).json({ success: false, message: `Table #${tableNum} not found.` });
    }

    table.status = status;
    await table.save();

    // Broadcast table status change
    const io = req.app.get('io');
    if (io) {
      io.emit('table:status_changed', { num: tableNum, status: table.status });
    }

    res.status(200).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
};
