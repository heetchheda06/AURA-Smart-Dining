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
    const s = String(o.status || 'pending').toLowerCase();
    if (statusFilter === 'active') return ['pending', 'placed', 'accepted', 'preparing', 'cooking', 'in_cooking'].includes(s);
    if (statusFilter === 'pending') return ['pending', 'placed', 'accepted'].includes(s);
    if (statusFilter === 'preparing') return ['preparing', 'cooking', 'in_cooking'].includes(s);
    if (statusFilter === 'completed') return ['served', 'completed', 'delivered'].includes(s);
    return true;
  });

  const pendingCount = orders.filter(o => ['pending', 'placed', 'accepted'].includes(String(o.status || '').toLowerCase())).length;
  const preparingCount = orders.filter(o => ['preparing', 'cooking', 'in_cooking'].includes(String(o.status || '').toLowerCase())).length;
  const completedCount = orders.filter(o => ['served', 'completed', 'delivered'].includes(String(o.status || '').toLowerCase())).length;

  return (
    <div className="admin-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', color: '#111827' }}>
      
      {/* Kitchen Display System Header */}
      <header style={{ background: '#1E3A5F', color: '#FFFFFF', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(30, 58, 95, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#F97316', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#FFF', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)' }}>
            <i className="fa-solid fa-fire-burner"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#FFF', letterSpacing: '0.5px' }}>AURA Kitchen Display System (KDS)</h1>
              <span style={{ background: '#D6EAF8', color: '#1E3A5F', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>
                EXECUTIVE CHEF VIEW
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '2px 0 0 0' }}>Logged in as: <strong>{chefName}</strong> &bull; Real-Time Order Stream</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', background: '#D6EAF8', color: '#1E3A5F', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316', display: 'inline-block' }}></span>
            {pendingCount + preparingCount} Live Tickets In Kitchen
          </span>
          <button 
            onClick={() => { fetchOrders(); showToast("🔄 Kitchen tickets refreshed!"); }} 
            style={{ background: '#F97316', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '10px 18px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
            title="Refresh Kitchen Tickets"
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Tickets
          </button>
          <button onClick={onLogout} style={{ background: '#D6EAF8', color: '#1E3A5F', border: '1px solid #BEE3F8', borderRadius: '20px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Switch Account
          </button>
        </div>
      </header>

      <div style={{ padding: '24px 28px' }}>

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: '80px', right: '28px', background: '#F97316', color: '#FFF', padding: '12px 20px', borderRadius: '10px', fontWeight: 800, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-bell"></i> {toastMessage}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: statusFilter === 'active' ? '2px solid #1E3A5F' : '1px solid #CBD5E1',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              background: statusFilter === 'active' ? '#1E3A5F' : '#FFFFFF',
              color: statusFilter === 'active' ? '#FFF' : '#1E3A5F',
              boxShadow: statusFilter === 'active' ? '0 4px 15px rgba(30,58,95,0.25)' : 'none'
            }}
          >
            <i className="fa-solid fa-fire" style={{ marginRight: '6px', color: '#F97316' }}></i>
            Active Kitchen Queue ({pendingCount + preparingCount})
          </button>

          <button 
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: statusFilter === 'pending' ? '2px solid #F59E0B' : '1px solid #CBD5E1',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              background: statusFilter === 'pending' ? '#F59E0B' : '#FFFBEB',
              color: statusFilter === 'pending' ? '#FFF' : '#B45309'
            }}
          >
            <i className="fa-solid fa-clock" style={{ marginRight: '6px' }}></i>
            Pending Cook ({pendingCount})
          </button>

          <button 
            onClick={() => setStatusFilter('preparing')}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: statusFilter === 'preparing' ? '2px solid #1E3A5F' : '1px solid #CBD5E1',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              background: statusFilter === 'preparing' ? '#1E3A5F' : '#D6EAF8',
              color: statusFilter === 'preparing' ? '#FFF' : '#1E3A5F'
            }}
          >
            <i className="fa-solid fa-kitchen-set" style={{ marginRight: '6px' }}></i>
            In Cooking ({preparingCount})
          </button>

          <button 
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: statusFilter === 'completed' ? '2px solid #10B981' : '1px solid #CBD5E1',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              background: statusFilter === 'completed' ? '#10B981' : '#F0FDF4',
              color: statusFilter === 'completed' ? '#FFF' : '#065F46'
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
            Ready & Served ({completedCount})
          </button>
        </div>

        {/* Tickets Grid */}
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', borderRadius: '16px', color: '#111827', background: '#FFFFFF', border: '2px solid #D6EAF8' }}>
            <i className="fa-solid fa-utensils" style={{ fontSize: '48px', marginBottom: '16px', color: '#F97316' }}></i>
            <h3 style={{ margin: 0, color: '#1E3A5F', fontWeight: 900 }}>No kitchen tickets in this view</h3>
            <p style={{ fontSize: '13px', marginTop: '6px', color: '#4B5563', fontWeight: 600 }}>New customer orders placed at tables will pop up here live!</p>
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
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    border: `2.5px solid ${isPending ? '#F59E0B' : isPreparing ? '#1E3A5F' : '#10B981'}`,
                    background: '#FFFFFF',
                    boxShadow: '0 6px 20px rgba(30, 58, 95, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    color: '#111827'
                  }}
                >
                  <div>
                    {/* Ticket Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#1E3A5F' }}>
                            Table #{order.tableNum}
                          </div>
                          {(order.roundsCount > 1 || (order.items && order.items.some(i => i.round > 1))) && (
                            <span style={{ background: '#F97316', color: '#FFF', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 900 }}>
                              🔥 ORDER ROUND #{order.roundsCount || 2}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#F97316', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-user"></i> {
                            (order.customerName && order.customerName !== 'AURA Customer' && order.customerName !== 'AURA Member' && order.customerName !== 'Registered Customer' && order.customerName !== 'Guest Customer')
                              ? order.customerName
                              : (order.items && order.items.find(i => i.addedBy && i.addedBy !== 'You' && i.addedBy !== 'Guest' && i.addedBy !== 'AURA Customer' && i.addedBy !== 'AURA Member')?.addedBy)
                                || order.userRef?.name
                                || 'Guest Diner'
                          }
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', fontWeight: 800, marginTop: '2px' }}>
                          TICKET #{order._id.substring(order._id.length - 6).toUpperCase()}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 900,
                          background: isPending ? '#FEF3C7' : isPreparing ? '#D6EAF8' : '#DCFCE7',
                          color: isPending ? '#92400E' : isPreparing ? '#1E3A5F' : '#065F46',
                          border: `1px solid ${isPending ? '#FCD34D' : isPreparing ? '#93C5FD' : '#6EE7B7'}`
                        }}>
                          {isPending ? `PENDING (Round #${order.roundsCount || 1})` : isPreparing ? 'IN PREPARATION' : 'READY TO SERVE'}
                        </span>
                        <div style={{ fontSize: '11px', color: '#F97316', marginTop: '4px', fontWeight: 800 }}>
                          <i className="fa-solid fa-stopwatch"></i> {minutesAgo} min{minutesAgo > 1 ? 's' : ''} ago
                        </div>
                      </div>
                    </div>

                    {/* Dish Items List Grouped by Order Round */}
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ fontSize: '11px', color: '#1E3A5F', textTransform: 'uppercase', fontWeight: 900, marginBottom: '8px' }}>
                        Dishes to Prepare ({order.items.reduce((s, i) => s + (i.qty || 1), 0)} items total)
                      </div>

                      {order.items.map((item, idx) => {
                        const itemRound = item.round || 1;
                        const isLatestRound = itemRound === (order.roundsCount || 1) && order.roundsCount > 1;

                        return (
                          <div 
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              background: isLatestRound ? '#FFFBEB' : '#D6EAF8',
                              borderRadius: '10px',
                              marginBottom: '8px',
                              borderLeft: `4px solid ${isLatestRound ? '#F97316' : '#1E3A5F'}`,
                              border: isLatestRound ? '1.5px solid #FCD34D' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ background: isLatestRound ? '#F97316' : '#1E3A5F', color: '#FFFFFF', padding: '3px 9px', borderRadius: '6px', fontWeight: 900, fontSize: '13px' }}>
                                {item.qty}x
                              </span>
                              <div>
                                <div style={{ fontWeight: 900, color: '#111827', fontSize: '15px' }}>{item.name}</div>
                                <div style={{ fontSize: '11px', color: '#1E3A5F', fontWeight: 700 }}>
                                  Round #{itemRound} &bull; Requested by: {item.addedBy || 'Customer'}
                                </div>
                              </div>
                            </div>

                            {isLatestRound && (
                              <span style={{ background: '#F97316', color: '#FFF', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>
                                🔥 ADD-ON
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chef Status Action Button */}
                  <div>
                    {isPending && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'preparing')}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
                        }}
                      >
                        <i className="fa-solid fa-fire-burner"></i> Start Cooking Round #{order.roundsCount || 1}
                      </button>
                    )}

                    {isPreparing && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'served')}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <i className="fa-solid fa-bell-concierge"></i> Mark Round #{order.roundsCount || 1} Ready for Table
                      </button>
                    )}

                    {isReady && (
                      <div style={{ textAlign: 'center', fontSize: '13px', color: '#065F46', padding: '10px', background: '#DCFCE7', borderRadius: '10px', fontWeight: 900, border: '1px solid #6EE7B7' }}>
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
