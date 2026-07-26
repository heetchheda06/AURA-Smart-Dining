import React from 'react';

export default function TableFreedModal({ 
  isOpen, 
  onClose, 
  activeCustomerSession, 
  cart, 
  onTakeSeat 
}) {
  if (!isOpen) return null;

  const { customerName, tableNum, seats, zone } = activeCustomerSession;
  const preorderCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="modal-overlay active" id="table-freed-modal">
      <div className="modal-card glass" style={{ maxWidth: '500px', border: '2px solid var(--accent-emerald)' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px auto', boxShadow: '0 0 25px rgba(16,185,129,0.4)' }}>
            <i className="fa-solid fa-bell-concierge"></i>
          </div>

          <span className="brand-badge" style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--accent-emerald)', borderColor: 'rgba(16,185,129,0.4)' }}>
            <i className="fa-solid fa-sparkles"></i> TABLE FREED & READY
          </span>
          
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: 'var(--text-main)', marginTop: '8px' }} id="tf-title">
            Table #0{tableNum} is Free & Cleaned!
          </h2>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0 20px 0' }} id="tf-desc">
            Hello <strong style={{ color: 'var(--primary)' }}>{customerName}</strong>! Your selected <strong>Table #0{tableNum}</strong> in <strong>{zone || 'Main Hall'}</strong> has just been vacated and sanitized for your party.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'left', fontSize: '13px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Allotted Table:</span>
              <strong style={{ color: 'var(--primary)' }} id="tf-table-num">Table #0{tableNum} ({seats} Seats)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Pre-Ordered Selections:</span>
              <strong style={{ color: 'var(--accent-emerald)' }} id="tf-preorder-count">
                {preorderCount > 0 ? `${preorderCount} Dishes Pre-Ordered` : 'No pre-orders (Menu Active)'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kitchen Dispatch Status:</span>
              <strong style={{ color: '#F59E0B' }}>
                <i className="fa-solid fa-fire"></i> Fast-Track Prep Dispatched!
              </strong>
            </div>
          </div>

          <button 
            className="btn-action btn-primary-action" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px' }} 
            onClick={onTakeSeat}
          >
            <i className="fa-solid fa-chair"></i> Take Seat at Table & Start Dining Session
          </button>
        </div>
      </div>
    </div>
  );
}
