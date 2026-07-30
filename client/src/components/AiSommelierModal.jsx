import React from 'react';

export default function AiSommelierModal({ isOpen, onClose, cart, menuItems, onAddToCart, formatPrice }) {
  if (!isOpen) return null;

  // Generate pairing recommendations based on items in cart
  const getPairings = () => {
    const defaultPairings = [
      {
        id: 'DSH-204',
        name: 'Classic Mojito',
        category: 'Beverages & Drinks',
        price: 190,
        type: 'Cocktail Mocktail',
        icon: 'fa-solid fa-glass-citrus',
        reason: 'Fresh mint and zesty lime perfectly balance rich appetizers and spicy starters.',
        badge: 'Top Refreshing Choice'
      },
      {
        id: 'DSH-207',
        name: 'Signature AURA Mocktail',
        category: 'Beverages & Drinks',
        price: 220,
        type: 'Signature Drink',
        icon: 'fa-solid fa-martini-glass-citrus',
        reason: 'Tropical passion fruit and citrus notes complement Tandoori & Paneer delicacies.',
        badge: 'House Specialty'
      },
      {
        id: 'DSH-202',
        name: 'Cold Coffee with Ice Cream',
        category: 'Beverages & Drinks',
        price: 180,
        type: 'Chilled Coffee',
        icon: 'fa-solid fa-mug-hot',
        reason: 'Creamy espresso shake pairs wonderfully with desserts and burgers.',
        badge: 'Customer Favorite'
      }
    ];

    if (!cart || cart.length === 0) return defaultPairings;

    // Analyze cart contents
    const cartCategories = cart.map(item => (item.category || '').toLowerCase());
    const cartNames = cart.map(item => (item.name || '').toLowerCase()).join(' ');

    const pairings = [];

    // Spice or Indian starters / Main course
    if (cartCategories.some(c => c.includes('indian') || c.includes('starter')) || cartNames.includes('tikka') || cartNames.includes('paneer') || cartNames.includes('biryani')) {
      pairings.push({
        id: 'DSH-204',
        name: 'Classic Mojito',
        category: 'Beverages & Drinks',
        price: 190,
        type: 'Zesty Refresher',
        icon: 'fa-solid fa-glass-citrus',
        reason: 'Crisp mint and crushed ice instantly cool down spicy Tandoori & Biryani spices.',
        badge: '🌶️ Spicy Food Pairing'
      });
    }

    // Italian / Pasta / Pizza
    if (cartCategories.some(c => c.includes('italian')) || cartNames.includes('pizza') || cartNames.includes('pasta') || cartNames.includes('penne')) {
      pairings.push({
        id: 'DSH-207',
        name: 'Signature AURA Mocktail',
        category: 'Beverages & Drinks',
        price: 220,
        type: 'Fruity Infusion',
        icon: 'fa-solid fa-martini-glass-citrus',
        reason: 'Passion fruit acidity cuts through rich cheesy mozzarella & creamy Alfredo sauce.',
        badge: '🍕 Italian Pairing'
      });
    }

    // Chinese / Asian / Noodles / Fried Rice
    if (cartCategories.some(c => c.includes('chinese') || c.includes('asian')) || cartNames.includes('noodle') || cartNames.includes('rice') || cartNames.includes('corn')) {
      pairings.push({
        id: 'DSH-203',
        name: 'Fresh Lime Soda (Sweet & Salt)',
        category: 'Beverages & Drinks',
        price: 100,
        type: 'Fizzy Cleanser',
        icon: 'fa-solid fa-wine-glass',
        reason: 'Fizzy citrus palate cleanser that complements soya sauce and stir-fried flavors.',
        badge: '🥢 Asian Pairing'
      });
    }

    // Desserts
    if (cartCategories.some(c => c.includes('dessert')) || cartNames.includes('brownie') || cartNames.includes('jamun') || cartNames.includes('cake')) {
      pairings.push({
        id: 'DSH-208',
        name: 'Hot Chocolate (Belgian)',
        category: 'Beverages & Drinks',
        price: 160,
        type: 'Rich Beverage',
        icon: 'fa-solid fa-mug-saucer',
        reason: 'Silky warm dark Belgian chocolate enhances cakes, ice creams, and sweet treats.',
        badge: '🍰 Dessert Companion'
      });
    }

    // Fallback if less than 2 matched
    if (pairings.length < 2) {
      return defaultPairings;
    }

    return pairings;
  };

  const pairings = getPairings();

  return (
    <div 
      className="modal-overlay active" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        style={{
          width: '92%',
          maxWidth: '520px',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(30, 58, 95, 0.25)',
          border: '2px solid #D6EAF8',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#111827'
        }}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#D6EAF8',
            border: 'none',
            color: '#1E3A5F',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900
          }}
          title="Close Sommelier"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)', borderRadius: '18px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', boxShadow: '0 6px 20px rgba(30,58,95,0.3)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '24px', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF' }}>
              AI Smart Sommelier
            </h3>
            <span style={{ fontSize: '12px', color: '#D6EAF8', fontWeight: 700, marginTop: '2px', display: 'block' }}>
              Curated Beverage & Cocktail Pairings for your active cart
            </span>
          </div>
        </div>

        {/* Recommendations list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {pairings.map((drink) => (
            <div 
              key={drink.id}
              style={{
                background: '#F8FAFC',
                border: '2px solid #D6EAF8',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#D6EAF8', color: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className={drink.icon}></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 900, background: '#1E3A5F', color: '#FFF', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {drink.badge}
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>
                      {drink.name}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#F97316' }}>
                  {formatPrice ? formatPrice(drink.price) : `₹${drink.price}`}
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', fontWeight: 700, lineHeight: '1.4', background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10B981', marginRight: '6px' }}></i>
                {drink.reason}
              </p>

              <button 
                onClick={() => {
                  const menuItemToCart = (menuItems || []).find(m => m._id === drink.id || m.dish_id === drink.id) || {
                    _id: drink.id,
                    dish_id: drink.id,
                    name: drink.name,
                    price: drink.price,
                    category: drink.category
                  };
                  onAddToCart(menuItemToCart);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                  marginTop: '4px'
                }}
              >
                <i className="fa-solid fa-cart-plus"></i> Add {drink.name} to Cart
              </button>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
          🍷 Powered by AURA Smart Dining Beverage Intelligence Engine
        </div>

      </div>
    </div>
  );
}
