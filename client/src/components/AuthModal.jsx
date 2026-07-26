import React, { useState, useEffect, useRef } from 'react';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onGuestLogin, 
  onUserLogin,
  onAdminLogin,
  onGoogleLogin,
  onOpenFloorplan,
  isMandatory
}) {
  const [activeTab, setActiveTab] = useState('guest'); // 'guest', 'user', 'staff'
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [seatCount, setSeatCount] = useState(2);
  const [isWifiInRange, setIsWifiInRange] = useState(true);
  
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');

  const googleBtnRef = useRef(null);

  // Handle Google Button Rendering safely using useRef
  useEffect(() => {
    if (isOpen && activeTab === 'user') {
      const renderGoogle = () => {
        if (googleBtnRef.current && window.google) {
          try {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(
              googleBtnRef.current,
              { theme: "outline", size: "large", width: "340", text: "signin_with" }
            );
            return true;
          } catch (err) {
            console.error("Error rendering Google button inside modal:", err);
          }
        }
        return false;
      };

      if (!renderGoogle()) {
        const timer = setInterval(() => {
          if (renderGoogle()) {
            clearInterval(timer);
          }
        }, 300);
        return () => clearInterval(timer);
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleGuestSubmit = (mode) => {
    if (!isWifiInRange) {
      alert("⚠️ Guest login denied: Please connect to Restaurant Wi-Fi (5 GHz range).");
      return;
    }
    
    if (mode === 'auto') {
      onGuestLogin(guestName || "Guest Customer", seatCount, 'auto');
    } else {
      onOpenFloorplan(seatCount, guestName || "Guest Customer");
    }
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userEmail || !userPassword) {
      alert("⚠️ Please fill in all fields.");
      return;
    }
    onUserLogin(userEmail, userPassword);
  };

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    setStaffError('');
    if (!staffEmail || !staffPassword) {
      setStaffError('Please fill in all fields.');
      return;
    }
    onUserLogin(staffEmail, staffPassword);
  };

  const handleAutofillStaff = (email, password) => {
    setStaffEmail(email);
    setStaffPassword(password);
  };

  const handleGoogleDirectAuth = async () => {
    try {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            executeGoogleBackendLogin();
          }
        });
      } else {
        executeGoogleBackendLogin();
      }
    } catch (err) {
      executeGoogleBackendLogin();
    }
  };

  const executeGoogleBackendLogin = async () => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'google.member@auradining.in',
          name: 'Google Member Diner',
          googleId: 'google_oauth_102938'
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onGoogleLogin) {
          onGoogleLogin(data.user, data.token);
        }
      } else {
        alert(`⚠️ Google Login error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Connection error to Google Auth endpoint.");
    }
  };

  const toggleWifi = () => {
    setIsWifiInRange(!isWifiInRange);
  };

  return (
    <div className="modal-overlay active" id="auth-modal" style={{ zIndex: 9999 }}>
      <div className="modal-card glass auth-card-wide">
        {!isMandatory && (
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        )}
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            <div className="brand-logo" style={{ width: '36px', height: '36px', fontSize: '16px' }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <span className="brand-title" style={{ fontSize: '22px' }}>AURA</span>
          </div>
          <span className="brand-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>
            RESTRICTED ACCESS PORTAL
          </span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: 'var(--text-main)', margin: '4px 0' }}>
            Sign In to Continue
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Authenticate as Guest, Member, or Staff Account.
          </p>
        </div>

        {/* Tab Selection — 3 main tabs */}
        <div className="auth-tab-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button 
            className={`auth-tab-btn ${activeTab === 'guest' ? 'active' : ''}`} 
            onClick={() => setActiveTab('guest')}
          >
            <i className="fa-solid fa-chair" style={{ color: 'var(--accent-emerald)' }}></i>
            <span>Guest Diner</span>
          </button>
          <button 
            className={`auth-tab-btn ${activeTab === 'user' ? 'active' : ''}`} 
            onClick={() => setActiveTab('user')}
          >
            <i className="fa-solid fa-user-shield" style={{ color: 'var(--accent-purple)' }}></i>
            <span>Member Login</span>
          </button>
          <button 
            className={`auth-tab-btn ${activeTab === 'staff' ? 'active' : ''}`} 
            onClick={() => setActiveTab('staff')}
          >
            <i className="fa-solid fa-lock" style={{ color: '#F59E0B' }}></i>
            <span>Staff & Admin</span>
          </button>
        </div>

        {/* ========= TAB 1: GUEST DINER LOGIN ========= */}
        {activeTab === 'guest' && (
          <div id="auth-tab-guest" className="auth-tab-content">
            
            {/* Wi-Fi Frequency Radar Card */}
            <div className={`wifi-detector-card ${!isWifiInRange ? 'out-of-range' : ''}`} id="wifi-card">
              <div className="wifi-info-left">
                <div 
                  className="wifi-pulse-icon" 
                  id="wifi-icon-box"
                  style={{
                    background: isWifiInRange ? 'rgba(16, 185, 129, 0.2)' : 'rgba(230, 57, 70, 0.2)',
                    color: isWifiInRange ? 'var(--accent-emerald)' : 'var(--secondary)'
                  }}
                >
                  <i className={`fa-solid ${isWifiInRange ? 'fa-wifi' : 'fa-wifi-slash'}`}></i>
                </div>
                <div>
                  <div className="wifi-status-title">
                    <span>
                      {isWifiInRange ? 'SSID: AURA_RESTAURANT_5G' : 'SSID: Not Connected to Restaurant Wi-Fi'}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '10px', 
                        background: isWifiInRange ? 'rgba(16,185,129,0.2)' : 'rgba(230,57,70,0.2)', 
                        color: isWifiInRange ? 'var(--accent-emerald)' : 'var(--secondary)',
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}
                    >
                      {isWifiInRange ? 'VERIFIED ON-SITE' : 'OUT OF RANGE'}
                    </span>
                  </div>
                  <div className="wifi-status-sub">
                    {isWifiInRange ? (
                      <>Frequency: <strong>5.785 GHz (5G Band)</strong> &bull; Proximity: <strong>~4m (In Restaurant)</strong></>
                    ) : (
                      <>Frequency: <strong>Unknown / Off-Premises</strong> &bull; Proximity: <strong>&gt; 250m Away</strong></>
                    )}
                  </div>
                </div>
              </div>
              <button className="wifi-toggle-switch" onClick={toggleWifi}>
                <i className="fa-solid fa-arrows-rotate"></i> <span>
                  {isWifiInRange ? 'Simulate Out of Range' : 'Simulate Connected On-Site'}
                </span>
              </button>
            </div>

            {!isWifiInRange && (
              <div style={{ background: 'rgba(230, 57, 70, 0.15)', border: '1px solid var(--secondary)', padding: '14px', borderRadius: 'var(--radius-sm)', color: '#F87171', fontSize: '13px', marginBottom: '20px' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                <strong>Guest Access Denied:</strong> Guest access requires connection to the Restaurant Wi-Fi. Please connect on-site or use <strong>Member Login</strong>.
              </div>
            )}

            <div style={{ opacity: isWifiInRange ? 1 : 0.4, pointerEvents: isWifiInRange ? 'all' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label"><i className="fa-solid fa-user"></i> Full Name</label>
                  <input type="text" className="form-input" placeholder="Enter guest name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fa-solid fa-phone"></i> Mobile No. (Optional)</label>
                  <input type="tel" className="form-input" placeholder="+91 98765 43210" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-users"></i> Number of Guests / Seats Needed</label>
                <div className="seat-pill-grid">
                  {[1, 2, 3, 4, 6, 8].map((count) => (
                    <div key={count} className={`seat-pill ${seatCount === count ? 'active' : ''}`} onClick={() => setSeatCount(count)}>
                      {count === 8 ? '8+ VIP' : `${count} Seat${count > 1 ? 's' : ''}`}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label"><i className="fa-solid fa-chair"></i> Seating Preference</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button type="button" className="service-btn" style={{ textAlign: 'left', alignItems: 'flex-start', padding: '14px' }} onClick={() => handleGuestSubmit('auto')}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}><i className="fa-solid fa-bolt"></i> Auto-Assign Table</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Instantly allotments customer dining session.</div>
                  </button>
                  <button type="button" className="service-btn" style={{ textAlign: 'left', alignItems: 'flex-start', padding: '14px' }} onClick={() => handleGuestSubmit('2d')}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-purple)' }}><i className="fa-solid fa-map"></i> Select via 2D Floor Plan</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Pick specific table location and seats.</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========= TAB 2: MEMBER LOGIN & GOOGLE AUTH ========= */}
        {activeTab === 'user' && (
          <div id="auth-tab-user" className="auth-tab-content">
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-sm)', padding: '14px', color: '#C4B5FD', fontSize: '13px', marginBottom: '20px' }}>
              <i className="fa-solid fa-info-circle"></i> <strong>Member Login:</strong> Sign in with email or click <strong>Google OAuth</strong> below.
            </div>

            <form onSubmit={handleUserSubmit}>
              <div className="form-group">
                <label className="form-label">Email / Customer ID</label>
                <input type="email" className="form-input" placeholder="customer@auradining.in" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="••••••••••••" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-action btn-primary-action" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}>
                <i className="fa-solid fa-right-to-bracket"></i> Sign In to Member Account
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>or sign in with Google</div>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
            </div>
            
            {/* Single Google Sign-In Container */}
            <div 
              type="button" 
              onClick={handleGoogleDirectAuth}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#FFF',
                color: '#000',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '10px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign in with Google
            </div>
          </div>
        )}

        {/* ========= TAB 3: SECURE STAFF & ADMIN LOGIN ========= */}
        {activeTab === 'staff' && (
          <div id="auth-tab-staff" className="auth-tab-content">
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '14px', color: '#FCD34D', fontSize: '13px', marginBottom: '16px' }}>
              <i className="fa-solid fa-lock"></i> <strong>Staff & Admin Portal Login:</strong> Enter staff credentials. Unauthenticated guests cannot access staff dashboards.
            </div>

            {staffError && (
              <div style={{ background: 'rgba(230, 57, 70, 0.15)', border: '1px solid var(--secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', color: '#F87171', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                <i className="fa-solid fa-xmark-circle" style={{ marginRight: '6px' }}></i>{staffError}
              </div>
            )}

            {/* Autofill presets for testing */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>Autofill Preset Account:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                <button type="button" onClick={() => handleAutofillStaff('admin@auradining.in', 'AdminPassword123')} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#34D399', cursor: 'pointer', fontWeight: 700 }}>
                  Admin
                </button>
                <button type="button" onClick={() => handleAutofillStaff('manager@auradining.in', 'ManagerPassword123')} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8B5CF6', color: '#C4B5FD', cursor: 'pointer', fontWeight: 700 }}>
                  Manager
                </button>
                <button type="button" onClick={() => handleAutofillStaff('chef@auradining.in', 'ChefPassword123')} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', cursor: 'pointer', fontWeight: 700 }}>
                  Chef
                </button>
                <button type="button" onClick={() => handleAutofillStaff('cashier@auradining.in', 'CashierPassword123')} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', color: '#FCD34D', cursor: 'pointer', fontWeight: 700 }}>
                  Cashier
                </button>
              </div>
            </div>

            <form onSubmit={handleStaffSubmit}>
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-at"></i> Staff / Admin Email</label>
                <input type="email" className="form-input" placeholder="admin@auradining.in" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-key"></i> Secret Password</label>
                <input type="password" className="form-input" placeholder="••••••••••••" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-action" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#FFF', fontWeight: 800 }}>
                <i className="fa-solid fa-shield-halved"></i> Sign In to Staff / Admin Portal
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
