const Joi = require('joi');

const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    mobile: Joi.string().allow('', null).optional(),
    role: Joi.string().allow('', null).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

const validateGuestLogin = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(2).max(50),
    mobile: Joi.string().allow('', null).optional(),
    tableNum: Joi.number().required().min(1)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

const validateBooking = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    seats: Joi.number().required().min(1).max(20),
    bookingDate: Joi.date().required().greater('now')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateGuestLogin,
  validateBooking
};
