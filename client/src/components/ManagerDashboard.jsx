import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function ManagerDashboard({ onLogout, managerName = "AURA Manager", formatPrice }) {
  const [activeTab, setActiveTab] = useState('tables'); // 'tables', 'ingredients', or 'queue'
  const [tables, setTables] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [queue, setQueue] = useState([]);
  
  // Filters
  const [tableFilter, setTableFilter] = useState('all'); // 'all', 'vacant', 'occupied'
  const [ingredientFilter, setIngredientFilter] = useState('all'); // 'all', 'low', 'out'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  
  // Selected Table Modal State for Live Session Tracking
  const [selectedTable, setSelectedTable] = useState(null);

  // New Ingredient Modal State
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('Produce');
  const [newIngQty, setNewIngQty] = useState(10);
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngMin, setNewIngMin] = useState(5);
  const [newIngCost, setNewIngCost] = useState(100);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const default20Tables = [
    { num: 1, seats: 2, zone: "Main Hall", status: "free" },
    { num: 2, seats: 4, zone: "Main Hall", status: "free" },
    { num: 3, seats: 2, zone: "Window Lounge", status: "free" },
    { num: 4, seats: 6, zone: "VIP Private Lounge", status: "free" },
    { num: 5, seats: 4, zone: "Window Lounge", status: "free" },
    { num: 6, seats: 8, zone: "VIP Private Lounge", status: "free" },
    { num: 7, seats: 2, zone: "Outdoor Patio", status: "free" },
    { num: 8, seats: 4, zone: "Outdoor Patio", status: "free" },
    { num: 9, seats: 6, zone: "Main Hall", status: "free" },
    { num: 10, seats: 4, zone: "Main Hall", status: "free" },
    { num: 11, seats: 2, zone: "Window Lounge", status: "free" },
    { num: 12, seats: 4, zone: "Window Lounge", status: "free" },
    { num: 13, seats: 6, zone: "Rooftop Deck", status: "free" },
    { num: 14, seats: 4, zone: "Rooftop Deck", status: "free" },
    { num: 15, seats: 8, zone: "VIP Private Lounge", status: "free" },
    { num: 16, seats: 2, zone: "Rooftop Deck", status: "free" },
    { num: 17, seats: 4, zone: "Outdoor Patio", status: "free" },
    { num: 18, seats: 6, zone: "Family Dining", status: "free" },
    { num: 19, seats: 10, zone: "Family Dining", status: "free" },
    { num: 20, seats: 12, zone: "Family Dining Grand", status: "free" }
  ];

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setOrders(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching live orders:", e);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/tables/queue');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setQueue(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching waitlist queue:", e);
    }
  };

  const fetchTables = async () => {
    try {
      let loadedTables = [];
      const res = await fetch('/api/tables');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          loadedTables = data.data;
        }
      }
      
      const existingMap = new Map((loadedTables || []).map(t => [Number(t.num), t]));
      loadedTables = default20Tables.map(dt => {
        const dbT = existingMap.get(Number(dt.num));
        return dbT ? { ...dt, ...dbT, num: Number(dt.num) } : dt;
      });

      // Cross-check live active orders so any table with an unpaid order or customer is marked OCCUPIED
      try {
        const orderRes = await fetch('/api/orders');
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData.success && orderData.data) {
            setOrders(orderData.data || []);
            const activeTableMap = new Map();
            orderData.data
              .filter(o => o.paymentStatus !== 'paid' && !['completed', 'cancelled'].includes(String(o.status).toLowerCase()))
              .forEach(o => {
                activeTableMap.set(Number(o.tableNum), o.customerName || 'Diner');
              });

            loadedTables = loadedTables.map(t => {
              const activeCustName = activeTableMap.get(Number(t.num));
              const isOccupied = t.status === 'occupied' || Boolean(activeCustName) || Boolean(t.currentCustomer && t.currentCustomer.trim() !== '');
              if (isOccupied) {
                return { 
                  ...t, 
                  status: 'occupied', 
                  currentCustomer: t.currentCustomer || activeCustName || 'Seated Diner'
                };
              }
              return t;
            });
          }
        }
      } catch (e) {}

      setTables(loadedTables);
    } catch (err) {
      console.error(err);
      setTables(default20Tables);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setIngredients(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchIngredients();
    fetchOrders();
    fetchQueue();

    const handleRefresh = () => {
      fetchTables();
      fetchIngredients();
      fetchOrders();
      fetchQueue();
    };

    socket.on('table:status_changed', handleRefresh);
    socket.on('inventory:updated', handleRefresh);
    socket.on('order:placed', handleRefresh);
    socket.on('order:status_updated', handleRefresh);
    socket.on('payment:completed', handleRefresh);
    socket.on('queue:updated', handleRefresh);

    const interval = setInterval(handleRefresh, 4000);

    return () => {
      socket.off('table:status_changed', handleRefresh);
      socket.off('inventory:updated', handleRefresh);
      socket.off('order:placed', handleRefresh);
      socket.off('order:status_updated', handleRefresh);
      socket.off('payment:completed', handleRefresh);
      socket.off('queue:updated', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const handleSeatQueuedCustomer = async (queueId, tableNum) => {
    try {
      const res = await fetch(`/api/tables/queue/seat/${queueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNum })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 ${data.message}`);
        fetchTables();
        fetchQueue();
      } else {
        showToast(`⚠️ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Seating queued customer failed.");
    }
  };

  const handleRemoveFromQueue = async (queueId) => {
    try {
      const res = await fetch(`/api/tables/queue/${queueId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast("🗑️ Removed from waitlist.");
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Table status action with Instant Optimistic UI Update
  const handleUpdateTableStatus = async (tableNum, newStatus) => {
    // 1. Instant Optimistic State Update
    setTables(prev => prev.map(t => Number(t.num) === Number(tableNum) ? { ...t, status: newStatus } : t));
    if (selectedTable && Number(selectedTable.num) === Number(tableNum)) {
      setSelectedTable(prev => ({ ...prev, status: newStatus }));
    }
    showToast(`🪑 Table #${tableNum} is now ${newStatus.toUpperCase()}`);

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/tables/${tableNum}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Background table status sync:", err);
    }
  };

  // Adjust Ingredient Stock delta action (+ / -) with Instant Optimistic UI Update
  const handleAdjustStock = async (ingredientId, delta) => {
    // 1. Instant Optimistic State Update
    setIngredients(prev => prev.map(ing => {
      if (String(ing._id) === String(ingredientId) || String(ing.ingredient_id) === String(ingredientId)) {
        const cur = ing.current_stock !== undefined ? ing.current_stock : (ing.quantity || 0);
        const newQty = Math.max(0, cur + Number(delta));
        const thresh = ing.reorder_threshold || ing.minThreshold || 5;
        const isLow = newQty > 0 && newQty <= thresh;
        const status = newQty <= 0 ? 'out_of_stock' : isLow ? 'low_stock' : 'in_stock';
        return { ...ing, current_stock: newQty, quantity: newQty, status, is_low_stock: isLow };
      }
      return ing;
    }));

    showToast(`📦 Stock adjusted (${delta > 0 ? '+' + delta : delta})!`);

    try {
      await fetch(`/api/inventory/${ingredientId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaAmount: delta })
      });
    } catch (err) {
      console.error("Background stock sync:", err);
    }
  };

  // Add new ingredient submit
  const handleAddIngredientSubmit = async (e) => {
    e.preventDefault();
    if (!newIngName) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newIngName,
          category: newIngCategory,
          quantity: Number(newIngQty),
          unit: newIngUnit,
          minThreshold: Number(newIngMin),
          cost_per_unit: Number(newIngCost),
          maxCapacity: Number(newIngQty) * 2
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✨ Added ${newIngName} to live inventory stock!`);
        setIsAddIngredientOpen(false);
        setNewIngName('');
        fetchIngredients();
      } else {
        showToast(`⚠️ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Table & Ingredient Calculations
  const vacantTablesCount = tables.filter(t => t.status === 'free').length;
  const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;
  const occupancyRate = tables.length > 0 ? Math.round((occupiedTablesCount / tables.length) * 100) : 0;

  const filteredTables = tables.filter(t => {
    if (tableFilter === 'vacant') return t.status === 'free';
    if (tableFilter === 'occupied') return t.status === 'occupied';
    return true;
  });

  const lowStockCount = ingredients.filter(i => {
    const qty = i.current_stock !== undefined ? i.current_stock : i.quantity;
    const thresh = i.reorder_threshold || i.minThreshold || 5;
    return qty > 0 && qty <= thresh;
  }).length;

  const outOfStockCount = ingredients.filter(i => {
    const qty = i.current_stock !== undefined ? i.current_stock : i.quantity;
    return qty <= 0;
  }).length;

  const categories = ['all', ...Array.from(new Set(ingredients.map(i => i.category || 'Produce')))];

  const filteredIngredients = ingredients.filter(i => {
    const curStock = i.current_stock !== undefined ? i.current_stock : i.quantity;
    const threshold = i.reorder_threshold || i.minThreshold || 5;
    
    // Status Filter
    if (ingredientFilter === 'low' && !(curStock > 0 && curStock <= threshold)) return false;
    if (ingredientFilter === 'out' && curStock > 0) return false;
    
    // Category Filter
    if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;

    // Search Query
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  // Get active order details for a table
  const getActiveOrdersForTable = (tableNum) => {
    return orders.filter(o => Number(o.tableNum) === Number(tableNum) && o.paymentStatus !== 'paid');
  };

  return (
    <div className="admin-wrapper" style={{ background: '#0B0F19', minHeight: '100vh', color: '#111827' }}>
      {/* Header Bar */}
      <header style={{ background: '#1E3A5F', color: '#FFFFFF', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(30, 58, 95, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#F97316', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '20px', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)' }}>
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '0.5px' }}>
                Manager Operations Control
              </h1>
              <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFF', display: 'inline-block' }}></span> LIVE SOCKET SYNC
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#D6EAF8', fontWeight: 800, marginTop: '2px', display: 'inline-block' }}>
              LOGGED IN AS: {managerName.toUpperCase()} &bull; REAL-TIME FLOOR & STOCK ENGINE
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => { fetchTables(); fetchIngredients(); fetchOrders(); showToast("🔄 Real-time data synced!"); }}
            style={{
              background: '#F97316',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
            }}
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Live Data
          </button>
          <button 
            onClick={onLogout}
            style={{
              background: '#D6EAF8',
              color: '#1E3A5F',
              border: '1px solid #BEE3F8',
              borderRadius: '20px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Switch Account
          </button>
        </div>
      </header>

      <div style={{ padding: '24px 28px', background: '#F8FAFC', minHeight: 'calc(100vh - 80px)', color: '#111827' }}>

        {/* Toast */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: '80px', right: '28px', background: '#F97316', color: '#FFF', padding: '12px 20px', borderRadius: '10px', fontWeight: 800, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-circle-info"></i> {toastMessage}
          </div>
        )}

        {/* Top Navigation Tabs */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('tables')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              border: activeTab === 'tables' ? '2px solid #1E3A5F' : '1px solid #CBD5E1',
              background: activeTab === 'tables' ? '#1E3A5F' : '#FFFFFF',
              color: activeTab === 'tables' ? '#FFFFFF' : '#1E3A5F',
              fontWeight: 900,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: activeTab === 'tables' ? '0 6px 20px rgba(30, 58, 95, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <i className="fa-solid fa-chair" style={{ fontSize: '20px', color: activeTab === 'tables' ? '#F97316' : '#1E3A5F' }}></i>
            1. Vacant & Floor Tables ({vacantTablesCount} Free / {tables.length} Total)
          </button>

          <button 
            onClick={() => setActiveTab('ingredients')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              border: activeTab === 'ingredients' ? '2px solid #1E3A5F' : '1px solid #CBD5E1',
              background: activeTab === 'ingredients' ? '#1E3A5F' : '#FFFFFF',
              color: activeTab === 'ingredients' ? '#FFFFFF' : '#1E3A5F',
              fontWeight: 900,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: activeTab === 'ingredients' ? '0 6px 20px rgba(30, 58, 95, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <i className="fa-solid fa-boxes-packing" style={{ fontSize: '20px', color: activeTab === 'ingredients' ? '#F97316' : '#1E3A5F' }}></i>
            2. Live Ingredients & Stock ({ingredients.length} Tracked)
          </button>

          <button 
            onClick={() => setActiveTab('queue')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              border: activeTab === 'queue' ? '2px solid #1E3A5F' : '1px solid #CBD5E1',
              background: activeTab === 'queue' ? '#1E3A5F' : '#FFFFFF',
              color: activeTab === 'queue' ? '#FFFFFF' : '#1E3A5F',
              fontWeight: 900,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: activeTab === 'queue' ? '0 6px 20px rgba(30, 58, 95, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <i className="fa-solid fa-users-line" style={{ fontSize: '20px', color: activeTab === 'queue' ? '#F97316' : '#1E3A5F' }}></i>
            3. Live Waitlist Queue ({queue.length} Waiting)
          </button>
        </div>

        {/* TAB 1: VACANT & OCCUPIED TABLES */}
        {activeTab === 'tables' && (
          <div>
            {/* Table Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div 
                onClick={() => setTableFilter('vacant')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: tableFilter === 'vacant' ? '3px solid #10B981' : '2px solid #6EE7B7', background: '#F0FDF4', color: '#111827', boxShadow: '0 4px 15px rgba(16,185,129,0.1)' }}
              >
                <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 900, textTransform: 'uppercase' }}>Vacant / Free Tables</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#10B981', margin: '4px 0' }}>{vacantTablesCount}</div>
                <div style={{ fontSize: '12px', color: '#047857', fontWeight: 700 }}>Click to filter vacant tables</div>
              </div>

              <div 
                onClick={() => setTableFilter('occupied')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: tableFilter === 'occupied' ? '3px solid #EF4444' : '2px solid #FCA5A5', background: '#FEF2F2', color: '#111827', boxShadow: '0 4px 15px rgba(239,68,68,0.1)' }}
              >
                <div style={{ fontSize: '12px', color: '#991B1B', fontWeight: 900, textTransform: 'uppercase' }}>Occupied Tables</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#EF4444', margin: '4px 0' }}>{occupiedTablesCount}</div>
                <div style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 700 }}>Currently dining & ordering</div>
              </div>

              <div 
                onClick={() => setTableFilter('all')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: tableFilter === 'all' ? '3px solid #F59E0B' : '2px solid #FCD34D', background: '#FFFBEB', color: '#111827', boxShadow: '0 4px 15px rgba(245,158,11,0.1)' }}
              >
                <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 900, textTransform: 'uppercase' }}>Current Occupancy</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#D97706', margin: '4px 0' }}>{occupancyRate}%</div>
                <div style={{ fontSize: '12px', color: '#B45309', fontWeight: 700 }}>{tables.length} Total Floor Tables (All)</div>
              </div>
            </div>

            {/* Table Filter Controls */}
            <div style={{ background: '#FFFFFF', padding: '14px 20px', borderRadius: '14px', marginBottom: '20px', border: '1.5px solid #D6EAF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E3A5F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-map-location-dot" style={{ color: '#F97316' }}></i>
                Live Floor Plan Grid ({filteredTables.length} Tables Shown)
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setTableFilter('all')}
                  style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid #1E3A5F', background: tableFilter === 'all' ? '#1E3A5F' : '#FFFFFF', color: tableFilter === 'all' ? '#FFF' : '#1E3A5F', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}
                >
                  All ({tables.length})
                </button>
                <button 
                  onClick={() => setTableFilter('vacant')}
                  style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid #10B981', background: tableFilter === 'vacant' ? '#10B981' : '#F0FDF4', color: tableFilter === 'vacant' ? '#FFF' : '#065F46', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}
                >
                  🟢 Vacant ({vacantTablesCount})
                </button>
                <button 
                  onClick={() => setTableFilter('occupied')}
                  style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid #EF4444', background: tableFilter === 'occupied' ? '#EF4444' : '#FEF2F2', color: tableFilter === 'occupied' ? '#FFF' : '#991B1B', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}
                >
                  🔴 Occupied ({occupiedTablesCount})
                </button>
              </div>
            </div>

            {/* Table Floor Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '18px' }}>
              {filteredTables.map(t => {
                const isVacant = t.status === 'free';
                const tableOrders = getActiveOrdersForTable(t.num);
                const orderTotal = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                const rawCust = t.currentCustomer || tableOrders[0]?.customerName;
                const activeCust = (rawCust && rawCust !== 'AURA Customer' && rawCust !== 'AURA Member' && rawCust !== 'Registered Customer' && rawCust !== 'Guest Customer')
                  ? rawCust
                  : (tableOrders[0]?.items && tableOrders[0].items.find(i => i.addedBy && i.addedBy !== 'You' && i.addedBy !== 'Guest' && i.addedBy !== 'AURA Customer' && i.addedBy !== 'AURA Member')?.addedBy)
                    || 'Active Diner';

                return (
                  <div 
                    key={t.num} 
                    style={{ 
                      padding: '20px', 
                      borderRadius: '16px', 
                      border: `2px solid ${isVacant ? '#10B981' : '#EF4444'}`,
                      background: '#FFFFFF',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                      color: '#111827',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '19px', fontWeight: 900, color: '#1E3A5F' }}>Table #{t.num}</div>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 900,
                        background: isVacant ? '#DCFCE7' : '#FEE2E2',
                        color: isVacant ? '#065F46' : '#991B1B',
                        border: `1px solid ${isVacant ? '#6EE7B7' : '#FCA5A5'}`
                      }}>
                        {isVacant ? 'VACANT' : 'OCCUPIED'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '14px', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><i className="fa-solid fa-users" style={{ width: '18px', color: '#1E3A5F' }}></i> Seating: <strong>{t.seats} Seats</strong></div>
                      <div><i className="fa-solid fa-layer-group" style={{ width: '18px', color: '#1E3A5F' }}></i> Zone: <strong>{t.zone}</strong></div>
                      {!isVacant && tableOrders.length > 0 && (
                        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '6px 10px', borderRadius: '8px', marginTop: '6px', color: '#92400E', fontSize: '12px' }}>
                          <i className="fa-solid fa-user-tag" style={{ marginRight: '6px' }}></i>
                          <strong>{activeCust}</strong> &bull; Bill: <strong style={{ color: '#F97316' }}>{formatPrice(orderTotal)}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setSelectedTable({ ...t, orders: tableOrders, activeCust, orderTotal })}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #1E3A5F', background: '#D6EAF8', color: '#1E3A5F', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-eye"></i> View Session
                      </button>

                      {isVacant ? (
                        <button 
                          onClick={() => handleUpdateTableStatus(t.num, 'occupied')}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#FFFFFF', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-user-plus"></i> Mark Occupied
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateTableStatus(t.num, 'free')}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#10B981', color: '#FFFFFF', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-check"></i> Mark Vacant
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: INGREDIENTS & STOCK LEFT */}
        {activeTab === 'ingredients' && (
          <div>
            {/* Stock Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div 
                onClick={() => setIngredientFilter('all')}
                style={{ cursor: 'pointer', padding: '18px', borderRadius: '16px', border: ingredientFilter === 'all' ? '3px solid #1E3A5F' : '2px solid #D6EAF8', background: '#FFFFFF', boxShadow: '0 4px 15px rgba(30,58,95,0.06)', color: '#111827' }}
              >
                <div style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 900, textTransform: 'uppercase' }}>Total Tracked Ingredients</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#1E3A5F', margin: '4px 0' }}>{ingredients.length}</div>
                <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 700 }}>Click to view all items</div>
              </div>

              <div 
                onClick={() => setIngredientFilter('low')}
                style={{ cursor: 'pointer', padding: '18px', borderRadius: '16px', border: ingredientFilter === 'low' ? '3px solid #F59E0B' : '2px solid #FCD34D', background: '#FFFBEB', boxShadow: '0 4px 15px rgba(245,158,11,0.08)', color: '#111827' }}
              >
                <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 900, textTransform: 'uppercase' }}>Low Stock Warnings</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#D97706', margin: '4px 0' }}>{lowStockCount}</div>
                <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 800 }}>⚠️ Click to filter low stock items</div>
              </div>

              <div 
                onClick={() => setIngredientFilter('out')}
                style={{ cursor: 'pointer', padding: '18px', borderRadius: '16px', border: ingredientFilter === 'out' ? '3px solid #EF4444' : '2px solid #FCA5A5', background: '#FEF2F2', boxShadow: '0 4px 15px rgba(239,68,68,0.08)', color: '#111827' }}
              >
                <div style={{ fontSize: '12px', color: '#991B1B', fontWeight: 900, textTransform: 'uppercase' }}>Out of Stock</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#DC2626', margin: '4px 0' }}>{outOfStockCount}</div>
                <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 800 }}>🚨 Click to filter out of stock items</div>
              </div>
            </div>

            {/* Interactive Search & Controls Bar */}
            <div style={{ background: '#FFFFFF', padding: '18px 24px', borderRadius: '16px', marginBottom: '20px', border: '1.5px solid #D6EAF8', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}></i>
                  <input 
                    type="text" 
                    placeholder="Search ingredient by name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                  />
                </div>

                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 800, background: '#FFFFFF', color: '#1E3A5F' }}
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>Category: {cat.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setIsAddIngredientOpen(true)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #F97316, #EA580C)',
                    color: '#FFF',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.4)'
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Add New Ingredient
                </button>
              </div>
            </div>

            {/* INGREDIENTS DYNAMIC STOCK TABLE */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '2px solid #D6EAF8', overflow: 'hidden', boxShadow: '0 6px 25px rgba(30,58,95,0.08)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#1E3A5F', color: '#FFFFFF' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Ingredient Name</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Category</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Current Stock</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Threshold</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Cost / Unit</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900, textAlign: 'right' }}>Dynamic Stock Adjuster (+ / -)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map((ing, idx) => {
                      const curStock = ing.current_stock !== undefined ? ing.current_stock : ing.quantity;
                      const threshold = ing.reorder_threshold || ing.minThreshold || 5;
                      const isLow = curStock > 0 && curStock <= threshold;
                      const isOut = curStock <= 0;

                      return (
                        <tr key={ing._id || ing.ingredient_id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 900, color: '#111827', fontSize: '14px' }}>
                            {ing.name}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#D6EAF8', color: '#1E3A5F', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                              {ing.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 900, color: isOut ? '#DC2626' : isLow ? '#D97706' : '#059669', fontSize: '15px' }}>
                            {curStock} {ing.unit}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#4B5563', fontWeight: 700 }}>
                            {threshold} {ing.unit}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 900, color: '#F97316', fontSize: '14px' }}>
                            ₹{ing.cost_per_unit || 100}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 900,
                              background: isOut ? '#FEE2E2' : isLow ? '#FEF3C7' : '#DCFCE7',
                              color: isOut ? '#991B1B' : isLow ? '#92400E' : '#065F46',
                              border: `1px solid ${isOut ? '#FCA5A5' : isLow ? '#FCD34D' : '#6EE7B7'}`
                            }}>
                              {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button 
                                onClick={() => handleAdjustStock(ing._id, -1)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#111827', fontWeight: 900, cursor: 'pointer' }}
                                title="Reduce stock by -1"
                              >
                                -1
                              </button>
                              <button 
                                onClick={() => handleAdjustStock(ing._id, 1)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#111827', fontWeight: 900, cursor: 'pointer' }}
                                title="Add stock +1"
                              >
                                +1
                              </button>
                              <button 
                                onClick={() => handleAdjustStock(ing._id, 10)}
                                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF', fontSize: '11px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}
                              >
                                +10 Restock
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE WAITLIST QUEUE */}
        {activeTab === 'queue' && (
          <div>
            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1.5px solid #D6EAF8', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1E3A5F', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-users-line" style={{ color: '#F97316' }}></i>
                  Real-Time Customer Waitlist Queue
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 700 }}>
                  Active queue when floor tables are full. Manager can manually assign queued diners to newly vacated tables.
                </p>
              </div>

              <div style={{ background: '#F0FDF4', color: '#065F46', border: '1px solid #6EE7B7', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 900 }}>
                {queue.length} Diners Waiting in Queue
              </div>
            </div>

            {queue.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '2px solid #D6EAF8', textAlign: 'center', color: '#64748B' }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '36px', color: '#10B981', marginBottom: '10px', display: 'block' }}></i>
                <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1E3A5F', margin: 0 }}>No Diners Currently Waiting in Queue</h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>All walk-in & logged-in diners are directly seated at floor tables.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {queue.map((q, idx) => (
                  <div key={q._id || idx} style={{ background: '#FFFFFF', border: '2px solid #D6EAF8', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ background: '#F97316', color: '#FFF', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 900 }}>
                        Position #{idx + 1} in Queue
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                        <i className="fa-solid fa-clock"></i> ~{Math.max(5, (idx + 1) * 6)} Mins Wait
                      </span>
                    </div>

                    <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#1E3A5F', margin: '0 0 6px 0' }}>
                      {q.customerName}
                    </h4>

                    <div style={{ fontSize: '13px', color: '#4B5563', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                      <div><i className="fa-solid fa-users" style={{ color: '#1E3A5F', width: '18px' }}></i> Party Size: <strong>{q.partySize || 2} Guests</strong></div>
                      {q.mobile && <div><i className="fa-solid fa-phone" style={{ color: '#10B981', width: '18px' }}></i> Phone: <strong>{q.mobile}</strong></div>}
                    </div>

                    {/* Manager Seating Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 900, color: '#1E3A5F', textTransform: 'uppercase' }}>Seat at Vacant Table:</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {tables.filter(t => t.status === 'free').map(t => (
                          <button
                            key={t.num}
                            onClick={() => handleSeatQueuedCustomer(q._id, t.num)}
                            style={{ padding: '6px 12px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}
                          >
                            Seat at Table #{t.num}
                          </button>
                        ))}
                        {tables.filter(t => t.status === 'free').length === 0 && (
                          <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 800 }}>No vacant tables available right now</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveFromQueue(q._id)}
                        style={{ marginTop: '6px', padding: '8px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-trash"></i> Cancel Waitlist Entry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* SELECTED TABLE LIVE SESSION MODAL */}
      {selectedTable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ width: '560px', maxWidth: '92%', background: '#FFFFFF', border: '2px solid #D6EAF8', borderRadius: '24px', padding: '26px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', color: '#111827', position: 'relative' }}>
            
            <button 
              onClick={() => setSelectedTable(null)} 
              style={{ position: 'absolute', top: '18px', right: '18px', background: '#D6EAF8', border: 'none', color: '#1E3A5F', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: selectedTable.status === 'free' ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '22px', fontWeight: 900 }}>
                <i className="fa-solid fa-chair"></i>
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1E3A5F', margin: 0 }}>
                  Table #{selectedTable.num} Session
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                  Zone: {selectedTable.zone} &bull; Capacity: {selectedTable.seats} Seats
                </span>
              </div>
            </div>

            {/* Session Info */}
            {selectedTable.status === 'free' ? (
              <div style={{ padding: '24px', background: '#F0FDF4', borderRadius: '16px', border: '1.5px solid #6EE7B7', textAlign: 'center', marginBottom: '20px' }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '32px', color: '#10B981', marginBottom: '8px', display: 'block' }}></i>
                <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#065F46', margin: 0 }}>Table is Currently Vacant</h4>
                <p style={{ fontSize: '13px', color: '#047857', marginTop: '4px', margin: 0 }}>Ready for immediate walk-in customer seating.</p>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#92400E', textTransform: 'uppercase', marginBottom: '4px' }}>Active Dining Customer</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>{selectedTable.activeCust || 'Guest Diner'}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#F97316', marginTop: '4px' }}>Running Bill: {formatPrice(selectedTable.orderTotal || 0)}</div>
                </div>

                {/* Orders List */}
                <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#1E3A5F', marginBottom: '10px' }}>Active Ordered Items:</h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTable.orders && selectedTable.orders.length > 0 ? (
                    selectedTable.orders.map((ord, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid #D6EAF8', fontSize: '13px' }}>
                        {(ord.items || []).map((it, iIdx) => (
                          <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                            <span><strong>{it.qty}x</strong> {it.name}</span>
                            <span style={{ fontWeight: 900, color: '#1E3A5F' }}>{formatPrice(it.price * it.qty)}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '13px', color: '#64748B' }}>No active unpaid orders recorded for this table.</div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedTable.status === 'free' ? (
                <button 
                  onClick={() => handleUpdateTableStatus(selectedTable.num, 'occupied')}
                  style={{ flex: 1, padding: '12px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-user-plus"></i> Mark Table Occupied
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateTableStatus(selectedTable.num, 'free')}
                  style={{ flex: 1, padding: '12px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-check"></i> Clear Table & Mark Vacant
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add New Ingredient Modal */}
      {isAddIngredientOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass" style={{ width: '420px', padding: '26px', borderRadius: '20px', border: '2px solid #D6EAF8', background: '#FFFFFF', color: '#111827', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginTop: 0, color: '#1E3A5F', fontSize: '20px', fontWeight: 900, marginBottom: '18px' }}>Add New Ingredient to Stock</h3>
            <form onSubmit={handleAddIngredientSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Ingredient Name</label>
                <input type="text" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} required placeholder="e.g. Fresh Amul Butter" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', color: '#111827', fontSize: '13px', fontWeight: 700 }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Category</label>
                <select value={newIngCategory} onChange={(e) => setNewIngCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', color: '#111827', fontSize: '13px', fontWeight: 700 }}>
                  <option value="Produce">Produce</option>
                  <option value="Meat & Seafood">Meat & Seafood</option>
                  <option value="Dairy & Oils">Dairy & Oils</option>
                  <option value="Beverages & Teas">Beverages & Teas</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Spices">Spices</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Initial Qty</label>
                  <input type="number" value={newIngQty} onChange={(e) => setNewIngQty(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', color: '#111827', fontSize: '13px', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Unit</label>
                  <select value={newIngUnit} onChange={(e) => setNewIngUnit(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', color: '#111827', fontSize: '13px', fontWeight: 700 }}>
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#F97316', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}>Save Ingredient</button>
                <button type="button" onClick={() => setIsAddIngredientOpen(false)} style={{ flex: 1, padding: '12px', background: '#D6EAF8', color: '#1E3A5F', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
