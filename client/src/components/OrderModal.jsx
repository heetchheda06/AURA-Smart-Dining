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
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        pointerEvents: 'all'
      }}
    >
      <div 
        style={{ 
          width: '92%', 
          maxWidth: '540px', 
          padding: '28px', 
          borderRadius: '24px', 
          position: 'relative', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          background: '#FFFFFF',
          border: '2px solid #D6EAF8',
          boxShadow: '0 20px 60px rgba(30, 58, 95, 0.15)',
          color: '#111827'
        }}
      >
        {/* Modal Close Button */}
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
            fontWeight: 900,
            transition: 'all 0.2s ease'
          }}
          title="Close Order Modal"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div style={{ background: '#1E3A5F', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(30,58,95,0.2)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.4)' }}>
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF' }}>
              Table #0{isLoggedIn ? tableNum : '8'} Shared Order
            </h3>
            <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#065F46', border: '1px solid #6EE7B7', padding: '2px 8px', borderRadius: '10px', fontWeight: 900, display: 'inline-block', marginTop: '4px' }}>
              ● LIVE SYNCED TABLE CART ({totalCount} items selected)
            </span>
          </div>
        </div>

        {/* Order Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#1E3A5F', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #D6EAF8' }}>
              <i className="fa-solid fa-basket-shopping" style={{ fontSize: '48px', color: '#F97316', marginBottom: '12px', display: 'block' }}></i>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E3A5F' }}>Your table cart is empty</div>
              <div style={{ fontSize: '13px', marginTop: '4px', color: '#4B5563', fontWeight: 700 }}>Select delicious dishes from the menu to start ordering!</div>
            </div>
          ) : (
            cart.map((item) => {
              const isYou = item.addedBy === customerName;
              return (
                <div key={item.menuItemId} style={{ background: '#F8FAFC', border: '1.5px solid #D6EAF8', borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '15px', color: '#111827' }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 900,
                        padding: '3px 8px', 
                        borderRadius: '6px',
                        background: isYou ? '#F97316' : '#1E3A5F',
                        color: '#FFFFFF'
                      }}>
                        {item.addedBy}
                      </span>
                      <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 700 }}>
                        {formatPrice(item.price)} each
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#D6EAF8', border: '1px solid #93C5FD', borderRadius: '20px', padding: '4px 10px' }}>
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, -1)} 
                        style={{ background: 'none', border: 'none', color: '#1E3A5F', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', fontWeight: 900 }}
                        title="Reduce quantity"
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <span style={{ fontWeight: 900, fontSize: '14px', color: '#1E3A5F', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, 1)} 
                        style={{ background: 'none', border: 'none', color: '#1E3A5F', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', fontWeight: 900 }}
                        title="Increase quantity"
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>

                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#F97316', minWidth: '65px', textAlign: 'right' }}>
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Summary */}
        <div style={{ background: '#F8FAFC', borderRadius: '18px', padding: '20px', marginBottom: '20px', border: '2px solid #D6EAF8', color: '#111827' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4B5563', fontWeight: 800, marginBottom: '8px' }}>
            <span>Subtotal</span>
            <span style={{ color: '#1E3A5F', fontWeight: 900 }}>{formatPrice(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4B5563', fontWeight: 800, marginBottom: '12px' }}>
            <span>Service & Taxes (10%)</span>
            <span style={{ color: '#1E3A5F', fontWeight: 900 }}>{formatPrice(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 900, color: '#1E3A5F', paddingTop: '12px', borderTop: '2px solid #D6EAF8' }}>
            <span>Total Bill</span>
            <span style={{ color: '#F97316', fontSize: '26px', fontWeight: 900 }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '18px', 
              fontSize: '16px', 
              fontWeight: 900,
              border: 'none',
              color: '#FFFFFF',
              background: cart.length === 0 ? '#CBD5E1' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: cart.length > 0 ? '0 6px 20px rgba(249,115,22,0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
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
          
        </div>

        {/* AI Sommelier Recommendations */}
        <div style={{ marginTop: '20px', background: '#D6EAF8', border: '2px solid #93C5FD', borderRadius: '18px', padding: '18px', color: '#111827' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E3A5F', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#F97316' }}></i> AI Smart Sommelier
          </div>
          <div style={{ fontSize: '12.5px', color: '#1E3A5F', marginBottom: '12px', fontWeight: 700, lineHeight: '1.4' }}>
            Recommends perfect beverage pairings based on your active table selections.
          </div>
          <button 
            style={{ width: '100%', justifyContent: 'center', fontSize: '13px', border: 'none', borderRadius: '14px', color: '#FFF', background: '#1E3A5F', fontWeight: 900, padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(30,58,95,0.2)' }} 
            onClick={onGetRecommendation}
          >
            <i className="fa-solid fa-wine-glass" style={{ color: '#F97316' }}></i> Suggest Wine & Cocktail Pairing
          </button>
        </div>

      </div>
    </div>
  );
}
