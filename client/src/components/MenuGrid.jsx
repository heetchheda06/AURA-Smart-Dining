import React, { useState, useMemo } from 'react';

// Official Food Category Badges
const VegIcon = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', border: '2px solid #10B981', borderRadius: '4px', padding: '2px', background: 'rgba(16, 185, 129, 0.15)', verticalAlign: 'middle' }} title="100% Vegetarian">
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
  </span>
);

const NonVegIcon = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', border: '2px solid #EF4444', borderRadius: '4px', padding: '2px', background: 'rgba(239, 68, 68, 0.15)', verticalAlign: 'middle' }} title="Non-Vegetarian">
    <span style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #EF4444' }}></span>
  </span>
);

const VeganIcon = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', border: '2px solid #059669', borderRadius: '4px', padding: '2px', background: 'rgba(5, 150, 105, 0.15)', color: '#34D399', fontSize: '11px', verticalAlign: 'middle' }} title="100% Plant-Based Vegan">
    🌿
  </span>
);

export default function MenuGrid({ 
  menuItems, 
  searchTerm, 
  onSearchChange, 
  onAddToCart,
  formatPrice
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [dietaryFilter, setDietaryFilter] = useState('All'); // 'All', 'Veg', 'Non-Veg', 'Vegan'

  // Generate a random stable set of 10 Today's Specials (Veg, Non-Veg, Vegan mix)
  const todaysSpecials = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    
    const vegItems = menuItems.filter(item => item.dietary_type === 'Veg');
    const nonVegItems = menuItems.filter(item => item.dietary_type === 'Non-Veg');
    const veganItems = menuItems.filter(item => item.dietary_type === 'Vegan');

    // Pick 4 Veg, 4 Non-Veg, 2 Vegan for a total of 10 Today's Specials
    const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());
    const selVeg = shuffle(vegItems).slice(0, 4);
    const selNonVeg = shuffle(nonVegItems).slice(0, 4);
    const selVegan = shuffle(veganItems).slice(0, 2);

    return [...selVeg, ...selNonVeg, ...selVegan];
  }, [menuItems]);

  const specialIds = useMemo(() => new Set(todaysSpecials.map(s => s._id || s.dish_id)), [todaysSpecials]);

  // Extract unique categories and cuisines
  const categories = ['All', '🔥 Today\'s Special', ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)))];
  const cuisines = ['All', ...Array.from(new Set(menuItems.map(item => item.cuisine).filter(Boolean)))];

  const filteredItems = useMemo(() => {
    // If Today's Special is selected, show ONLY the 10 special items!
    let itemsToFilter = selectedCategory === '🔥 Today\'s Special' ? todaysSpecials : menuItems;

    return itemsToFilter.filter(item => {
      // Search matching
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.ingredients && item.ingredients.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.cuisine && item.cuisine.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category matching
      const matchesCategory = selectedCategory === 'All' || selectedCategory === '🔥 Today\'s Special' || item.category === selectedCategory;

      // Cuisine matching
      const matchesCuisine = selectedCuisine === 'All' || item.cuisine === selectedCuisine;

      // Dietary type matching
      const matchesDiet = dietaryFilter === 'All' || 
        (dietaryFilter === 'Veg' && (item.dietary_type === 'Veg' || item.dietary_type === 'Vegan')) ||
        (dietaryFilter === 'Non-Veg' && item.dietary_type === 'Non-Veg') ||
        (dietaryFilter === 'Vegan' && item.dietary_type === 'Vegan');

      return matchesSearch && matchesCategory && matchesCuisine && matchesDiet;
    });
  }, [menuItems, todaysSpecials, selectedCategory, selectedCuisine, dietaryFilter, searchTerm]);

  return (
    <section style={{ marginTop: '24px', paddingTop: '8px' }}>
      {/* Search and Main Header */}
      <div className="section-header" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="section-title" style={{ fontSize: '26px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-book-open" style={{ color: 'var(--primary)' }}></i> Restaurant Menu
          {selectedCategory === '🔥 Today\'s Special' && (
            <span style={{ fontSize: '13px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFF', padding: '4px 12px', borderRadius: '20px', fontWeight: 800 }}>
              🔥 10 TODAY'S SPECIAL DISHES
            </span>
          )}
        </h2>
        
        <div className="search-bar" style={{ minWidth: '280px', flex: '1 1 300px', maxWidth: '450px' }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text" 
            id="search-input" 
            placeholder="Search dish, ingredients, cuisine..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* FILTER BAR 1: Dietary Toggle (Veg vs Non-Veg vs Vegan with Visual Icons) */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <i className="fa-solid fa-filter"></i> Dietary Filter:
        </span>
        <button 
          className={`filter-btn ${dietaryFilter === 'All' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('All')}
          style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}
        >
          All Items ({menuItems.length})
        </button>
        <button 
          className={`filter-btn ${dietaryFilter === 'Veg' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('Veg')}
          style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, borderColor: '#10B981', color: dietaryFilter === 'Veg' ? '#FFF' : '#10B981', background: dietaryFilter === 'Veg' ? '#10B981' : 'rgba(16,185,129,0.1)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <VegIcon /> Veg Category
        </button>
        <button 
          className={`filter-btn ${dietaryFilter === 'Non-Veg' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('Non-Veg')}
          style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, borderColor: '#EF4444', color: dietaryFilter === 'Non-Veg' ? '#FFF' : '#EF4444', background: dietaryFilter === 'Non-Veg' ? '#EF4444' : 'rgba(239,68,68,0.1)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <NonVegIcon /> Non-Veg Category
        </button>
        <button 
          className={`filter-btn ${dietaryFilter === 'Vegan' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('Vegan')}
          style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, borderColor: '#059669', color: dietaryFilter === 'Vegan' ? '#FFF' : '#34D399', background: dietaryFilter === 'Vegan' ? '#059669' : 'rgba(5,150,105,0.1)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <VeganIcon /> Vegan Category
        </button>
      </div>

      {/* FILTER BAR 2: Category Filter Tabs (Includes 🔥 Today's Special) */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>Category:</div>
        <div className="categories-scroll" style={{ paddingBottom: '6px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {categories.map((cat) => {
            const isSpecial = cat === '🔥 Today\'s Special';
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  fontSize: '12px', 
                  padding: '7px 16px',
                  background: isSpecial 
                    ? (isActive ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(245, 158, 11, 0.15)') 
                    : undefined,
                  borderColor: isSpecial ? '#F59E0B' : undefined,
                  color: isSpecial ? (isActive ? '#FFF' : '#FCD34D') : undefined,
                  fontWeight: isSpecial || isActive ? 800 : 600,
                  boxShadow: isSpecial && isActive ? '0 0 14px rgba(245, 158, 11, 0.5)' : undefined
                }}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER BAR 3: Cuisine Filter Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>Cuisine:</div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          {cuisines.map((cui) => (
            <button
              key={cui}
              onClick={() => setSelectedCuisine(cui)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: selectedCuisine === cui ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                background: selectedCuisine === cui ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                color: selectedCuisine === cui ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🌍 {cui}
            </button>
          ))}
        </div>
      </div>

      {/* DISH CARD GRID */}
      <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '60px', gridColumn: '1/-1', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px border-glass' }}>
            <i className="fa-solid fa-utensils" style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}></i>
            <div>No matching dishes found in this category. Try clearing filters.</div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isVeg = item.dietary_type === 'Veg';
            const isVegan = item.dietary_type === 'Vegan';
            const isNonVeg = item.dietary_type === 'Non-Veg';
            const isTodaySpecial = specialIds.has(item._id || item.dish_id);

            const borderCol = isTodaySpecial ? '#F59E0B' : isVeg ? '#10B981' : isVegan ? '#059669' : '#EF4444';
            const cardBg = isTodaySpecial 
              ? 'linear-gradient(145deg, #FFFBEB 0%, #FFFFFF 100%)' 
              : isVeg 
              ? 'linear-gradient(145deg, #FFFFFF 0%, #F0FDF4 100%)' 
              : isVegan 
              ? 'linear-gradient(145deg, #FFFFFF 0%, #ECFDF5 100%)' 
              : 'linear-gradient(145deg, #FFFFFF 0%, #FEF2F2 100%)';

            const cardShadow = isTodaySpecial
              ? '0 0 25px rgba(245, 158, 11, 0.45), 0 8px 24px rgba(245, 158, 11, 0.25)'
              : isVeg
              ? '0 6px 20px rgba(16, 185, 129, 0.12)'
              : isVegan
              ? '0 6px 20px rgba(5, 150, 105, 0.12)'
              : '0 6px 20px rgba(239, 68, 68, 0.12)';

            return (
              <div 
                key={item._id || item.dish_id} 
                style={{ 
                  borderRadius: '16px', 
                  padding: '18px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: `2px solid ${borderCol}`,
                  background: cardBg,
                  boxShadow: cardShadow,
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Today's Special Yellow Gold Ribbon with Glow */}
                {isTodaySpecial && (
                  <div style={{ position: 'absolute', top: '-12px', right: '14px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFF', fontSize: '10px', fontWeight: 900, padding: '4px 12px', borderRadius: '20px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.5), 0 0 10px #F59E0B', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', zIndex: 2 }}>
                    <i className="fa-solid fa-fire"></i> TODAY'S SPECIAL
                  </div>
                )}

                <div>
                  {/* Top Category Badge Row with Visual Symbol Icons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {/* Visual Veg/NonVeg/Vegan Symbol Badge */}
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '11px', 
                        fontWeight: 800, 
                        color: isVeg ? '#065F46' : isVegan ? '#064E3B' : '#991B1B', 
                        background: isVeg ? '#DCFCE7' : isVegan ? '#D1FAE5' : '#FEE2E2', 
                        border: `1.5px solid ${isVeg ? '#10B981' : isVegan ? '#059669' : '#EF4444'}`,
                        padding: '3px 9px', 
                        borderRadius: '8px' 
                      }}>
                        {isVeg && <VegIcon />}
                        {isNonVeg && <NonVegIcon />}
                        {isVegan && <VeganIcon />}
                        <span>{item.dietary_type}</span>
                      </span>

                      {/* Cuisine Badge */}
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: '#334155', 
                        background: '#E2E8F0', 
                        border: '1px solid #CBD5E1',
                        padding: '3px 8px', 
                        borderRadius: '6px' 
                      }}>
                        {item.cuisine || 'Indian'}
                      </span>
                    </div>

                    {/* Dish ID */}
                    <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
                      {item.dish_id || 'DSH'}
                    </span>
                  </div>

                  {/* Dish Name & Price Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1E3A5F', margin: 0, lineHeight: '1.3' }}>
                      {item.name}
                    </h3>
                    <div style={{ fontSize: '19px', fontWeight: 800, color: '#1E3A5F', whiteSpace: 'nowrap' }}>
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  {/* Category Subtitle */}
                  <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '12px', fontWeight: 700 }}>
                    <i className="fa-solid fa-layer-group" style={{ marginRight: '4px', color: '#1E3A5F' }}></i>
                    {item.category}
                  </div>

                  {/* Ingredients Used Section */}
                  <div style={{ 
                    background: '#FFFFFF', 
                    border: '1px solid rgba(30, 58, 95, 0.15)', 
                    borderRadius: '10px', 
                    padding: '10px 12px', 
                    marginBottom: '14px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#F97316', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-wheat-awn" style={{ color: '#F97316' }}></i> Ingredients Used:
                    </div>
                    <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4', fontWeight: 500 }}>
                      {item.ingredients || item.desc || "Fresh seasonal produce, signature herbs and spices."}
                    </div>
                  </div>
                </div>

                {/* Footer Details & Add Button */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(30,58,95,0.12)' }}>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#4B5563', fontWeight: 600 }}>
                      <span><i className="fa-regular fa-clock"></i> {item.prep_time_minutes || 15} min</span>
                      {item.calories && <span><i className="fa-solid fa-fire"></i> {item.calories} kcal</span>}
                      {item.spiciness && (
                        <span style={{ color: item.spiciness === 'High' ? '#DC2626' : '#059669', fontWeight: 700 }}>
                          <i className="fa-solid fa-pepper-hot"></i> {item.spiciness}
                        </span>
                      )}
                    </div>

                    <button 
                      className="btn-add-item" 
                      onClick={() => onAddToCart(item._id || item.dish_id)} 
                      title="Add to Cart"
                      style={{
                        background: 'linear-gradient(135deg, #1E3A5F, #2A4D7C)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)',
                        transition: 'all 0.2s ease',
                        width: 'auto',
                        height: 'auto'
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Add Item
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
