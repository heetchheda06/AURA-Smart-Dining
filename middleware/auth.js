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

  if (!token) {
    if (req.body && req.body.tableNum) {
      req.user = {
        _id: 'guest_table_' + req.body.tableNum,
        name: 'Guest Diner',
        role: 'customer',
        isGuest: true,
        tableNum: parseInt(req.body.tableNum)
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Not authorized to access this route. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production');
    
    if (decoded.isGuest) {
      const guest = await Guest.findById(decoded.id);
      if (!guest || !guest.sessionActive) {
        return res.status(401).json({ success: false, message: 'Guest session has expired or is inactive.' });
      }
      
      // Construct a mock user object for the request
      req.user = {
        _id: guest._id,
        id: guest._id,
        name: guest.name,
        role: 'customer',
        isGuest: true,
        tableNum: guest.tableNum
      };
    } else {
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (e) {}

      if (!req.user && decoded.role) {
        req.user = { _id: decoded.id, id: decoded.id, role: decoded.role, name: decoded.name || 'Admin User' };
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found with this token.' });
      }
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized. Token invalid or expired.' });
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
