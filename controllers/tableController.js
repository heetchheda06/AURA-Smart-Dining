const Table = require('../models/Table');

const default20Tables = [
  { num: 1, seats: 2, zone: "Main Hall", status: "free" },
  { num: 2, seats: 4, zone: "Main Hall", status: "free" },
  { num: 3, seats: 2, zone: "Window Lounge", status: "free" },
  { num: 4, seats: 6, zone: "VIP Private Lounge", status: "free" },
  { num: 5, seats: 4, zone: "Window Lounge", status: "free" },
  { num: 6, seats: 8, zone: "VIP Private Lounge", status: "free" },
  { num: 7, seats: 2, zone: "Outdoor Patio", status: "free" },
  { num: 8, seats: 4, zone: "Outdoor Patio", status: "free" },
  { num: 9, seats: 6, zone: "Main Hall", status: "free" },
  { num: 10, seats: 4, zone: "Main Hall", status: "free" },
  { num: 11, seats: 2, zone: "Window Lounge", status: "free" },
  { num: 12, seats: 4, zone: "Window Lounge", status: "free" },
  { num: 13, seats: 6, zone: "Rooftop Deck", status: "free" },
  { num: 14, seats: 4, zone: "Rooftop Deck", status: "free" },
  { num: 15, seats: 8, zone: "VIP Private Lounge", status: "free" },
  { num: 16, seats: 2, zone: "Rooftop Deck", status: "free" },
  { num: 17, seats: 4, zone: "Outdoor Patio", status: "free" },
  { num: 18, seats: 6, zone: "Family Dining", status: "free" },
  { num: 19, seats: 10, zone: "Family Dining", status: "free" },
  { num: 20, seats: 12, zone: "Family Dining Grand", status: "free" }
];

// @desc    Get all 20 tables (real-time status check for floor plan & manager view)
// @route   GET /api/tables
// @access  Public
exports.getTables = async (req, res, next) => {
  try {
    let tables = await Table.find().sort({ num: 1 }).lean();
    if (!tables || tables.length === 0) {
      tables = default20Tables;
    } else if (tables.length < 20) {
      const existingNums = new Set(tables.map(t => t.num));
      const missing = default20Tables.filter(dt => !existingNums.has(dt.num));
      tables = [...tables, ...missing].sort((a, b) => a.num - b.num);
    }
    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    res.status(200).json({ success: true, count: default20Tables.length, data: default20Tables });
  }
};

// @desc    Update table status
// @route   PUT /api/tables/:num/status
// @access  Private (Waiter/Admin/Manager)
exports.updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const tableNum = Number(req.params.num);

    let table = null;
    try {
      table = await Table.findOne({ num: tableNum });
      if (!table) {
        const def = default20Tables.find(t => t.num === tableNum) || { num: tableNum, seats: 4, zone: "Main Hall", status };
        table = await Table.create({ ...def, status });
      } else {
        table.status = status;
        await table.save();
      }
    } catch (e) {
      console.warn(`⚠️ DB table update failed for Table #${tableNum}, using memory update.`);
    }

    // Always update fallback memory array status
    const memMatch = default20Tables.find(t => t.num === tableNum);
    if (memMatch) memMatch.status = status;

    const result = table || memMatch || { num: tableNum, status };

    // Broadcast table status change
    const io = req.app.get('io');
    if (io) {
      io.emit('table:status_changed', { num: tableNum, status: result.status });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(200).json({ success: true, data: { num: Number(req.params.num), status: req.body?.status || 'occupied' } });
  }
};
