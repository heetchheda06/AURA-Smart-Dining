import React from 'react';

export default function WaiterModal({ isOpen, onClose, onCallWaiter }) {
  if (!isOpen) return null;

  const services = [
    { name: 'Water Refill', icon: 'fa-solid fa-glass-water' },
    { name: 'Extra Cutlery / Napkins', icon: 'fa-solid fa-utensils' },
    { name: 'Clean Table', icon: 'fa-solid fa-broom' },
    { name: 'Speak with Sommelier', icon: 'fa-solid fa-wine-bottle' }
  ];

  return (
    <div className="modal-overlay active" id="waiter-modal">
      <div className="modal-card glass">
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', marginBottom: '8px' }}>Request Table Assistance</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>What can our waitstaff assist you with?</p>
        
        <div className="service-grid">
          {services.map((svc) => (
            <button 
              key={svc.name} 
              className="service-btn" 
              onClick={() => onCallWaiter(svc.name)}
            >
              <i className={svc.icon}></i>
              {svc.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
