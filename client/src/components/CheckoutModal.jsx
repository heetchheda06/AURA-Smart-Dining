import React, { useState, useEffect } from 'react';

export default function CheckoutModal({
  isOpen,
  onClose,
  activeCustomerSession,
  sessionData,
  onPaymentSuccess,
  onCancel
}) {
  const [step, setStep] = useState('bill');
  const [selectedMethod, setSelectedMethod] = useState('demo_upi');
  const [upiId, setUpiId] = useState('customer@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 7890');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState('HEET CHHEDA');
  const [isProcessing, setIsProcessing] = useState(false);

  const [cashTimer, setCashTimer] = useState(300);
  const [vacatingTimer, setVacatingTimer] = useState(300);
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

  useEffect(() => {
    let interval = null;
    if (step === 'cash_pending' && cashTimer > 0) {
      interval = setInterval(() => setCashTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, cashTimer]);

  useEffect(() => {
    let interval = null;
    if (step === 'vacating_timer' && vacatingTimer > 0) {
      interval = setInterval(() => setVacatingTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, vacatingTimer]);

  if (!isOpen) return null;

  const tableNum = activeCustomerSession?.tableNum || 2;
  const customerName = activeCustomerSession?.customerName || 'Customer';
  const items = liveSession?.items || [
    { name: 'Truffle Mushroom Risotto', price: 450, qty: 1 },
    { name: 'Artisan Garlic Bread', price: 180, qty: 1 },
    { name: 'Craft Berry Mocktail', price: 220, qty: 2 }
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
      if (data.success && data.session) setLiveSession(data.session);
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
      if (data.success && data.session) setLiveSession(data.session);
    } catch (e) {}
    setCashTimer(300);
    setStep('cash_pending');
  };

  const handleSelectOnline = () => setStep('demo_gateway');

  const handleExecuteDemoPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        const res = await fetch('/api/checkout/process-demo-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNum, paymentMethod: selectedMethod })
        });
        const data = await res.json();
        if (data.success && data.session) setLiveSession(data.session);
      } catch (err) {}
      setIsProcessing(false);
      setStep('success_receipt');
      if (onPaymentSuccess) onPaymentSuccess();
    }, 3000);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  // ─── Shared Styles ────────────────────────────────────────────────────────
  const overlay = {
    position: 'fixed', inset: 0,
    background: 'rgba(2, 6, 23, 0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '16px'
  };

  const card = {
    background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
    border: '1px solid rgba(249,115,22,0.3)',
    borderRadius: '28px',
    padding: '28px',
    maxWidth: '640px',
    width: '100%',
    position: 'relative',
    boxShadow: '0 0 60px rgba(249,115,22,0.15), 0 20px 60px rgba(0,0,0,0.6)',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const btnOrange = {
    padding: '14px 20px', borderRadius: '14px', border: 'none',
    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    color: '#FFF', fontWeight: 900, fontSize: '14px', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(249,115,22,0.45)',
    transition: 'all 0.2s', width: '100%', letterSpacing: '0.3px'
  };

  const btnGreen = {
    padding: '14px 20px', borderRadius: '14px', border: 'none',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: '#FFF', fontWeight: 900, fontSize: '14px', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(16,185,129,0.45)',
    transition: 'all 0.2s', width: '100%'
  };

  const btnCancel = {
    padding: '13px 20px', borderRadius: '14px',
    border: '1.5px solid rgba(239,68,68,0.5)',
    background: 'rgba(239,68,68,0.08)',
    color: '#F87171', fontWeight: 800, fontSize: '13px',
    cursor: 'pointer', width: '100%', transition: 'all 0.2s'
  };

  const btnGhost = {
    padding: '13px 20px', borderRadius: '14px',
    border: '1.5px solid rgba(148,163,184,0.25)',
    background: 'rgba(255,255,255,0.04)',
    color: '#94A3B8', fontWeight: 800, fontSize: '13px',
    cursor: 'pointer', width: '100%'
  };

  const stepLabel = {
    fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: '#F97316',
    background: 'rgba(249,115,22,0.1)',
    border: '1px solid rgba(249,115,22,0.25)',
    padding: '4px 12px', borderRadius: '20px', display: 'inline-block',
    marginBottom: '8px'
  };

  const sectionBox = {
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(248,113,113,0.15)',
    borderRadius: '18px', padding: '18px', marginBottom: '18px'
  };

  // ─── Step Labels ──────────────────────────────────────────────────────────
  const stepTitles = {
    bill: 'Your Itemized Bill',
    confirm: 'Confirm Checkout',
    payment_choice: 'Choose Payment',
    cash_pending: 'Awaiting Cash Payment',
    demo_gateway: 'AURA Payment Gateway',
    success_receipt: 'Payment Confirmed!',
    vacating_timer: 'Thank You For Dining!'
  };

  const stepNumbers = {
    bill: 1, confirm: 1, payment_choice: 2,
    cash_pending: 2, demo_gateway: 2, success_receipt: 3, vacating_timer: 3
  };

  return (
    <div style={overlay}>
      <div style={card}>

        {/* ── Glowing Header ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: '24px', paddingBottom: '18px',
          borderBottom: '1px solid rgba(249,115,22,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #F97316, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 900, color: '#FFF',
              boxShadow: '0 0 20px rgba(249,115,22,0.5)', flexShrink: 0
            }}>
              {stepNumbers[step]}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFF', lineHeight: 1.2 }}>
                {stepTitles[step]}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                Table #{tableNum} &nbsp;•&nbsp; {customerName}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              background: 'rgba(59,130,246,0.15)', color: '#60A5FA',
              border: '1px solid rgba(59,130,246,0.3)',
              padding: '4px 10px', borderRadius: '10px', fontSize: '10px',
              fontWeight: 800, fontFamily: 'monospace', whiteSpace: 'nowrap'
            }}>
              {orderId}
            </span>
            {step !== 'vacating_timer' && (
              <button
                onClick={onClose}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '1px solid rgba(148,163,184,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#64748B', cursor: 'pointer', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 1 — Itemized Bill                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'bill' && (
          <div>
            <div style={sectionBox}>
              {/* Table header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderBottom: '1px dashed rgba(248,113,113,0.2)',
                paddingBottom: '10px', marginBottom: '10px',
                fontSize: '11px', color: '#F97316', fontWeight: 800, letterSpacing: '1px'
              }}>
                <span>ITEM</span><span>QTY × RATE</span><span>TOTAL</span>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ fontWeight: 800, color: '#F1F5F9', fontSize: '13.5px', flex: 1 }}>
                      {item.name}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '12.5px', margin: '0 16px' }}>
                      {item.qty} × ₹{item.price}
                    </div>
                    <div style={{ fontWeight: 900, color: '#FB923C', fontSize: '13.5px' }}>
                      ₹{item.price * item.qty}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(249,115,22,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '5px' }}>
                  <span>Subtotal</span><span style={{ color: '#CBD5E1' }}>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '5px' }}>
                  <span>GST & Tax (5%)</span><span style={{ color: '#CBD5E1' }}>₹{tax}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#34D399', marginBottom: '5px' }}>
                    <span>Discount</span><span>-₹{discount}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '20px', fontWeight: 900, marginTop: '10px',
                  paddingTop: '10px', borderTop: '1.5px solid rgba(249,115,22,0.5)'
                }}>
                  <span style={{ color: '#FFF' }}>Grand Total</span>
                  <span style={{
                    color: '#F97316',
                    textShadow: '0 0 20px rgba(249,115,22,0.6)'
                  }}>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="button" onClick={onClose} style={btnGhost}>
                ← Continue Ordering
              </button>
              <button type="button" onClick={() => setStep('confirm')} style={btnOrange}>
                Request Checkout →
              </button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="button" onClick={handleCancel} style={btnCancel}>
                ✕ Cancel & Close
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Confirm Finish Dining                                  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'confirm' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.2))',
              border: '2px solid #F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', margin: '0 auto 18px auto',
              boxShadow: '0 0 30px rgba(245,158,11,0.3)'
            }}>
              <i className="fa-solid fa-utensils" style={{ color: '#FCD34D' }}></i>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 8px 0' }}>
              Finish Dining & Pay Bill?
            </h3>

            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '16px', padding: '16px', marginBottom: '24px',
              fontSize: '13.5px', color: '#E2E8F0', lineHeight: '1.7', textAlign: 'left'
            }}>
              <strong style={{ color: '#FCD34D' }}>⚠️ Important:</strong> After proceeding to checkout, ordering will be paused for your table. You won't be able to place additional orders unless a cashier or manager reopens your session.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <button type="button" onClick={() => setStep('bill')} style={btnGhost}>
                ← Back to Bill
              </button>
              <button type="button" onClick={handleProceedToPaymentChoice} style={btnGreen}>
                Proceed to Checkout ✓
              </button>
            </div>
            <button type="button" onClick={handleCancel} style={btnCancel}>
              ✕ Cancel Checkout
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 3 — Payment Method Selection                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'payment_choice' && (
          <div>
            {/* Total badge */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(124,58,237,0.1))',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Total Amount Payable
              </div>
              <div style={{
                fontSize: '36px', fontWeight: 900, color: '#FB923C', margin: '4px 0',
                textShadow: '0 0 30px rgba(249,115,22,0.5)'
              }}>
                ₹{grandTotal}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              {/* Cash */}
              <div onClick={handleSelectCash} style={{
                background: 'rgba(59,130,246,0.08)',
                border: '2px solid rgba(59,130,246,0.5)',
                borderRadius: '20px', padding: '22px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.25s',
                boxShadow: '0 4px 20px rgba(59,130,246,0.1)'
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'rgba(59,130,246,0.2)', color: '#60A5FA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', margin: '0 auto 14px auto'
                }}>
                  <i className="fa-solid fa-money-bill-wave"></i>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#F1F5F9', marginBottom: '6px' }}>
                  Pay at Cashier
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                  Cash or card directly at counter. 5 min payment timer.
                </div>
              </div>

              {/* Online */}
              <div onClick={handleSelectOnline} style={{
                background: 'rgba(16,185,129,0.08)',
                border: '2px solid rgba(16,185,129,0.5)',
                borderRadius: '20px', padding: '22px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.25s',
                boxShadow: '0 4px 20px rgba(16,185,129,0.1)'
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'rgba(16,185,129,0.2)', color: '#34D399',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', margin: '0 auto 14px auto'
                }}>
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#F1F5F9', marginBottom: '6px' }}>
                  Online Payment
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                  Instant UPI / Card demo gateway. No real money.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button type="button" onClick={() => setStep('bill')} style={btnGhost}>
                ← Back to Bill
              </button>
              <button type="button" onClick={handleCancel} style={btnCancel}>
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 4A — Cash Pending Timer                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'cash_pending' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%',
              background: 'rgba(59,130,246,0.15)',
              border: '3px solid #3B82F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '34px', margin: '0 auto 18px auto',
              boxShadow: '0 0 30px rgba(59,130,246,0.3)',
              animation: 'pulse 2s infinite'
            }}>
              <i className="fa-solid fa-clock" style={{ color: '#60A5FA' }}></i>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#F1F5F9', margin: '0 0 6px 0' }}>
              Awaiting Cash Payment
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '13.5px', margin: '0 0 22px 0', lineHeight: '1.6' }}>
              Please head to the cashier counter to pay{' '}
              <strong style={{ color: '#FB923C' }}>₹{grandTotal}</strong>
            </p>

            {/* Timer box */}
            <div style={{
              background: 'linear-gradient(145deg, #0F172A, #1E1B4B)',
              border: cashTimer === 0 ? '2px solid #EF4444' : '2px solid #3B82F6',
              borderRadius: '22px', padding: '24px', marginBottom: '20px',
              boxShadow: cashTimer === 0
                ? '0 0 30px rgba(239,68,68,0.3)'
                : '0 0 30px rgba(59,130,246,0.2)'
            }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {cashTimer === 0 ? '⚠️ PAYMENT OVERDUE' : 'PAYMENT COUNTDOWN'}
              </div>
              <div style={{
                fontSize: '52px', fontWeight: 900,
                color: cashTimer === 0 ? '#F87171' : '#38BDF8',
                fontFamily: 'monospace',
                textShadow: cashTimer === 0
                  ? '0 0 20px rgba(239,68,68,0.6)'
                  : '0 0 20px rgba(56,189,248,0.5)'
              }}>
                {cashTimer === 0 ? 'OVERDUE' : formatTimer(cashTimer)}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                {cashTimer === 0 ? 'Cashier has been notified.' : '🔔 Cashier portal notified automatically.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button type="button" onClick={() => setStep('payment_choice')} style={btnGhost}>
                Change Method
              </button>
              <button type="button" onClick={handleCancel} style={btnCancel}>
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 4B — Demo Online Payment Gateway                           */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'demo_gateway' && (
          <div>
            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: '64px', height: '64px', margin: '0 auto 20px auto',
                  border: '4px solid rgba(16,185,129,0.2)',
                  borderTopColor: '#10B981', borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#F1F5F9', margin: '0 0 8px 0' }}>
                  Processing Payment…
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '13px' }}>
                  Secure demo bank & gateway handshake. Please wait.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteDemoPayment}>
                {/* Merchant + Amount */}
                <div style={{
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '16px', padding: '14px',
                  marginBottom: '16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>MERCHANT</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#F1F5F9' }}>AURA Smart Dining</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>AMOUNT</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#34D399' }}>₹{grandTotal}</div>
                  </div>
                </div>

                {/* Method tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['demo_upi', 'demo_card', 'demo_netbanking', 'demo_wallet'].map((method) => (
                    <button key={method} type="button" onClick={() => setSelectedMethod(method)} style={{
                      padding: '9px 13px', borderRadius: '10px',
                      border: selectedMethod === method ? '1.5px solid #10B981' : '1px solid rgba(148,163,184,0.2)',
                      background: selectedMethod === method ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                      color: selectedMethod === method ? '#34D399' : '#94A3B8',
                      fontSize: '12px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                      {method === 'demo_upi' && '📱 UPI / GPay'}
                      {method === 'demo_card' && '💳 Card'}
                      {method === 'demo_netbanking' && '🏦 Net Banking'}
                      {method === 'demo_wallet' && '👛 Wallet'}
                    </button>
                  ))}
                </div>

                {/* UPI */}
                {selectedMethod === 'demo_upi' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '6px' }}>
                      UPI ID / VPA
                    </label>
                    <input
                      type="text" value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        border: '1.5px solid rgba(16,185,129,0.3)',
                        background: 'rgba(15,23,42,0.9)', color: '#F1F5F9',
                        fontSize: '14px', fontWeight: 700, outline: 'none', boxSizing: 'border-box'
                      }}
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#475569', marginTop: '5px', display: 'block' }}>
                      💡 Demo mode — any valid UPI format is accepted instantly.
                    </span>
                  </div>
                )}

                {/* Card */}
                {selectedMethod === 'demo_card' && (
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                    {[
                      { label: 'Cardholder Name', val: cardHolder, set: setCardHolder, type: 'text' },
                      { label: '16-Digit Card Number', val: cardNumber, set: setCardNumber, type: 'text' }
                    ].map(({ label, val, set, type }) => (
                      <div key={label}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '4px' }}>{label}</label>
                        <input type={type} value={val} onChange={e => set(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.9)', color: '#F1F5F9', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }} required />
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '4px' }}>Expiry</label>
                        <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.9)', color: '#F1F5F9', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', fontWeight: 800, marginBottom: '4px' }}>CVV</label>
                        <input type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value)} maxLength="4"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.9)', color: '#F1F5F9', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }} required />
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking / Wallet */}
                {(selectedMethod === 'demo_netbanking' || selectedMethod === 'demo_wallet') && (
                  <div style={{
                    background: 'rgba(15,23,42,0.8)', padding: '14px', borderRadius: '12px',
                    border: '1px solid rgba(52,211,153,0.2)', marginBottom: '16px',
                    fontSize: '13px', color: '#94A3B8'
                  }}>
                    <i className="fa-solid fa-building-columns" style={{ marginRight: '8px', color: '#34D399' }}></i>
                    Demo portal ready. Click <strong style={{ color: '#34D399' }}>Pay Now</strong> to process instantly.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <button type="button" onClick={() => setStep('payment_choice')} style={btnGhost}>
                    ← Back
                  </button>
                  <button type="submit" style={btnGreen}>
                    <i className="fa-solid fa-lock" style={{ marginRight: '6px' }}></i>
                    Pay ₹{grandTotal}
                  </button>
                </div>
                <button type="button" onClick={handleCancel} style={btnCancel}>
                  ✕ Cancel Payment
                </button>
              </form>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 5 — Success Receipt                                        */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'success_receipt' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '3px solid #10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '34px', margin: '0 auto 14px auto',
                boxShadow: '0 0 30px rgba(16,185,129,0.4)'
              }}>
                <i className="fa-solid fa-check" style={{ color: '#34D399' }}></i>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', margin: '0 0 4px 0' }}>
                Payment Successful! 🎉
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
                Demo transaction complete •{' '}
                <strong style={{ color: '#34D399' }}>PAID (DEMO)</strong>
              </p>
            </div>

            {/* Receipt */}
            <div style={{
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '18px', padding: '18px', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, letterSpacing: '1px' }}>TRANSACTION ID</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>{txnId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, letterSpacing: '1px' }}>DATE & TIME</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>{new Date().toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><span style={{ color: '#64748B' }}>Table: </span><strong style={{ color: '#E2E8F0' }}>#{tableNum}</strong></div>
                <div><span style={{ color: '#64748B' }}>Customer: </span><strong style={{ color: '#E2E8F0' }}>{customerName}</strong></div>
                <div><span style={{ color: '#64748B' }}>Method: </span><strong style={{ color: '#E2E8F0' }}>{selectedMethod.replace('demo_','').toUpperCase()}</strong></div>
                <div><span style={{ color: '#64748B' }}>Paid: </span><strong style={{ color: '#34D399' }}>₹{grandTotal}</strong></div>
              </div>
              <button type="button" onClick={() => window.print()} style={{
                width: '100%', marginTop: '14px', padding: '10px',
                borderRadius: '10px', border: '1px solid rgba(96,165,250,0.3)',
                background: 'rgba(59,130,246,0.08)', color: '#60A5FA',
                fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <i className="fa-solid fa-print"></i> Download / Print Receipt
              </button>
            </div>

            <button type="button" onClick={() => setStep('vacating_timer')} style={btnOrange}>
              Continue to Table Vacating Screen →
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 6 — Vacating Timer (FULLY REDESIGNED)                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 'vacating_timer' && (
          <div style={{ textAlign: 'center' }}>
            {/* Animated Heart */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(124,58,237,0.25))',
              border: '3px solid #F97316',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 18px auto',
              boxShadow: '0 0 40px rgba(249,115,22,0.4)',
              animation: 'heartbeat 1.4s ease-in-out infinite'
            }}>
              ❤️
            </div>

            <h3 style={{
              fontSize: '24px', fontWeight: 900, color: '#FFF',
              margin: '0 0 6px 0',
              background: 'linear-gradient(90deg, #FB923C, #A78BFA)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Thank You For Dining!
            </h3>

            <p style={{
              fontSize: '14px', color: '#CBD5E1', lineHeight: '1.7',
              margin: '0 0 22px 0',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(249,115,22,0.15)',
              borderRadius: '14px', padding: '14px'
            }}>
              Your bill of{' '}
              <strong style={{ color: '#34D399', fontSize: '16px' }}>₹{grandTotal}</strong>
              {' '}has been marked as{' '}
              <strong style={{ color: '#10B981' }}>PAID</strong>.
              <br />
              Please vacate your table within 5 minutes so our floor hosts can prepare it for the next guests.
            </p>

            {/* Countdown Box */}
            <div style={{
              background: 'linear-gradient(145deg, #0F0A1E, #1A0A2E)',
              border: vacatingTimer < 60 ? '2px solid #EF4444' : '2px solid #F97316',
              borderRadius: '24px', padding: '28px', marginBottom: '20px',
              boxShadow: vacatingTimer < 60
                ? '0 0 40px rgba(239,68,68,0.35)'
                : '0 0 40px rgba(249,115,22,0.3)',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Glow orb */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: '200px', height: '200px', borderRadius: '50%',
                background: vacatingTimer < 60
                  ? 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}></div>

              <div style={{
                fontSize: '10px', fontWeight: 800, letterSpacing: '3px',
                textTransform: 'uppercase', color: '#64748B', marginBottom: '12px'
              }}>
                PLEASE VACATE TABLE IN
              </div>

              <div style={{
                fontSize: '64px', fontWeight: 900, fontFamily: 'monospace',
                lineHeight: 1,
                color: vacatingTimer < 60 ? '#F87171' : '#FB923C',
                textShadow: vacatingTimer < 60
                  ? '0 0 30px rgba(239,68,68,0.7)'
                  : '0 0 30px rgba(249,115,22,0.7)',
                marginBottom: '14px'
              }}>
                {formatTimer(vacatingTimer)}
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '7px 14px',
                fontSize: '12px', fontWeight: 800, color: '#F87171'
              }}>
                🔒 Ordering locked during checkout
              </div>
            </div>

            {/* Status line */}
            <div style={{
              fontSize: '13px', color: '#64748B', marginBottom: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#10B981', display: 'inline-block',
                boxShadow: '0 0 8px rgba(16,185,129,0.8)',
                animation: 'pulse 1.5s infinite'
              }}></span>
              Waiter & Floor Host notified to start table cleaning
            </div>

            {/* Cancel button — always visible on vacating timer */}
            <button
              type="button"
              onClick={handleCancel}
              style={{
                ...btnCancel,
                fontSize: '14px', padding: '14px',
                border: '1.5px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.1)'
              }}
            >
              ✕ Close & Exit Session
            </button>
          </div>
        )}

        {/* CSS Animations */}
        <style>{`
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            14% { transform: scale(1.12); }
            28% { transform: scale(1); }
            42% { transform: scale(1.06); }
            56% { transform: scale(1); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.92); }
          }
        `}</style>

      </div>
    </div>
  );
}
