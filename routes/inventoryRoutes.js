const express = require('express');
const router = express.Router();
const { 
  getIngredients, 
  updateIngredient, 
  restockIngredient, 
  addIngredient 
} = require('../controllers/inventoryController');

router.get('/', getIngredients);
router.post('/', addIngredient);
router.put('/:id', updateIngredient);
router.post('/:id/restock', restockIngredient);

module.exports = router;
