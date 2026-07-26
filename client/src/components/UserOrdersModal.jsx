import React, { useState, useEffect } from 'react';

export default function UserOrdersModal({ isOpen, onClose, customerName, formatPrice }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUserOrders();
    }
  }, [isOpen]);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data && data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching user order history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--accent-emerald)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>COMPLETED</span>;
      case 'served':
        return <span style={{ background: 'rgba(139,92,246,0.2)', color: '#C4B5FD', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>SERVED</span>;
      case 'preparing':
        return <span style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>PREPARING</span>;
      default:
        return <span style={{ background: 'rgba(255,159,28,0.2)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>PENDING</span>;
    }
  };

  return (
    <div className="modal-overlay active" id="user-orders-modal" style={{ zIndex: 9999 }}>
      <div className="modal-card glass auth-card-wide" style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>

        {/* User Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff', boxShadow: 'var(--shadow-glow)' }}>
            <i className="fa-solid fa-user"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: 'var(--text-main)', margin: 0 }}>
                {customerName}
              </h3>
              <span className="brand-badge" style={{ background: 'rgba(139,92,246,0.2)', color: '#C4B5FD', borderColor: 'rgba(139,92,246,0.4)', fontSize: '10px' }}>
                MEMBER ACCOUNT
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
              Your personal dining history & past order receipts.
            </p>
          </div>
        </div>

        {/* Section Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-receipt" style={{ color: 'var(--primary)' }}></i> Past Dining Orders ({orders.length})
          </h4>
          <button className="btn-action" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={fetchUserOrders}>
            <i className="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', marginBottom: '12px', display: 'block', color: 'var(--primary)' }}></i>
            Fetching your order receipts...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <i className="fa-solid fa-utensils" style={{ fontSize: '36px', color: 'var(--text-dim)', marginBottom: '12px', display: 'block' }}></i>
            <h4 style={{ color: 'var(--text-main)', fontSize: '16px', marginBottom: '4px' }}>No Order History Yet</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>You haven't placed any orders with this member account yet. Explore our exquisite menu to start dining!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {orders.map((order, idx) => (
              <div 
                key={order._id || idx} 
                className="glass" 
                style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.25)' }}
              >
                {/* Receipt Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed var(--border-glass)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                      Table #0{order.tableNum}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(order.status)}
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      ID: #{order._id?.substring(order._id.length - 6).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {order.items && order.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>
                        <strong style={{ color: 'var(--primary)', marginRight: '6px' }}>{item.qty}x</strong>
                        {item.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bill Totals Breakdown */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>Service & GST (10%)</span>
                    <span>{formatPrice(order.tax || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '14px', color: 'var(--primary)', borderTop: '1px solid var(--border-glass)', paddingTop: '6px' }}>
                    <span>Total Paid Bill</span>
                    <span>{formatPrice(order.total || 0)}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
