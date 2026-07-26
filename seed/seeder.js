require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Menu = require('../models/Menu');
const Table = require('../models/Table');
const User = require('../models/User');
const Ingredient = require('../models/Ingredient');
const Order = require('../models/Order');

const categories = [
  { name: "Starters & Appetizers", slug: "starters-appetizers", icon: "fa-solid fa-fire-flame-curved" },
  { name: "Soups & Salads", slug: "soups-salads", icon: "fa-solid fa-bowl-food" },
  { name: "Main Course - Indian", slug: "main-course-indian", icon: "fa-solid fa-pepper-hot" },
  { name: "Main Course - Asian & Chinese", slug: "main-course-asian-chinese", icon: "fa-solid fa-bowl-rice" },
  { name: "Main Course - Italian & Continental", slug: "main-course-italian-continental", icon: "fa-solid fa-pizza-slice" },
  { name: "Burgers & Sandwiches", slug: "burgers-sandwiches", icon: "fa-solid fa-burger" },
  { name: "Breads & Rice", slug: "breads-rice", icon: "fa-solid fa-bread-slice" },
  { name: "Desserts", slug: "desserts", icon: "fa-solid fa-cake-candles" },
  { name: "Beverages & Drinks", slug: "beverages-drinks", icon: "fa-solid fa-wine-glass" }
];

const menuItems = [
  // Starters & Appetizers
  { dish_id: "DSH-101", name: "Paneer Tikka", category: "Starters & Appetizers", cuisine: "Indian", dietary_type: "Veg", price: 280, prep_time_minutes: 15, calories: 320, ingredients: "Paneer, Yogurt, Bell Pepper, Spices", tags: "spicy, tandoori, popular", spiciness: "High" },
  { dish_id: "DSH-102", name: "Chicken 65", category: "Starters & Appetizers", cuisine: "Indian", dietary_type: "Non-Veg", price: 320, prep_time_minutes: 18, calories: 410, ingredients: "Chicken, Chilly, Curry Leaves, Spices", tags: "spicy, fried, popular", spiciness: "High" },
  { dish_id: "DSH-103", name: "Crispy Corn", category: "Starters & Appetizers", cuisine: "Chinese", dietary_type: "Veg", price: 220, prep_time_minutes: 12, calories: 280, ingredients: "Corn, Capsicum, Cornflour, Garlic", tags: "crispy, snack", spiciness: "Low" },
  { dish_id: "DSH-104", name: "Spring Rolls", category: "Starters & Appetizers", cuisine: "Chinese", dietary_type: "Veg", price: 240, prep_time_minutes: 14, calories: 310, ingredients: "Cabbage, Carrot, Flour Wrapper, Oil", tags: "crispy, classic", spiciness: "Low" },
  { dish_id: "DSH-105", name: "Hara Bhara Kebab", category: "Starters & Appetizers", cuisine: "Indian", dietary_type: "Veg", price: 250, prep_time_minutes: 15, calories: 260, ingredients: "Spinach, Green Peas, Potato, Breadcrumbs", tags: "healthy, veggie", spiciness: "Low" },
  { dish_id: "DSH-106", name: "Garlic Bread with Cheese", category: "Starters & Appetizers", cuisine: "Italian", dietary_type: "Veg", price: 210, prep_time_minutes: 10, calories: 350, ingredients: "Bread, Garlic Butter, Mozzarella Cheese", tags: "cheesy, classic", spiciness: "Low" },
  { dish_id: "DSH-107", name: "Bruschetta", category: "Starters & Appetizers", cuisine: "Italian", dietary_type: "Vegan", price: 230, prep_time_minutes: 10, calories: 220, ingredients: "Baguette, Tomatoes, Basil, Olive Oil, Garlic", tags: "fresh, italian", spiciness: "Low" },
  { dish_id: "DSH-108", name: "Fish Amritsari", category: "Starters & Appetizers", cuisine: "Indian", dietary_type: "Non-Veg", price: 380, prep_time_minutes: 16, calories: 390, ingredients: "Fish Fillet, Gram Flour, Ajwain, Lemon, Spices", tags: "crispy, spicy", spiciness: "High" },
  { dish_id: "DSH-109", name: "Mutton Seekh Kebab", category: "Starters & Appetizers", cuisine: "Indian", dietary_type: "Non-Veg", price: 420, prep_time_minutes: 20, calories: 450, ingredients: "Mutton Mince, Spices, Mint, Onion, Garlic", tags: "tandoori, rich", spiciness: "High" },
  { dish_id: "DSH-110", name: "Chicken Wings (BBQ)", category: "Starters & Appetizers", cuisine: "Continental", dietary_type: "Non-Veg", price: 340, prep_time_minutes: 18, calories: 480, ingredients: "Chicken Wings, BBQ Sauce, Garlic, Honey", tags: "smoky, juicy", spiciness: "Medium" },

  // Soups & Salads
  { dish_id: "DSH-111", name: "Tomato Basil Soup", category: "Soups & Salads", cuisine: "Continental", dietary_type: "Veg", price: 180, prep_time_minutes: 10, calories: 150, ingredients: "Fresh Tomatoes, Basil, Cream, Garlic, Butter", tags: "warm, comfort", spiciness: "Low" },
  { dish_id: "DSH-112", name: "Hot & Sour Chicken Soup", category: "Soups & Salads", cuisine: "Chinese", dietary_type: "Non-Veg", price: 210, prep_time_minutes: 12, calories: 190, ingredients: "Chicken, Soy Sauce, Vinegar, Pepper, Mushroom", tags: "spicy, sour", spiciness: "High" },
  { dish_id: "DSH-113", name: "Sweet Corn Veg Soup", category: "Soups & Salads", cuisine: "Chinese", dietary_type: "Veg", price: 170, prep_time_minutes: 10, calories: 160, ingredients: "Sweet Corn, Veggies, Cornflour, Pepper", tags: "mild, classic", spiciness: "Low" },
  { dish_id: "DSH-114", name: "Greek Salad", category: "Soups & Salads", cuisine: "Continental", dietary_type: "Veg", price: 260, prep_time_minutes: 8, calories: 210, ingredients: "Cucumber, Tomatoes, Feta Cheese, Olives, Olive Oil", tags: "fresh, healthy", spiciness: "Low" },
  { dish_id: "DSH-115", name: "Caesar Salad with Grilled Chicken", category: "Soups & Salads", cuisine: "Continental", dietary_type: "Non-Veg", price: 320, prep_time_minutes: 12, calories: 340, ingredients: "Lettuce, Chicken, Croutons, Caesar Dressing, Parmesan", tags: "protein, fresh", spiciness: "Low" },

  // Main Course - Indian
  { dish_id: "DSH-121", name: "Butter Chicken", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 420, prep_time_minutes: 22, calories: 580, ingredients: "Chicken, Butter, Tomato Gravy, Cream, Kasuri Methi", tags: "rich, creamy, bestselling", spiciness: "Medium" },
  { dish_id: "DSH-122", name: "Paneer Butter Masala", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 360, prep_time_minutes: 20, calories: 490, ingredients: "Paneer, Tomato Gravy, Butter, Spices, Cream", tags: "rich, popular", spiciness: "Medium" },
  { dish_id: "DSH-123", name: "Dal Makhani", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 310, prep_time_minutes: 25, calories: 420, ingredients: "Black Lentils, Kidney Beans, Butter, Cream, Spices", tags: "slow-cooked, classic", spiciness: "Low" },
  { dish_id: "DSH-124", name: "Kadai Paneer", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 350, prep_time_minutes: 18, calories: 440, ingredients: "Paneer, Capsicum, Onion, Kadai Spices", tags: "spicy, flavorful", spiciness: "High" },
  { dish_id: "DSH-125", name: "Mutton Rogan Josh", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 490, prep_time_minutes: 28, calories: 620, ingredients: "Mutton, Kashmiri Chilly, Yogurt, Whole Spices", tags: "spicy, traditional", spiciness: "High" },
  { dish_id: "DSH-126", name: "Palak Paneer", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 340, prep_time_minutes: 18, calories: 380, ingredients: "Spinach Puree, Paneer, Garlic, Spices", tags: "healthy, green", spiciness: "Low" },
  { dish_id: "DSH-127", name: "Chicken Tikka Masala", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 430, prep_time_minutes: 22, calories: 540, ingredients: "Grilled Chicken, Onion Tomato Gravy, Spices", tags: "spicy, rich", spiciness: "High" },

  // Main Course - Asian & Chinese
  { dish_id: "DSH-131", name: "Veg Hakka Noodles", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Vegan", price: 240, prep_time_minutes: 14, calories: 360, ingredients: "Noodles, Cabbage, Carrot, Capsicum, Soy Sauce", tags: "classic, popular", spiciness: "Low" },
  { dish_id: "DSH-132", name: "Chicken Fried Rice", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Non-Veg", price: 290, prep_time_minutes: 15, calories: 480, ingredients: "Rice, Chicken, Egg, Soy Sauce, Spring Onion", tags: "filling, savory", spiciness: "Low" },
  { dish_id: "DSH-133", name: "Paneer Manchurian (Gravy)", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Veg", price: 310, prep_time_minutes: 16, calories: 410, ingredients: "Paneer Balls, Manchurian Sauce, Garlic, Coriander", tags: "tangy, spicy", spiciness: "Medium" },
  { dish_id: "DSH-134", name: "Thai Green Curry with Jasmine Rice", category: "Main Course - Asian & Chinese", cuisine: "Asian", dietary_type: "Veg", price: 410, prep_time_minutes: 20, calories: 510, ingredients: "Coconut Milk, Green Curry Paste, Veggies, Rice", tags: "aromatic, coconut", spiciness: "Medium" },

  // Main Course - Italian & Continental
  { dish_id: "DSH-141", name: "Margherita Pizza (12 inch)", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Veg", price: 390, prep_time_minutes: 18, calories: 680, ingredients: "Pizza Crust, Tomato Sauce, Mozzarella, Basil", tags: "cheesy, classic", spiciness: "Low" },
  { dish_id: "DSH-142", name: "Penne Alfredo (White Sauce Pasta)", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Veg", price: 350, prep_time_minutes: 16, calories: 560, ingredients: "Penne, Fresh Cream, Butter, Garlic, Parmesan", tags: "creamy, rich", spiciness: "Low" },
  { dish_id: "DSH-143", name: "Pepperoni Pizza (12 inch)", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Non-Veg", price: 490, prep_time_minutes: 20, calories: 780, ingredients: "Crust, Mozzarella, Pork Pepperoni, Tomato Sauce", tags: "cheesy, meat lovers", spiciness: "Medium" },

  // Burgers & Sandwiches
  { dish_id: "DSH-151", name: "Classic Veg Burger with Fries", category: "Burgers & Sandwiches", cuisine: "Continental", dietary_type: "Veg", price: 220, prep_time_minutes: 12, calories: 450, ingredients: "Bun, Potato Veg Patty, Lettuce, Cheese, Mayo", tags: "comfort, combo", spiciness: "Low" },
  { dish_id: "DSH-152", name: "Crispy Chicken Cheese Burger", category: "Burgers & Sandwiches", cuisine: "Continental", dietary_type: "Non-Veg", price: 270, prep_time_minutes: 14, calories: 580, ingredients: "Bun, Fried Chicken Patty, Cheddar Cheese, Sauce", tags: "juicy, crunchy", spiciness: "Medium" },

  // Breads & Rice
  { dish_id: "DSH-161", name: "Butter Naan", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 60, prep_time_minutes: 6, calories: 180, ingredients: "Refined Flour, Butter, Milk", tags: "tandoori bread", spiciness: "Low" },
  { dish_id: "DSH-162", name: "Garlic Naan", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 80, prep_time_minutes: 7, calories: 200, ingredients: "Refined Flour, Garlic, Butter, Coriander", tags: "aromatic, popular", spiciness: "Low" },
  { dish_id: "DSH-163", name: "Chicken Dum Biryani", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Non-Veg", price: 390, prep_time_minutes: 22, calories: 650, ingredients: "Basmati Rice, Chicken, Whole Spices, Saffron, Ghee", tags: "bestselling, royal", spiciness: "High" },
  { dish_id: "DSH-164", name: "Veg Hyderabadi Biryani", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 310, prep_time_minutes: 20, calories: 520, ingredients: "Basmati Rice, Mixed Veggies, Fried Onions, Spices", tags: "aromatic, spicy", spiciness: "High" },

  // Desserts
  { dish_id: "DSH-171", name: "Gulab Jamun (2 pcs)", category: "Desserts", cuisine: "Indian", dietary_type: "Veg", price: 140, prep_time_minutes: 5, calories: 300, ingredients: "Khoya, Sugar Syrup, Cardamom, Rose Water", tags: "sweet, warm", spiciness: "Low" },
  { dish_id: "DSH-172", name: "Sizzling Chocolate Brownie with Ice Cream", category: "Desserts", cuisine: "Continental", dietary_type: "Veg", price: 240, prep_time_minutes: 8, calories: 480, ingredients: "Brownie, Vanilla Ice Cream, Hot Chocolate Fudge", tags: "decadent, hot & cold", spiciness: "Low" },

  // Beverages & Drinks
  { dish_id: "DSH-181", name: "Masala Chai", category: "Beverages & Drinks", cuisine: "Indian", dietary_type: "Veg", price: 60, prep_time_minutes: 5, calories: 90, ingredients: "Tea Leaves, Milk, Ginger, Cardamom, Sugar", tags: "hot, staple", spiciness: "Low" },
  { dish_id: "DSH-182", name: "Cold Coffee with Ice Cream", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Veg", price: 180, prep_time_minutes: 6, calories: 290, ingredients: "Espresso, Milk, Vanilla Ice Cream, Chocolate Syrup", tags: "chilled, popular", spiciness: "Low" },
  { dish_id: "DSH-183", name: "Fresh Lime Soda (Sweet & Salt)", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Vegan", price: 100, prep_time_minutes: 4, calories: 110, ingredients: "Lime Juice, Soda, Sugar, Salt, Mint", tags: "refreshing, fizzy", spiciness: "Low" },
  { dish_id: "DSH-184", name: "Classic Mojito", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Vegan", price: 190, prep_time_minutes: 5, calories: 140, ingredients: "Mint Leaves, Lime, Sugar, Soda, Crushed Ice", tags: "mocktail, chilled", spiciness: "Low" }
];

const tables = [
  { num: 1, seats: 2, zone: "Main Hall", status: "free" },
  { num: 2, seats: 4, zone: "Main Hall", status: "occupied" },
  { num: 3, seats: 2, zone: "Window Lounge", status: "free" },
  { num: 4, seats: 6, zone: "VIP Private Lounge", status: "occupied" },
  { num: 5, seats: 4, zone: "Window Lounge", status: "free" },
  { num: 6, seats: 8, zone: "VIP Private Lounge", status: "reserved" },
  { num: 7, seats: 2, zone: "Outdoor Patio", status: "occupied" },
  { num: 8, seats: 4, zone: "Outdoor Patio", status: "free" }
];

const pdfIngredients = [
  { ingredient_id: "ING-001", name: "Paneer", unit: "kg", initial_stock: 50, current_stock: 53.92, reorder_threshold: 15, cost_per_unit: 280, shelf_life_days: 5, is_low_stock: false, category: "Dairy & Oils" },
  { ingredient_id: "ING-002", name: "Chicken", unit: "kg", initial_stock: 80, current_stock: 47.17, reorder_threshold: 20, cost_per_unit: 220, shelf_life_days: 3, is_low_stock: false, category: "Meat & Seafood" },
  { ingredient_id: "ING-003", name: "Mutton", unit: "kg", initial_stock: 30, current_stock: 14.23, reorder_threshold: 10, cost_per_unit: 650, shelf_life_days: 4, is_low_stock: false, category: "Meat & Seafood" },
  { ingredient_id: "ING-004", name: "Fish Fillet", unit: "kg", initial_stock: 25, current_stock: 8.18, reorder_threshold: 8, cost_per_unit: 480, shelf_life_days: 3, is_low_stock: false, category: "Meat & Seafood" },
  { ingredient_id: "ING-005", name: "Butter", unit: "kg", initial_stock: 40, current_stock: 39.97, reorder_threshold: 10, cost_per_unit: 420, shelf_life_days: 30, is_low_stock: false, category: "Dairy & Oils" },
  { ingredient_id: "ING-006", name: "Cream", unit: "liters", initial_stock: 35, current_stock: 30.33, reorder_threshold: 10, cost_per_unit: 180, shelf_life_days: 10, is_low_stock: false, category: "Dairy & Oils" },
  { ingredient_id: "ING-007", name: "Basmati Rice", unit: "kg", initial_stock: 150, current_stock: 65.89, reorder_threshold: 30, cost_per_unit: 90, shelf_life_days: 180, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-008", name: "Refined Flour (Maida)", unit: "kg", initial_stock: 100, current_stock: 64.88, reorder_threshold: 25, cost_per_unit: 45, shelf_life_days: 90, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-009", name: "Whole Wheat Flour (Atta)", unit: "kg", initial_stock: 100, current_stock: 71.22, reorder_threshold: 25, cost_per_unit: 40, shelf_life_days: 90, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-010", name: "Tomatoes", unit: "kg", initial_stock: 90, current_stock: 86.63, reorder_threshold: 20, cost_per_unit: 35, shelf_life_days: 7, is_low_stock: false, category: "Produce" },
  { ingredient_id: "ING-011", name: "Onions", unit: "kg", initial_stock: 120, current_stock: 71.72, reorder_threshold: 30, cost_per_unit: 30, shelf_life_days: 15, is_low_stock: false, category: "Produce" },
  { ingredient_id: "ING-012", name: "Garlic", unit: "kg", initial_stock: 25, current_stock: 10.71, reorder_threshold: 5, cost_per_unit: 140, shelf_life_days: 30, is_low_stock: false, category: "Produce" },
  { ingredient_id: "ING-013", name: "Ginger", unit: "kg", initial_stock: 20, current_stock: 20.15, reorder_threshold: 5, cost_per_unit: 120, shelf_life_days: 20, is_low_stock: false, category: "Produce" },
  { ingredient_id: "ING-014", name: "Mozzarella Cheese", unit: "kg", initial_stock: 30, current_stock: 6.08, reorder_threshold: 8, cost_per_unit: 450, shelf_life_days: 20, is_low_stock: true, category: "Dairy & Oils" },
  { ingredient_id: "ING-015", name: "Cheddar Cheese", unit: "kg", initial_stock: 20, current_stock: 6.98, reorder_threshold: 5, cost_per_unit: 520, shelf_life_days: 30, is_low_stock: false, category: "Dairy & Oils" },
  { ingredient_id: "ING-016", name: "Noodles", unit: "kg", initial_stock: 50, current_stock: 39.37, reorder_threshold: 12, cost_per_unit: 70, shelf_life_days: 90, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-017", name: "Soy Sauce", unit: "liters", initial_stock: 20, current_stock: 21.08, reorder_threshold: 5, cost_per_unit: 110, shelf_life_days: 180, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-018", name: "Cooking Oil", unit: "liters", initial_stock: 100, current_stock: 36.77, reorder_threshold: 25, cost_per_unit: 130, shelf_life_days: 180, is_low_stock: false, category: "Dairy & Oils" },
  { ingredient_id: "ING-019", name: "Milk", unit: "liters", initial_stock: 60, current_stock: 22.73, reorder_threshold: 15, cost_per_unit: 55, shelf_life_days: 3, is_low_stock: false, category: "Dairy & Oils" },
  { ingredient_id: "ING-020", name: "Yogurt", unit: "kg", initial_stock: 40, current_stock: 10.68, reorder_threshold: 10, cost_per_unit: 75, shelf_life_days: 7, is_low_stock: false, category: "Dairy & Oils" },
  { ingredient_id: "ING-021", name: "Green Bell Pepper", unit: "kg", initial_stock: 30, current_stock: 5.77, reorder_threshold: 8, cost_per_unit: 60, shelf_life_days: 7, is_low_stock: true, category: "Produce" },
  { ingredient_id: "ING-022", name: "Spinach", unit: "kg", initial_stock: 25, current_stock: 10.65, reorder_threshold: 6, cost_per_unit: 40, shelf_life_days: 4, is_low_stock: false, category: "Produce" },
  { ingredient_id: "ING-023", name: "Sweet Corn", unit: "kg", initial_stock: 30, current_stock: 24.82, reorder_threshold: 8, cost_per_unit: 90, shelf_life_days: 15, is_low_stock: false, category: "Produce" },
  { ingredient_id: "ING-024", name: "Coffee Beans", unit: "kg", initial_stock: 15, current_stock: 3.08, reorder_threshold: 4, cost_per_unit: 850, shelf_life_days: 90, is_low_stock: true, category: "Beverages & Teas" },
  { ingredient_id: "ING-025", name: "Tea Leaves", unit: "kg", initial_stock: 15, current_stock: 11.9, reorder_threshold: 3, cost_per_unit: 400, shelf_life_days: 180, is_low_stock: false, category: "Beverages & Teas" },
  { ingredient_id: "ING-026", name: "Sugar", unit: "kg", initial_stock: 80, current_stock: 69.25, reorder_threshold: 20, cost_per_unit: 42, shelf_life_days: 180, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-027", name: "Cashew Nuts", unit: "kg", initial_stock: 15, current_stock: 2.29, reorder_threshold: 4, cost_per_unit: 750, shelf_life_days: 90, is_low_stock: true, category: "Pantry" },
  { ingredient_id: "ING-028", name: "Burger Buns", unit: "pieces", initial_stock: 200, current_stock: 55.32, reorder_threshold: 50, cost_per_unit: 8, shelf_life_days: 4, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-029", name: "Tortilla Chips", unit: "kg", initial_stock: 20, current_stock: 14.24, reorder_threshold: 5, cost_per_unit: 180, shelf_life_days: 30, is_low_stock: false, category: "Pantry" },
  { ingredient_id: "ING-030", name: "Mint Leaves", unit: "kg", initial_stock: 10, current_stock: 4.76, reorder_threshold: 3, cost_per_unit: 80, shelf_life_days: 3, is_low_stock: false, category: "Produce" },
  { ingredient_id: "ING-031", name: "Limes", unit: "kg", initial_stock: 20, current_stock: 21.11, reorder_threshold: 5, cost_per_unit: 70, shelf_life_days: 10, is_low_stock: false, category: "Produce" }
];

const autoSeedIfEmpty = async () => {
  try {
    const count = await Menu.countDocuments();
    if (count === 0) {
      console.log('🌱 Database is empty! Auto-seeding menu, categories, ingredients & accounts...');
      await Category.deleteMany({});
      await Category.insertMany(categories);

      await Menu.deleteMany({});
      await Menu.insertMany(menuItems);

      await Table.deleteMany({});
      await Table.insertMany(tables);

      await Ingredient.deleteMany({});
      await Ingredient.insertMany(pdfIngredients);

      const admin = await User.findOne({ email: "admin@auradining.in" });
      if (!admin) {
        await User.create([
          { name: "AURA Admin", email: "admin@auradining.in", password: "AdminPassword123", role: "admin", provider: "local" },
          { name: "AURA Manager", email: "manager@auradining.in", password: "ManagerPassword123", role: "manager", provider: "local" },
          { name: "Executive Chef Mario", email: "chef@auradining.in", password: "ChefPassword123", role: "chef", provider: "local" },
          { name: "Lead Cashier Sarah", email: "cashier@auradining.in", password: "CashierPassword123", role: "cashier", provider: "local" },
          { name: "AURA Customer", email: "customer@auradining.in", password: "CustomerPassword123", role: "customer", provider: "local" }
        ]);
      }
      console.log('🌱 Auto-seeding completed successfully!');
    }
  } catch (err) {
    console.error(`Auto-seed warning: ${err.message}`);
  }
};

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aura';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    await autoSeedIfEmpty();
    console.log('Database Seeding Completed Successfully! 🌱');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = { autoSeedIfEmpty, seedDB, menuItems, pdfIngredients };
