import React, { useState, useEffect, useMemo } from 'react';

export default function UserOrdersModal({ isOpen, onClose, customerName, formatPrice, onAddToCart }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realName, setRealName] = useState(customerName || '');

  useEffect(() => {
    if (isOpen) {
      fetchUserOrders();
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user && data.user.name) {
          setRealName(data.user.name);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  // Compute Member Dashboard Analytics (Total Spent & Top Most Ordered Dishes)
  const { totalSpent, favoriteDishes } = useMemo(() => {
    let spent = 0;
    const dishCountMap = {};

    orders.forEach(order => {
      spent += (order.total || 0);
      (order.items || []).forEach(item => {
        const name = item.name || 'Delicious Dish';
        const key = item.menuItem || item._id || name;
        if (!dishCountMap[name]) {
          dishCountMap[name] = {
            id: key,
            name,
            qty: 0,
            price: item.price || 0
          };
        }
        dishCountMap[name].qty += (item.qty || 1);
        if (item.price) dishCountMap[name].price = item.price;
      });
    });

    const favorites = Object.values(dishCountMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);

    return { totalSpent: spent, favoriteDishes: favorites };
  }, [orders]);

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
      <div style={{ maxWidth: '680px', width: '92%', maxHeight: '88vh', overflowY: 'auto', background: '#FFFFFF', border: '2px solid #D6EAF8', borderRadius: '24px', padding: '26px', boxShadow: '0 20px 60px rgba(30,58,95,0.15)', color: '#111827', position: 'relative' }}>
        
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#D6EAF8', border: 'none', color: '#1E3A5F', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, zIndex: 10 }}
          title="Close Member Dashboard"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* User Profile Header Banner */}
        <div style={{ background: '#1E3A5F', borderRadius: '18px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', boxShadow: '0 6px 20px rgba(30,58,95,0.25)', border: '2px solid #D6EAF8' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff', fontWeight: 900, boxShadow: '0 4px 14px rgba(249,115,22,0.4)', flexShrink: 0 }}>
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '0.3px' }}>
                {realName || customerName || 'Valued Member'}
              </h3>
              <span style={{ background: '#F97316', color: '#FFFFFF', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>
                👑 MEMBER DASHBOARD
              </span>
            </div>
            <p style={{ color: '#D6EAF8', fontSize: '13px', marginTop: '4px', fontWeight: 700, margin: 0 }}>
              Personalized dining insights, order history & favorite dish reordering.
            </p>
          </div>
        </div>

        {/* Quick Member Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div style={{ background: '#F8FAFC', border: '1.5px solid #D6EAF8', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#1E3A5F', textTransform: 'uppercase', marginBottom: '4px' }}>
              <i className="fa-solid fa-receipt" style={{ color: '#F97316', marginRight: '6px' }}></i> Total Orders Placed
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>
              {orders.length} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>orders</span>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1.5px solid #D6EAF8', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#1E3A5F', textTransform: 'uppercase', marginBottom: '4px' }}>
              <i className="fa-solid fa-wallet" style={{ color: '#10B981', marginRight: '6px' }}></i> Total Lifetime Spent
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E3A5F' }}>
              {formatPrice(totalSpent)}
            </div>
          </div>

          <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#92400E', textTransform: 'uppercase', marginBottom: '4px' }}>
              <i className="fa-solid fa-coins" style={{ color: '#D97706', marginRight: '6px' }}></i> Loyalty Reward Points
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#92400E' }}>
              {Math.round(totalSpent * 0.1)} <span style={{ fontSize: '13px', color: '#B45309', fontWeight: 700 }}>pts</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: MOST FREQUENTLY ORDERED FOODS (FAVORITES) */}
        {favoriteDishes.length > 0 && (
          <div style={{ marginBottom: '24px', background: '#F8FAFC', border: '2px solid #D6EAF8', borderRadius: '18px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1E3A5F', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-fire" style={{ color: '#F97316' }}></i> Your Most Ordered Dishes ({favoriteDishes.length})
              </h4>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>
                1-CLICK QUICK REORDER
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {favoriteDishes.map((dish, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: '#FFFFFF', 
                    border: '1.5px solid #93C5FD', 
                    borderRadius: '14px', 
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: '0 2px 10px rgba(30,58,95,0.06)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '10px', border: '1px solid #FCD34D' }}>
                        🔥 Ordered {dish.qty}x
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: '#F97316' }}>
                        {formatPrice(dish.price)}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>
                      {dish.name}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (onAddToCart) onAddToCart(dish.id);
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 3px 10px rgba(249,115,22,0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> Order Again
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: PAST DINING ORDERS HISTORY */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1E3A5F', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <i className="fa-solid fa-receipt" style={{ color: '#F97316' }}></i> Past Order Receipts ({orders.length})
          </h4>
          <button 
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 900, background: '#1E3A5F', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} 
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
