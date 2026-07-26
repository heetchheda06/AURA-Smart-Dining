const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Categories routing
router.route('/categories')
  .get(menuController.getCategories)
  .post(protect, authorize('admin'), menuController.createCategory);

router.route('/categories/:id')
  .put(protect, authorize('admin'), menuController.updateCategory)
  .delete(protect, authorize('admin'), menuController.deleteCategory);

// Menu items routing
router.route('/menu')
  .get(menuController.getMenuItems)
  .post(protect, authorize('admin'), upload.single('image'), menuController.createMenuItem);

router.route('/menu/:id')
  .put(protect, authorize('admin'), upload.single('image'), menuController.updateMenuItem)
  .delete(protect, authorize('admin'), menuController.deleteMenuItem);

module.exports = router;
