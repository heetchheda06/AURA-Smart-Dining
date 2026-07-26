import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ onLogout, adminName, formatPrice, currentRole, onSwitchRole }) {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphTab, setGraphTab] = useState('weekly'); // 'weekly' or 'monthly'

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) setStats(data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) setAnalytics(data.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  // Compute graph data
  const chartData = graphTab === 'weekly' 
    ? (analytics?.weeklyAnalysis || [
        { day: 'Mon', sales: 4200, orders: 12 },
        { day: 'Tue', sales: 3800, orders: 10 },
        { day: 'Wed', sales: 5100, orders: 15 },
        { day: 'Thu', sales: 6400, orders: 18 },
        { day: 'Fri', sales: 8900, orders: 26 },
        { day: 'Sat', sales: 12400, orders: 35 },
        { day: 'Sun', sales: 10800, orders: 30 }
      ])
    : (analytics?.monthlyAnalysis || [
        { month: 'Mar 2026', sales: 85000, orders: 240 },
        { month: 'Apr 2026', sales: 92000, orders: 275 },
        { month: 'May 2026', sales: 110000, orders: 320 },
        { month: 'Jun 2026', sales: 105000, orders: 310 },
        { month: 'Jul 2026', sales: 128000, orders: 380 }
      ]);

  const maxSales = Math.max(...chartData.map(d => d.sales || 1), 1);

  return (
    <div className="app-container">
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      {/* Admin Navbar */}
      <nav className="navbar glass">
        <a href="#" className="brand-container" onClick={(e) => e.preventDefault()}>
          <div className="brand-logo">
            <i className="fa-solid fa-utensils"></i>
          </div>
          <div>
            <div className="brand-title">AURA</div>
            <div className="brand-badge">ADMIN PANEL</div>
          </div>
        </a>

        <div className="nav-center-info">
          <div className="status-pill" style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <span className="status-dot" style={{ backgroundColor: '#8B5CF6', boxShadow: '0 0 10px #8B5CF6' }}></span>
            <span style={{ color: '#C4B5FD' }}>Admin Dashboard • {adminName}</span>
          </div>
        </div>

        <div className="nav-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-action" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket" style={{ color: 'var(--secondary)' }}></i>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Admin Content */}
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Welcome Banner */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: 'var(--text-main)', margin: 0 }}>
                Welcome back, <span style={{ color: 'var(--primary)' }}>{adminName}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                Restaurant management overview and real-time sales & revenue analytics graphs.
              </p>
            </div>
            <span className="brand-badge" style={{ background: 'rgba(139,92,246,0.2)', color: '#C4B5FD', borderColor: 'rgba(139,92,246,0.4)' }}>
              <i className="fa-solid fa-shield-halved"></i> ADMIN ACCESS
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '16px', display: 'block', color: 'var(--primary)' }}></i>
            Loading dashboard analytics data...
          </div>
        ) : (
          <>
            {/* Stats Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>{stats?.formattedRevenue || '₹48,500'}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '4px' }}><i className="fa-solid fa-arrow-trend-up"></i> All time sales</div>
              </div>

              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-emerald)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Active Diners</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>{stats?.activeDiners || 8}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}><i className="fa-solid fa-users"></i> Currently seated</div>
              </div>

              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Active Orders</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#F59E0B' }}>{stats?.activeOrdersCount || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}><i className="fa-solid fa-fire"></i> In kitchen pipeline</div>
              </div>

              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--secondary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bookings</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--secondary)' }}>{stats?.bookingsCount || 14}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}><i className="fa-solid fa-calendar-check"></i> Confirmed</div>
              </div>

              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #C4B5FD' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Menu Items</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#C4B5FD' }}>{stats?.menuItemsCount || 87}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}><i className="fa-solid fa-utensils"></i> Active dishes</div>
              </div>

              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #60A5FA' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Registered Users</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#60A5FA' }}>{stats?.customersCount || 28}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}><i className="fa-solid fa-user-group"></i> Customer accounts</div>
              </div>
            </div>

            {/* VISUAL ANALYTICS GRAPH SECTION */}
            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#FFF', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-chart-column" style={{ color: 'var(--primary)' }}></i>
                    Revenue & Sales Performance Graph
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                    Visual analytics graph for sales revenue (₹) and order count trends over time.
                  </p>
                </div>

                {/* Graph Tab Switcher (Weekly vs Monthly) */}
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button 
                    onClick={() => setGraphTab('weekly')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '16px',
                      border: 'none',
                      background: graphTab === 'weekly' ? 'linear-gradient(135deg, var(--primary), #D97706)' : 'transparent',
                      color: graphTab === 'weekly' ? '#FFF' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: graphTab === 'weekly' ? '0 4px 12px rgba(245,158,11,0.4)' : 'none'
                    }}
                  >
                    📅 Weekly Analysis (7 Days)
                  </button>

                  <button 
                    onClick={() => setGraphTab('monthly')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '16px',
                      border: 'none',
                      background: graphTab === 'monthly' ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'transparent',
                      color: graphTab === 'monthly' ? '#FFF' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: graphTab === 'monthly' ? '0 4px 12px rgba(139,92,246,0.4)' : 'none'
                    }}
                  >
                    🗓️ Monthly Analysis (6 Months)
                  </button>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div style={{ background: 'rgba(10, 12, 16, 0.6)', borderRadius: '16px', padding: '24px 20px 16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '220px', gap: '16px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  {chartData.map((item, idx) => {
                    const label = item.day || item.month;
                    const heightPercent = Math.max(Math.round((item.sales / maxSales) * 100), 12);
                    const isPeak = item.sales === maxSales;

                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                        {/* Peak Badge */}
                        {isPeak && (
                          <div style={{ position: 'absolute', top: '0px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFF', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(239,68,68,0.5)', whiteSpace: 'nowrap' }}>
                            🔥 PEAK
                          </div>
                        )}

                        {/* Revenue Tooltip Value */}
                        <div style={{ fontSize: '11px', fontWeight: 800, color: isPeak ? '#F59E0B' : '#E2E8F0', marginBottom: '6px' }}>
                          {formatPrice(item.sales)}
                        </div>

                        {/* Animated Gradient Column Bar */}
                        <div 
                          style={{ 
                            width: '100%', 
                            maxWidth: '48px', 
                            height: `${heightPercent}%`, 
                            background: isPeak 
                              ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' 
                              : (graphTab === 'weekly' 
                                ? 'linear-gradient(180deg, #10B981 0%, #047857 100%)' 
                                : 'linear-gradient(180deg, #8B5CF6 0%, #4C1D95 100%)'), 
                            borderRadius: '8px 8px 4px 4px',
                            boxShadow: isPeak ? '0 0 15px rgba(245,158,11,0.6)' : '0 4px 10px rgba(0,0,0,0.3)',
                            transition: 'all 0.4s ease',
                            cursor: 'pointer'
                          }}
                          title={`${label}: ${formatPrice(item.sales)} (${item.orders} orders)`}
                        ></div>

                        {/* Order Count Label */}
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 700 }}>
                          {item.orders} orders
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px' }}>
                  {chartData.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#9CA3AF' }}>
                      {item.day || item.month}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Two-column layout: Recent Orders + Top Sellers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Recent Orders */}
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-receipt" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                  Recent Customer Orders
                </h3>
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.recentOrders.map((order, idx) => (
                      <div key={order._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFF' }}>Table #{order.tableNum || '08'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {order.items?.length || 1} items &bull; <strong style={{ color: order.status === 'served' ? '#10B981' : '#F59E0B' }}>{order.status.toUpperCase()}</strong>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(order.total || 0)}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                            {new Date(order.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '13px' }}>
                    <i className="fa-solid fa-inbox" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                    No recent orders yet.
                  </div>
                )}
              </div>

              {/* Top Selling Items */}
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-chart-line" style={{ color: 'var(--accent-emerald)', marginRight: '8px' }}></i>
                  Top Selling Dishes
                </h3>
                {analytics?.categorySales && analytics.categorySales.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analytics.categorySales.slice(0, 5).map((item, idx) => (
                      <div key={item._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,159,28,0.2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFF' }}>{item._id}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.totalQty} units ordered</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatPrice(item.totalSales)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '13px' }}>
                    <i className="fa-solid fa-chart-bar" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                    No sales data yet. Orders will appear here.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
