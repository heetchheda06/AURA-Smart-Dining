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
      <div className="sidebar-card glass">
        <div className="order-header">
          <div className="order-title">
            <i className="fa-solid fa-receipt" style={{ color: 'var(--primary)' }}></i> Table #0{isLoggedIn ? tableNum : '8'} Shared Order
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
            LIVE
          </span>
        </div>

        <div className="order-items-list" id="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <i className="fa-solid fa-basket-shopping" style={{ fontSize: '32px', color: 'var(--text-dim)', marginBottom: '12px', display: 'block' }}></i>
              Your table cart is empty. Select items from the menu to start!
            </div>
          ) : (
            cart.map((item) => {
              const isYou = item.addedBy === customerName;
              return (
                <div key={item.menuItemId} className="order-item">
                  <div className="order-item-info">
                    <div className="order-item-name">{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span 
                        className="order-item-user-tag" 
                        style={{
                          background: isYou ? 'rgba(255,159,28,0.15)' : 'rgba(139,92,246,0.15)',
                          color: isYou ? 'var(--primary)' : '#C4B5FD'
                        }}
                      >
                        {item.addedBy}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {formatPrice(item.price)} each
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => onUpdateQty(item.menuItemId, -1)}>
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <span>{item.qty}</span>
                      <button className="qty-btn" onClick={() => onUpdateQty(item.menuItemId, 1)}>
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    <div className="order-item-price">{formatPrice(item.price * item.qty)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="order-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span id="subtotal-val">{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Service & Taxes (10%)</span>
            <span id="tax-val">{formatPrice(tax)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total Bill</span>
            <span id="total-val" style={{ color: 'var(--primary)' }}>{formatPrice(total)}</span>
          </div>

          <button 
            className="btn-action btn-primary-action" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '14px' }} 
            onClick={onPlaceOrder}
          >
            <i className="fa-solid fa-paper-plane"></i> Send Order to Kitchen
          </button>
          <button 
            className="btn-action" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', fontSize: '12px' }} 
            onClick={() => onSplitBill(total)}
          >
            <i className="fa-solid fa-calculator"></i> Split Bill per Person
          </button>
        </div>
      </div>

      {/* AI Sommelier & Pairings */}
      <div className="sommelier-card">
        <div className="sommelier-title">
          <i className="fa-solid fa-wand-magic-sparkles"></i> AI Smart Sommelier
        </div>
        <div className="sommelier-desc">
          Recommends perfect beverage pairings based on your active table selections.
        </div>
        <button 
          className="btn-action" 
          style={{ width: '100%', justifyContent: 'center', fontSize: '12px', borderColor: 'rgba(139,92,246,0.4)', color: '#C4B5FD' }} 
          onClick={onGetRecommendation}
        >
          <i className="fa-solid fa-wine-glass"></i> Suggest Wine & Cocktail Pairing
        </button>
      </div>
    </aside>
  );
}
