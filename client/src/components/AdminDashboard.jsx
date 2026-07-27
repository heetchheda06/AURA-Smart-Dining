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
    socket.on('payment:completed', handleOrderEvent);
    socket.on('bill:settled', handleOrderEvent);

    const interval = setInterval(() => {
      fetchDashboard();
      fetchAnalytics();
    }, 5000);

    return () => {
      socket.off('admin:new_order', handleOrderEvent);
      socket.off('waiter:new_order', handleOrderEvent);
      socket.off('order:placed', handleOrderEvent);
      socket.off('order:status_updated', handleOrderEvent);
      socket.off('payment:completed', handleOrderEvent);
      socket.off('bill:settled', handleOrderEvent);
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
    <div className="admin-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', color: '#111827' }}>
      
      {/* Admin Navbar */}
      <header style={{ background: '#1E3A5F', color: '#FFFFFF', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(30, 58, 95, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#F97316', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#FFF', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)' }}>
            <i className="fa-solid fa-chart-pie"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#FFF', letterSpacing: '0.5px' }}>AURA Admin Executive Portal</h1>
              <span style={{ background: '#D6EAF8', color: '#1E3A5F', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>
                EXECUTIVE ANALYTICS
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '2px 0 0 0' }}>Logged in as: <strong>{adminName}</strong> &bull; Super Admin Permissions</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', background: '#D6EAF8', color: '#1E3A5F', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            Real-Time DB Sync
          </span>
          <button 
            onClick={() => { fetchDashboard(); fetchAnalytics(); }}
            style={{ background: '#F97316', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '10px 18px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
            title="Refresh Admin Dashboard"
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Data
          </button>
          <button onClick={onLogout} style={{ background: '#D6EAF8', color: '#1E3A5F', border: '1px solid #BEE3F8', borderRadius: '20px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Switch Account
          </button>
        </div>
      </header>

      <div style={{ padding: '24px 28px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Welcome Banner */}
        <div style={{ background: '#FFFFFF', padding: '22px 28px', borderRadius: '16px', marginBottom: '24px', border: '2px solid #D6EAF8', boxShadow: '0 4px 20px rgba(30,58,95,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E3A5F', margin: 0 }}>
                Welcome back, <span style={{ color: '#F97316' }}>{adminName}</span>
              </h1>
              <p style={{ color: '#4B5563', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 600 }}>
                Live restaurant performance metrics powered by real-time order and sales data.
              </p>
            </div>
            <span style={{ background: '#D6EAF8', color: '#1E3A5F', border: '1.5px solid #93C5FD', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 900 }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#F97316', marginRight: '6px' }}></i> FULL SYSTEM CONTROL
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#1E3A5F', background: '#FFFFFF', borderRadius: '16px', border: '2px solid #D6EAF8' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '36px', marginBottom: '16px', display: 'block', color: '#F97316' }}></i>
            <div style={{ fontWeight: 800 }}>Loading live analytics data from database…</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Sales Revenue', value: formatPrice(stats?.totalRevenue || 0), sub: `${stats?.totalOrdersCount || 0} completed orders`, color: '#1E3A5F', icon: 'fa-indian-rupee-sign' },
                { label: 'Total Orders Placed', value: stats?.totalOrdersCount || 0, sub: 'All non-cancelled orders', color: '#059669', icon: 'fa-receipt' },
                { label: 'Active Kitchen Orders', value: stats?.activeOrdersCount || 0, sub: 'Preparing / Pending now', color: '#D97706', icon: 'fa-fire' },
                { label: 'Confirmed Bookings', value: stats?.bookingsCount || 0, sub: 'Reserved tables', color: '#DC2626', icon: 'fa-calendar-check' },
                { label: 'Menu Dishes', value: stats?.menuItemsCount || 0, sub: 'Active catalog items', color: '#7C3AED', icon: 'fa-utensils' },
                { label: 'Registered Customers', value: stats?.customersCount || 0, sub: 'Member accounts', color: '#2563EB', icon: 'fa-users' }
              ].map((kpi, idx) => (
                <div key={idx} style={{ background: '#FFFFFF', padding: '18px', borderRadius: '16px', border: '2px solid #D6EAF8', borderLeft: `4px solid ${kpi.color}`, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '11px', color: '#4B5563', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '6px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '4px', fontWeight: 600 }}>
                    <i className={`fa-solid ${kpi.icon}`} style={{ marginRight: '4px', color: kpi.color }}></i> {kpi.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics Suite */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '2px solid #D6EAF8', boxShadow: '0 6px 25px rgba(30,58,95,0.08)' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1E3A5F', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-chart-column" style={{ color: '#F97316' }}></i>
                    Live Sales & Revenue Analytics
                  </h3>
                  <p style={{ fontSize: '12px', color: '#4B5563', margin: '4px 0 0 0', fontWeight: 600 }}>
                    All graphs powered by real-time order data from your database.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '6px', borderRadius: '20px', border: '1.5px solid #D6EAF8', flexWrap: 'wrap' }}>
                  {tabBtn('revenue', '📈 Revenue Trend', '#1E3A5F')}
                  {tabBtn('hourly', '🔥 Peak Traffic Hours', '#F97316')}
                  {tabBtn('categories', '🍱 Category Revenue Share', '#10B981')}
                  {tabBtn('payments', '💳 Payment Breakdown', '#1E3A5F')}
                </div>
              </div>

              {/* GRAPH 1: Revenue & Sales Trend */}
              {activeMetricTab === 'revenue' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: 700 }}>
                      Total revenue (₹) and order counts from real completed orders.
                    </span>
                    <div style={{ display: 'flex', gap: '6px', background: '#D6EAF8', padding: '4px', borderRadius: '12px' }}>
                      <button onClick={() => setGraphTab('weekly')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: graphTab === 'weekly' ? '#1E3A5F' : 'transparent', color: graphTab === 'weekly' ? '#FFF' : '#1E3A5F', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}>
                        Last 7 Days
                      </button>
                      <button onClick={() => setGraphTab('monthly')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: graphTab === 'monthly' ? '#1E3A5F' : 'transparent', color: graphTab === 'monthly' ? '#FFF' : '#1E3A5F', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}>
                        Last 6 Months
                      </button>
                    </div>
                  </div>

                  {chartData.length === 0 || chartData.every(d => d.sales === 0) ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#4B5563', background: '#F8FAFC', borderRadius: '14px' }}>
                      <i className="fa-solid fa-chart-bar" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', color: '#F97316' }}></i>
                      <div style={{ fontWeight: 800, color: '#1E3A5F' }}>No order data yet. Revenue trend will populate as orders are placed.</div>
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '24px 20px 16px 20px', border: '1.5px solid #D6EAF8' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '230px', gap: '12px', borderBottom: '2px solid #CBD5E1', paddingBottom: '12px' }}>
                        {chartData.map((item, idx) => {
                          const label = item.day || item.month;
                          const heightPercent = Math.max(Math.round(((item.sales || 0) / maxSales) * 100), item.sales > 0 ? 8 : 2);
                          const isPeak = item.sales > 0 && item.sales === maxSales;
                          return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                              {isPeak && (
                                <div style={{ position: 'absolute', top: 0, background: '#F97316', color: '#FFF', fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                  🔥 PEAK
                                </div>
                              )}
                              {item.sales > 0 && (
                                <div style={{ fontSize: '11px', fontWeight: 900, color: isPeak ? '#F97316' : '#1E3A5F', marginBottom: '5px' }}>
                                  {formatPrice(item.sales)}
                                </div>
                              )}
                              <div
                                style={{
                                  width: '100%', maxWidth: '48px',
                                  height: `${heightPercent}%`,
                                  background: item.sales === 0
                                    ? '#E2E8F0'
                                    : isPeak
                                      ? 'linear-gradient(180deg,#F97316,#EA580C)'
                                      : 'linear-gradient(180deg,#1E3A5F,#2A4D7C)',
                                  borderRadius: '6px 6px 3px 3px',
                                  boxShadow: isPeak ? '0 4px 14px rgba(249,115,22,0.4)' : 'none',
                                  transition: 'height 0.4s ease'
                                }}
                                title={`${label}: ${formatPrice(item.sales || 0)} · ${item.orders || 0} orders`}
                              ></div>
                              <div style={{ fontSize: '10px', color: '#4B5563', marginTop: '4px', fontWeight: 800 }}>
                                {item.orders || 0} orders
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                        {chartData.map((item, idx) => (
                          <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 900, color: '#1E3A5F' }}>
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
                  <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px', fontWeight: 600 }}>
                    Actual customer order traffic by dining hour. Helps optimize kitchen prep and staff scheduling.
                  </p>
                  {hourlyTraffic.length === 0 || hourlyTraffic.every(h => h.orders === 0) ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#1E3A5F', background: '#F8FAFC', borderRadius: '14px' }}>
                      <i className="fa-solid fa-clock" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', color: '#F97316' }}></i>
                      <div style={{ fontWeight: 800 }}>No hourly traffic data yet. Order times will appear here as orders come in.</div>
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '24px 20px 16px 20px', border: '1.5px solid #D6EAF8' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '220px', gap: '10px', borderBottom: '2px solid #CBD5E1', paddingBottom: '12px' }}>
                        {hourlyTraffic.map((h, idx) => {
                          const heightPercent = Math.max(Math.round(((h.orders || 0) / maxHourlyOrders) * 100), h.orders > 0 ? 8 : 2);
                          const isPeak = h.orders > 0 && h.orders === maxHourlyOrders;
                          return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                              {isPeak && (
                                <div style={{ position: 'absolute', top: 0, background: '#F97316', color: '#FFF', fontSize: '8px', fontWeight: 900, padding: '2px 5px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                                  🔥 PEAK
                                </div>
                              )}
                              {h.orders > 0 && (
                                <div style={{ fontSize: '10px', fontWeight: 900, color: isPeak ? '#F97316' : '#1E3A5F', marginBottom: '4px' }}>
                                  {h.orders}
                                </div>
                              )}
                              <div
                                style={{
                                  width: '100%', maxWidth: '38px',
                                  height: `${heightPercent}%`,
                                  background: h.orders === 0
                                    ? '#E2E8F0'
                                    : isPeak
                                      ? 'linear-gradient(180deg,#F97316,#EA580C)'
                                      : 'linear-gradient(180deg,#1E3A5F,#2A4D7C)',
                                  borderRadius: '5px 5px 2px 2px',
                                  boxShadow: isPeak ? '0 4px 10px rgba(249,115,22,0.4)' : 'none',
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
                          <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#1E3A5F' }}>
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
                  <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px', fontWeight: 600 }}>
                    Revenue contribution by menu category, computed from all non-cancelled orders.
                  </p>
                  {categoryDistribution.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#1E3A5F', background: '#F8FAFC', borderRadius: '14px' }}>
                      <i className="fa-solid fa-bowl-food" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', color: '#10B981' }}></i>
                      <div style={{ fontWeight: 800 }}>No category data yet. Sales will be tracked as orders arrive.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1.5px solid #D6EAF8' }}>
                      {categoryDistribution.map((cat, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13.5px' }}>
                              <span style={{ fontWeight: 900, color: '#111827' }}>
                                <i className="fa-solid fa-circle" style={{ color, fontSize: '9px', marginRight: '8px' }}></i>
                                {cat.category}
                              </span>
                              <span style={{ fontWeight: 900, color: '#1E3A5F' }}>
                                {formatPrice(cat.revenue)} ({cat.percent}%)
                              </span>
                            </div>
                            <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '5px', overflow: 'hidden' }}>
                              <div style={{ width: `${cat.percent}%`, height: '100%', background: color, borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
                            </div>
                            <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '3px', fontWeight: 700 }}>{cat.qty} units sold</div>
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
                  <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px', fontWeight: 600 }}>
                    Transaction settlement breakdown from real payment records.
                  </p>
                  {paymentBreakdown.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#1E3A5F', background: '#F8FAFC', borderRadius: '14px' }}>
                      <i className="fa-solid fa-credit-card" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', color: '#1E3A5F' }}></i>
                      <div style={{ fontWeight: 800 }}>No payment data yet.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      {paymentBreakdown.map((pm, idx) => (
                        <div key={idx} style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '2px solid #D6EAF8', borderLeft: `4px solid ${pm.color}`, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#D6EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A5F', fontSize: '18px' }}>
                              <i className={`fa-solid ${pm.icon}`}></i>
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: 900, color: pm.color }}>{pm.percent}%</span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '15px', color: '#111827', fontWeight: 900 }}>{pm.method}</h4>
                          <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E3A5F', marginTop: '6px' }}>
                            {pm.amount > 0 ? formatPrice(pm.amount) : '—'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px', fontWeight: 700 }}>
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
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '2px solid #D6EAF8', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px', color: '#1E3A5F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-receipt" style={{ color: '#F97316' }}></i>
                  Recent Orders
                </h3>
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.recentOrders.map((order, idx) => (
                      <div key={order._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #D6EAF8' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '14px', color: '#111827' }}>Table #{order.tableNum}</div>
                          <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>
                            {order.items?.length || 0} items &bull; <strong style={{ color: order.status === 'served' || order.status === 'completed' ? '#059669' : '#D97706' }}>{order.status.toUpperCase()}</strong>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: '#F97316', fontSize: '15px' }}>{formatPrice(order.total || 0)}</div>
                          <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>
                            {new Date(order.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#4B5563', fontSize: '13px', background: '#F8FAFC', borderRadius: '10px' }}>
                    <i className="fa-solid fa-inbox" style={{ fontSize: '24px', display: 'block', marginBottom: '8px', color: '#F97316' }}></i>
                    No orders placed yet.
                  </div>
                )}
              </div>

              {/* Top Selling Dishes */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '2px solid #D6EAF8', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px', color: '#1E3A5F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-chart-line" style={{ color: '#10B981' }}></i>
                  Top Bestselling Dishes
                </h3>
                {topDishes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topDishes.slice(0, 7).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #D6EAF8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#D6EAF8', color: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '14px', color: '#111827' }}>{item._id}</div>
                            <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>{item.totalQty} units sold</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, color: '#059669', fontSize: '15px' }}>{formatPrice(item.totalSales)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#4B5563', fontSize: '13px', background: '#F8FAFC', borderRadius: '10px' }}>
                    <i className="fa-solid fa-chart-bar" style={{ fontSize: '24px', display: 'block', marginBottom: '8px', color: '#10B981' }}></i>
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
