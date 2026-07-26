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
  { dish_id: "DSH-108", name: "Fish Fingers", category: "Starters & Appetizers", cuisine: "Continental", dietary_type: "Non-Veg", price: 360, prep_time_minutes: 15, calories: 380, ingredients: "Fish Fillet, Breadcrumbs, Egg, Tartar Sauce", tags: "crispy, seafood", spiciness: "Low" },
  { dish_id: "DSH-109", name: "Chicken Wings (BBQ)", category: "Starters & Appetizers", cuisine: "American", dietary_type: "Non-Veg", price: 350, prep_time_minutes: 20, calories: 480, ingredients: "Chicken Wings, BBQ Sauce, Honey, Garlic", tags: "smoky, savory", spiciness: "Medium" },
  { dish_id: "DSH-110", name: "Veg Nachos Supreme", category: "Starters & Appetizers", cuisine: "Mexican", dietary_type: "Veg", price: 270, prep_time_minutes: 12, calories: 450, ingredients: "Tortilla Chips, Cheese Sauce, Jalapenos, Beans, Salsa", tags: "mexican, cheesy", spiciness: "Low" },
  { dish_id: "DSH-111", name: "Falafel with Hummus", category: "Starters & Appetizers", cuisine: "Middle Eastern", dietary_type: "Vegan", price: 260, prep_time_minutes: 15, calories: 390, ingredients: "Chickpeas, Tahini, Garlic, Pita Bread, Olive Oil", tags: "healthy, mediterranean", spiciness: "Low" },
  { dish_id: "DSH-112", name: "Dim Sum / Veg Momos", category: "Starters & Appetizers", cuisine: "Tibetan", dietary_type: "Veg", price: 200, prep_time_minutes: 15, calories: 240, ingredients: "Flour, Cabbage, Carrot, Ginger, Soy Sauce", tags: "steamed, snack", spiciness: "Low" },
  { dish_id: "DSH-113", name: "Chicken Momos", category: "Starters & Appetizers", cuisine: "Tibetan", dietary_type: "Non-Veg", price: 240, prep_time_minutes: 15, calories: 310, ingredients: "Chicken Mince, Flour, Onion, Chilly Sauce", tags: "steamed, street-food", spiciness: "Low" },
  { dish_id: "DSH-114", name: "Paneer Malai Tikka", category: "Starters & Appetizers", cuisine: "Indian", dietary_type: "Veg", price: 310, prep_time_minutes: 18, calories: 380, ingredients: "Paneer, Cream, Cashew Paste, Cardamom", tags: "mild, creamy", spiciness: "Low" },
  { dish_id: "DSH-115", name: "Stuffed Mushrooms", category: "Starters & Appetizers", cuisine: "Continental", dietary_type: "Veg", price: 290, prep_time_minutes: 16, calories: 290, ingredients: "Button Mushrooms, Cheese, Garlic, Herbs", tags: "baked, gourmet", spiciness: "Low" },

  // Soups & Salads
  { dish_id: "DSH-116", name: "Tomato Basil Soup", category: "Soups & Salads", cuisine: "Italian", dietary_type: "Veg", price: 180, prep_time_minutes: 10, calories: 150, ingredients: "Tomatoes, Basil, Cream, Croutons", tags: "warm, classic", spiciness: "Low" },
  { dish_id: "DSH-117", name: "Sweet Corn Chicken Soup", category: "Soups & Salads", cuisine: "Chinese", dietary_type: "Non-Veg", price: 210, prep_time_minutes: 12, calories: 190, ingredients: "Chicken, Sweet Corn, Egg White, Chicken Broth", tags: "comfort, chinese", spiciness: "Low" },
  { dish_id: "DSH-118", name: "Hot & Sour Veg Soup", category: "Soups & Salads", cuisine: "Chinese", dietary_type: "Veg", price: 170, prep_time_minutes: 10, calories: 130, ingredients: "Mushrooms, Carrots, Soy Sauce, Vinegar, Chilly", tags: "spicy, sour", spiciness: "High" },
  { dish_id: "DSH-119", name: "Caesar Salad (Chicken)", category: "Soups & Salads", cuisine: "American", dietary_type: "Non-Veg", price: 320, prep_time_minutes: 10, calories: 360, ingredients: "Romaine Lettuce, Grilled Chicken, Parmesan, Croutons, Caesar Dressing", tags: "fresh, salad", spiciness: "Low" },
  { dish_id: "DSH-120", name: "Greek Salad", category: "Soups & Salads", cuisine: "Greek", dietary_type: "Veg", price: 280, prep_time_minutes: 10, calories: 250, ingredients: "Cucumber, Feta Cheese, Olives, Tomatoes, Red Onion, Olive Oil", tags: "healthy, fresh", spiciness: "Low" },
  { dish_id: "DSH-121", name: "Manchow Soup", category: "Soups & Salads", cuisine: "Chinese", dietary_type: "Veg", price: 180, prep_time_minutes: 12, calories: 160, ingredients: "Mix Veggies, Soy Sauce, Fried Noodles, Garlic", tags: "spicy, popular", spiciness: "High" },
  { dish_id: "DSH-122", name: "Minestrone Soup", category: "Soups & Salads", cuisine: "Italian", dietary_type: "Vegan", price: 200, prep_time_minutes: 12, calories: 180, ingredients: "Pasta, Kidney Beans, Tomatoes, Zucchini, Broth", tags: "hearty, italian", spiciness: "Low" },

  // Main Course - Indian
  { dish_id: "DSH-123", name: "Butter Chicken", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 420, prep_time_minutes: 25, calories: 650, ingredients: "Chicken, Butter, Cream, Tomato Gravy, Kasuri Methi", tags: "creamy, bestseller, rich", spiciness: "Low" },
  { dish_id: "DSH-124", name: "Paneer Butter Masala", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 360, prep_time_minutes: 20, calories: 580, ingredients: "Paneer, Butter, Cashew Paste, Tomato Gravy", tags: "creamy, popular", spiciness: "Low" },
  { dish_id: "DSH-125", name: "Dal Makhani", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 310, prep_time_minutes: 22, calories: 490, ingredients: "Black Lentils, Kidney Beans, Butter, Cream, Spices", tags: "classic, creamy", spiciness: "Low" },
  { dish_id: "DSH-126", name: "Chicken Tikka Masala", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 430, prep_time_minutes: 22, calories: 610, ingredients: "Chicken Tikka, Onion Tomato Gravy, Spices, Cream", tags: "spicy, popular", spiciness: "High" },
  { dish_id: "DSH-127", name: "Kadhai Paneer", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 350, prep_time_minutes: 18, calories: 520, ingredients: "Paneer, Capsicum, Kadhai Masala, Tomatoes", tags: "spicy, bold", spiciness: "High" },
  { dish_id: "DSH-128", name: "Mutton Rogan Josh", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 520, prep_time_minutes: 30, calories: 720, ingredients: "Mutton, Yogurt, Kashmiri Chilly, Whole Spices", tags: "spicy, rich, traditional", spiciness: "High" },
  { dish_id: "DSH-129", name: "Malai Kofta", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 370, prep_time_minutes: 22, calories: 590, ingredients: "Potato Cheese Kofta, Cashew Gravy, Cream, Raisins", tags: "sweet, creamy", spiciness: "Low" },
  { dish_id: "DSH-130", name: "Palak Paneer", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 340, prep_time_minutes: 18, calories: 450, ingredients: "Spinach Purée, Paneer, Garlic, Cream", tags: "healthy, classic", spiciness: "Low" },
  { dish_id: "DSH-131", name: "Chicken Biryani (Hyderabadi)", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 390, prep_time_minutes: 25, calories: 680, ingredients: "Basmati Rice, Chicken, Biryani Spices, Fried Onions, Saffron", tags: "bestseller, spicy, signature", spiciness: "High" },
  { dish_id: "DSH-132", name: "Mutton Biryani", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 490, prep_time_minutes: 28, calories: 780, ingredients: "Basmati Rice, Mutton, Biryani Spices, Ghee, Mint", tags: "rich, signature", spiciness: "Low" },
  { dish_id: "DSH-133", name: "Veg Dum Biryani", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 320, prep_time_minutes: 20, calories: 510, ingredients: "Basmati Rice, Mixed Vegetables, Biryani Spices, Paneer", tags: "aromatic, classic", spiciness: "Low" },
  { dish_id: "DSH-134", name: "Chole Bhature", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 260, prep_time_minutes: 15, calories: 620, ingredients: "Chickpeas, Flour Bhatura, Spices, Pickle", tags: "north-indian, street-food", spiciness: "Low" },
  { dish_id: "DSH-135", name: "Rajma Chawal Bowl", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 220, prep_time_minutes: 12, calories: 480, ingredients: "Red Kidney Beans, Basmati Rice, Ghee, Spices", tags: "comfort-food, homestyle", spiciness: "Low" },
  { dish_id: "DSH-136", name: "Paneer Do Pyaza", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Veg", price: 350, prep_time_minutes: 18, calories: 510, ingredients: "Paneer, Onion Cubes, Tomato Gravy, Spices", tags: "savory", spiciness: "Medium" },
  { dish_id: "DSH-137", name: "Chicken Chettinad", category: "Main Course - Indian", cuisine: "Indian", dietary_type: "Non-Veg", price: 410, prep_time_minutes: 22, calories: 590, ingredients: "Chicken, Chettinad Masala, Coconut, Curry Leaves", tags: "very-spicy, south-indian", spiciness: "High" },

  // Main Course - Asian & Chinese
  { dish_id: "DSH-138", name: "Chicken Hakka Noodles", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Non-Veg", price: 290, prep_time_minutes: 15, calories: 450, ingredients: "Noodles, Chicken, Cabbage, Soy Sauce, Capsicum", tags: "popular, wok tossed", spiciness: "Low" },
  { dish_id: "DSH-139", name: "Veg Schezwan Fried Rice", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Vegan", price: 250, prep_time_minutes: 12, calories: 420, ingredients: "Rice, Schezwan Sauce, Mix Veggies, Spring Onion", tags: "spicy, fried rice", spiciness: "High" },
  { dish_id: "DSH-140", name: "Kung Pao Chicken", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Non-Veg", price: 410, prep_time_minutes: 18, calories: 510, ingredients: "Chicken, Peanuts, Dry Red Chilly, Soy Sauce, Zucchini", tags: "spicy, nutty", spiciness: "High" },
  { dish_id: "DSH-141", name: "Chicken Manchurian Gravy", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Non-Veg", price: 340, prep_time_minutes: 18, calories: 470, ingredients: "Chicken Balls, Soy Sauce, Garlic, Ginger, Cornflour", tags: "classic, gravy", spiciness: "Low" },
  { dish_id: "DSH-142", name: "Veg Manchurian Dry", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Veg", price: 270, prep_time_minutes: 15, calories: 380, ingredients: "Veggie Balls, Garlic, Soy Sauce, Spring Onion", tags: "starter, popular", spiciness: "Low" },
  { dish_id: "DSH-143", name: "Pad Thai Noodles (Shrimp)", category: "Main Course - Asian & Chinese", cuisine: "Thai", dietary_type: "Non-Veg", price: 450, prep_time_minutes: 18, calories: 530, ingredients: "Flat Rice Noodles, Shrimp, Peanuts, Tamarind, Bean Sprouts", tags: "thai, classic", spiciness: "Low" },
  { dish_id: "DSH-144", name: "Thai Green Curry with Rice (Veg)", category: "Main Course - Asian & Chinese", cuisine: "Thai", dietary_type: "Veg", price: 380, prep_time_minutes: 20, calories: 490, ingredients: "Green Curry Paste, Coconut Milk, Bamboo Shoots, Jasmine Rice", tags: "aromatic, creamy", spiciness: "Low" },
  { dish_id: "DSH-145", name: "Thai Red Curry with Chicken", category: "Main Course - Asian & Chinese", cuisine: "Thai", dietary_type: "Non-Veg", price: 420, prep_time_minutes: 20, calories: 560, ingredients: "Red Curry Paste, Chicken, Coconut Milk, Thai Basil, Jasmine Rice", tags: "spicy, rich", spiciness: "High" },
  { dish_id: "DSH-146", name: "Ramen Bowl (Chicken)", category: "Main Course - Asian & Chinese", cuisine: "Japanese", dietary_type: "Non-Veg", price: 480, prep_time_minutes: 20, calories: 620, ingredients: "Ramen Noodles, Broth, Chicken, Boiled Egg, Nori", tags: "japanese, comfort", spiciness: "Low" },
  { dish_id: "DSH-147", name: "Sushi Roll (California)", category: "Main Course - Asian & Chinese", cuisine: "Japanese", dietary_type: "Non-Veg", price: 520, prep_time_minutes: 15, calories: 340, ingredients: "Sushi Rice, Crab Stick, Avocado, Cucumber, Nori", tags: "sushi, fresh", spiciness: "Low" },
  { dish_id: "DSH-148", name: "Veg Fried Rice", category: "Main Course - Asian & Chinese", cuisine: "Chinese", dietary_type: "Vegan", price: 230, prep_time_minutes: 12, calories: 390, ingredients: "Rice, Carrots, Peas, Soy Sauce, Spring Onion", tags: "classic", spiciness: "Low" },

  // Main Course - Italian & Continental
  { dish_id: "DSH-149", name: "Margherita Pizza", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Veg", price: 320, prep_time_minutes: 15, calories: 650, ingredients: "Pizza Dough, Tomato Sauce, Mozzarella Cheese, Fresh Basil", tags: "classic, cheesy", spiciness: "Low" },
  { dish_id: "DSH-150", name: "Pepperoni Pizza", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Non-Veg", price: 480, prep_time_minutes: 18, calories: 820, ingredients: "Pizza Dough, Pepperoni, Mozzarella, Tomato Sauce", tags: "bestseller, american style", spiciness: "Low" },
  { dish_id: "DSH-151", name: "BBQ Chicken Pizza", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Non-Veg", price: 460, prep_time_minutes: 18, calories: 790, ingredients: "Pizza Dough, BBQ Chicken, Red Onion, Mozzarella, Cilantro", tags: "savory, cheesy", spiciness: "Medium" },
  { dish_id: "DSH-152", name: "Farmhouse Pizza", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Veg", price: 410, prep_time_minutes: 16, calories: 710, ingredients: "Pizza Dough, Capsicum, Onion, Mushroom, Corn, Mozzarella", tags: "veggie-loaded", spiciness: "Low" },
  { dish_id: "DSH-153", name: "Penne Arrabbiata", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Vegan", price: 340, prep_time_minutes: 15, calories: 430, ingredients: "Penne Pasta, Spicy Tomato Sauce, Garlic, Chilly Flakes, Olive Oil", tags: "spicy, classic", spiciness: "High" },
  { dish_id: "DSH-154", name: "Fettuccine Alfredo (Chicken)", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Non-Veg", price: 420, prep_time_minutes: 18, calories: 680, ingredients: "Fettuccine Pasta, Grilled Chicken, Parmesan, Heavy Cream, Butter", tags: "creamy, rich", spiciness: "Low" },
  { dish_id: "DSH-155", name: "Lasagna (Chicken)", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Non-Veg", price: 490, prep_time_minutes: 25, calories: 750, ingredients: "Lasagna Sheets, Minced Meat, Béchamel, Mozzarella, Tomato Sauce", tags: "hearty, baked", spiciness: "Low" },
  { dish_id: "DSH-156", name: "Grilled Chicken Breast with Veggies", category: "Main Course - Italian & Continental", cuisine: "Continental", dietary_type: "Non-Veg", price: 440, prep_time_minutes: 22, calories: 480, ingredients: "Chicken Breast, Mashed Potato, Grilled Veggies, Pepper Sauce", tags: "healthy, high protein", spiciness: "Low" },
  { dish_id: "DSH-157", name: "Fish and Chips", category: "Main Course - Italian & Continental", cuisine: "British", dietary_type: "Non-Veg", price: 420, prep_time_minutes: 18, calories: 650, ingredients: "Battered Fish Fillet, French Fries, Tartar Sauce, Lemon", tags: "crispy, classic", spiciness: "Low" },
  { dish_id: "DSH-158", name: "Risotto Wild Mushroom", category: "Main Course - Italian & Continental", cuisine: "Italian", dietary_type: "Veg", price: 450, prep_time_minutes: 22, calories: 540, ingredients: "Arborio Rice, Wild Mushrooms, Parmesan, White Wine, Butter", tags: "gourmet, creamy", spiciness: "Low" },

  // Burgers & Sandwiches
  { dish_id: "DSH-159", name: "Classic Cheese Burger", category: "Burgers & Sandwiches", cuisine: "American", dietary_type: "Non-Veg", price: 350, prep_time_minutes: 15, calories: 680, ingredients: "Burger Bun, Beef/Chicken Patty, Cheddar Cheese, Lettuce, Burger Sauce", tags: "bestseller, classic", spiciness: "Low" },
  { dish_id: "DSH-160", name: "Crispy Chicken Burger", category: "Burgers & Sandwiches", cuisine: "American", dietary_type: "Non-Veg", price: 320, prep_time_minutes: 14, calories: 610, ingredients: "Burger Bun, Fried Chicken Patty, Mayo, Pickles, Lettuce", tags: "crispy, popular", spiciness: "Low" },
  { dish_id: "DSH-161", name: "Veg Supreme Burger", category: "Burgers & Sandwiches", cuisine: "American", dietary_type: "Veg", price: 250, prep_time_minutes: 12, calories: 480, ingredients: "Burger Bun, Veggie Patty, Cheese Slice, Tomato, Lettuce", tags: "veggie, classic", spiciness: "Low" },
  { dish_id: "DSH-162", name: "Club Sandwich (Chicken)", category: "Burgers & Sandwiches", cuisine: "Continental", dietary_type: "Non-Veg", price: 290, prep_time_minutes: 12, calories: 520, ingredients: "Bread, Chicken, Egg, Bacon, Lettuce, Mayo", tags: "triple-decker", spiciness: "Low" },
  { dish_id: "DSH-163", name: "Grilled Paneer Tikka Sandwich", category: "Burgers & Sandwiches", cuisine: "Indian", dietary_type: "Veg", price: 240, prep_time_minutes: 10, calories: 420, ingredients: "Bread, Paneer Tikka, Green Chutney, Butter, Cheese", tags: "deshi, toast", spiciness: "Low" },
  { dish_id: "DSH-164", name: "Spinach & Corn Sandwich", category: "Burgers & Sandwiches", cuisine: "Continental", dietary_type: "Veg", price: 210, prep_time_minutes: 10, calories: 360, ingredients: "Bread, Spinach, Sweet Corn, Cheese Sauce", tags: "creamy, snack", spiciness: "Low" },

  // Breads & Rice
  { dish_id: "DSH-165", name: "Butter Naan", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 60, prep_time_minutes: 5, calories: 210, ingredients: "Refined Flour, Butter, Yogurt, Milk", tags: "staple, tandoori", spiciness: "Low" },
  { dish_id: "DSH-166", name: "Garlic Naan", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 80, prep_time_minutes: 6, calories: 230, ingredients: "Refined Flour, Garlic, Butter, Cilantro", tags: "popular, tandoori", spiciness: "Low" },
  { dish_id: "DSH-167", name: "Cheese Garlic Naan", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 120, prep_time_minutes: 8, calories: 310, ingredients: "Refined Flour, Cheese, Garlic, Butter", tags: "cheesy, rich", spiciness: "Low" },
  { dish_id: "DSH-168", name: "Tandoori Roti", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Vegan", price: 40, prep_time_minutes: 4, calories: 130, ingredients: "Whole Wheat Flour, Water", tags: "healthy, staple", spiciness: "Low" },
  { dish_id: "DSH-169", name: "Lachha Paratha", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 70, prep_time_minutes: 6, calories: 240, ingredients: "Whole Wheat Flour, Ghee", tags: "layered, flaky", spiciness: "Low" },
  { dish_id: "DSH-170", name: "Steamed Basmati Rice", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Vegan", price: 140, prep_time_minutes: 8, calories: 200, ingredients: "Basmati Rice, Water", tags: "staple", spiciness: "Low" },
  { dish_id: "DSH-171", name: "Jeera Rice", category: "Breads & Rice", cuisine: "Indian", dietary_type: "Veg", price: 170, prep_time_minutes: 8, calories: 250, ingredients: "Basmati Rice, Cumin Seeds, Ghee", tags: "aromatic", spiciness: "Low" },

  // Desserts
  { dish_id: "DSH-172", name: "Gulab Jamun (2 pcs)", category: "Desserts", cuisine: "Indian", dietary_type: "Veg", price: 120, prep_time_minutes: 5, calories: 320, ingredients: "Milk Powder, Sugar Syrup, Cardamom, Rose Water", tags: "sweet, classic, warm", spiciness: "Low" },
  { dish_id: "DSH-173", name: "Rasmalai (2 pcs)", category: "Desserts", cuisine: "Indian", dietary_type: "Veg", price: 150, prep_time_minutes: 5, calories: 280, ingredients: "Chhena, Saffron Milk, Pistachio, Cardamom", tags: "chilled, rich", spiciness: "Low" },
  { dish_id: "DSH-174", name: "Chocolate Lava Cake", category: "Desserts", cuisine: "Bakery", dietary_type: "Veg", price: 220, prep_time_minutes: 12, calories: 420, ingredients: "Chocolate, Butter, Flour, Vanilla Ice Cream", tags: "decadent, bestseller", spiciness: "Low" },
  { dish_id: "DSH-175", name: "New York Cheesecake", category: "Desserts", cuisine: "Bakery", dietary_type: "Veg", price: 280, prep_time_minutes: 5, calories: 450, ingredients: "Cream Cheese, Graham Crust, Berry Compote", tags: "creamy, gourmet", spiciness: "Low" },
  { dish_id: "DSH-176", name: "Tiramisu", category: "Desserts", cuisine: "Italian", dietary_type: "Veg", price: 290, prep_time_minutes: 5, calories: 380, ingredients: "Ladyfingers, Espresso, Mascarpone Cheese, Cocoa Powder", tags: "coffee, classic", spiciness: "Low" },
  { dish_id: "DSH-177", name: "Sizzling Brownie with Ice Cream", category: "Desserts", cuisine: "Bakery", dietary_type: "Veg", price: 250, prep_time_minutes: 8, calories: 520, ingredients: "Walnut Brownie, Vanilla Ice Cream, Hot Fudge Sauce", tags: "hot-and-cold, popular", spiciness: "Low" },
  { dish_id: "DSH-178", name: "Ice Cream Sundae (Triple Scoop)", category: "Desserts", cuisine: "Dessert", dietary_type: "Veg", price: 190, prep_time_minutes: 5, calories: 350, ingredients: "Vanilla, Chocolate, Strawberry, Nuts, Syrup", tags: "kids-favorite", spiciness: "Low" },
  { dish_id: "DSH-179", name: "Apple Pie with Ice Cream", category: "Desserts", cuisine: "Bakery", dietary_type: "Veg", price: 240, prep_time_minutes: 10, calories: 390, ingredients: "Apples, Cinnamon, Pie Crust, Vanilla Ice Cream", tags: "warm, classic", spiciness: "Low" },

  // Beverages & Drinks
  { dish_id: "DSH-180", name: "Mango Lassi", category: "Beverages & Drinks", cuisine: "Indian", dietary_type: "Veg", price: 130, prep_time_minutes: 5, calories: 220, ingredients: "Yogurt, Mango Pulp, Sugar, Cardamom", tags: "refreshing, sweet", spiciness: "Low" },
  { dish_id: "DSH-181", name: "Masala Chai", category: "Beverages & Drinks", cuisine: "Indian", dietary_type: "Veg", price: 60, prep_time_minutes: 5, calories: 90, ingredients: "Tea Leaves, Milk, Ginger, Cardamom, Sugar", tags: "hot, staple", spiciness: "Low" },
  { dish_id: "DSH-182", name: "Cold Coffee with Ice Cream", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Veg", price: 180, prep_time_minutes: 6, calories: 290, ingredients: "Espresso, Milk, Vanilla Ice Cream, Chocolate Syrup", tags: "chilled, popular", spiciness: "Low" },
  { dish_id: "DSH-183", name: "Fresh Lime Soda (Sweet & Salt)", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Vegan", price: 100, prep_time_minutes: 4, calories: 110, ingredients: "Lime Juice, Soda, Sugar, Salt, Mint", tags: "refreshing, fizzy", spiciness: "Low" },
  { dish_id: "DSH-184", name: "Classic Mojito", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Vegan", price: 190, prep_time_minutes: 5, calories: 140, ingredients: "Mint Leaves, Lime, Sugar, Soda, Crushed Ice", tags: "mocktail, chilled", spiciness: "Low" },
  { dish_id: "DSH-185", name: "Virgin Pina Colada", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Vegan", price: 210, prep_time_minutes: 6, calories: 230, ingredients: "Pineapple Juice, Coconut Cream, Crushed Ice", tags: "tropical, creamy", spiciness: "Low" },
  { dish_id: "DSH-186", name: "Iced Peach Tea", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Vegan", price: 140, prep_time_minutes: 4, calories: 120, ingredients: "Black Tea, Peach Syrup, Ice, Lemon", tags: "chilled, refreshing", spiciness: "Low" },
  { dish_id: "DSH-187", name: "Oreo Milkshake", category: "Beverages & Drinks", cuisine: "Beverage", dietary_type: "Veg", price: 200, prep_time_minutes: 6, calories: 420, ingredients: "Oreo Biscuits, Milk, Vanilla Ice Cream, Chocolate Syrup", tags: "rich, kids-favorite", spiciness: "Low" }
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

const initialIngredients = [
  { name: "Paneer Fresh", category: "Dairy & Oils", quantity: 25, unit: "kg", minThreshold: 5, maxCapacity: 50 },
  { name: "Chicken Fresh Fillet", category: "Meat & Seafood", quantity: 35, unit: "kg", minThreshold: 10, maxCapacity: 80 },
  { name: "Basmati Rice Premium", category: "Pantry", quantity: 45, unit: "kg", minThreshold: 10, maxCapacity: 100 },
  { name: "Butter & Cream", category: "Dairy & Oils", quantity: 18, unit: "kg", minThreshold: 5, maxCapacity: 40 },
  { name: "Tomatoes & Fresh Herbs", category: "Produce", quantity: 30, unit: "kg", minThreshold: 8, maxCapacity: 60 },
  { name: "Garlic & Ginger", category: "Produce", quantity: 12, unit: "kg", minThreshold: 3, maxCapacity: 25 },
  { name: "Mozzarella Cheese", category: "Dairy & Oils", quantity: 15, unit: "kg", minThreshold: 4, maxCapacity: 30 },
  { name: "Tea & Spices", category: "Beverages & Teas", quantity: 8, unit: "kg", minThreshold: 2, maxCapacity: 20 }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aura';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Category.deleteMany({});
    await Menu.deleteMany({});
    await Table.deleteMany({});
    await User.deleteMany({});
    await Ingredient.deleteMany({});
    await Order.deleteMany({});

    console.log('Seeding categories...');
    await Category.insertMany(categories);

    console.log('Seeding menu items from PDF dataset...');
    const insertedMenu = await Menu.insertMany(menuItems);
    console.log(`Successfully seeded ${insertedMenu.length} menu items!`);

    console.log('Seeding tables...');
    await Table.insertMany(tables);

    console.log('Seeding ingredients...');
    await Ingredient.insertMany(initialIngredients);

    console.log('Creating default system accounts...');
    
    // Create admin user
    const admin = new User({
      name: "AURA Admin",
      email: "admin@auradining.in",
      password: "AdminPassword123",
      role: "admin",
      provider: "local"
    });
    await admin.save();
    console.log('Created Admin account (admin@auradining.in / AdminPassword123)');

    // Create Manager user
    const manager = new User({
      name: "AURA Manager",
      email: "manager@auradining.in",
      password: "ManagerPassword123",
      role: "manager",
      provider: "local"
    });
    await manager.save();
    console.log('Created Manager account (manager@auradining.in / ManagerPassword123)');

    // Create Chef user
    const chef = new User({
      name: "Executive Chef Mario",
      email: "chef@auradining.in",
      password: "ChefPassword123",
      role: "chef",
      provider: "local"
    });
    await chef.save();
    console.log('Created Chef account (chef@auradining.in / ChefPassword123)');

    // Create Cashier user
    const cashier = new User({
      name: "Lead Cashier Sarah",
      email: "cashier@auradining.in",
      password: "CashierPassword123",
      role: "cashier",
      provider: "local"
    });
    await cashier.save();
    console.log('Created Cashier account (cashier@auradining.in / CashierPassword123)');

    // Create regular customer user
    const customer = new User({
      name: "AURA Customer",
      email: "customer@auradining.in",
      password: "CustomerPassword123",
      role: "customer",
      provider: "local"
    });
    await customer.save();
    console.log('Created Customer account (customer@auradining.in / CustomerPassword123)');

    console.log('Seeding 31 ingredients from PDF dataset...');
    await Ingredient.deleteMany({});
    await Ingredient.insertMany([
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
    ]);

    console.log('Database Seeding Completed Successfully! 🌱');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
