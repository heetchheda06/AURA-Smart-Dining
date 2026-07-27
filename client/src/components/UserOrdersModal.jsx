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
        return <span style={{ background: '#DCFCE7', color: '#065F46', border: '1px solid #6EE7B7', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>COMPLETED</span>;
      case 'served':
        return <span style={{ background: '#D6EAF8', color: '#1E3A5F', border: '1px solid #93C5FD', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>SERVED</span>;
      case 'preparing':
        return <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>PREPARING</span>;
      default:
        return <span style={{ background: '#FFEDD5', color: '#C2410C', border: '1px solid #FDBA74', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>PENDING</span>;
    }
  };

  return (
    <div className="modal-overlay active" id="user-orders-modal" style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: '650px', width: '92%', maxHeight: '85vh', overflowY: 'auto', background: '#FFFFFF', border: '2px solid #D6EAF8', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 60px rgba(30,58,95,0.15)', color: '#111827', position: 'relative' }}>
        
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#D6EAF8', border: 'none', color: '#1E3A5F', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}
          title="Close Orders History"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* User Profile Header */}
        <div style={{ background: '#1E3A5F', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(30,58,95,0.2)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff', fontWeight: 900, boxShadow: '0 4px 12px rgba(249,115,22,0.4)', flexShrink: 0 }}>
            <i className="fa-solid fa-user"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                {customerName}
              </h3>
              <span style={{ background: '#D6EAF8', color: '#1E3A5F', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>
                MEMBER ACCOUNT
              </span>
            </div>
            <p style={{ color: '#93C5FD', fontSize: '12px', marginTop: '4px', fontWeight: 700, margin: 0 }}>
              Your personal dining history & past order receipts.
            </p>
          </div>
        </div>

        {/* Section Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1E3A5F', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <i className="fa-solid fa-receipt" style={{ color: '#F97316' }}></i> Past Dining Orders ({orders.length})
          </h4>
          <button 
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 900, background: '#1E3A5F', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} 
            onClick={fetchUserOrders}
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#4B5563', fontWeight: 700 }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', marginBottom: '12px', display: 'block', color: '#F97316' }}></i>
            Fetching your order receipts...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #D6EAF8' }}>
            <i className="fa-solid fa-utensils" style={{ fontSize: '36px', color: '#F97316', marginBottom: '12px', display: 'block' }}></i>
            <h4 style={{ color: '#1E3A5F', fontSize: '16px', fontWeight: 900, marginBottom: '4px' }}>No Order History Yet</h4>
            <p style={{ color: '#4B5563', fontSize: '13px', fontWeight: 700 }}>You haven't placed any orders with this member account yet. Explore our exquisite menu to start dining!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {orders.map((order, idx) => (
              <div 
                key={order._id || idx} 
                style={{ padding: '18px', borderRadius: '16px', border: '1.5px solid #D6EAF8', background: '#F8FAFC', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
              >
                {/* Receipt Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1.5px dashed #D6EAF8' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '15px', color: '#111827' }}>
                      Table #0{order.tableNum}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px', fontWeight: 700 }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: '4px', color: '#F97316' }}></i>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(order.status)}
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontFamily: 'monospace', fontWeight: 900 }}>
                      ID: #{order._id ? String(order._id).substring(String(order._id).length - 6).toUpperCase() : 'ORD'}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {order.items && order.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                      <span>
                        <strong style={{ color: '#F97316', marginRight: '6px', fontWeight: 900 }}>{item.qty}x</strong>
                        <span style={{ fontWeight: 800, color: '#111827' }}>{item.name}</span>
                      </span>
                      <span style={{ color: '#1E3A5F', fontWeight: 900 }}>
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bill Totals Breakdown */}
                <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '12px', border: '1px solid #D6EAF8', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', marginBottom: '4px', fontWeight: 700 }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#1E3A5F', fontWeight: 900 }}>{formatPrice(order.subtotal || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', marginBottom: '6px', fontWeight: 700 }}>
                    <span>Service & GST (10%)</span>
                    <span style={{ color: '#1E3A5F', fontWeight: 900 }}>{formatPrice(order.tax || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '15px', color: '#1E3A5F', borderTop: '1.5px solid #D6EAF8', paddingTop: '6px' }}>
                    <span>Total Paid Bill</span>
                    <span style={{ color: '#F97316', fontWeight: 900 }}>{formatPrice(order.total || 0)}</span>
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
