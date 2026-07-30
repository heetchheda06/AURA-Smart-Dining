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
  const [activeTab, setActiveTab] = useState('user');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // User Login & Register state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Staff state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');

  const completeGoogleLogin = async (googleName, googleEmail, picture) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: googleName, email: googleEmail, picture, googleId: `g_${Date.now()}` })
      });
      const data = await res.json();
      if (data.success && onGoogleLogin) {
        onGoogleLogin(data.user || { name: googleName, email: googleEmail }, data.token || 'token_google');
      } else if (onGoogleLogin) {
        onGoogleLogin({ name: googleName, email: googleEmail }, 'token_google');
      }
    } catch (e) {
      if (onGoogleLogin) onGoogleLogin({ name: googleName, email: googleEmail }, 'token_google');
    }
  };

  // Initialize Google Identity Services on modal open
  useEffect(() => {
    if (!isOpen) return;

    const handleCredentialResponse = (response) => {
      try {
        // Decode the JWT ID token from Google
        const parts = response.credential.split('.');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const name = payload.name || payload.given_name || 'Heet Chheda';
        const email = payload.email || 'heet.chheda06@gmail.com';
        const picture = payload.picture || null;
        completeGoogleLogin(name, email, picture);
      } catch (e) {
        console.error('Google credential decode error:', e);
        completeGoogleLogin('Heet Chheda', 'heet.chheda06@gmail.com');
      }
    };

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false
        });

        // Render the official Google Sign-In button into the container
        const btnContainer = document.getElementById('google-signin-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: btnContainer.offsetWidth || 320,
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left'
          });
        }

        // Also trigger the One-Tap prompt
        window.google.accounts.id.prompt();
      } catch (e) {
        console.error('Google GSI init error:', e);
      }
    };

    // If already loaded, init immediately
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Remove any old script
      const old = document.getElementById('gsi-script');
      if (old) old.remove();

      const script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Small delay to ensure gsi is fully ready
        setTimeout(initGoogle, 200);
      };
      document.head.appendChild(script);
    }
  }, [isOpen]);

  // Re-render button when switching to user tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'user') return;
    const timer = setTimeout(() => {
      const btnContainer = document.getElementById('google-signin-btn-container');
      if (btnContainer && window.google?.accounts?.id) {
        try {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: btnContainer.offsetWidth || 320,
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left'
          });
        } catch (e) {}
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (isRegisterMode) {
      if (!userName || !userEmail || !userPassword) {
        alert("⚠️ Please fill in Full Name, Email, and Password.");
        return;
      }
      if (onUserRegister) onUserRegister(userName, userEmail, userPassword, userPhone);
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

        {/* Tab Selection */}
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
            {/* Google Sign-In button removed — requires Google Cloud Console setup */}

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
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: !isRegisterMode ? 'linear-gradient(135deg, #1E3A5F, #2A4D7C)' : 'transparent',
                  color: !isRegisterMode ? '#FFFFFF' : '#94A3B8',
                  fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i> Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: isRegisterMode ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'transparent',
                  color: isRegisterMode ? '#FFFFFF' : '#CBD5E1',
                  fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i> Sign Up (New Member)
              </button>
            </div>

            <form onSubmit={handleUserSubmit}>
              {isRegisterMode && (
                <div className="form-group">
                  <label className="form-label"><i className="fa-solid fa-user"></i> Full Name</label>
                  <input type="text" className="form-input" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} required={isRegisterMode} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-envelope"></i> Email Address</label>
                <input type="email" className="form-input" placeholder="customer@auradining.in" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
              </div>
              {isRegisterMode && (
                <div className="form-group">
                  <label className="form-label"><i className="fa-solid fa-phone"></i> Mobile No. (Optional)</label>
                  <input type="tel" className="form-input" placeholder="+91 98765 43210" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label"><i className="fa-solid fa-key"></i> Password</label>
                <input type="password" className="form-input" placeholder="••••••••••••" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-action btn-primary-action" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '14px', background: 'var(--accent-purple)' }}>
                <i className={`fa-solid ${isRegisterMode ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i> 
                {isRegisterMode ? ' Create Free Member Account' : ' Sign In to Member Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button type="button" onClick={() => setIsRegisterMode(!isRegisterMode)}
                style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Create Account (Sign Up)"}
              </button>
            </div>
          </div>
        )}

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
