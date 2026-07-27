import React from 'react';

export default function CartSidebar({ 
  cart, 
  activeCustomerSession, 
  onUpdateQty, 
  onPlaceOrder, 
  onSplitBill, 
  onGetRecommendation, 
  formatPrice 
}) {
  const { isLoggedIn, customerName, tableNum } = activeCustomerSession;
  
  let subtotal = 0;
  let totalCount = 0;
  
  cart.forEach(item => {
    subtotal += item.price * item.qty;
    totalCount += item.qty;
  });

  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  return (
    <aside className="order-sidebar" id="order-section">
      <div 
        style={{
          background: '#0F172A',
          border: '2px solid #1E3A5F',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          color: '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-receipt" style={{ color: '#F97316' }}></i> 
            Table #0{isLoggedIn ? tableNum : '8'} Shared Order
          </div>
          <span style={{ fontSize: '11px', background: '#10B981', color: '#FFFFFF', padding: '3px 9px', borderRadius: '12px', fontWeight: 800 }}>
            LIVE ({totalCount} items)
          </span>
        </div>

        <div className="order-items-list" id="cart-items" style={{ marginBottom: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#CBD5E1' }}>
              <i className="fa-solid fa-basket-shopping" style={{ fontSize: '36px', color: '#F97316', marginBottom: '12px', display: 'block' }}></i>
              Your table cart is empty. Select items from the menu to start!
            </div>
          ) : (
            cart.map((item) => {
              const isYou = item.addedBy === customerName;
              return (
                <div 
                  key={item.menuItemId} 
                  style={{
                    background: '#1E293B',
                    border: '1.5px solid #334155',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{
                          background: isYou ? '#F97316' : '#8B5CF6',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {item.addedBy}
                      </span>
                      <span style={{ fontSize: '12px', color: '#E2E8F0', fontWeight: 600 }}>
                        {formatPrice(item.price)} each
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#0F172A',
                        border: '1px solid #475569',
                        borderRadius: '20px',
                        padding: '4px 10px'
                      }}
                    >
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, -1)}
                        style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '12px', padding: '2px 4px' }}
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '13px', minWidth: '16px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, 1)}
                        style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '12px', padding: '2px 4px' }}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#F59E0B', whiteSpace: 'nowrap' }}>
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Summary Container */}
        <div 
          style={{
            background: '#1E293B',
            border: '1.5px solid #334155',
            borderRadius: '16px',
            padding: '16px',
            color: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>
            <span>Subtotal</span>
            <span style={{ color: '#FFFFFF', fontWeight: 800 }}>{formatPrice(subtotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>
            <span>Service & Taxes (10%)</span>
            <span style={{ color: '#FFFFFF', fontWeight: 800 }}>{formatPrice(tax)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #334155', marginTop: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>Total Bill</span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#F59E0B' }}>{formatPrice(total)}</span>
          </div>

          <button 
            onClick={onPlaceOrder}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '14px',
              marginTop: '16px',
              fontSize: '15px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(249, 115, 22, 0.45)',
              transition: 'all 0.2s ease'
            }} 
          >
            <i className="fa-solid fa-paper-plane"></i> Send Order to Kitchen
          </button>

          <button 
            onClick={() => onSplitBill(total)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #1E3A5F, #2A4D7C)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '10px',
              marginTop: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(30, 58, 95, 0.3)'
            }} 
          >
            <i className="fa-solid fa-calculator"></i> Split Bill per Person
          </button>
        </div>
      </div>

      {/* AI Sommelier Card */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
          border: '1.5px solid #8B5CF6',
          borderRadius: '20px',
          padding: '18px',
          marginTop: '16px',
          boxShadow: '0 8px 25px rgba(139, 92, 246, 0.25)',
          color: '#FFFFFF'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#F59E0B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#8B5CF6' }}></i> AI Smart Sommelier
        </div>
        <div style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: '1.4', marginBottom: '14px' }}>
          Recommends perfect beverage pairings based on your active table selections.
        </div>
        <button 
          onClick={onGetRecommendation}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
          }} 
        >
          <i className="fa-solid fa-wine-glass"></i> Suggest Wine & Cocktail Pairing
        </button>
      </div>
    </aside>
  );
}
