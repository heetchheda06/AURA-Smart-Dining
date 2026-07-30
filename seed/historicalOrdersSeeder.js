const mongoose = require('mongoose');
const Order = require('../models/Order');

const sampleCustomers = [
  { name: "Rohan Sharma", type: "member" },
  { name: "Priya Ananth", type: "member" },
  { name: "Aniket Verma", type: "guest" },
  { name: "Sneha Kapadia", type: "member" },
  { name: "Karan Mehta", type: "guest" },
  { name: "Rahul Joshi", type: "member" },
  { name: "Neha Shah", type: "member" },
  { name: "Vikram Patel", type: "guest" },
  { name: "Pooja Malhotra", type: "member" },
  { name: "Aryan Keni", type: "member" },
  { name: "Aditya Roy", type: "guest" },
  { name: "Divya Nair", type: "member" },
  { name: "Aarav Sen", type: "member" },
  { name: "Ananya Iyer", type: "guest" },
  { name: "Kabir Malhotra", type: "member" },
  { name: "Ishaan Verma", type: "guest" },
  { name: "Tarun Rao", type: "member" },
  { name: "Meera Deshmukh", type: "member" },
  { name: "Riya Kapoor", type: "guest" },
  { name: "Siddharth Jain", type: "member" },
  { name: "Kavya Reddy", type: "member" },
  { name: "Gaurav Singhal", type: "guest" },
  { name: "Tanvi Agarwal", type: "member" },
  { name: "Nikhil Saxena", type: "member" },
  { name: "Shruti Bose", type: "guest" }
];

const sampleItemsPool = [
  { name: "Paneer Tikka", price: 280, category: "Starters & Appetizers" },
  { name: "Butter Chicken", price: 420, category: "Main Course - Indian" },
  { name: "Paneer Butter Masala", price: 360, category: "Main Course - Indian" },
  { name: "Dal Makhani", price: 310, category: "Main Course - Indian" },
  { name: "Butter Naan", price: 60, category: "Breads & Rice" },
  { name: "Garlic Naan", price: 80, category: "Breads & Rice" },
  { name: "Chicken Biryani", price: 390, category: "Breads & Rice" },
  { name: "Veg Hakka Noodles", price: 240, category: "Main Course - Asian & Chinese" },
  { name: "Chicken Fried Rice", price: 290, category: "Main Course - Asian & Chinese" },
  { name: "Margherita Pizza (12 inch)", price: 390, category: "Main Course - Italian & Continental" },
  { name: "Penne Alfredo", price: 350, category: "Main Course - Italian & Continental" },
  { name: "Crispy Chicken Cheese Burger", price: 270, category: "Burgers & Sandwiches" },
  { name: "Gulab Jamun with Ice Cream", price: 160, category: "Desserts" },
  { name: "Sizzling Brownie", price: 240, category: "Desserts" },
  { name: "Fresh Lime Soda", price: 110, category: "Beverages & Drinks" },
  { name: "Cold Coffee with Ice Cream", price: 180, category: "Beverages & Drinks" },
  { name: "Masala Chai", price: 60, category: "Beverages & Drinks" },
  { name: "Sweet Corn Veg Soup", price: 170, category: "Soups & Salads" }
];

// Generates 46 historical orders spanning 4 days ago to today
const generateHistoricalOrders = () => {
  const orders = [];
  const now = new Date();
  
  // Days: -3, -2, -1, 0 (Today)
  const daysOffset = [3, 2, 1, 0];
  const peakHours = [12, 13, 14, 19, 20, 21, 22]; // Peak lunch & dinner hours

  let orderIndex = 1;

  daysOffset.forEach(daysAgo => {
    // 10 to 14 orders per day
    const ordersPerDay = daysAgo === 0 ? 10 : 12;

    for (let i = 0; i < ordersPerDay; i++) {
      const orderDate = new Date(now);
      orderDate.setDate(now.getDate() - daysAgo);
      
      // Select random hour from peak hours & random minute
      const hour = peakHours[i % peakHours.length];
      const minute = Math.floor(Math.random() * 50);
      orderDate.setHours(hour, minute, 0, 0);

      // Select 2 to 4 items
      const numItems = Math.floor(Math.random() * 3) + 2;
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const itemTemplate = sampleItemsPool[(orderIndex + j) % sampleItemsPool.length];
        const qty = (j === 0 || j === 1) ? (Math.random() > 0.5 ? 2 : 1) : 1;
        const itemCost = itemTemplate.price * qty;
        subtotal += itemCost;

        items.push({
          menuItem: null,
          name: itemTemplate.name,
          price: itemTemplate.price,
          qty: qty,
          addedBy: "Diner",
          round: 1,
          itemStatus: "served",
          category: itemTemplate.category
        });
      }

      const tax = Math.round(subtotal * 0.10 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const customer = sampleCustomers[orderIndex % sampleCustomers.length];
      const tableNum = (orderIndex % 20) + 1;
      const orderId = new mongoose.Types.ObjectId();

      orders.push({
        _id: orderId,
        tableNum: tableNum,
        roundsCount: 1,
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: "completed",
        sessionType: customer.type,
        customerName: customer.name,
        paymentStatus: "paid",
        createdAt: orderDate,
        updatedAt: orderDate
      });

      orderIndex++;
    }
  });

  return orders;
};

const seedHistoricalOrdersIfEmpty = async () => {
  try {
    const existingCount = await Order.countDocuments({ status: "completed" });
    if (existingCount < 20) {
      console.log(`📦 Seeding 4-day historical analytics order data into MongoDB...`);
      const historicalOrders = generateHistoricalOrders();
      await Order.insertMany(historicalOrders);
      console.log(`✅ Successfully seeded ${historicalOrders.length} historical orders across previous 4 days!`);
    } else {
      console.log(`ℹ️ MongoDB already has ${existingCount} completed orders. Preserving database state.`);
    }
  } catch (err) {
    console.warn(`⚠️ Historical order seeding warning: ${err.message}`);
  }
};

module.exports = { generateHistoricalOrders, seedHistoricalOrdersIfEmpty };
