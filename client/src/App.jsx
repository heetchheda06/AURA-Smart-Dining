import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CategoryFilters from './components/CategoryFilters';
import MenuGrid from './components/MenuGrid';
import CartSidebar from './components/CartSidebar';
import OrderModal from './components/OrderModal';
import AuthModal from './components/AuthModal';
import FloorPlanModal from './components/FloorPlanModal';
import WaiterModal from './components/WaiterModal';
import QueueModal from './components/QueueModal';
import TableFreedModal from './components/TableFreedModal';
import AdminDashboard from './components/AdminDashboard';
import UserOrdersModal from './components/UserOrdersModal';
import CashierDashboard from './components/CashierDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ChefDashboard from './components/ChefDashboard';
import RoleQuickSwitcher from './components/RoleQuickSwitcher';
import AIRecommender from './components/AIRecommender';
import TableSelectModal from './components/TableSelectModal';
import { fallbackMenu } from './data/fallbackMenu';

// Initialize socket connection at module level
const socket = io();

export default function App() {
  // --- State Management ---
  const [activeCustomerSession, setActiveCustomerSession] = useState({
    isLoggedIn: false,
    customerName: "Guest Customer",
    tableNum: 8,
    seats: 4,
    status: "active_dining",
    loginType: "guest"
  });

  const [menuItems, setMenuItems] = useState(fallbackMenu);
  const [restaurantTables, setRestaurantTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [roomName, setRoomName] = useState('smart-restaurant-aura');
  const [toasts, setToasts] = useState([]);
  const [partySizeInput, setPartySizeInput] = useState(2);

  // --- Admin, Staff & Member Role State ---
  const [currentRole, setCurrentRole] = useState('customer'); // 'customer', 'cashier', 'manager', 'chef', 'admin'
  const [staffName, setStaffName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [isUserOrdersOpen, setIsUserOrdersOpen] = useState(false);

  // --- Modal Visibility Toggles ---
  // Auth modal opens by default as mandatory login gate
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [isWaiterOpen, setIsWaiterOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isTableFreedOpen, setIsTableFreedOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // --- Table Selection Modal ---
  const [isTableSelectOpen, setIsTableSelectOpen] = useState(false);
  // Pending info while waiting for table selection
  const [pendingCustomerInfo, setPendingCustomerInfo] = useState({ name: '', loginType: 'guest', openDashboard: false });

  // --- Toast helper ---
  const showToast = (message) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // --- Google OAuth Callback integration ---
  useEffect(() => {
    // Expose handler globally for Google's GIS SDK
    window.handleCredentialResponse = async (response) => {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          showToast(`👋 Welcome back, ${data.user.name}!`);
          setIsAuthModalOpen(false);
          allotTableToCustomer(data.user.name, 8, 2, "Outdoor Patio");
        } else {
          showToast(`⚠️ Google login failed: ${data.message}`);
        }
      } catch (err) {
        console.error("Google auth error:", err);
        showToast("⚠️ Google Authentication failed.");
      }
    };

    // Google Identity client initialization helper
    const initGoogle = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: '686445090372-17hhr1l6fsbjots3e8kuse904cv9rq72.apps.googleusercontent.com',
            callback: window.handleCredentialResponse
          });
        } catch (err) {
          console.error("Failed to initialize Google Auth:", err);
        }
      }
    };

    initGoogle();
    const googleTimer = setInterval(() => {
      if (window.google) {
        initGoogle();
        clearInterval(googleTimer);
      }
    }, 300);

    return () => {
      clearInterval(googleTimer);
      delete window.handleCredentialResponse;
    };
  }, []);

  // --- Socket.IO & Initial Load ---
  useEffect(() => {
    // Check auth session — if user was previously logged in, restore and close login gate
    checkAuthSession();
    fetchMenu('all');
    fetchTables();

    // Socket Event Listeners
    socket.on('cart:updated', (updatedCart) => {
      console.log('Cart updated via socket:', updatedCart);
      setCart(updatedCart.items || []);
    });

    socket.on('user:joined', (data) => {
      showToast(`👋 ${data.message}`);
      fetchTables();
    });

    socket.on('user:left', (data) => {
      showToast(`🚶 ${data.message}`);
      fetchTables();
    });

    socket.on('table:status_changed', (data) => {
      console.log('Table status changed:', data);
      fetchTables();
    });

    socket.on('order:placed', (order) => {
      showToast(`✨ Order successfully sent to Kitchen! Est. prep: 14 mins.`);
      setCart([]);
    });

    socket.on('order:status_updated', (data) => {
      showToast(`🔔 ${data.message}`);
    });

    socket.on('waiter:call_acknowledged', (data) => {
      showToast(data.message);
    });

    socket.on('waiter:request_completed', (data) => {
      showToast(data.message);
    });

    socket.on('queue:table_freed', (data) => {
      showToast(`🎉 Table #${data.tableNum} is now free! Ready for seating.`);
    });

    return () => {
      socket.off('cart:updated');
      socket.off('user:joined');
      socket.off('user:left');
      socket.off('table:status_changed');
      socket.off('order:placed');
      socket.off('order:status_updated');
      socket.off('waiter:call_acknowledged');
      socket.off('waiter:request_completed');
      socket.off('queue:table_freed');
    };
  }, []);

  // --- API Integrations ---

  // Check existing token — restore session and close login gate
  const checkAuthSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        const user = data.user;

        if (user.role === 'admin') {
          setCurrentRole('admin');
          setStaffName(user.name);
          setIsAdmin(true);
          setAdminName(user.name);
          setIsAuthModalOpen(false);
          return;
        } else if (user.role === 'cashier') {
          setCurrentRole('cashier');
          setStaffName(user.name);
          setIsAuthModalOpen(false);
          return;
        } else if (user.role === 'manager') {
          setCurrentRole('manager');
          setStaffName(user.name);
          setIsAuthModalOpen(false);
          return;
        } else if (user.role === 'chef') {
          setCurrentRole('chef');
          setStaffName(user.name);
          setIsAuthModalOpen(false);
          return;
        }

        setCurrentRole('customer');
        const newSession = {
          isLoggedIn: true,
          customerName: user.name,
          tableNum: user.tableNum || 8,
          seats: 4,
          status: "active_dining",
          loginType: user.isGuest ? "guest" : "member"
        };
        setActiveCustomerSession(newSession);
        setIsAuthModalOpen(false); // Close login gate

        // Join table room via socket
        socket.emit('table:join', { 
          tableNum: newSession.tableNum, 
          name: newSession.customerName 
        });
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error("Session restoration error:", err);
      localStorage.removeItem('token');
    }
  };

  // Fetch Menu items by category
  const fetchMenu = async (category) => {
    try {
      const queryParam = category === 'all' ? '' : `?category=${category}`;
      const res = await fetch(`/api/menu${queryParam}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        setMenuItems(data.data);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  };

  // Fetch tables state
  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        setRestaurantTables(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  // Handle Category selection
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    fetchMenu(catId);
  };

  // Handle Guest Login — now shows Table Select modal first
  const handleGuestLogin = async (name, seats, mode) => {
    setIsAuthModalOpen(false);
    setPendingCustomerInfo({ name: name || 'Guest Customer', loginType: 'guest', openDashboard: false });
    setIsTableSelectOpen(true);
  };

  // Submit Guest credentials to API
  const submitGuestLoginApi = async (name, tableNum, seats, zone) => {
    try {
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tableNum })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        allotTableToCustomer(data.user.name, data.user.tableNum, seats, zone);
      } else {
        showToast(`⚠️ Guest Login failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Guest Login Error.");
    }
  };

  // Switch to Floor plan modal
  const handleOpenFloorplan = (seats, name) => {
    setIsAuthModalOpen(false);
    setPartySizeInput(seats);
    setIsFloorPlanOpen(true);
  };

  // Confirm Table Selection from 2D Layout
  const handleConfirmTable = async (table) => {
    setIsFloorPlanOpen(false);
    const guestNameInput = document.getElementById('guest-name')?.value || "Guest Customer";
    
    if (table.status === 'free') {
      await submitGuestLoginApi(guestNameInput, table.num, table.seats, table.zone);
    } else {
      // Pre-order list mode
      startPreOrderingSession(guestNameInput, table.num, partySizeInput, table.zone, table.estWait || 15);
    }
  };

  // Allot Table session
  const allotTableToCustomer = (name, tableNum, seats, zone, loginType = "guest") => {
    setIsAuthModalOpen(false);
    const newSession = {
      isLoggedIn: true,
      customerName: name,
      tableNum: tableNum,
      seats: seats,
      zone: zone,
      status: "active_dining",
      loginType: loginType
    };
    setActiveCustomerSession(newSession);

    // Join room
    socket.emit('table:join', { tableNum: tableNum, name: name });
    
    // Sync cart with database
    socket.emit('cart:sync', { tableNum: tableNum });

    showToast(`🎉 Table #${tableNum} Allotted to ${name} (${seats} Seats)!`);
  };

  // Start pre-order session
  const startPreOrderingSession = (name, tableNum, seats, zone, estWait) => {
    const newSession = {
      isLoggedIn: true,
      customerName: name,
      tableNum: tableNum,
      seats: seats,
      zone: zone,
      status: "pre_ordering",
      estWait: estWait,
      loginType: "guest"
    };
    setActiveCustomerSession(newSession);
    
    socket.emit('table:join', { tableNum: tableNum, name: name });
    socket.emit('cart:sync', { tableNum: tableNum });
    
    showToast(`⏳ Table #${tableNum} is busy. Pre-Order Mode Activated! Select items.`);
  };

  // Member user registration api call
  const handleUserRegister = async (name, email, password, mobile) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, mobile })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        showToast(`🎉 Registration successful! Welcome to AURA, ${data.user.name}!`);
        setIsAuthModalOpen(false);
        setCurrentRole('customer');
        setPendingCustomerInfo({ name: data.user.name, loginType: 'member', openDashboard: false });
        setIsTableSelectOpen(true);
      } else {
        showToast(`⚠️ Registration failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Registration error.");
    }
  };

  // Member user login api call
  const handleUserLogin = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        showToast(`👋 Welcome back, ${data.user.name}!`);
        setIsAuthModalOpen(false);
        setStaffName(data.user.name);
        
        if (data.user.role === 'admin') {
          setCurrentRole('admin');
          setIsAdmin(true);
          setAdminName(data.user.name);
          showToast("📊 Admin analytics dashboard unlocked.");
        } else if (data.user.role === 'cashier') {
          setCurrentRole('cashier');
          showToast("💵 Cashier Billing portal unlocked.");
        } else if (data.user.role === 'manager') {
          setCurrentRole('manager');
          showToast("📋 Manager Floor & Inventory portal unlocked.");
        } else if (data.user.role === 'chef') {
          setCurrentRole('chef');
          showToast("🍳 Kitchen Display System (KDS) unlocked.");
        } else {
          setCurrentRole('customer');
          setPendingCustomerInfo({ name: data.user.name, loginType: 'member', openDashboard: true });
          setIsTableSelectOpen(true);
          showToast(`👋 Welcome back, ${data.user.name}! Please select your dining table.`);
        }
      } else {
        showToast(`⚠️ Login failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Error connecting to member login API.");
    }
  };

  // Admin login handler — uses the same /api/auth/login but validates role
  const handleAdminLogin = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        if (data.user.role !== 'admin') {
          showToast('⛔ Access Denied: This account does not have admin privileges.');
          return;
        }
        localStorage.setItem('token', data.token);
        setCurrentRole('admin');
        setStaffName(data.user.name);
        setIsAdmin(true);
        setAdminName(data.user.name);
        setIsAuthModalOpen(false);
        showToast(`🔓 Admin Dashboard Unlocked. Welcome, ${data.user.name}!`);
      } else {
        showToast(`⚠️ Admin login failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Error connecting to admin login API.');
    }
  };

  // Dynamic login logout click toggle
  const handleLoginLogoutClick = () => {
    if (activeCustomerSession.isLoggedIn) {
      // Logout
      handleLogout();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}

    socket.emit('table:leave');
    localStorage.removeItem('token');

    setCurrentRole('customer');
    setStaffName('');
    setIsAdmin(false);
    setAdminName('');
    setActiveCustomerSession({
      isLoggedIn: false,
      customerName: "Guest Customer",
      tableNum: 8,
      seats: 4,
      status: "active_dining",
      loginType: "guest"
    });
    setCart([]);
    setIsAuthModalOpen(true); // Re-show login gate
    showToast("🔒 Session logged out.");
  };

  // Add Item to cart
  const handleAddToCart = (itemId) => {
    if (!activeCustomerSession.isLoggedIn) {
      showToast("⚠️ Please login/allot a table first.");
      setIsAuthModalOpen(true);
      return;
    }
    
    const itemObj = menuItems.find(i => i._id === itemId || i.dish_id === itemId);
    if (!itemObj) return;

    const itemKey = itemObj._id || itemObj.dish_id;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.menuItemId === itemKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1
        };
        return updated;
      } else {
        return [...prev, {
          menuItemId: itemKey,
          name: itemObj.name,
          price: itemObj.price,
          qty: 1,
          addedBy: activeCustomerSession.customerName
        }];
      }
    });

    showToast(`🛒 Added ${itemObj.name} to shared order`);

    socket.emit('cart:add', {
      tableNum: activeCustomerSession.tableNum,
      menuItemId: itemKey,
      name: itemObj.name,
      price: itemObj.price,
      addedBy: activeCustomerSession.customerName
    });
  };

  // Update Qty delta (+ and - handlers)
  const handleUpdateQty = (menuItemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.menuItemId === menuItemId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });

    socket.emit('cart:update', {
      tableNum: activeCustomerSession.tableNum,
      menuItemId,
      delta
    });
  };

  // Place order from cart
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showToast("⚠️ Cart is empty. Please select dishes first.");
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          tableNum: activeCustomerSession.tableNum,
          items: cart 
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Order successfully placed for Kitchen!`);
        setCart([]);
        socket.emit('cart:clear', { tableNum: activeCustomerSession.tableNum });
      } else {
        showToast(`⚠️ Order failed: ${data.message || 'Error processing order'}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Connection error placing order.");
    }
  };

  // Split bill helper
  const handleSplitBill = (totalBillAmount) => {
    if (!totalBillAmount || totalBillAmount === 0) {
      showToast("⚠️ Bill total is ₹0.00.");
      return;
    }
    const perPerson = (totalBillAmount / 4).toFixed(0);
    showToast(`💳 Split 4 ways: ${formatPrice(perPerson)} per diner.`);
  };

  // Smart Sommelier Pairings
  const handleGetRecommendation = () => {
    if (cart.length === 0) {
      showToast("🍷 Sommelier: Add items to your cart so I can recommend pairings!");
      return;
    }
    const itemsInCart = cart.map(i => i.name.toLowerCase());
    let recommendation = "🍷 Sommelier: Pair your dishes with our house vintage red wine.";
    if (itemsInCart.some(name => name.includes('steak') || name.includes('beef') || name.includes('salmon'))) {
      recommendation = "🍷 Sommelier: I recommend pairing the Wagyu / Salmon with our 2018 Napa Cabernet Sauvignon.";
    } else if (itemsInCart.some(name => name.includes('sushi') || name.includes('fish'))) {
      recommendation = "🍶 Sommelier: Enhance the sushi flavors with a glass of chilled Junmai Daiginjo Sake.";
    } else if (itemsInCart.some(name => name.includes('chocolate') || name.includes('dessert'))) {
      recommendation = "🥂 Sommelier: Finish your meal with a sparkling French Champagne or Sweet Port Wine.";
    }
    showToast(recommendation);
  };

  // Dispatch assistance request
  const handleCallWaiter = async (serviceName) => {
    setIsWaiterOpen(false);

    // Show toast IMMEDIATELY — don't wait for API (optimistic UI)
    showToast(`🛎️ Calling Floor Host for: "${serviceName}"…`);

    try {
      const res = await fetch('/api/waiter/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNum: activeCustomerSession.tableNum || 8,
          serviceName
        })
      });
      const data = await res.json();
      if (data.success) {
        // Show confirmed toast after API acknowledges
        setTimeout(() => {
          showToast(`✅ Floor Host notified! They'll be at Table #${activeCustomerSession.tableNum || 8} shortly.`);
        }, 1200);
      }
    } catch (err) {
      // Even if API fails, the first toast already showed — silent fail is fine
      console.error('Waiter call API error:', err);
    }
  };

  // Simulate queue clear
  const handleSimulateQueueClear = () => {
    setIsQueueOpen(false);
    // Move into pre_ordering state and trigger freed alert
    setActiveCustomerSession((prev) => ({
      ...prev,
      isLoggedIn: true,
      status: "pre_ordering",
      tableNum: 2,
      seats: partySizeInput
    }));
    
    socket.emit('table:join', { tableNum: 2, name: activeCustomerSession.customerName });
    socket.emit('cart:sync', { tableNum: 2 });
    
    setIsTableFreedOpen(true);
  };

  // Take seat at vacated table
  const handleTakeSeat = async () => {
    setIsTableFreedOpen(false);
    
    // Mark table occupied in DB
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/tables/${activeCustomerSession.tableNum}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'occupied' })
      });
    } catch(e) {}

    setActiveCustomerSession((prev) => ({
      ...prev,
      status: "active_dining"
    }));
    
    // Send pre-orders to kitchen
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    if (totalItems > 0) {
      await handlePlaceOrder();
    } else {
      showToast(`🎉 You are seated at Table #0${activeCustomerSession.tableNum}! Start dining.`);
    }
  };

  // Open Order Cart Modal helper
  const handleScrollToOrder = () => {
    setIsOrderModalOpen(true);
  };

  // Price formatting helper
  const formatPrice = (amount) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
    return formatter.format(amount).replace('INR', '₹').trim();
  };

  // --- Render: Dedicated Role UIs ---

  // 1. Cashier UI — Sees ONLY Bills, Invoices & Payment Collections
  if (currentRole === 'cashier') {
    return (
      <>
        <CashierDashboard 
          onLogout={handleLogout} 
          cashierName={staffName || "Lead Cashier Sarah"} 
          formatPrice={formatPrice} 
        />
        <RoleQuickSwitcher currentRole={currentRole} onSwitchRole={(r) => setCurrentRole(r)} />
        <div className="toast-container" id="toast-box">
          {toasts.map(t => (
            <div key={t.id} className="toast-item glass">
              {t.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  // 2. Manager UI — Sees ONLY Vacant Tables & Ingredients Left
  if (currentRole === 'manager') {
    return (
      <>
        <ManagerDashboard 
          onLogout={handleLogout} 
          managerName={staffName || "AURA Manager"} 
          formatPrice={formatPrice} 
        />
        <RoleQuickSwitcher currentRole={currentRole} onSwitchRole={(r) => setCurrentRole(r)} />
        <div className="toast-container" id="toast-box">
          {toasts.map(t => (
            <div key={t.id} className="toast-item glass">
              {t.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  // 3. Chef UI — Sees ONLY Incoming Kitchen Orders to Cook (KDS)
  if (currentRole === 'chef') {
    return (
      <>
        <ChefDashboard 
          onLogout={handleLogout} 
          chefName={staffName || "Executive Chef Mario"} 
          formatPrice={formatPrice} 
        />
        <RoleQuickSwitcher currentRole={currentRole} onSwitchRole={(r) => setCurrentRole(r)} />
        <div className="toast-container" id="toast-box">
          {toasts.map(t => (
            <div key={t.id} className="toast-item glass">
              {t.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  // 4. Admin UI — Sees ALL Metrics, Total Orders, Revenue Payment Done & Analytics ONLY
  if (currentRole === 'admin') {
    return (
      <>
        <AdminDashboard 
          onLogout={handleLogout} 
          adminName={adminName || staffName || "AURA Admin"} 
          formatPrice={formatPrice} 
          currentRole={currentRole}
          onSwitchRole={(r) => setCurrentRole(r)}
        />
        <RoleQuickSwitcher currentRole={currentRole} onSwitchRole={(r) => setCurrentRole(r)} />
        <div className="toast-container" id="toast-box">
          {toasts.map(t => (
            <div key={t.id} className="toast-item glass">
              {t.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  // 5. Customer UI — Sees ONLY Home Page, Categories, Menu Grid, Cart & Order Placement
  return (
    <div className="app-container">
      {/* Ambient Glow Objects */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      {/* Mandatory Login Gate — shown until user authenticates */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => {
          if (activeCustomerSession.isLoggedIn) setIsAuthModalOpen(false);
        }}
        isMandatory={!activeCustomerSession.isLoggedIn}
        onGuestLogin={handleGuestLogin}
        onUserLogin={handleUserLogin}
        onUserRegister={handleUserRegister}
        onAdminLogin={handleAdminLogin}
        onGoogleLogin={(user, token) => {
          localStorage.setItem('token', token);
          showToast(`👋 Welcome, ${user.name}! Please choose your dining table.`);
          setIsAuthModalOpen(false);
          setCurrentRole('customer');
          setPendingCustomerInfo({ name: user.name, loginType: 'member', openDashboard: false });
          setIsTableSelectOpen(true);
        }}
        onOpenFloorplan={handleOpenFloorplan}
      />

      {/* Navbar Component */}
      <Navbar 
        activeCustomerSession={activeCustomerSession}
        roomName={roomName}
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        onOpenAuth={handleLoginLogoutClick}
        onOpenWaiter={() => setIsWaiterOpen(true)}
        onScrollToOrder={handleScrollToOrder}
        onOpenOrdersHistory={() => setIsUserOrdersOpen(true)}
        onLogout={handleLogout}
      />

      {/* Hero Banner Section */}
      <HeroSection activeCustomerSession={activeCustomerSession} />

      {/* Main Grid Content */}
      <main className="main-container">
        
        {/* Automated AI Food Recommender */}
        <AIRecommender 
          menuItems={menuItems}
          activeCustomerSession={activeCustomerSession}
          onAddToCart={handleAddToCart}
          formatPrice={formatPrice}
        />

        {/* Menu Cards Container */}
        <MenuGrid 
          menuItems={menuItems}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddToCart={handleAddToCart}
          formatPrice={formatPrice}
        />
      </main>

      {/* Order Modal Drawer */}
      <OrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        cart={cart}
        activeCustomerSession={activeCustomerSession}
        onUpdateQty={handleUpdateQty}
        onPlaceOrder={handlePlaceOrder}
        onSplitBill={handleSplitBill}
        onGetRecommendation={handleGetRecommendation}
        formatPrice={formatPrice}
      />

      {/* Waiter Call Assistance Modal */}
      <WaiterModal 
        isOpen={isWaiterOpen}
        onClose={() => setIsWaiterOpen(false)}
        onCallWaiter={handleCallWaiter}
      />

      {/* 2D Interactive Seat Arrangement Floorplan Modal */}
      <FloorPlanModal 
        isOpen={isFloorPlanOpen}
        onClose={() => setIsFloorPlanOpen(false)}
        tables={restaurantTables}
        partySize={partySizeInput}
        onConfirmTable={handleConfirmTable}
      />

      {/* Real-time Waitlist Queue Modal */}
      <QueueModal 
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        partySize={partySizeInput}
        onSimulateClear={handleSimulateQueueClear}
      />

      {/* Table Freed Cleaned Alert notification */}
      <TableFreedModal 
        isOpen={isTableFreedOpen}
        onClose={() => setIsTableFreedOpen(false)}
        activeCustomerSession={activeCustomerSession}
        cart={cart}
        onTakeSeat={handleTakeSeat}
      />

      {/* Registered Member Order History & Receipts Modal */}
      <UserOrdersModal 
        isOpen={isUserOrdersOpen}
        onClose={() => setIsUserOrdersOpen(false)}
        customerName={activeCustomerSession.customerName}
        formatPrice={formatPrice}
        onAddToCart={handleAddToCart}
      />

      {/* Table Selection Modal — shown after guest/member login */}
      <TableSelectModal
        isOpen={isTableSelectOpen}
        onClose={() => setIsTableSelectOpen(false)}
        customerName={pendingCustomerInfo.name || 'Customer'}
        loginType={pendingCustomerInfo.loginType || 'guest'}
        onJoinQueue={(custName) => {
          setIsTableSelectOpen(false);
          setIsQueueOpen(true);
          showToast(`⏳ ${custName} added to live seating queue!`);
        }}
        onConfirmTable={async (tableNum, seats, zone) => {
          setIsTableSelectOpen(false);
          if (pendingCustomerInfo.loginType === 'guest') {
            // For guests: call API then allot
            await submitGuestLoginApi(pendingCustomerInfo.name, tableNum, seats, zone);
          } else {
            // For members: allot directly (already have token)
            allotTableToCustomer(pendingCustomerInfo.name, tableNum, seats, zone, 'member');
          }
          if (pendingCustomerInfo.openDashboard) {
            setTimeout(() => setIsUserOrdersOpen(true), 400);
          }
        }}
      />

      {/* Toast Notification Container */}
      <div className="toast-container" id="toast-box">
        {toasts.map(t => (
          <div key={t.id} className="toast-item glass">
            {t.message}
          </div>
        ))}
      </div>

    </div>
  );
}
