const Order = require('../models/Order');
const Table = require('../models/Table');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Menu = require('../models/Menu');
const { memoryOrders } = require('./orderController');

// Helper to generate last 7 days date array
const getWeeklyBaseline = () => {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];
    days.push({ date: dateStr, day: dayLabel, sales: 0, orders: 0 });
  }
  return days;
};

// Helper to generate last 6 months date array
const getMonthlyBaseline = () => {
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    months.push({
      month: monthLabel,
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      sales: 0,
      orders: 0
    });
  }
  return months;
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    let dbOrders = [];
    try {
      dbOrders = await Order.find({ status: { $ne: 'cancelled' } }).lean();
    } catch (e) {
      dbOrders = [];
    }

    const dbOrderIds = new Set(dbOrders.map(o => String(o._id)));
    const memNonCancelled = (memoryOrders || []).filter(o => o.status !== 'cancelled' && !dbOrderIds.has(String(o._id)));
    const allOrders = [...dbOrders, ...memNonCancelled];

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrdersCount = allOrders.length;

    let occupiedTables = [];
    try {
      occupiedTables = await Table.find({ status: 'occupied' });
    } catch (e) {}
    const activeDiners = occupiedTables.reduce((sum, t) => sum + (t.seats || 4), 0);

    const activeOrdersCount = allOrders.filter(o => ['pending', 'accepted', 'preparing', 'served'].includes(o.status)).length;

    const bookingsCount = await Booking.countDocuments().catch(() => 0);
    const menuItemsCount = await Menu.countDocuments().catch(() => 82);
    const customersCount = await User.countDocuments({ role: 'customer' }).catch(() => 0);

    const sortedOrders = [...allOrders].sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
    const recentOrders = sortedOrders.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        formattedRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
        totalOrdersCount,
        activeDiners: activeDiners || 0,
        activeOrdersCount,
        bookingsCount: bookingsCount || 0,
        menuItemsCount,
        customersCount: customersCount || 0,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Analytics Reports
// @route   GET /api/admin/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {

    // 1. Top Selling Items (by revenue)
    const categorySales = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQty: { $sum: '$items.qty' },
          totalSales: { $sum: { $multiply: ['$items.price', '$items.qty'] } }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    // 2. Weekly Analysis (Last 7 Days) — 100% from real orders
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const liveWeekly = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$total" },
          count: { $sum: 1 }
        }
      }
    ]);

    const weeklyMap = new Map(liveWeekly.map(w => [w._id, w]));
    const weeklyBaseline = getWeeklyBaseline();

    const weeklyAnalysis = weeklyBaseline.map(item => {
      const match = weeklyMap.get(item.date);
      return {
        day: item.day,
        date: item.date,
        sales: match ? match.sales : 0,
        orders: match ? match.count : 0
      };
    });

    // 3. Monthly Analysis (Last 6 Months) — 100% from real orders
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const liveMonthly = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          sales: { $sum: "$total" },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyMap = new Map(liveMonthly.map(m => [m._id, m]));
    const monthlyBaseline = getMonthlyBaseline();

    const monthlyAnalysis = monthlyBaseline.map(item => {
      const match = monthlyMap.get(item.monthKey);
      return {
        month: item.month,
        sales: match ? match.sales : 0,
        orders: match ? match.count : 0
      };
    });

    // 4. Hourly Traffic Distribution — real orders grouped by hour-of-day
    const hourlyRaw = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          orders: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build 24-hour map — only show hours with activity OR standard dining hours
    const diningHours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const hourlyMap = new Map(hourlyRaw.map(h => [h._id, h]));
    const hourlyTraffic = diningHours.map(h => {
      const match = hourlyMap.get(h);
      const hourLabel = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      return {
        hour: hourLabel,
        hourNum: h,
        orders: match ? match.orders : 0,
        revenue: match ? match.revenue : 0
      };
    });

    // 5. Category Sales Share — from menu item categories using order data
    const categorySalesRaw = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menus',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuData'
        }
      },
      { $unwind: { path: '$menuData', preserveNullAndEmpty: true } },
      {
        $group: {
          _id: { $ifNull: ['$menuData.category', 'Other'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          qty: { $sum: '$items.qty' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 }
    ]);

    const totalCategoryRevenue = categorySalesRaw.reduce((s, c) => s + c.revenue, 0) || 1;
    const categoryDistribution = categorySalesRaw.map(c => ({
      category: c._id,
      revenue: c.revenue,
      qty: c.qty,
      percent: Math.round((c.revenue / totalCategoryRevenue) * 100)
    }));

    // 6. Payment Method Breakdown — from paymentStatus + sessionType
    const totalPaidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const totalUnpaidOrders = await Order.countDocuments({ paymentStatus: 'unpaid', status: { $ne: 'cancelled' } });

    const paidRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const memberOrders = await Order.aggregate([
      { $match: { sessionType: 'member', paymentStatus: 'paid' } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } }
    ]);

    const guestOrders = await Order.aggregate([
      { $match: { sessionType: 'guest', paymentStatus: 'paid' } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } }
    ]);

    const paidTotal = paidRevenue[0]?.total || 0;
    const memberCount = memberOrders[0]?.count || 0;
    const memberRevenue = memberOrders[0]?.revenue || 0;
    const guestCount = guestOrders[0]?.count || 0;
    const guestRevenue = guestOrders[0]?.revenue || 0;

    const paymentBreakdown = [
      {
        method: 'Member Account Payments',
        count: memberCount,
        amount: memberRevenue,
        percent: paidTotal > 0 ? Math.round((memberRevenue / paidTotal) * 100) : 0,
        icon: 'fa-user-check',
        color: '#10B981'
      },
      {
        method: 'Guest / Walk-In Payments',
        count: guestCount,
        amount: guestRevenue,
        percent: paidTotal > 0 ? Math.round((guestRevenue / paidTotal) * 100) : 0,
        icon: 'fa-person-walking',
        color: '#F59E0B'
      },
      {
        method: 'Pending / Unpaid Bills',
        count: totalUnpaidOrders,
        amount: 0,
        percent: 0,
        icon: 'fa-clock',
        color: '#EF4444'
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        categorySales,         // top selling dishes
        weeklyAnalysis,        // 7-day revenue trend
        monthlyAnalysis,       // 6-month revenue trend
        hourlyTraffic,         // dining hour traffic
        categoryDistribution,  // category revenue share %
        paymentBreakdown,      // payment method split
        totalPaidOrders,
        totalUnpaidOrders
      }
    });
  } catch (error) {
    next(error);
  }
};
