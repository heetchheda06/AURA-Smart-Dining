import React from 'react';

export default function CategoryFilters({ activeCategory, onSelectCategory }) {
  const categories = [
    { id: 'all', name: "Chef's Specials", icon: 'fa-solid fa-fire' },
    { id: 'mains', name: "Prime Mains", icon: 'fa-solid fa-drumstick-bite' },
    { id: 'sushi', name: "Artisanal Sushi", icon: 'fa-solid fa-fish' },
    { id: 'cocktails', name: "Craft Cocktails", icon: 'fa-solid fa-martini-glass-citrus' },
    { id: 'desserts', name: "Decadent Desserts", icon: 'fa-solid fa-cake-candles' }
  ];

  return (
    <section className="categories-wrapper">
      <div className="category-scroll" id="category-bar">
        {categories.map((cat) => (
          <button 
            key={cat.id}
            className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <i className={cat.icon}></i> {cat.name}
          </button>
        ))}
      </div>
    </section>
  );
}
