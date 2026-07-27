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
  const [activeTab, setActiveTab] = useState('user'); // 'user', 'staff'
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
            {activeTab === 'user' ? (isRegisterMode ? 'Create Member Account' : 'Member Sign In') : 'Staff Login'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Sign in as a Member or Staff / Admin to continue.
          </p>
        </div>

        {/* Tab Selection — 2 tabs only: Member & Staff */}
        <div className="auth-tab-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
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
            <span>Staff &amp; Admin</span>
          </button>
        </div>


        {activeTab === 'user' && (
          <div id="auth-tab-user" className="auth-tab-content">
            <div style={{ display: 'flex', background: '#0F172A', borderRadius: '12px', padding: '6px', marginBottom: '20px', border: '1px solid #1E3A5F' }}>
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !isRegisterMode ? 'linear-gradient(135deg, #1E3A5F, #2A4D7C)' : 'transparent',
                  color: !isRegisterMode ? '#FFFFFF' : '#94A3B8',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i> Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isRegisterMode ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'transparent',
                  color: isRegisterMode ? '#FFFFFF' : '#CBD5E1',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i> Sign Up (New Member)
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
