import React from 'react';

export default function Navbar({ 
  activeCustomerSession, 
  roomName, 
  cartCount, 
  onOpenAuth, 
  onOpenWaiter, 
  onOpenReviews,
  onOpenAiAnalyzer,
  onScrollToOrder,
  onOpenOrdersHistory,
  onLogout
}) {
  const { isLoggedIn, customerName, tableNum, loginType } = activeCustomerSession;
  
  return (
    <header className="navbar-header glass">
      <div className="navbar-container">
        {/* Left: Brand Logo */}
        <a href="#" className="brand-container" onClick={(e) => e.preventDefault()}>
          <div className="brand-logo">
            <i className="fa-solid fa-utensils"></i>
          </div>
          <div className="brand-text-box">
            <div className="brand-title">AURA</div>
            <div className="brand-subtitle">SMART DINING</div>
          </div>
        </a>

        {/* Center: Live Table Session Status */}
        <div className="nav-session-pill">
          <span className="live-dot"></span>
          <span className="session-text">
            {isLoggedIn ? `Table #0${tableNum} • ${customerName}` : 'Table #08 • Smart Dining'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="nav-actions-group">
          {isLoggedIn && loginType === 'member' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#1E3A5F', background: '#D6EAF8', padding: '5px 12px', borderRadius: '20px', letterSpacing: '0.3px' }}>
                👤 {customerName}
              </span>
              <button 
                className="nav-btn nav-btn-outline" 
                onClick={onOpenOrdersHistory} 
                title="Open My Member Dashboard"
                style={{
                  borderColor: '#F97316',
                  color: '#1E3A5F',
                  background: '#FEF3C7',
                  fontWeight: 900
                }}
              >
                <i className="fa-solid fa-chart-pie" style={{ color: '#F97316' }}></i>
                <span className="btn-label" style={{ fontWeight: 900 }}>Dashboard</span>
              </button>
            </div>
          )}

          {isLoggedIn && loginType !== 'member' && (
            <button 
              className="nav-btn nav-btn-outline" 
              onClick={onOpenOrdersHistory} 
              title="Open My Member Dashboard"
              style={{
                borderColor: '#F97316',
                color: '#1E3A5F',
                background: '#FEF3C7',
                fontWeight: 900
              }}
            >
              <i className="fa-solid fa-chart-pie" style={{ color: '#F97316' }}></i>
              <span className="btn-label" style={{ fontWeight: 900 }}>Dashboard</span>
            </button>
          )}

          <button 
            className="nav-btn nav-btn-outline" 
            onClick={onOpenReviews} 
            title="Customer Reviews & Ratings"
            style={{
              borderColor: '#F97316',
              color: '#1E3A5F',
              background: '#FFF7ED',
              fontWeight: 900
            }}
          >
            <i className="fa-solid fa-star" style={{ color: '#F97316' }}></i>
            <span className="btn-label" style={{ fontWeight: 900 }}>Customer Reviews</span>
          </button>

          <button 
            className="nav-btn nav-btn-outline" 
            onClick={onOpenAiAnalyzer} 
            title="Gemini 2.5 AI Customer Review & Sentiment Analyzer"
            style={{
              borderColor: '#8B5CF6',
              color: '#FFF',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
            }}
          >
            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#FFF' }}></i>
            <span className="btn-label" style={{ fontWeight: 900, color: '#FFF' }}>🤖 AI Review Analyzer</span>
          </button>

          <button className="nav-btn nav-btn-outline" onClick={onOpenWaiter} title="Call Waiter Assistance">
            <i className="fa-solid fa-bell" style={{ color: '#F59E0B' }}></i>
            <span className="btn-label">Call Waiter</span>
          </button>

          {isLoggedIn ? (
            <button className="nav-btn nav-btn-outline" onClick={onLogout} title="Logout Session">
              <i className="fa-solid fa-right-from-bracket" style={{ color: '#EF4444' }}></i>
              <span className="btn-label">Logout</span>
            </button>
          ) : (
            <button className="nav-btn nav-btn-outline" onClick={onOpenAuth}>
              <i className="fa-solid fa-user-shield" style={{ color: '#8B5CF6' }}></i>
              <span className="btn-label">Sign In</span>
            </button>
          )}

          <button className="nav-btn nav-btn-primary" onClick={onScrollToOrder} title="View Table Order Cart">
            <i className="fa-solid fa-basket-shopping"></i>
            <span>Order</span>
            {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
