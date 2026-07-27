import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function ChefDashboard({ onLogout, chefName = "Executive Chef Mario", formatPrice }) {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'pending', 'preparing', 'completed'
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching kitchen orders:", err);
    }
  };

  useEffect(() => {
    // Join staff room to receive all broadcast events
    socket.emit('staff:join');

    fetchOrders();

    // Order placed — add directly to state AND refresh from server
    socket.on('order:placed', (newOrder) => {
      if (newOrder && newOrder.tableNum) {
        setOrders(prev => {
          const exists = prev.some(o => String(o._id) === String(newOrder._id));
          if (exists) return prev;
          return [newOrder, ...prev];
        });
        showToast(`🔔 NEW ORDER! Table #${newOrder.tableNum} — ${newOrder.items?.length || 0} items`);
        // Also refresh from server after a short delay
        setTimeout(fetchOrders, 1000);
      }
    });

    // Chef-specific new order broadcast (includes full order data)
    socket.on('chef:new_order', ({ order }) => {
      if (order && order.tableNum) {
        setOrders(prev => {
          const exists = prev.some(o => String(o._id) === String(order._id));
          if (exists) return prev;
          return [order, ...prev];
        });
        showToast(`🔔 KITCHEN TICKET! Table #${order.tableNum} — ₹${order.total?.toFixed(0)}`);
      }
    });

    // Waiter new order event
    socket.on('waiter:new_order', ({ order }) => {
      if (order) {
        setOrders(prev => {
          const exists = prev.some(o => String(o._id) === String(order._id));
          if (exists) return prev;
          return [order, ...prev];
        });
      }
    });

    socket.on('order:status_updated', () => {
      fetchOrders();
    });

    socket.on('payment:completed', () => {
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 5000);

    return () => {
      socket.off('order:placed');
      socket.off('chef:new_order');
      socket.off('waiter:new_order');
      socket.off('order:status_updated');
      socket.off('payment:completed');
      clearInterval(interval);
    };
  }, []);

  // Update order status action
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🍳 Order status updated to: ${newStatus.toUpperCase()}`);
        fetchOrders();
      } else {
        showToast(`⚠️ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Status update failed.");
    }
  };

  // Filter kitchen tickets
  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'active') return ['pending', 'preparing', 'accepted'].includes(o.status);
    if (statusFilter === 'pending') return o.status === 'pending';
    if (statusFilter === 'preparing') return o.status === 'preparing';
    if (statusFilter === 'completed') return ['served', 'completed'].includes(o.status);
    return true;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const completedCount = orders.filter(o => ['served', 'completed'].includes(o.status)).length;

  return (
    <div className="admin-wrapper" style={{ background: '#090D16', minHeight: '100vh', color: '#F3F4F6' }}>
      
      {/* Kitchen Display System Header */}
      <header className="admin-header glass" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff' }}>
            <i className="fa-solid fa-fire-burner"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, fontFamily: 'Playfair Display, serif', color: '#FFF' }}>AURA Kitchen Display System (KDS)</h1>
              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                EXECUTIVE CHEF VIEW
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Logged in as: <strong>{chefName}</strong> &bull; Kitchen Display Only</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
            {pendingCount + preparingCount} Live Tickets In Kitchen
          </span>
          <button 
            className="btn-action" 
            onClick={() => { fetchOrders(); showToast("🔄 Kitchen tickets refreshed!"); }} 
            style={{ background: '#D6EAF8', borderColor: '#1E3A5F', color: '#1E3A5F', fontWeight: 800 }}
            title="Refresh Kitchen Tickets"
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Tickets
          </button>
          <button className="btn-action" onClick={onLogout} style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)', color: '#FFF' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Switch Account
          </button>
        </div>
      </header>

      <div style={{ padding: '24px 28px' }}>

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: '80px', right: '28px', background: 'linear-gradient(135deg, #EF4444, #B91C1C)', color: '#FFF', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-bell"></i> {toastMessage}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button 
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              background: statusFilter === 'active' ? 'linear-gradient(135deg, #EF4444, #B91C1C)' : 'rgba(255,255,255,0.05)',
              color: '#FFF'
            }}
          >
            <i className="fa-solid fa-fire" style={{ marginRight: '6px' }}></i>
            Active Kitchen Queue ({pendingCount + preparingCount})
          </button>

          <button 
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              background: statusFilter === 'pending' ? '#F59E0B' : 'rgba(255,255,255,0.05)',
              color: statusFilter === 'pending' ? '#FFF' : '#9CA3AF'
            }}
          >
            <i className="fa-solid fa-clock" style={{ marginRight: '6px' }}></i>
            Pending Cook ({pendingCount})
          </button>

          <button 
            onClick={() => setStatusFilter('preparing')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              background: statusFilter === 'preparing' ? '#3B82F6' : 'rgba(255,255,255,0.05)',
              color: statusFilter === 'preparing' ? '#FFF' : '#9CA3AF'
            }}
          >
            <i className="fa-solid fa-kitchen-set" style={{ marginRight: '6px' }}></i>
            In Cooking ({preparingCount})
          </button>

          <button 
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              background: statusFilter === 'completed' ? '#10B981' : 'rgba(255,255,255,0.05)',
              color: statusFilter === 'completed' ? '#FFF' : '#9CA3AF'
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
            Ready & Served ({completedCount})
          </button>
        </div>

        {/* Tickets Grid */}
        {filteredOrders.length === 0 ? (
          <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px', color: '#6B7280' }}>
            <i className="fa-solid fa-utensils" style={{ fontSize: '48px', marginBottom: '16px', color: '#374151' }}></i>
            <h3 style={{ margin: 0, color: '#9CA3AF' }}>No kitchen tickets in this view</h3>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>New customer orders placed at tables will pop up here live!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredOrders.map(order => {
              const isPending = order.status === 'pending';
              const isPreparing = order.status === 'preparing';
              const isReady = ['served', 'completed'].includes(order.status);
              
              const minutesAgo = Math.max(1, Math.round((new Date() - new Date(order.createdAt)) / 60000));

              return (
                <div 
                  key={order._id}
                  className="glass"
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    border: '2px solid',
                    borderColor: isPending ? '#F59E0B' : isPreparing ? '#3B82F6' : '#10B981',
                    background: isPending ? 'rgba(245, 158, 11, 0.05)' : isPreparing ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between'
                  }}
                >
                  <div>
                    {/* Ticket Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFF' }}>
                          Table #{order.tableNum}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                          TICKET #{order._id.substring(order._id.length - 6).toUpperCase()}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: isPending ? 'rgba(245, 158, 11, 0.2)' : isPreparing ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isPending ? '#FCD34D' : isPreparing ? '#93C5FD' : '#6EE7B7'
                        }}>
                          {isPending ? 'PENDING COOK' : isPreparing ? 'IN PREPARATION' : 'READY TO SERVE'}
                        </span>
                        <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '4px', fontWeight: 600 }}>
                          <i className="fa-solid fa-stopwatch"></i> {minutesAgo} min{minutesAgo > 1 ? 's' : ''} ago
                        </div>
                      </div>
                    </div>

                    {/* Dish Items List */}
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>
                        Dishes to Prepare ({order.items.reduce((s, i) => s + i.qty, 0)} items)
                      </div>

                      {order.items.map((item, idx) => (
                        <div 
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '8px 10px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            marginBottom: '6px',
                            borderLeft: '3px solid #EF4444'
                          }}
                        >
                          <span style={{ background: '#EF4444', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '13px' }}>
                            {item.qty}x
                          </span>
                          <div>
                            <div style={{ fontWeight: 800, color: '#FFF', fontSize: '14px' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Requested by: {item.addedBy || 'Customer'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chef Status Action Button */}
                  <div>
                    {isPending && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'preparing')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          color: '#FFF',
                          fontWeight: 800,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                        }}
                      >
                        <i className="fa-solid fa-[#FFF] fa-fire-burner"></i> Start Cooking Order
                      </button>
                    )}

                    {isPreparing && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'served')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          color: '#FFF',
                          fontWeight: 800,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <i className="fa-solid fa-bell-concierge"></i> Mark Order Ready for Table
                      </button>
                    )}

                    {isReady && (
                      <div style={{ textAlign: 'center', fontSize: '12px', color: '#34D399', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontWeight: 700 }}>
                        <i className="fa-solid fa-circle-check"></i> Prepared & Delivered
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
