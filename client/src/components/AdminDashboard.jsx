import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();
const COLORS = ['#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'];

export default function AdminDashboard({ onLogout, adminName, formatPrice }) {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphTab, setGraphTab] = useState('weekly');
  const [activeMetricTab, setActiveMetricTab] = useState('revenue');

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics();

    const handleOrderEvent = () => {
      fetchDashboard();
      fetchAnalytics();
    };

    socket.on('admin:new_order', handleOrderEvent);
    socket.on('waiter:new_order', handleOrderEvent);
    socket.on('order:placed', handleOrderEvent);
    socket.on('order:status_updated', handleOrderEvent);

    const interval = setInterval(() => {
      fetchDashboard();
      fetchAnalytics();
    }, 5000);

    return () => {
      socket.off('admin:new_order', handleOrderEvent);
      socket.off('waiter:new_order', handleOrderEvent);
      socket.off('order:placed', handleOrderEvent);
      socket.off('order:status_updated', handleOrderEvent);
      clearInterval(interval);
    };
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

  // Revenue trend chart data (from API, no hardcoding)
  const chartData = graphTab === 'weekly'
    ? (analytics?.weeklyAnalysis || [])
    : (analytics?.monthlyAnalysis || []);

  const maxSales = chartData.length > 0 ? Math.max(...chartData.map(d => d.sales || 0), 1) : 1;

  // Hourly traffic (from API)
  const hourlyTraffic = analytics?.hourlyTraffic || [];
  const maxHourlyOrders = hourlyTraffic.length > 0 ? Math.max(...hourlyTraffic.map(h => h.orders || 0), 1) : 1;

  // Category distribution (from API)
  const categoryDistribution = analytics?.categoryDistribution || [];

  // Payment breakdown (from API)
  const paymentBreakdown = analytics?.paymentBreakdown || [];

  // Top selling dishes (from API)
  const topDishes = analytics?.categorySales || [];

  const tabBtn = (id, label, activeColor) => (
    <button
      onClick={() => setActiveMetricTab(id)}
      style={{
        padding: '8px 14px',
        borderRadius: '16px',
        border: 'none',
        background: activeMetricTab === id ? activeColor : 'transparent',
        color: activeMetricTab === id ? '#FFF' : 'var(--text-muted)',
        fontWeight: 800,
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="app-container">
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      {/* Admin Navbar */}
      <nav className="navbar glass">
        <a href="#" className="brand-container" onClick={(e) => e.preventDefault()}>
          <div className="brand-logo"><i className="fa-solid fa-utensils"></i></div>
          <div>
            <div className="brand-title">AURA</div>
            <div className="brand-badge">ADMIN PANEL</div>
          </div>
        </a>
        <div className="nav-center-info">
          <div className="status-pill" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <span className="status-dot" style={{ backgroundColor: '#8B5CF6', boxShadow: '0 0 10px #8B5CF6' }}></span>
            <span style={{ color: '#C4B5FD' }}>Admin Dashboard • {adminName}</span>
          </div>
        </div>
        <div className="nav-actions">
          <button className="btn-action" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket" style={{ color: 'var(--secondary)' }}></i>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Welcome Banner */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: 'var(--text-main)', margin: 0 }}>
                Welcome back, <span style={{ color: 'var(--primary)' }}>{adminName}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Live restaurant performance metrics powered by real order and sales data.
              </p>
            </div>
            <span className="brand-badge" style={{ background: 'rgba(139,92,246,0.2)', color: '#C4B5FD', borderColor: 'rgba(139,92,246,0.4)' }}>
              <i className="fa-solid fa-shield-halved"></i> ADMIN ACCESS
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '36px', marginBottom: '16px', display: 'block', color: 'var(--primary)' }}></i>
            Loading live analytics data from database…
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Total Sales Revenue', value: formatPrice(stats?.totalRevenue || 0), sub: `${stats?.totalOrdersCount || 0} total completed orders`, color: 'var(--primary)', icon: 'fa-indian-rupee-sign' },
                { label: 'Total Orders Placed', value: stats?.totalOrdersCount || 0, sub: 'All non-cancelled orders', color: '#10B981', icon: 'fa-receipt' },
                { label: 'Active Kitchen Orders', value: stats?.activeOrdersCount || 0, sub: 'Preparing / Pending now', color: '#F59E0B', icon: 'fa-fire' },
                { label: 'Confirmed Bookings', value: stats?.bookingsCount || 0, sub: 'Reserved tables', color: '#EF4444', icon: 'fa-calendar-check' },
                { label: 'Menu Dishes', value: stats?.menuItemsCount || 0, sub: 'Active catalog items', color: '#C4B5FD', icon: 'fa-utensils' },
                { label: 'Registered Customers', value: stats?.customersCount || 0, sub: 'Member accounts', color: '#60A5FA', icon: 'fa-users' }
              ].map((kpi, idx) => (
                <div key={idx} className="glass" style={{ padding: '18px', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${kpi.color}` }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <i className={`fa-solid ${kpi.icon}`}></i> {kpi.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics Suite */}
            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#FFF', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-chart-column" style={{ color: 'var(--primary)' }}></i>
                    Live Sales & Revenue Analytics
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    All graphs powered by real-time order data from your database.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)', flexWrap: 'wrap' }}>
                  {tabBtn('revenue', '📈 Revenue Trend', 'linear-gradient(135deg,var(--primary),#D97706)')}
                  {tabBtn('hourly', '🔥 Peak Traffic Hours', 'linear-gradient(135deg,#EF4444,#B91C1C)')}
                  {tabBtn('categories', '🍱 Category Revenue Share', 'linear-gradient(135deg,#10B981,#047857)')}
                  {tabBtn('payments', '💳 Payment Breakdown', 'linear-gradient(135deg,#8B5CF6,#6D28D9)')}
                </div>
              </div>

              {/* GRAPH 1: Revenue & Sales Trend */}
              {activeMetricTab === 'revenue' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Total revenue (₹) and order counts from real completed orders.
                    </span>
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '12px' }}>
                      <button onClick={() => setGraphTab('weekly')} style={{ padding: '4px 12px', borderRadius: '10px', border: 'none', background: graphTab === 'weekly' ? '#F59E0B' : 'transparent', color: graphTab === 'weekly' ? '#000' : '#AAA', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>
                        Last 7 Days
                      </button>
                      <button onClick={() => setGraphTab('monthly')} style={{ padding: '4px 12px', borderRadius: '10px', border: 'none', background: graphTab === 'monthly' ? '#8B5CF6' : 'transparent', color: graphTab === 'monthly' ? '#FFF' : '#AAA', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>
                        Last 6 Months
                      </button>
                    </div>
                  </div>

                  {chartData.length === 0 || chartData.every(d => d.sales === 0) ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-chart-bar" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', color: 'var(--primary)' }}></i>
                      No order data yet. Revenue trend will populate as orders are placed.
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(10,12,16,0.6)', borderRadius: '16px', padding: '24px 20px 16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '230px', gap: '12px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                        {chartData.map((item, idx) => {
                          const label = item.day || item.month;
                          const heightPercent = Math.max(Math.round(((item.sales || 0) / maxSales) * 100), item.sales > 0 ? 8 : 2);
                          const isPeak = item.sales > 0 && item.sales === maxSales;
                          return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                              {isPeak && (
                                <div style={{ position: 'absolute', top: 0, background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: '#FFF', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                  🔥 PEAK
                                </div>
                              )}
                              {item.sales > 0 && (
                                <div style={{ fontSize: '11px', fontWeight: 800, color: isPeak ? '#F59E0B' : '#E2E8F0', marginBottom: '5px' }}>
                                  {formatPrice(item.sales)}
                                </div>
                              )}
                              <div
                                style={{
                                  width: '100%', maxWidth: '48px',
                                  height: `${heightPercent}%`,
                                  background: item.sales === 0
                                    ? 'rgba(255,255,255,0.05)'
                                    : isPeak
                                      ? 'linear-gradient(180deg,#F59E0B,#D97706)'
                                      : graphTab === 'weekly'
                                        ? 'linear-gradient(180deg,#10B981,#047857)'
                                        : 'linear-gradient(180deg,#8B5CF6,#4C1D95)',
                                  borderRadius: '6px 6px 3px 3px',
                                  boxShadow: isPeak ? '0 0 14px rgba(245,158,11,0.5)' : 'none',
                                  transition: 'height 0.4s ease'
                                }}
                                title={`${label}: ${formatPrice(item.sales || 0)} · ${item.orders || 0} orders`}
                              ></div>
                              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 700 }}>
                                {item.orders || 0} orders
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                        {chartData.map((item, idx) => (
                          <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#9CA3AF' }}>
                            {item.day || item.month}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GRAPH 2: Hourly Peak Traffic */}
              {activeMetricTab === 'hourly' && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Actual customer order traffic by dining hour. Helps optimize kitchen prep and staff scheduling.
                  </p>
                  {hourlyTraffic.length === 0 || hourlyTraffic.every(h => h.orders === 0) ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-clock" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', color: '#EF4444' }}></i>
                      No hourly traffic data yet. Order times will appear here as orders come in.
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(10,12,16,0.6)', borderRadius: '16px', padding: '24px 20px 16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '220px', gap: '10px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                        {hourlyTraffic.map((h, idx) => {
                          const heightPercent = Math.max(Math.round(((h.orders || 0) / maxHourlyOrders) * 100), h.orders > 0 ? 8 : 2);
                          const isPeak = h.orders > 0 && h.orders === maxHourlyOrders;
                          return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                              {isPeak && (
                                <div style={{ position: 'absolute', top: 0, background: 'linear-gradient(135deg,#EF4444,#B91C1C)', color: '#FFF', fontSize: '8px', fontWeight: 800, padding: '2px 5px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                                  🔥 PEAK
                                </div>
                              )}
                              {h.orders > 0 && (
                                <div style={{ fontSize: '10px', fontWeight: 800, color: isPeak ? '#EF4444' : '#FCD34D', marginBottom: '4px' }}>
                                  {h.orders}
                                </div>
                              )}
                              <div
                                style={{
                                  width: '100%', maxWidth: '38px',
                                  height: `${heightPercent}%`,
                                  background: h.orders === 0
                                    ? 'rgba(255,255,255,0.05)'
                                    : isPeak
                                      ? 'linear-gradient(180deg,#EF4444,#991B1B)'
                                      : 'linear-gradient(180deg,#F59E0B,#B45309)',
                                  borderRadius: '5px 5px 2px 2px',
                                  boxShadow: isPeak ? '0 0 10px rgba(239,68,68,0.4)' : 'none',
                                  transition: 'height 0.3s ease'
                                }}
                                title={`${h.hour}: ${h.orders} orders · ${formatPrice(h.revenue)}`}
                              ></div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                        {hourlyTraffic.map((h, idx) => (
                          <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '10px', fontWeight: 700, color: h.orders === maxHourlyOrders && h.orders > 0 ? '#EF4444' : '#9CA3AF' }}>
                            {h.hour}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GRAPH 3: Category Sales Share */}
              {activeMetricTab === 'categories' && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Revenue contribution by menu category, computed from all non-cancelled orders.
                  </p>
                  {categoryDistribution.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-bowl-food" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', color: '#10B981' }}></i>
                      No category data yet. Sales will be tracked as orders arrive.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(10,12,16,0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {categoryDistribution.map((cat, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                              <span style={{ fontWeight: 700, color: '#FFF' }}>
                                <i className="fa-solid fa-circle" style={{ color, fontSize: '8px', marginRight: '8px' }}></i>
                                {cat.category}
                              </span>
                              <span style={{ fontWeight: 800, color }}>
                                {formatPrice(cat.revenue)} ({cat.percent}%)
                              </span>
                            </div>
                            <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
                              <div style={{ width: `${cat.percent}%`, height: '100%', background: `linear-gradient(90deg,${color},${color}99)`, borderRadius: '5px', boxShadow: `0 0 8px ${color}50`, transition: 'width 0.5s ease' }}></div>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>{cat.qty} units sold</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* GRAPH 4: Payment Breakdown */}
              {activeMetricTab === 'payments' && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Transaction settlement breakdown from real payment records.
                  </p>
                  {paymentBreakdown.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-credit-card" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', color: '#8B5CF6' }}></i>
                      No payment data yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      {paymentBreakdown.map((pm, idx) => (
                        <div key={idx} className="glass" style={{ padding: '20px', borderRadius: '16px', borderLeft: `4px solid ${pm.color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${pm.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pm.color, fontSize: '18px' }}>
                              <i className={`fa-solid ${pm.icon}`}></i>
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: pm.color }}>{pm.percent}%</span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#FFF' }}>{pm.method}</h4>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginTop: '6px' }}>
                            {pm.amount > 0 ? formatPrice(pm.amount) : '—'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {pm.count} transaction{pm.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Row: Recent Orders + Top Selling Dishes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Recent Orders */}
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-receipt" style={{ color: 'var(--primary)' }}></i>
                  Recent Orders
                </h3>
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.recentOrders.map((order, idx) => (
                      <div key={order._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFF' }}>Table #{order.tableNum}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {order.items?.length || 0} items &bull; <strong style={{ color: order.status === 'served' || order.status === 'completed' ? '#10B981' : '#F59E0B' }}>{order.status.toUpperCase()}</strong>
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
                    No orders placed yet.
                  </div>
                )}
              </div>

              {/* Top Selling Dishes */}
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-chart-line" style={{ color: '#10B981' }}></i>
                  Top Bestselling Dishes
                </h3>
                {topDishes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topDishes.slice(0, 7).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,159,28,0.2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFF' }}>{item._id}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.totalQty} units sold</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: '#10B981' }}>{formatPrice(item.totalSales)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '13px' }}>
                    <i className="fa-solid fa-chart-bar" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                    No sales data yet. Top dishes will appear as orders arrive.
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
