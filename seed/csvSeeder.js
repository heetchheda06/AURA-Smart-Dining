require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Menu = require('../models/Menu');
const Table = require('../models/Table');
const User = require('../models/User');
const Order = require('../models/Order');
const { parseCSV } = require('../utils/csvHelper');

const seedFromCSV = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aura';
    console.log(`Connecting to database for CSV Seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });

    console.log('Clearing existing database collections for CSV refresh...');
    await Category.deleteMany({});
    await Menu.deleteMany({});
    await Table.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});

    const csvDir = path.join(__dirname, '../data/csv');

    // 1. Seed Categories
    const categoriesCSV = fs.readFileSync(path.join(csvDir, 'categories.csv'), 'utf8');
    const categoriesData = parseCSV(categoriesCSV);
    if (categoriesData.length > 0) {
      await Category.insertMany(categoriesData);
      console.log(`✅ Seeded ${categoriesData.length} categories from CSV.`);
    }

    // 2. Seed Menu Items
    const menuCSV = fs.readFileSync(path.join(csvDir, 'menu_items.csv'), 'utf8');
    const menuData = parseCSV(menuCSV);
    if (menuData.length > 0) {
      await Menu.insertMany(menuData);
      console.log(`✅ Seeded ${menuData.length} menu items from CSV.`);
    }

    // 3. Seed Tables
    const tablesCSV = fs.readFileSync(path.join(csvDir, 'tables.csv'), 'utf8');
    const tablesData = parseCSV(tablesCSV);
    if (tablesData.length > 0) {
      await Table.insertMany(tablesData);
      console.log(`✅ Seeded ${tablesData.length} tables from CSV.`);
    }

    // 4. Seed Users
    const usersCSV = fs.readFileSync(path.join(csvDir, 'users.csv'), 'utf8');
    const usersData = parseCSV(usersCSV);
    if (usersData.length > 0) {
      for (const u of usersData) {
        const userDoc = new User(u);
        await userDoc.save();
      }
      console.log(`✅ Seeded ${usersData.length} system user accounts from CSV.`);
    }

    // 5. Seed Sample Orders (optional)
    const ordersPath = path.join(csvDir, 'orders.csv');
    if (fs.existsSync(ordersPath)) {
      const ordersCSV = fs.readFileSync(ordersPath, 'utf8');
      const ordersData = parseCSV(ordersCSV);
      if (ordersData.length > 0) {
        // Map tableNum to table ID if needed or insert basic structure
        for (const o of ordersData) {
          const table = await Table.findOne({ num: o.tableNum });
          await Order.create({
            orderNumber: o.orderNumber,
            table: table ? table._id : null,
            tableNum: o.tableNum,
            items: [
              { name: "Sample Item", price: o.total, qty: 1 }
            ],
            total: o.total,
            status: o.status || 'completed',
            paymentStatus: o.paymentStatus || 'paid',
            notes: o.notes || ''
          });
        }
        console.log(`✅ Seeded ${ordersData.length} sample orders from CSV.`);
      }
    }

    console.log('🎉 CSV Database Seeding Completed Successfully! 🌱');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`❌ Error seeding database from CSV: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

if (require.main === module) {
  seedFromCSV();
}

module.exports = seedFromCSV;
