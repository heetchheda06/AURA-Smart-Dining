import React from 'react';

export default function OrderModal({ 
  isOpen, 
  onClose, 
  cart, 
  activeCustomerSession, 
  onUpdateQty, 
  onPlaceOrder, 
  onSplitBill, 
  onGetRecommendation, 
  formatPrice 
}) {
  if (!isOpen) return null;

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
        background: 'rgba(10, 12, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        pointerEvents: 'all'
      }}
    >
      <div 
        className="modal-card glass" 
        style={{ 
          width: '92%', 
          maxWidth: '540px', 
          padding: '28px', 
          borderRadius: '24px', 
          position: 'relative', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          border: '1.5px solid rgba(255, 159, 28, 0.4)'
        }}
      >
        {/* Modal Close Button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            color: '#FFF', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            cursor: 'pointer', 
            fontSize: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '20px', boxShadow: '0 4px 15px rgba(245,158,11,0.4)' }}>
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFF', fontFamily: 'Playfair Display, serif' }}>
              Table #0{isLoggedIn ? tableNum : '8'} Shared Order
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 800, letterSpacing: '0.5px' }}>
              ● LIVE SYNCED TABLE CART ({totalCount} items selected)
            </span>
          </div>
        </div>

        {/* Order Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px border-glass' }}>
              <i className="fa-solid fa-basket-shopping" style={{ fontSize: '40px', color: 'var(--primary)', marginBottom: '14px', opacity: 0.8 }}></i>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>Your table cart is empty</div>
              <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>Select delicious dishes from the menu to start ordering!</div>
            </div>
          ) : (
            cart.map((item) => {
              const isYou = item.addedBy === customerName;
              return (
                <div key={item.menuItemId} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#FFF' }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 800,
                        padding: '3px 8px', 
                        borderRadius: '10px',
                        background: isYou ? 'rgba(255,159,28,0.2)' : 'rgba(139,92,246,0.2)',
                        color: isYou ? 'var(--primary)' : '#C4B5FD',
                        border: isYou ? '1px solid rgba(255,159,28,0.4)' : '1px solid rgba(139,92,246,0.4)'
                      }}>
                        {item.addedBy}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatPrice(item.price)} each
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="qty-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 12px' }}>
                      <button 
                        className="qty-btn" 
                        onClick={() => onUpdateQty(item.menuItemId, -1)} 
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}
                        title="Reduce quantity"
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: '#FFF', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                      <button 
                        className="qty-btn" 
                        onClick={() => onUpdateQty(item.menuItemId, 1)} 
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}
                        title="Increase quantity"
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)', minWidth: '65px', textAlign: 'right' }}>
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Summary */}
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '18px', padding: '18px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span>Service & Taxes (10%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#FFF', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
            <span>Total Bill</span>
            <span style={{ color: 'var(--primary)' }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            className="btn-action btn-primary-action" 
            style={{ 
              width: '100%', 
              justify: 'center', 
              padding: '16px', 
              borderRadius: '16px', 
              fontSize: '15px', 
              fontWeight: 800,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.6 : 1,
              boxShadow: cart.length > 0 ? '0 6px 20px rgba(255,159,28,0.4)' : 'none'
            }} 
            onClick={() => {
              if (cart.length > 0) {
                onPlaceOrder();
                onClose();
              }
            }}
            disabled={cart.length === 0}
          >
            <i className="fa-solid fa-paper-plane"></i> Send Order to Kitchen
          </button>
          
          <button 
            className="btn-action" 
            style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '14px', fontSize: '13px', background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: '#FFF', fontWeight: 700 }} 
            onClick={() => onSplitBill(total)}
            disabled={cart.length === 0}
          >
            <i className="fa-solid fa-calculator"></i> Split Bill per Person
          </button>
        </div>

        {/* AI Sommelier Recommendations */}
        <div style={{ marginTop: '20px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '18px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#C4B5FD', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-wand-magic-sparkles"></i> AI Smart Sommelier
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Recommends perfect beverage pairings based on your active table selections.
          </div>
          <button 
            className="btn-action" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', borderColor: 'rgba(139,92,246,0.4)', color: '#C4B5FD', background: 'rgba(139,92,246,0.18)', fontWeight: 700 }} 
            onClick={onGetRecommendation}
          >
            <i className="fa-solid fa-wine-glass"></i> Suggest Wine & Cocktail Pairing
          </button>
        </div>

      </div>
    </div>
  );
}
