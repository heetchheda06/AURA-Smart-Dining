import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function CashierDashboard({ onLogout, cashierName = "Lead Cashier Sarah", formatPrice }) {
  const [orders, setOrders] = useState([]);
  const [filterTab, setFilterTab] = useState('unpaid'); // 'unpaid', 'paid', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'Cash', 'UPI', 'Card'
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching orders for cashier:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleRefresh = () => {
      fetchOrders();
    };

    socket.on('order:placed', () => {
      fetchOrders();
      showToast("🔔 New order placed by table! Invoice ready for billing.");
    });

    socket.on('waiter:new_order', handleRefresh);
    socket.on('order:status_updated', handleRefresh);
    socket.on('payment:completed', () => {
      fetchOrders();
      showToast("💳 Payment received! Invoice status updated.");
    });
    socket.on('bill:settled', handleRefresh);

    const interval = setInterval(fetchOrders, 5000);

    return () => {
      socket.off('order:placed');
      socket.off('waiter:new_order');
      socket.off('order:status_updated');
      socket.off('payment:completed');
      socket.off('bill:settled');
      clearInterval(interval);
    };
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesTab = 
      filterTab === 'all' ? true :
      filterTab === 'unpaid' ? order.paymentStatus === 'unpaid' :
      order.paymentStatus === 'paid';
    
    const matchesSearch = 
      order.tableNum.toString().includes(searchTerm) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Calculate totals
  const totalUnpaid = orders.filter(o => o.paymentStatus === 'unpaid').reduce((sum, o) => sum + o.total, 0);
  const totalPaid = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter(o => o.paymentStatus === 'unpaid').length;
  const completedCount = orders.filter(o => o.paymentStatus === 'paid').length;

  // Process payment action
  const handleProcessPayment = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Payment of ${formatPrice(selectedOrderForBill?.total || 0)} collected via ${paymentMethod}! Table bill closed.`);
        fetchOrders();
        setIsReceiptModalOpen(true);
      } else {
        showToast(`⚠️ Payment failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Payment processing error.");
    }
  };

  const openBillModal = (order) => {
    setSelectedOrderForBill(order);
    setReceiptData(order);
    setDiscountPercent(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="admin-wrapper" style={{ background: '#0B0F19', minHeight: '100vh', color: '#F3F4F6' }}>
      
      {/* Cashier Top Navbar */}
      <header className="admin-header glass" style={{ borderBottom: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff' }}>
            <i className="fa-solid fa-calculator"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, fontFamily: 'Playfair Display, serif', color: '#FFF' }}>AURA Billing & Cashier Desk</h1>
              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                POS STATION 01
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Logged in as: <strong>{cashierName}</strong> &bull; Cashier Role View Only</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }}></span>
            POS Register Active
          </span>
          <button 
            className="btn-action" 
            onClick={() => { fetchOrders(); showToast("🔄 Billing data refreshed!"); }} 
            style={{ background: '#D6EAF8', borderColor: '#1E3A5F', color: '#1E3A5F', fontWeight: 800 }}
            title="Refresh Billing Orders"
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Data
          </button>
          <button className="btn-action" onClick={onLogout} style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444', color: '#FCA5A5' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Switch Account
          </button>
        </div>
      </header>

      <div style={{ padding: '24px 28px' }}>

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: '80px', right: '28px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFF', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-circle-check"></i> {toastMessage}
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
          <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unpaid Table Bills</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#EF4444', margin: '6px 0' }}>{formatPrice(totalUnpaid)}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}><i className="fa-solid fa-clock"></i> {pendingCount} Pending Table Bills</div>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ fontSize: '12px', color: '#6EE7B7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Paid Revenue</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981', margin: '6px 0' }}>{formatPrice(totalPaid)}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}><i className="fa-solid fa-circle-check"></i> {completedCount} Receipts Closed</div>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
            <div style={{ fontSize: '12px', color: '#FCD34D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Billing Tables</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#F59E0B', margin: '6px 0' }}>{orders.length}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}><i className="fa-solid fa-utensils"></i> Live Dining Sessions</div>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)' }}>
            <div style={{ fontSize: '12px', color: '#C4B5FD', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accepted Payment Modes</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#FFF' }}><i className="fa-solid fa-qrcode"></i> UPI</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#FFF' }}><i className="fa-solid fa-credit-card"></i> Card</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#FFF' }}><i className="fa-solid fa-money-bill-wave"></i> Cash</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setFilterTab('unpaid')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                background: filterTab === 'unpaid' ? '#EF4444' : 'rgba(255,255,255,0.05)',
                color: filterTab === 'unpaid' ? '#FFF' : '#9CA3AF'
              }}
            >
              <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '6px' }}></i>
              Unpaid Bills ({pendingCount})
            </button>
            <button 
              onClick={() => setFilterTab('paid')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                background: filterTab === 'paid' ? '#10B981' : 'rgba(255,255,255,0.05)',
                color: filterTab === 'paid' ? '#FFF' : '#9CA3AF'
              }}
            >
              <i className="fa-solid fa-[#10B981] fa-circle-check" style={{ marginRight: '6px' }}></i>
              Paid Receipts ({completedCount})
            </button>
            <button 
              onClick={() => setFilterTab('all')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                background: filterTab === 'all' ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                color: filterTab === 'all' ? '#FFF' : '#9CA3AF'
              }}
            >
              <i className="fa-solid fa-list" style={{ marginRight: '6px' }}></i>
              All Orders ({orders.length})
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}></i>
            <input 
              type="text"
              placeholder="Search Table # or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Main Cashier Workspace Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedOrderForBill ? '1fr 420px' : '1fr', gap: '24px' }}>
          
          {/* Bills List Table */}
          <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-receipt" style={{ color: '#F59E0B' }}></i>
              Table Invoices & Bills List ({filteredOrders.length})
            </h2>

            {filteredOrders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '36px', marginBottom: '12px' }}></i>
                <p>No table bills found matching the selected filter.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}>
                      <th style={{ padding: '12px' }}>Table #</th>
                      <th style={{ padding: '12px' }}>Order ID</th>
                      <th style={{ padding: '12px' }}>Time</th>
                      <th style={{ padding: '12px' }}>Dishes</th>
                      <th style={{ padding: '12px' }}>Subtotal</th>
                      <th style={{ padding: '12px' }}>Total Bill</th>
                      <th style={{ padding: '12px' }}>Bill Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Cashier Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const isSelected = selectedOrderForBill?._id === order._id;
                      const isPaid = order.paymentStatus === 'paid';
                      return (
                        <tr 
                          key={order._id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                            cursor: 'pointer'
                          }}
                          onClick={() => openBillModal(order)}
                        >
                          <td style={{ padding: '12px', fontWeight: 800, color: '#F59E0B' }}>
                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>
                              Table #{order.tableNum}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#9CA3AF' }}>
                            #{order._id.substring(order._id.length - 6).toUpperCase()}
                          </td>
                          <td style={{ padding: '12px', color: '#9CA3AF' }}>
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px', color: '#D1D5DB' }}>
                            {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                          </td>
                          <td style={{ padding: '12px', color: '#9CA3AF' }}>
                            {formatPrice(order.subtotal || order.total * 0.9)}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: isPaid ? '#34D399' : '#F87171', fontSize: '15px' }}>
                            {formatPrice(order.total)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: isPaid ? '#34D399' : '#F87171'
                            }}>
                              {isPaid ? 'PAID' : 'UNPAID'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button 
                              className="btn-action"
                              style={{ 
                                padding: '5px 12px', 
                                fontSize: '12px', 
                                background: isPaid ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.2)',
                                borderColor: isPaid ? 'rgba(255,255,255,0.2)' : '#F59E0B',
                                color: isPaid ? '#FFF' : '#F59E0B'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openBillModal(order);
                              }}
                            >
                              <i className={`fa-solid ${isPaid ? 'fa-receipt' : 'fa-cash-register'}`}></i>
                              {isPaid ? ' View Bill' : ' Process Bill'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Drawer: Selected Table Bill & Payment Checkout */}
          {selectedOrderForBill && (
            <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#F59E0B' }}>
                  <i className="fa-solid fa-file-invoice"></i> Table #{selectedOrderForBill.tableNum} Bill Summary
                </h3>
                <button 
                  onClick={() => setSelectedOrderForBill(null)}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '16px' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Itemized breakdown */}
              <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Ordered Items</div>
                {selectedOrderForBill.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#F59E0B', fontWeight: 700, marginRight: '6px' }}>{item.qty}x</span>
                      <span style={{ color: '#FFF' }}>{item.name}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#D1D5DB' }}>
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Math */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#9CA3AF' }}>
                  <span>Subtotal:</span>
                  <span>{formatPrice(selectedOrderForBill.subtotal || selectedOrderForBill.total * 0.9)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#9CA3AF' }}>
                  <span>GST & Service Tax (10%):</span>
                  <span>{formatPrice(selectedOrderForBill.tax || selectedOrderForBill.total * 0.1)}</span>
                </div>
                
                {/* Discount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', color: '#F59E0B' }}>
                  <span>Discount:</span>
                  <select 
                    value={discountPercent} 
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value={0} style={{ color: '#000' }}>0% Regular</option>
                    <option value={5} style={{ color: '#000' }}>5% VIP Member</option>
                    <option value={10} style={{ color: '#000' }}>10% Staff / Promo</option>
                  </select>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: '#FFF' }}>Net Payable Total:</span>
                  <span style={{ fontWeight: 900, fontSize: '22px', color: '#34D399' }}>
                    {formatPrice(selectedOrderForBill.total * (1 - discountPercent / 100))}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              {selectedOrderForBill.paymentStatus === 'unpaid' ? (
                <div>
                  <label style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Select Payment Method:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <button 
                      onClick={() => setPaymentMethod('UPI')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: paymentMethod === 'UPI' ? '#34D399' : 'rgba(255,255,255,0.1)',
                        background: paymentMethod === 'UPI' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: paymentMethod === 'UPI' ? '#34D399' : '#9CA3AF',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-qrcode" style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}></i>
                      UPI / QR
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('Card')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: paymentMethod === 'Card' ? '#34D399' : 'rgba(255,255,255,0.1)',
                        background: paymentMethod === 'Card' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: paymentMethod === 'Card' ? '#34D399' : '#9CA3AF',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-credit-card" style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}></i>
                      Credit Card
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('Cash')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: paymentMethod === 'Cash' ? '#34D399' : 'rgba(255,255,255,0.1)',
                        background: paymentMethod === 'Cash' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: paymentMethod === 'Cash' ? '#34D399' : '#9CA3AF',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-money-bill-wave" style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}></i>
                      Cash
                    </button>
                  </div>

                  <button 
                    onClick={() => handleProcessPayment(selectedOrderForBill._id)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFF',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <i className="fa-solid fa-circle-check"></i> Collect Payment & Mark Bill Paid
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#34D399', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', marginBottom: '14px' }}>
                    <i className="fa-solid fa-[#34D399] fa-circle-check"></i> This bill has been fully settled and paid!
                  </div>
                  <button 
                    onClick={() => setIsReceiptModalOpen(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#FFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-print"></i> Print Official Thermal Invoice
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Printable Thermal Receipt Modal */}
      {isReceiptModalOpen && receiptData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: '#FFF', color: '#000', width: '360px', padding: '24px', borderRadius: '12px', fontFamily: 'Courier New, monospace', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '12px', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>AURA FINE DINING</h2>
              <p style={{ margin: '4px 0', fontSize: '11px' }}>108 Signature Tower, Golf Course Road</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}>GSTIN: 07AAAAA0000A1Z5 &bull; Ph: +91 98765 43210</p>
            </div>

            <div style={{ fontSize: '12px', marginBottom: '12px' }}>
              <div><strong>Receipt #:</strong> {receiptData._id.substring(receiptData._id.length - 8).toUpperCase()}</div>
              <div><strong>Table #:</strong> {receiptData.tableNum}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
              <div><strong>Payment Mode:</strong> {paymentMethod} (SUCCESS)</div>
              <div><strong>Cashier:</strong> {cashierName}</div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', borderTop: '1px dashed #000', padding: '8px 0', marginBottom: '12px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Amount</span>
              </div>
              {receiptData.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>{it.name}</span>
                  <span>{it.qty} x {it.price}</span>
                  <span>{it.qty * it.price}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{(receiptData.subtotal || receiptData.total * 0.9).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST (10%):</span>
                <span>₹{(receiptData.tax || receiptData.total * 0.1).toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                  <span>Discount ({discountPercent}%):</span>
                  <span>-₹{(receiptData.total * (discountPercent / 100)).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #000', paddingTop: '6px', marginTop: '6px' }}>
                <span>TOTAL PAID:</span>
                <span>₹{(receiptData.total * (1 - discountPercent / 100)).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', borderTop: '2px dashed #000', paddingTop: '10px' }}>
              <p style={{ margin: '2px 0', fontWeight: 'bold' }}>*** THANK YOU FOR DINING WITH US ***</p>
              <p style={{ margin: '2px 0' }}>Please Visit Again!</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={handlePrint}
                style={{ flex: 1, padding: '10px', background: '#000', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Print Invoice
              </button>
              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ flex: 1, padding: '10px', background: '#E5E7EB', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
