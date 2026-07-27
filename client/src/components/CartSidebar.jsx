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
    <aside className="order-sidebar" id="order-section" style={{ minWidth: '340px' }}>
      <div 
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6EAF8',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 30px rgba(30, 58, 95, 0.08)',
          color: '#111827'
        }}
      >
        {/* Sidebar Header */}
        <div style={{ background: '#1E3A5F', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', boxShadow: '0 4px 15px rgba(30, 58, 95, 0.2)' }}>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-receipt" style={{ color: '#F97316', fontSize: '18px' }}></i> 
            Table #0{isLoggedIn ? tableNum : '8'} Live Cart
          </div>
          <span style={{ fontSize: '11px', background: '#F97316', color: '#FFFFFF', padding: '4px 10px', borderRadius: '12px', fontWeight: 900 }}>
            {totalCount} ITEMS
          </span>
        </div>

        {/* Cart Items List */}
        <div className="order-items-list" id="cart-items" style={{ marginBottom: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#1E3A5F', background: '#F8FAFC', borderRadius: '16px', border: '1.5px dashed #CBD5E1' }}>
              <i className="fa-solid fa-basket-shopping" style={{ fontSize: '44px', color: '#F97316', marginBottom: '12px', display: 'block' }}></i>
              <div style={{ fontWeight: 900, fontSize: '15px', color: '#1E3A5F', marginBottom: '4px' }}>Your table cart is empty</div>
              <div style={{ fontSize: '13px', color: '#4B5563', fontWeight: 600 }}>Select delicious dishes from the menu to start ordering!</div>
            </div>
          ) : (
            cart.map((item) => {
              const isYou = item.addedBy === customerName;
              return (
                <div 
                  key={item.menuItemId} 
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #D6EAF8',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827', marginBottom: '4px' }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{
                          background: isYou ? '#F97316' : '#1E3A5F',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {item.addedBy}
                      </span>
                      <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 700 }}>
                        {formatPrice(item.price)} each
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#D6EAF8',
                        border: '1px solid #93C5FD',
                        borderRadius: '20px',
                        padding: '4px 10px'
                      }}
                    >
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, -1)}
                        style={{ background: 'none', border: 'none', color: '#1E3A5F', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', fontWeight: 900 }}
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <span style={{ color: '#1E3A5F', fontWeight: 900, fontSize: '14px', minWidth: '18px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, 1)}
                        style={{ background: 'none', border: 'none', color: '#1E3A5F', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', fontWeight: 900 }}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#F97316', whiteSpace: 'nowrap' }}>
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
            background: '#F8FAFC',
            border: '2px solid #D6EAF8',
            borderRadius: '16px',
            padding: '18px',
            color: '#111827'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#4B5563', fontWeight: 700 }}>
            <span>Subtotal</span>
            <span style={{ color: '#1E3A5F', fontWeight: 900 }}>{formatPrice(subtotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563', fontWeight: 700 }}>
            <span>Service & Taxes (10%)</span>
            <span style={{ color: '#1E3A5F', fontWeight: 900 }}>{formatPrice(tax)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '2px solid #D6EAF8', marginTop: '8px' }}>
            <span style={{ fontSize: '17px', fontWeight: 900, color: '#1E3A5F' }}>Total Bill</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#F97316' }}>{formatPrice(total)}</span>
          </div>

          <button 
            onClick={onPlaceOrder}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '16px',
              marginTop: '16px',
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
              transition: 'all 0.2s ease'
            }} 
          >
            <i className="fa-solid fa-paper-plane"></i> Send Order to Kitchen
          </button>

          <button 
            onClick={() => onSplitBill(total)}
            style={{
              width: '100%',
              background: '#1E3A5F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '12px',
              marginTop: '10px',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 3px 12px rgba(30, 58, 95, 0.2)'
            }} 
          >
            <i className="fa-solid fa-calculator"></i> Split Bill per Person
          </button>
        </div>
      </div>

      {/* AI Sommelier Card */}
      <div 
        style={{
          background: '#D6EAF8',
          border: '2px solid #93C5FD',
          borderRadius: '20px',
          padding: '18px',
          marginTop: '16px',
          boxShadow: '0 4px 15px rgba(30, 58, 95, 0.08)',
          color: '#111827'
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E3A5F', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#F97316' }}></i> AI Smart Sommelier
        </div>
        <div style={{ fontSize: '12px', color: '#1E3A5F', lineHeight: '1.4', marginBottom: '14px', fontWeight: 700 }}>
          Recommends perfect beverage pairings based on your active table selections.
        </div>
        <button 
          onClick={onGetRecommendation}
          style={{
            width: '100%',
            background: '#1E3A5F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)'
          }} 
        >
          <i className="fa-solid fa-wine-glass" style={{ color: '#F97316' }}></i> Suggest Wine & Cocktail Pairing
        </button>
      </div>
    </aside>
  );
}
