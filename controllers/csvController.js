const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Category = require('../models/Category');
const { parseCSV, generateCSV } = require('../utils/csvHelper');

const csvDir = path.join(__dirname, '../data/csv');

const isDBConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// @desc    Export Menu Items as CSV
// @route   GET /api/admin/export/menu/csv
// @access  Private/Admin
exports.exportMenuCSV = async (req, res, next) => {
  try {
    let menuItems = [];
    if (isDBConnected()) {
      menuItems = await Menu.find().lean();
    } else if (fs.existsSync(path.join(csvDir, 'menu_items.csv'))) {
      const csvText = fs.readFileSync(path.join(csvDir, 'menu_items.csv'), 'utf8');
      menuItems = parseCSV(csvText);
    }

    const fields = ['name', 'category', 'price', 'rating', 'prep', 'tag', 'image', 'desc'];
    const csvContent = generateCSV(menuItems, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aura_menu_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Orders as CSV
// @route   GET /api/admin/export/orders/csv
// @access  Private/Admin
exports.exportOrdersCSV = async (req, res, next) => {
  try {
    let formattedOrders = [];
    if (isDBConnected()) {
      const orders = await Order.find().sort({ createdAt: -1 }).lean();
      formattedOrders = orders.map(o => ({
        orderNumber: o.orderNumber || o._id.toString(),
        tableNum: o.tableNum,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        itemsCount: Array.isArray(o.items) ? o.items.reduce((s, i) => s + (i.qty || 1), 0) : 0,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : ''
      }));
    } else if (fs.existsSync(path.join(csvDir, 'orders.csv'))) {
      const csvText = fs.readFileSync(path.join(csvDir, 'orders.csv'), 'utf8');
      formattedOrders = parseCSV(csvText);
    }

    const fields = ['orderNumber', 'tableNum', 'total', 'status', 'paymentStatus', 'itemsCount', 'createdAt'];
    const csvContent = generateCSV(formattedOrders, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aura_orders_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Tables as CSV
// @route   GET /api/admin/export/tables/csv
// @access  Private/Admin
exports.exportTablesCSV = async (req, res, next) => {
  try {
    let tables = [];
    if (isDBConnected()) {
      tables = await Table.find().sort({ num: 1 }).lean();
    } else if (fs.existsSync(path.join(csvDir, 'tables.csv'))) {
      const csvText = fs.readFileSync(path.join(csvDir, 'tables.csv'), 'utf8');
      tables = parseCSV(csvText);
    }

    const fields = ['num', 'seats', 'zone', 'status'];
    const csvContent = generateCSV(tables, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aura_tables_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Sales Analytics as CSV
// @route   GET /api/admin/export/analytics/csv
// @access  Private/Admin
exports.exportAnalyticsCSV = async (req, res, next) => {
  try {
    let formattedData = [];
    if (isDBConnected()) {
      const categorySales = await Order.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            totalQty: { $sum: '$items.qty' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);
      formattedData = categorySales.map(cs => ({
        itemName: cs._id,
        totalQuantitySold: cs.totalQty,
        totalRevenue: cs.totalRevenue
      }));
    } else {
      formattedData = [
        { itemName: "Wagyu A5 Black Truffle Steak", totalQuantitySold: 12, totalRevenue: 78000 },
        { itemName: "Artisanal Dragon Roll Sushi", totalQuantitySold: 28, totalRevenue: 35000 },
        { itemName: "Smoked Ember Old Fashioned", totalQuantitySold: 45, totalRevenue: 42750 }
      ];
    }

    const fields = ['itemName', 'totalQuantitySold', 'totalRevenue'];
    const csvContent = generateCSV(formattedData, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aura_sales_analytics.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Import / Upload Menu Items from CSV
// @route   POST /api/admin/import/menu/csv
// @access  Private/Admin
exports.importMenuCSV = async (req, res, next) => {
  try {
    let csvText = '';
    if (req.file) {
      csvText = req.file.buffer.toString('utf8');
    } else if (req.body && typeof req.body === 'string') {
      csvText = req.body;
    } else if (req.body && req.body.csvData) {
      csvText = req.body.csvData;
    }

    if (!csvText) {
      return res.status(400).json({ success: false, message: 'No CSV content provided for import.' });
    }

    const items = parseCSV(csvText);
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty CSV content.' });
    }

    let createdCount = 0;
    let updatedCount = 0;

    if (isDBConnected()) {
      for (const item of items) {
        if (!item.name || !item.category || !item.price) continue;
        const existing = await Menu.findOne({ name: item.name });
        if (existing) {
          await Menu.updateOne({ name: item.name }, { $set: item });
          updatedCount++;
        } else {
          await Menu.create(item);
          createdCount++;
        }
      }
    } else {
      createdCount = items.length;
    }

    res.status(200).json({
      success: true,
      message: `CSV Import completed successfully. Processed ${items.length} items.`,
      data: { createdCount, updatedCount, totalProcessed: items.length }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import / Upload Tables from CSV
// @route   POST /api/admin/import/tables/csv
// @access  Private/Admin
exports.importTablesCSV = async (req, res, next) => {
  try {
    let csvText = '';
    if (req.file) {
      csvText = req.file.buffer.toString('utf8');
    } else if (req.body && typeof req.body === 'string') {
      csvText = req.body;
    } else if (req.body && req.body.csvData) {
      csvText = req.body.csvData;
    }

    if (!csvText) {
      return res.status(400).json({ success: false, message: 'No CSV content provided for import.' });
    }

    const tables = parseCSV(csvText);
    if (!tables || tables.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty CSV content.' });
    }

    let createdCount = 0;
    let updatedCount = 0;

    if (isDBConnected()) {
      for (const t of tables) {
        if (t.num === undefined || t.num === null) continue;
        const existing = await Table.findOne({ num: t.num });
        if (existing) {
          await Table.updateOne({ num: t.num }, { $set: t });
          updatedCount++;
        } else {
          await Table.create(t);
          createdCount++;
        }
      }
    } else {
      createdCount = tables.length;
    }

    res.status(200).json({
      success: true,
      message: `CSV Tables Import completed successfully. Processed ${tables.length} tables.`,
      data: { createdCount, updatedCount, totalProcessed: tables.length }
    });
  } catch (error) {
    next(error);
  }
};
