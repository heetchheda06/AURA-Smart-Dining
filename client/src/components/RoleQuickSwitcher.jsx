import React from 'react';

export default function RoleQuickSwitcher({ currentRole, onSwitchRole }) {
  const roles = [
    { id: 'customer', label: 'Customer View', icon: 'fa-solid fa-utensils', color: '#10B981', desc: 'Home & Menu' },
    { id: 'cashier', label: 'Cashier View', icon: 'fa-solid fa-calculator', color: '#F59E0B', desc: 'Bills & Payments' },
    { id: 'manager', label: 'Manager View', icon: 'fa-solid fa-user-tie', color: '#8B5CF6', desc: 'Vacant Tables & Stock' },
    { id: 'chef', label: 'Chef View', icon: 'fa-solid fa-fire-burner', color: '#EF4444', desc: 'Kitchen Orders' },
    { id: 'admin', label: 'Admin View', icon: 'fa-solid fa-shield-halved', color: '#3B82F6', desc: 'Total Orders & Analytics' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999999,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1.5px solid rgba(255, 255, 255, 0.25)',
      borderRadius: '50px',
      padding: '8px 18px',
      boxShadow: '0 15px 40px rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 800, 
        color: '#F59E0B', 
        textTransform: 'uppercase', 
        letterSpacing: '1px', 
        marginRight: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <i className="fa-solid fa-layer-group" style={{ color: '#F59E0B' }}></i> PORTAL SWITCHER:
      </span>

      {roles.map(r => {
        const isActive = currentRole === r.id;
        return (
          <button
            key={r.id}
            onClick={() => onSwitchRole(r.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '30px',
              border: isActive ? `1.5px solid ${r.color}` : '1px solid rgba(255,255,255,0.1)',
              background: isActive ? `${r.color}35` : 'rgba(255,255,255,0.05)',
              color: isActive ? '#FFFFFF' : '#9CA3AF',
              fontWeight: isActive ? 800 : 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 12px ${r.color}50` : 'none'
            }}
            title={r.desc}
          >
            <i className={r.icon} style={{ color: isActive ? '#FFF' : r.color }}></i>
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
