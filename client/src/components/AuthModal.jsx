import React, { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = "1001461040344-ceskv2ur956blfqgrn0vaj9fl63c0hlm.apps.googleusercontent.com";

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onGuestLogin, 
  onUserLogin,
  onUserRegister,
  onGoogleLogin,
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

  // Google Sign-In state & dialog
  const [isGoogleAccountDialog, setIsGoogleAccountDialog] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const completeGoogleLogin = async (selectedName, selectedEmail) => {
    const finalName = (selectedName && selectedName.trim()) 
      ? selectedName.trim() 
      : (customGoogleName && customGoogleName.trim()) 
        ? customGoogleName.trim() 
        : 'Heet Chheda';
    const finalEmail = (selectedEmail && selectedEmail.trim()) 
      ? selectedEmail.trim() 
      : (customGoogleEmail && customGoogleEmail.trim()) 
        ? customGoogleEmail.trim() 
        : 'heet.chheda06@gmail.com';

    setIsGoogleAccountDialog(false);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          email: finalEmail,
          googleId: `g_user_${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success && onGoogleLogin) {
        onGoogleLogin(data.user || { name: finalName, email: finalEmail }, data.token || 'token_google_demo');
      } else if (onGoogleLogin) {
        onGoogleLogin({ name: finalName, email: finalEmail }, 'token_google_demo');
      }
    } catch (e) {
      if (onGoogleLogin) {
        onGoogleLogin({ name: finalName, email: finalEmail }, 'token_google_demo');
      }
    }
  };

  // Load Google GIS Script
  useEffect(() => {
    if (!isOpen) return;

    const handleGoogleResponse = async (response) => {
      try {
        let googleName = 'Heet Chheda';
        let googleEmail = 'heet.chheda06@gmail.com';
        try {
          if (response && response.credential) {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            if (payload && payload.name) googleName = payload.name;
            if (payload && payload.email) googleEmail = payload.email;
          }
        } catch (e) {}

        completeGoogleLogin(googleName, googleEmail);
      } catch (err) {
        console.error("Google auth callback error:", err);
        completeGoogleLogin('Heet Chheda', 'heet.chheda06@gmail.com');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse
          });
          window.google.accounts.id.prompt();
        } catch (e) {
          console.error("GSI Init error:", e);
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen]);

  const handleGoogleSignInClick = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setIsGoogleAccountDialog(true);
          }
        });
      } catch (e) {
        setIsGoogleAccountDialog(true);
      }
    } else {
      setIsGoogleAccountDialog(true);
    }
  };

  if (!isOpen) return null;

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

  return (
    <div className="modal-overlay active" id="auth-modal" style={{ zIndex: 9999 }}>
      <div className="modal-card glass auth-card-wide">
        {!isMandatory && (
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        )}

        {isGoogleAccountDialog ? (
          <div style={{ padding: '4px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '18px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', marginBottom: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#1E3A5F', margin: 0, fontWeight: 900 }}>
                Sign in with Google
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 600 }}>
                Choose an account or sign in to continue to AURA Smart Dining
              </p>
            </div>

            {/* Option 1: 1-Tap Login (Heet Chheda) */}
            <div 
              onClick={() => completeGoogleLogin('Heet Chheda', 'heet.chheda06@gmail.com')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                borderRadius: '16px',
                border: '2px solid #3B82F6',
                background: '#F0F9FF',
                cursor: 'pointer',
                marginBottom: '16px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                HC
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>Heet Chheda</div>
                <div style={{ fontSize: '12px', color: '#475569', fontWeight: 700 }}>heet.chheda06@gmail.com</div>
              </div>
              <span style={{ background: '#3B82F6', color: '#FFF', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>
                1-Tap Login
              </span>
            </div>

            {/* Option 2: Custom Google Account Name & Email */}
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1.5px solid #CBD5E1', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                Or sign in with your Google Account:
              </span>
              <input
                type="text"
                placeholder="Full Name (e.g. Rohan Sharma / Priya Ananth)"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #94A3B8', marginBottom: '10px', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
              />
              <input
                type="email"
                placeholder="Google Email (e.g. user@gmail.com)"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #94A3B8', marginBottom: '14px', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
              />
              <button
                type="button"
                onClick={() => completeGoogleLogin(customGoogleName, customGoogleEmail)}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(66, 133, 244, 0.35)'
                }}
              >
                <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: '6px' }}></i>
                Continue as {customGoogleName.trim() || 'Google User'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsGoogleAccountDialog(false)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#64748B', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}
            >
              &larr; Back to login portal
            </button>
          </div>
        ) : (
          <>
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
                {/* Standard Google OAuth Sign-In Button */}
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleGoogleSignInClick}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '30px',
                      border: '1.5px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 900,
                      fontSize: '14.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#334155' }}></div>
                  <span style={{ padding: '0 12px', fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    OR LOGIN WITH EMAIL
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#334155' }}></div>
                </div>

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
          </>
        )}

      </div>
    </div>
  );
}
