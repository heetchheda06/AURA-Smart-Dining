import React, { useState } from 'react';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onGuestLogin, 
  onUserLogin,
  onUserRegister,
  onAdminLogin,
  onOpenFloorplan,
  isMandatory
}) {
  const [activeTab, setActiveTab] = useState('guest'); // 'guest', 'user', 'staff'
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Sign In vs Sign Up for Member
  
  // Guest state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [seatCount, setSeatCount] = useState(2);
  const [isWifiInRange, setIsWifiInRange] = useState(true);
  
  // User Login & Register state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Staff state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');

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
    if (isRegisterMode) {
      if (!userName || !userEmail || !userPassword) {
        alert("⚠️ Please fill in Full Name, Email, and Password.");
        return;
      }
      if (onUserRegister) {
        onUserRegister(userName, userEmail, userPassword, userPhone);
      }
    } else {
      if (!userEmail || !userPassword) {
        alert("⚠️ Please fill in Email and Password.");
        return;
      }
      onUserLogin(userEmail, userPassword);
    }
  };

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    setStaffError('');
    if (!staffEmail || !staffPassword) {
      setStaffError('Please enter both employee email and secret key.');
      return;
    }
    onUserLogin(staffEmail, staffPassword);
  };

  const autofillStaff = (email, pass) => {
    setStaffEmail(email);
    setStaffPassword(pass);
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
            {activeTab === 'user' ? (isRegisterMode ? 'Create Member Account' : 'Member Sign In') : 'Sign In to Continue'}
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
            <span>Member Portal</span>
          </button>
          <button 
            className={`auth-tab-btn ${activeTab === 'staff' ? 'active' : ''}`} 
            onClick={() => setActiveTab('staff')}
          >
            <i className="fa-solid fa-lock" style={{ color: 'var(--accent-amber)' }}></i>
            <span>Staff & Admin</span>
          </button>
        </div>

        {/* ========= TAB 1: GUEST DINER ========= */}
        {activeTab === 'guest' && (
          <div id="auth-tab-guest" className="auth-tab-content">
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '14px', color: '#6EE7B7', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <i className="fa-solid fa-wifi" style={{ marginRight: '8px' }}></i>
                <strong>Location Check:</strong> Restaurant Wi-Fi Connected
              </div>
              <button 
                type="button" 
                onClick={() => setIsWifiInRange(!isWifiInRange)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
              >
                Toggle {isWifiInRange ? 'Out-of-Range' : 'In-Range'}
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

        {/* ========= TAB 2: MEMBER LOGIN & SIGN UP ========= */}
        {activeTab === 'user' && (
          <div id="auth-tab-user" className="auth-tab-content">
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: !isRegisterMode ? 'var(--accent-purple)' : 'transparent',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isRegisterMode ? 'var(--accent-purple)' : 'transparent',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign Up (Create Account)
              </button>
            </div>

            <form onSubmit={handleUserSubmit}>
              {isRegisterMode && (
                <div className="form-group">
                  <label className="form-label"><i className="fa-solid fa-user"></i> Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter your name" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                    required={isRegisterMode} 
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-envelope"></i> Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="customer@auradining.in" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  required 
                />
              </div>

              {isRegisterMode && (
                <div className="form-group">
                  <label className="form-label"><i className="fa-solid fa-phone"></i> Mobile No. (Optional)</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="+91 98765 43210" 
                    value={userPhone} 
                    onChange={(e) => setUserPhone(e.target.value)} 
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-key"></i> Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••••••" 
                  value={userPassword} 
                  onChange={(e) => setUserPassword(e.target.value)} 
                  required 
                />
              </div>

              <button type="submit" className="btn-action btn-primary-action" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '14px', background: 'var(--accent-purple)' }}>
                <i className={`fa-solid ${isRegisterMode ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i> 
                {isRegisterMode ? ' Create Free Member Account' : ' Sign In to Member Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Create Account (Sign Up)"}
              </button>
            </div>
          </div>
        )}

        {/* ========= TAB 3: SECURE STAFF & ADMIN LOGIN ========= */}
        {activeTab === 'staff' && (
          <div id="auth-tab-staff" className="auth-tab-content">
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '14px', color: '#FCD34D', fontSize: '13px', marginBottom: '16px' }}>
              <i className="fa-solid fa-user-shield"></i> <strong>Staff & Admin Portal Login:</strong> Enter staff credentials. Unauthenticated guests cannot access staff dashboards.
            </div>

            {staffError && (
              <div style={{ background: 'rgba(230, 57, 70, 0.15)', border: '1px solid var(--secondary)', padding: '10px', borderRadius: 'var(--radius-sm)', color: '#F87171', fontSize: '12px', marginBottom: '14px' }}>
                <i className="fa-solid fa-circle-exclamation"></i> {staffError}
              </div>
            )}

            <form onSubmit={handleStaffSubmit}>
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-at"></i> Staff / Admin Email</label>
                <input type="email" className="form-input" placeholder="admin@auradining.in" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-key"></i> Secret Password</label>
                <input type="password" className="form-input" placeholder="••••••••••••" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-action btn-white-staff-signin" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}>
                <i className="fa-solid fa-shield-halved"></i> Sign In to Staff / Admin Portal
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
