import React from 'react';

export default function HeroSection({ activeCustomerSession }) {
  const { isLoggedIn, tableNum, customerName } = activeCustomerSession;
  
  return (
    <section className="hero-section" style={{ marginTop: '16px', marginBottom: '24px' }}>
      <div className="hero-card-redesigned glass">
        {/* Left Hero Content */}
        <div className="hero-left-content">
          <div className="hero-tag-badge">
            <i className="fa-solid fa-sparkles"></i> REAL-TIME COLLABORATIVE DINING
          </div>
          <h1 className="hero-main-title">
            Elevate Your Dining <span>Together</span>
          </h1>
          <p className="hero-description">
            Order seamlessly with your table companions in real time. Items sync instantly across all devices at 
            <strong> Table #0{isLoggedIn ? tableNum : 8}</strong> using our high-speed smart dining network.
          </p>

          <div className="hero-stats-row">
            <div className="stat-card">
              <div className="stat-val">4.9 ★</div>
              <div className="stat-lbl">Chef Rating</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card">
              <div className="stat-val">12-18 min</div>
              <div className="stat-lbl">Avg Prep Time</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card">
              <div className="stat-val">8 Tables</div>
              <div className="stat-lbl">Smart Floor Plan</div>
            </div>
          </div>
        </div>
        
        {/* Right Companions Widget */}
        <div className="hero-right-widget">
          <div className="companions-box glass">
            <div className="companions-header">
              <div>
                <div className="comp-title">Table #0{isLoggedIn ? tableNum : '8'} Companions</div>
                <div className="comp-sub">{isLoggedIn ? `Active Diner: ${customerName}` : 'Diner Session Active'}</div>
              </div>
              <span className="live-status-tag">
                <i className="fa-solid fa-wifi"></i> Connected
              </span>
            </div>

            <div className="diners-avatars-row">
              <div className="avatar-circle host-avatar" title="You (Host)">
                <i className="fa-solid fa-user-check"></i>
              </div>
              <div className="avatar-circle" title="Alex">
                <span>A</span>
              </div>
              <div className="avatar-circle" title="Sophia">
                <span>S</span>
              </div>
              <div className="avatar-circle extra-count">+1</div>
            </div>

            <div className="companions-footer">
              <span>Shared Table Cart</span>
              <span className="sync-badge">
                <i className="fa-solid fa-rotate-dash"></i> Live Synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
