const Table = require('../models/Table');
const Queue = require('../models/Queue');
const mongoose = require('mongoose');

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

// Memory queue fallback
const memoryQueue = [];
let memoryQueueCounter = 1;

const isDBConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all 20 tables (real-time status check for floor plan & manager view)
// @route   GET /api/tables
// @access  Public
exports.getTables = async (req, res, next) => {
  try {
    let tables = [];
    if (isDBConnected()) {
      tables = await Table.find().sort({ num: 1 }).lean();
    }
    
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
// @access  Public / Private (Customer/Staff)
exports.updateTableStatus = async (req, res, next) => {
  try {
    const { status, customerName, loginType, userId } = req.body;
    const tableNum = Number(req.params.num);

    let table = null;
    if (isDBConnected()) {
      try {
        table = await Table.findOne({ num: tableNum });
        if (!table) {
          const def = default20Tables.find(t => t.num === tableNum) || { num: tableNum, seats: 4, zone: "Main Hall", status };
          table = await Table.create({ 
            ...def, 
            status, 
            currentCustomer: status === 'free' ? '' : (customerName || ''),
            loginType: status === 'free' ? '' : (loginType || ''),
            userId: status === 'free' ? '' : (userId || ''),
            occupiedAt: status === 'free' ? null : new Date()
          });
        } else {
          table.status = status;
          if (status === 'free') {
            table.currentCustomer = '';
            table.loginType = '';
            table.userId = '';
            table.occupiedAt = null;
          } else {
            if (customerName !== undefined) table.currentCustomer = customerName;
            if (loginType !== undefined) table.loginType = loginType;
            if (userId !== undefined) table.userId = userId;
            if (!table.occupiedAt) table.occupiedAt = new Date();
          }
          await table.save();
        }
      } catch (e) {
        console.warn(`⚠️ DB table update failed for Table #${tableNum}, using memory update.`);
      }
    }

    // Always update fallback memory array status
    const memMatch = default20Tables.find(t => t.num === tableNum);
    if (memMatch) {
      memMatch.status = status;
      if (status === 'free') {
        memMatch.currentCustomer = '';
        memMatch.loginType = '';
        memMatch.userId = '';
      } else {
        if (customerName) memMatch.currentCustomer = customerName;
        if (loginType) memMatch.loginType = loginType;
        if (userId) memMatch.userId = userId;
      }
    }

    const result = table || memMatch || { num: tableNum, status, currentCustomer: customerName || '' };

    const io = req.app.get('io');
    if (io) {
      io.emit('table:status_changed', { num: tableNum, status: result.status, currentCustomer: result.currentCustomer || '' });

      // If a table became free, notify waitlist queue!
      if (status === 'free') {
        let waitingUser = null;
        if (isDBConnected()) {
          waitingUser = await Queue.findOne({ status: 'waiting' }).sort({ createdAt: 1 }).catch(() => null);
        }
        if (!waitingUser && memoryQueue.length > 0) {
          waitingUser = memoryQueue.find(q => q.status === 'waiting');
        }

        if (waitingUser) {
          io.emit('queue:table_freed', {
            tableNum,
            nextCustomer: waitingUser
          });
        }
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(200).json({ success: true, data: { num: Number(req.params.num), status: req.body?.status || 'occupied' } });
  }
};

// ── QUEUE SYSTEM CONTROLLER HANDLERS ──────────────────────────────────────────

// @desc    Get live waitlist queue
// @route   GET /api/tables/queue
// @access  Public
exports.getQueue = async (req, res, next) => {
  try {
    let queue = [];
    if (isDBConnected()) {
      queue = await Queue.find({ status: 'waiting' }).sort({ createdAt: 1 }).lean().catch(() => []);
    }
    
    // Combine with memory queue
    const dbIds = new Set(queue.map(q => String(q._id)));
    const memOnly = memoryQueue.filter(q => q.status === 'waiting' && !dbIds.has(String(q._id)));
    const allQueue = [...queue, ...memOnly];

    res.status(200).json({ success: true, count: allQueue.length, data: allQueue });
  } catch (error) {
    const activeMem = memoryQueue.filter(q => q.status === 'waiting');
    res.status(200).json({ success: true, count: activeMem.length, data: activeMem });
  }
};

// @desc    Join waitlist queue
// @route   POST /api/tables/queue/join
// @access  Public
exports.addToQueue = async (req, res, next) => {
  try {
    const { customerName, partySize, mobile } = req.body;
    if (!customerName) {
      return res.status(400).json({ success: false, message: 'Customer name is required to join queue.' });
    }

    let queueItem = null;
    if (isDBConnected()) {
      try {
        queueItem = await Queue.create({
          customerName,
          partySize: Number(partySize) || 2,
          mobile: mobile || '',
          status: 'waiting'
        });
      } catch (e) {}
    }

    if (!queueItem) {
      queueItem = {
        _id: `q_${Date.now()}_${memoryQueueCounter++}`,
        customerName,
        partySize: Number(partySize) || 2,
        mobile: mobile || '',
        status: 'waiting',
        createdAt: new Date()
      };
      memoryQueue.push(queueItem);
    } else {
      const plain = queueItem.toObject ? queueItem.toObject() : queueItem;
      memoryQueue.push(plain);
    }

    // Calculate queue position
    const activeList = memoryQueue.filter(q => q.status === 'waiting');
    const position = activeList.findIndex(q => String(q._id) === String(queueItem._id)) + 1 || activeList.length;

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { count: activeList.length, queue: activeList });
    }

    res.status(201).json({
      success: true,
      message: `Successfully joined waitlist at position #${position}!`,
      data: queueItem,
      position,
      estWaitMins: Math.max(5, position * 6)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to join queue.' });
  }
};

// @desc    Remove from waitlist queue
// @route   DELETE /api/tables/queue/:id
// @access  Public / Staff
exports.removeFromQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (isDBConnected()) {
      try { await Queue.findByIdAndDelete(id); } catch (e) {}
    }

    const memIdx = memoryQueue.findIndex(q => String(q._id) === String(id));
    if (memIdx !== -1) {
      memoryQueue.splice(memIdx, 1);
    }

    const activeList = memoryQueue.filter(q => q.status === 'waiting');

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { count: activeList.length, queue: activeList });
    }

    res.status(200).json({ success: true, message: 'Removed from queue' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove from queue.' });
  }
};

// @desc    Manager/System seat queued customer at table
// @route   POST /api/tables/queue/seat/:id
// @access  Private (Manager/Staff)
exports.seatQueuedCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tableNum } = req.body;

    let queueItem = memoryQueue.find(q => String(q._id) === String(id));
    if (isDBConnected()) {
      const dbItem = await Queue.findById(id).catch(() => null);
      if (dbItem) queueItem = dbItem;
    }

    if (!queueItem) {
      return res.status(404).json({ success: false, message: 'Queued customer not found.' });
    }

    // Update queue entry
    queueItem.status = 'seated';
    queueItem.tableNumAssigned = Number(tableNum);
    if (queueItem.save) await queueItem.save();

    const memIdx = memoryQueue.findIndex(q => String(q._id) === String(id));
    if (memIdx !== -1) {
      memoryQueue[memIdx].status = 'seated';
      memoryQueue[memIdx].tableNumAssigned = Number(tableNum);
    }

    // Update table status to occupied
    let table = null;
    if (isDBConnected()) {
      table = await Table.findOneAndUpdate(
        { num: Number(tableNum) },
        { 
          status: 'occupied',
          currentCustomer: queueItem.customerName,
          loginType: 'queued_guest',
          occupiedAt: new Date()
        },
        { new: true }
      ).catch(() => null);
    }

    const memMatch = default20Tables.find(t => t.num === Number(tableNum));
    if (memMatch) {
      memMatch.status = 'occupied';
      memMatch.currentCustomer = queueItem.customerName;
      memMatch.loginType = 'queued_guest';
    }

    const activeList = memoryQueue.filter(q => q.status === 'waiting');

    const io = req.app.get('io');
    if (io) {
      io.emit('table:status_changed', { num: Number(tableNum), status: 'occupied', currentCustomer: queueItem.customerName });
      io.emit('queue:updated', { count: activeList.length, queue: activeList });
      io.emit('queue:customer_seated', { queueId: id, tableNum: Number(tableNum), customerName: queueItem.customerName });
    }

    res.status(200).json({
      success: true,
      message: `🎉 Customer ${queueItem.customerName} successfully seated at Table #${tableNum}!`,
      data: { queueItem, tableNum }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to seat queued customer.' });
  }
};
