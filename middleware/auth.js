const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Guest = require('../models/Guest');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // ─── No token at all ─────────────────────────────────────────────────────────
  if (!token) {
    // Allow anonymous guest orders if tableNum is present in body
    const tableNum = req.body?.tableNum || req.query?.tableNum;
    if (tableNum) {
      req.user = {
        _id: 'anon_table_' + tableNum,
        name: 'Guest Diner',
        role: 'customer',
        isGuest: true,
        tableNum: parseInt(tableNum)
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in or scan your table QR.' });
  }

  // ─── Token exists – try to decode ────────────────────────────────────────────
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production');

    // ── Guest token ──────────────────────────────────────────────────────────
    if (decoded.isGuest) {
      let guest = null;
      try { guest = await Guest.findById(decoded.id); } catch (e) {}

      if (guest && guest.sessionActive) {
        req.user = {
          _id: guest._id,
          id: guest._id,
          name: guest.name,
          role: 'customer',
          isGuest: true,
          tableNum: guest.tableNum
        };
      } else {
        // Guest session expired – still allow as anonymous if tableNum available
        const tableNum = req.body?.tableNum || decoded.tableNum;
        req.user = {
          _id: decoded.id || ('anon_table_' + tableNum),
          name: decoded.name || 'Guest Diner',
          role: 'customer',
          isGuest: true,
          tableNum: tableNum ? parseInt(tableNum) : undefined
        };
      }
      return next();
    }

    // ── Staff / member token ─────────────────────────────────────────────────
    let userDoc = null;
    try { userDoc = await User.findById(decoded.id).select('-password'); } catch (e) {}

    if (userDoc) {
      req.user = userDoc;
      return next();
    }

    // User deleted from DB but valid token – reconstruct from JWT claims
    if (decoded.role) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        role: decoded.role,
        name: decoded.name || 'Staff Member',
        email: decoded.email || '',
        tableNum: decoded.tableNum
      };
      return next();
    }

    // Last resort – still allow if tableNum present (treat as guest order)
    const tableNum = req.body?.tableNum || req.query?.tableNum;
    if (tableNum) {
      req.user = {
        _id: 'fallback_table_' + tableNum,
        name: 'Guest Diner',
        role: 'customer',
        isGuest: true,
        tableNum: parseInt(tableNum)
      };
      return next();
    }

    return res.status(401).json({ success: false, message: 'User account not found. Please sign in again.' });

  } catch (error) {
    // Token is corrupted / expired – allow guest order if tableNum present
    const tableNum = req.body?.tableNum || req.query?.tableNum;
    if (tableNum) {
      req.user = {
        _id: 'expired_table_' + tableNum,
        name: 'Guest Diner',
        role: 'customer',
        isGuest: true,
        tableNum: parseInt(tableNum)
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

// Role authorization check middleware generator
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user.role}' is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
