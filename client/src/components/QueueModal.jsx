import React from 'react';

export default function QueueModal({ isOpen, onClose, partySize, onSimulateClear }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" id="queue-modal">
      <div className="modal-card glass" style={{ maxWidth: '440px' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.2)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 16px auto', animation: 'pulse 2s infinite' }}>
            <i className="fa-solid fa-clock"></i>
          </div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', marginBottom: '8px' }}>Seating Waitlist Active</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
            All tables matching your party size (<strong id="queue-seats-text" style={{ color: 'var(--primary)' }}>{partySize} Guests</strong>) are currently busy. You have been added to the real-time queue.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', padding: '16px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Estimated Seating Time</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', margin: '8px 0' }}>~12 Mins</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Position: #2 in Queue &bull; SMS Alert Enabled</div>
          </div>

          <button 
            className="btn-action btn-primary-action" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: '8px' }} 
            onClick={onSimulateClear}
          >
            <i className="fa-solid fa-forward"></i> Simulate Host Table Cleared
          </button>
          <button 
            className="btn-action" 
            style={{ width: '100%', justifyContent: 'center' }} 
            onClick={onClose}
          >
            Stay in Queue & View Menu
          </button>
        </div>
      </div>
    </div>
  );
}
