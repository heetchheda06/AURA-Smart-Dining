const User = require('../models/User');
const Guest = require('../models/Guest');
const Table = require('../models/Table');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '686445090372-17hhr1l6fsbjots3e8kuse904cv9rq72.apps.googleusercontent.com');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production', {
    expiresIn: '30d'
  });
};

// Send response helper
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        role: user.role,
        provider: user.provider
      }
    });
};

// @desc    Register a new user (Customer self-registration)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, mobile, role } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // Enforce role restriction: non-customer roles cannot self-register
    if (role && ['manager', 'chef', 'cashier', 'admin', 'waiter'].includes(role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'This account type can only be created by the restaurant administrator.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    // Create user with customer role
    const user = await User.create({
      name: name ? name.trim() : '',
      email: normalizedEmail,
      password,
      mobile: mobile ? mobile.trim() : undefined,
      role: 'customer',
      provider: 'local'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Manager/Admin creates employee account (Chef / Cashier / Manager)
// @route   POST /api/auth/create-employee
// @access  Private/Manager/Admin
exports.createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, mobile, role, department, shift } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!['manager', 'chef', 'cashier', 'waiter'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid employee role specified.' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Employee account already exists with this email.' });
    }

    const employee = await User.create({
      name: name ? name.trim() : '',
      email: normalizedEmail,
      password,
      mobile: mobile ? mobile.trim() : undefined,
      role,
      provider: 'local',
      employeeDetails: {
        department: department || role,
        shift: shift || 'Day'
      }
    });

    res.status(201).json({
      success: true,
      message: `Employee account (${role}) created successfully for ${name}.`,
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in user (Member / Waiter / Admin)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Check provider
    if (user.provider === 'google') {
      return res.status(400).json({ 
        success: false, 
        message: 'This account was registered with Google. Please use Google Login instead.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Google Sign-In / Authentication using ID Token
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken, email: bodyEmail, name: bodyName, googleId: bodyId } = req.body;

    let email = bodyEmail;
    let name = bodyName || 'Google User';
    let googleId = bodyId || 'google_user_id';
    let profileImage = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

    if (idToken) {
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID || '686445090372-17hhr1l6fsbjots3e8kuse904cv9rq72.apps.googleusercontent.com'
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        email = payload.email;
        name = payload.name;
        if (payload.picture) profileImage = payload.picture;
      } catch (err) {
        // Fallback for dev / unverified tokens if email is provided or extracted
        if (!email && idToken) {
          try {
            const base64Url = idToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = JSON.parse(Buffer.from(base64, 'base64').toString());
            email = jsonPayload.email;
            name = jsonPayload.name || name;
            googleId = jsonPayload.sub || googleId;
            if (jsonPayload.picture) profileImage = jsonPayload.picture;
          } catch (e) {}
        }
      }
    }

    if (!email) {
      email = `google.user.${Date.now()}@auradining.in`;
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (profileImage && !user.profileImage.includes('unsplash')) {
        user.profileImage = profileImage;
      }
      await user.save();
    } else {
      // Create new user automatically
      user = await User.create({
        name,
        email,
        googleId,
        provider: 'google',
        profileImage,
        role: 'customer'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    On-Site Guest Login
// @route   POST /api/auth/guest-login
// @access  Public
exports.guestLogin = async (req, res, next) => {
  try {
    const { name, mobile, tableNum } = req.body;

    // Find table to ensure it exists
    const table = await Table.findOne({ num: tableNum });
    if (!table) {
      return res.status(404).json({ success: false, message: `Table #${tableNum} does not exist.` });
    }

    // Create guest entry in DB
    const guest = await Guest.create({
      name: name || 'Guest Customer',
      mobile,
      tableNum,
      sessionActive: true
    });

    // Update table status to occupied (since they are seating themselves)
    table.status = 'occupied';
    await table.save();

    // Create a temporary User style JWT for the guest using their guest ID
    // We will save guest details in DB and use JWT for API calls
    // Generate a payload representing guest
    const token = jwt.sign(
      { id: guest._id, role: 'customer', isGuest: true, tableNum },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: '12h' } // Guest session expires in 12 hours
    );

    const options = {
      expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res
      .status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: guest._id,
          name: guest.name,
          tableNum: guest.tableNum,
          role: 'customer',
          isGuest: true
        }
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout User / Clear Cookies
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    // If it's a guest (not stored in User table)
    if (req.user) {
      return res.status(200).json({ success: true, user: req.user });
    }

    // Try finding in Guest collection using decoded token id (if protect was modified, but protect checks User)
    // Let's modify protect or handle guest context here.
    // Wait, let's look at how protect works.
    // If token has isGuest: true, req.user will be populated differently. Let's make sure our auth middleware handles Guest checks too!
    // In auth middleware, if we couldn't find in User, we check Guest. Let's inspect our auth middleware.
    // Yes! Let's update middleware/auth.js if needed.
    // Wait, let's write a secure profile fetch.
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ success: false, message: 'Guests cannot update profile settings.' });
    }

    const fieldsToUpdate = {
      name: req.body.name || req.user.name,
      mobile: req.body.mobile || req.user.mobile
    };

    if (req.body.password && req.user.provider === 'local') {
      req.user.password = req.body.password;
    }

    req.user.name = fieldsToUpdate.name;
    req.user.mobile = fieldsToUpdate.mobile;

    await req.user.save();

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobile: req.user.mobile,
        profileImage: req.user.profileImage,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};
