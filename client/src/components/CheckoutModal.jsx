import React, { useState, useEffect } from 'react';

export default function CheckoutModal({
  isOpen,
  onClose,
  activeCustomerSession,
  sessionData,
  onPaymentSuccess,
  onCancel
}) {
  const [step, setStep] = useState('bill'); // 'bill', 'confirm', 'payment_choice', 'cash_pending', 'demo_gateway', 'success_receipt', 'vacating_timer'
  const [selectedMethod, setSelectedMethod] = useState('demo_upi');
  const [upiId, setUpiId] = useState('customer@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 7890');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState('HEET CHHEDA');
  const [isProcessing, setIsProcessing] = useState(false);

  // Timers
  const [cashTimer, setCashTimer] = useState(300); // 5 minutes
  const [vacatingTimer, setVacatingTimer] = useState(300); // 5 minutes
  const [liveSession, setLiveSession] = useState(sessionData || null);

  useEffect(() => {
    if (sessionData) {
      setLiveSession(sessionData);
      if (sessionData.status === 'Awaiting Cash Payment') {
        setStep('cash_pending');
      } else if (sessionData.status === 'Payment Completed' || sessionData.paymentStatus === 'paid') {
        setStep('vacating_timer');
      }
    }
  }, [sessionData]);

  // Cash 5-minute countdown
  useEffect(() => {
    let interval = null;
    if (step === 'cash_pending' && cashTimer > 0) {
      interval = setInterval(() => {
        setCashTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, cashTimer]);

  // Vacating 5-minute countdown
  useEffect(() => {
    let interval = null;
    if (step === 'vacating_timer' && vacatingTimer > 0) {
      interval = setInterval(() => {
        setVacatingTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, vacatingTimer]);

  if (!isOpen) return null;

  const tableNum = activeCustomerSession?.tableNum || 2;
  const customerName = activeCustomerSession?.customerName || 'Customer';
  const items = liveSession?.items || [
    { name: 'Truffle Mushroom Risotto', price: 450, qty: 1, subtotal: 450 },
    { name: 'Artisan Garlic Bread', price: 180, qty: 1, subtotal: 180 },
    { name: 'Craft Berry Mocktail', price: 220, qty: 2, subtotal: 440 }
  ];
  const subtotal = liveSession?.subtotal || items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const tax = liveSession?.tax || Math.round(subtotal * 0.05);
  const discount = liveSession?.discount || 0;
  const grandTotal = liveSession?.grandTotal || (subtotal + tax - discount);
  const orderId = liveSession?.orderId || `ORD_${tableNum}_${Date.now().toString().slice(-6)}`;
  const txnId = liveSession?.demoTransactionId || `TXN_DEMO_${Math.floor(100000 + Math.random() * 900000)}`;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProceedToPaymentChoice = async () => {
    try {
      const res = await fetch('/api/checkout/request-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNum, customerName })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setLiveSession(data.session);
      }
    } catch (e) {}
    setStep('payment_choice');
  };

  const handleSelectCash = async () => {
    try {
      const res = await fetch('/api/checkout/select-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNum, paymentMethod: 'cash' })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setLiveSession(data.session);
      }
    } catch (e) {}
    setCashTimer(300);
    setStep('cash_pending');
  };

  const handleSelectOnline = () => {
    setStep('demo_gateway');
  };

  const handleExecuteDemoPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate 3-second realistic gateway processing delay
    setTimeout(async () => {
      try {
        const res = await fetch('/api/checkout/process-demo-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNum, paymentMethod: selectedMethod })
        });
        const data = await res.json();
        if (data.success && data.session) {
          setLiveSession(data.session);
        }
      } catch (err) {}
      setIsProcessing(false);
      setStep('success_receipt');
      if (onPaymentSuccess) onPaymentSuccess();
    }, 3000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 9999 }}>
      <div className="modal-card glass" style={{ maxWidth: '640px', width: '95%', padding: '24px', borderRadius: '24px' }}>
        
        {/* Modal Close Button */}
        {step !== 'vacating_timer' && (
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}

        {/* Header Step Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900 }}>
              {step === 'bill' || step === 'confirm' ? '1' : step === 'payment_choice' || step === 'demo_gateway' || step === 'cash_pending' ? '2' : '3'}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
                {step === 'bill' && 'Itemized Session Bill'}
                {step === 'confirm' && 'Confirm Finish Dining'}
                {step === 'payment_choice' && 'Select Payment Method'}
                {step === 'cash_pending' && 'Pay at Cashier Counter'}
                {step === 'demo_gateway' && 'AURA Demo Payment Gateway'}
                {step === 'success_receipt' && 'Payment Receipt & Confirmation'}
                {step === 'vacating_timer' && 'Thank You For Dining With Us!'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                Table #{tableNum} • {customerName}
              </p>
            </div>
          </div>
          <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            {orderId}
          </span>
        </div>

        {/* STEP 1: Itemized Bill */}
        {step === 'bill' && (
          <div>
            <div style={{ background: '#0F172A', borderRadius: '16px', padding: '16px', border: '1px solid #1E3A5F', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #334155', paddingBottom: '10px', marginBottom: '10px', fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>TOTAL</span>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13.5px', color: '#E2E8F0', fontWeight: 600 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#FFF' }}>{item.name}</div>
                    </div>
                    <div style={{ color: '#94A3B8' }}>{item.qty} × ₹{item.price}</div>
                    <div style={{ fontWeight: 800, color: '#F97316' }}>₹{item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              {/* Bill Totals Summary */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
                  <span>GST Taxes (5%)</span>
                  <span>₹{tax}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10B981', marginBottom: '4px' }}>
                    <span>Discounts</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#FFF', fontWeight: 900, marginTop: '8px', paddingTop: '8px', borderTop: '1.5px solid #F97316' }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#F97316' }}>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="button" onClick={onClose} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontWeight: 800, cursor: 'pointer' }}>
                Continue Ordering
              </button>
              <button type="button" onClick={() => setStep('confirm')} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#FFF', fontWeight: 900, fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}>
                Request Checkout &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Confirmation Popup ("Finish Dining?") */}
        {step === 'confirm' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '2px solid #F59E0B', color: '#FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto' }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 10px 0' }}>
              Finish Dining &amp; Pay Bill?
            </h3>
            <p style={{ color: '#CBD5E1', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid #334155' }}>
              ⚠️ Are you done placing orders? After proceeding to checkout, ordering functionality will be paused for your table unless a cashier or manager reopens your session.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="button" onClick={() => setStep('bill')} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontWeight: 800, cursor: 'pointer' }}>
                Keep Ordering
              </button>
              <button type="button" onClick={handleProceedToPaymentChoice} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFF', fontWeight: 900, fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Selection (Cash vs Demo Online) */}
        {step === 'payment_choice' && (
          <div>
            <div style={{ background: '#0F172A', padding: '16px', borderRadius: '16px', border: '1px solid #1E3A5F', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                TOTAL AMOUNT PAYABLE
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#F97316', margin: '4px 0' }}>
                ₹{grandTotal}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Option 1: Pay at Cashier */}
              <div 
                onClick={handleSelectCash}
                style={{ background: 'rgba(30, 58, 95, 0.4)', border: '2px solid #3B82F6', borderRadius: '18px', padding: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.15)' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px auto' }}>
                  <i className="fa-solid fa-money-bill-wave"></i>
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 900, color: '#FFF' }}>Pay at Cashier Counter</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
                  Pay cash or card directly to the cashier. Starts 5:00 payment timer.
                </p>
              </div>

              {/* Option 2: Online Payment Demo Gateway */}
              <div 
                onClick={handleSelectOnline}
                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10B981', borderRadius: '18px', padding: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px auto' }}>
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 900, color: '#FFF' }}>Online Payment (Demo)</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
                  Instant simulated UPI / Card gateway test. No real money deducted.
                </p>
              </div>
            </div>

            <button type="button" onClick={() => setStep('bill')} style={{ width: '100%', background: 'transparent', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}>
              &larr; Back to bill details
            </button>
          </div>
        )}

        {/* STEP 4A: Cash Pending Timer */}
        {step === 'cash_pending' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', border: '3px solid #3B82F6', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px auto' }}>
              <i className="fa-solid fa-clock"></i>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 6px 0' }}>
              Awaiting Cash Payment at Counter
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 20px 0' }}>
              Please visit the cashier counter to complete your bill payment of <strong style={{ color: '#F97316' }}>₹{grandTotal}</strong>.
            </p>

            {/* Countdown Timer Display */}
            <div style={{ background: '#0F172A', padding: '20px', borderRadius: '20px', border: cashTimer === 0 ? '2px solid #EF4444' : '2px solid #3B82F6', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {cashTimer === 0 ? '⚠️ PAYMENT OVERDUE' : 'PAYMENT COUNTDOWN TIMER'}
              </span>
              <div style={{ fontSize: '42px', fontWeight: 900, color: cashTimer === 0 ? '#F87171' : '#38BDF8', fontFamily: 'monospace', margin: '6px 0' }}>
                {cashTimer === 0 ? '0:00 - Overdue' : formatTimer(cashTimer)}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                {cashTimer === 0 ? 'Cashier has been notified of payment delay.' : 'Notification sent to Cashier Portal.'}
              </p>
            </div>

            <button type="button" onClick={() => setStep('payment_choice')} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontWeight: 800, cursor: 'pointer' }}>
              Change Payment Method
            </button>
          </div>
        )}

        {/* STEP 4B: Demo Online Payment Gateway */}
        {step === 'demo_gateway' && (
          <div>
            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ display: 'inline-block', width: '56px', height: '56px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#FFF', margin: 0 }}>
                  Processing Demo Online Payment...
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '6px' }}>
                  Simulating secure bank &amp; gateway handshake. Please do not close this window.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteDemoPayment}>
                <div style={{ background: '#0F172A', padding: '14px', borderRadius: '14px', border: '1px solid #1E3A5F', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>MERCHANT</span>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFF' }}>AURA Smart Dining</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AMOUNT</span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981' }}>₹{grandTotal}</div>
                  </div>
                </div>

                {/* Gateway Tab Selectors */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['demo_upi', 'demo_card', 'demo_netbanking', 'demo_wallet'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: selectedMethod === method ? '1.5px solid #10B981' : '1px solid #334155',
                        background: selectedMethod === method ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: selectedMethod === method ? '#34D399' : '#94A3B8',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {method === 'demo_upi' && '📱 Google Pay / PhonePe UPI'}
                      {method === 'demo_card' && '💳 Credit / Debit Card'}
                      {method === 'demo_netbanking' && '🏦 Net Banking'}
                      {method === 'demo_wallet' && '👛 Digital Wallet'}
                    </button>
                  ))}
                </div>

                {/* Fields for UPI */}
                {selectedMethod === 'demo_upi' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '6px' }}>
                      Enter Virtual Payment Address (VPA / UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #334155', background: '#0F172A', color: '#FFF', fontSize: '14px', fontWeight: 700, outline: 'none' }}
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                      💡 Demo Gateway: Any VPA formatted text will be accepted instantly.
                    </span>
                  </div>
                )}

                {/* Fields for Card */}
                {selectedMethod === 'demo_card' && (
                  <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '4px' }}>Cardholder Name</label>
                      <input type="text" value={cardHolder} onChange={e => setCardHolder(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#0F172A', color: '#FFF', fontSize: '13px', fontWeight: 700 }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '4px' }}>16-Digit Card Number</label>
                      <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#0F172A', color: '#FFF', fontSize: '13px', fontWeight: 700 }} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '4px' }}>Expiry</label>
                        <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#0F172A', color: '#FFF', fontSize: '13px', fontWeight: 700 }} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '4px' }}>CVV</label>
                        <input type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value)} maxLength="4" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#0F172A', color: '#FFF', fontSize: '13px', fontWeight: 700 }} required />
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking & Wallet Info */}
                {(selectedMethod === 'demo_netbanking' || selectedMethod === 'demo_wallet') && (
                  <div style={{ background: '#0F172A', padding: '14px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '16px', fontSize: '13px', color: '#94A3B8' }}>
                    <i className="fa-solid fa-building-columns" style={{ marginRight: '6px', color: '#34D399' }}></i>
                    Demo Bank / Wallet portal ready. Click <strong>Pay Now</strong> below to process instantly.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button type="button" onClick={() => setStep('payment_choice')} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontWeight: 800, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFF', fontWeight: 900, fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
                    <i className="fa-solid fa-lock" style={{ marginRight: '6px' }}></i> Pay ₹{grandTotal} (Demo)
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STEP 5: Payment Success Receipt */}
        {step === 'success_receipt' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10B981', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 10px auto' }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 4px 0' }}>
                Payment Successful!
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
                Demo Transaction Complete • Payment Status: <strong style={{ color: '#34D399' }}>SUCCESS (DEMO)</strong>
              </p>
            </div>

            {/* Printable Receipt Card */}
            <div id="printable-receipt" style={{ background: '#0F172A', padding: '18px', borderRadius: '18px', border: '1px solid #1E3A5F', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800 }}>TRANSACTION ID</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>{txnId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800 }}>DATE &amp; TIME</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#E2E8F0' }}>{new Date().toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', color: '#CBD5E1', marginBottom: '12px' }}>
                <div><strong>Table:</strong> #{tableNum}</div>
                <div><strong>Customer:</strong> {customerName}</div>
                <div><strong>Payment Method:</strong> {selectedMethod.toUpperCase()}</div>
                <div><strong>Amount Paid:</strong> ₹{grandTotal}</div>
              </div>

              <button 
                type="button" 
                onClick={handlePrintReceipt}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: '#1E293B', color: '#60A5FA', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-print"></i> Download / Print Demo Receipt
              </button>
            </div>

            <button 
              type="button" 
              onClick={() => setStep('vacating_timer')} 
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#FFF', fontWeight: 900, fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
            >
              Continue to Table Vacating Screen &rarr;
            </button>
          </div>
        )}

        {/* STEP 6: Table Vacating Countdown Timer */}
        {step === 'vacating_timer' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.15)', border: '3px solid #F97316', color: '#FB923C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px auto' }}>
              <i className="fa-solid fa-heart"></i>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 6px 0' }}>
              Thank You For Dining With Us!
            </h3>
            <p style={{ color: '#CBD5E1', fontSize: '13.5px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Your bill of <strong style={{ color: '#10B981' }}>₹{grandTotal}</strong> has been marked as <strong>PAID</strong>. Please vacate your table within 5 minutes so floor hosts can sanitize it for the next guests.
            </p>

            {/* Countdown Display */}
            <div style={{ background: '#0F172A', padding: '24px', borderRadius: '20px', border: '2px solid #F97316', marginBottom: '20px', boxShadow: '0 4px 20px rgba(249,115,22,0.2)' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                PLEASE VACATE TABLE IN
              </span>
              <div style={{ fontSize: '52px', fontWeight: 900, color: '#FB923C', fontFamily: 'monospace', margin: '8px 0' }}>
                {formatTimer(vacatingTimer)}
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, display: 'inline-block' }}>
                🔒 Ordering functions locked during checkout session.
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              🧹 Waiter &amp; Floor Host notified to start table cleaning.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
