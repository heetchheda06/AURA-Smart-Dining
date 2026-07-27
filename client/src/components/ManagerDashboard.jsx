import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function ManagerDashboard({ onLogout, managerName = "AURA Manager", formatPrice }) {
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' or 'ingredients'
  const [tables, setTables] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [tableFilter, setTableFilter] = useState('vacant'); // 'vacant', 'occupied', 'all'
  const [ingredientFilter, setIngredientFilter] = useState('all'); // 'all', 'low', 'out'
  const [toastMessage, setToastMessage] = useState('');
  
  // New Ingredient Modal State
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('Produce');
  const [newIngQty, setNewIngQty] = useState(10);
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngMin, setNewIngMin] = useState(5);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const default20Tables = [
    { num: 1, seats: 2, zone: "Main Hall", status: "free" },
    { num: 2, seats: 4, zone: "Main Hall", status: "occupied" },
    { num: 3, seats: 2, zone: "Window Lounge", status: "free" },
    { num: 4, seats: 6, zone: "VIP Private Lounge", status: "occupied" },
    { num: 5, seats: 4, zone: "Window Lounge", status: "free" },
    { num: 6, seats: 8, zone: "VIP Private Lounge", status: "free" },
    { num: 7, seats: 2, zone: "Outdoor Patio", status: "occupied" },
    { num: 8, seats: 4, zone: "Outdoor Patio", status: "occupied" },
    { num: 9, seats: 6, zone: "Main Hall", status: "free" },
    { num: 10, seats: 4, zone: "Main Hall", status: "free" },
    { num: 11, seats: 2, zone: "Window Lounge", status: "free" },
    { num: 12, seats: 4, zone: "Window Lounge", status: "occupied" },
    { num: 13, seats: 6, zone: "Rooftop Deck", status: "free" },
    { num: 14, seats: 4, zone: "Rooftop Deck", status: "free" },
    { num: 15, seats: 8, zone: "VIP Private Lounge", status: "occupied" },
    { num: 16, seats: 2, zone: "Rooftop Deck", status: "free" },
    { num: 17, seats: 4, zone: "Outdoor Patio", status: "free" },
    { num: 18, seats: 6, zone: "Family Dining", status: "free" },
    { num: 19, seats: 10, zone: "Family Dining", status: "free" },
    { num: 20, seats: 12, zone: "Family Dining Grand", status: "free" }
  ];

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
      
      if (loadedTables.length < 20) {
        const existingMap = new Map(loadedTables.map(t => [t.num, t]));
        loadedTables = default20Tables.map(dt => existingMap.get(dt.num) || dt);
      }

      // Cross-check live active orders so any table with an unpaid order is marked OCCUPIED
      try {
        const orderRes = await fetch('/api/orders');
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData.success && orderData.data) {
            const activeTableSet = new Set(
              orderData.data
                .filter(o => o.paymentStatus !== 'paid' && !['completed', 'cancelled'].includes(String(o.status).toLowerCase()))
                .map(o => Number(o.tableNum))
            );
            loadedTables = loadedTables.map(t => {
              if (activeTableSet.has(Number(t.num))) {
                return { ...t, status: 'occupied' };
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

    const handleRefresh = () => {
      fetchTables();
      fetchIngredients();
    };

    socket.on('table:status_changed', handleRefresh);
    socket.on('inventory:updated', handleRefresh);
    socket.on('order:placed', handleRefresh);
    socket.on('order:status_updated', handleRefresh);
    socket.on('payment:completed', handleRefresh);

    const interval = setInterval(handleRefresh, 5000);

    return () => {
      socket.off('table:status_changed', handleRefresh);
      socket.off('inventory:updated', handleRefresh);
      socket.off('order:placed', handleRefresh);
      socket.off('order:status_updated', handleRefresh);
      socket.off('payment:completed', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  // Update Table status action
  const handleUpdateTableStatus = async (tableNum, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tables/${tableNum}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🪑 Table #${tableNum} status updated to: ${newStatus.toUpperCase()}`);
        fetchTables();
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Failed to update table status.");
    }
  };

  // Restock ingredient delta action
  const handleRestockIngredient = async (ingredientId, delta = 5) => {
    try {
      const res = await fetch(`/api/inventory/${ingredientId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaAmount: delta })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`📦 Restocked +${delta} ${data.data.unit} of ${data.data.name}!`);
        fetchIngredients();
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Restock failed.");
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
          maxCapacity: Number(newIngQty) * 2
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✨ Added ${newIngName} to inventory stock!`);
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

  // Filtered lists
  const vacantTablesCount = tables.filter(t => t.status === 'free').length;
  const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;
  const occupancyRate = tables.length > 0 ? Math.round((occupiedTablesCount / tables.length) * 100) : 0;

  const filteredTables = tables.filter(t => {
    if (tableFilter === 'vacant') return t.status === 'free';
    if (tableFilter === 'occupied') return t.status === 'occupied';
    return true;
  });

  const lowStockCount = ingredients.filter(i => i.status === 'low_stock').length;
  const outOfStockCount = ingredients.filter(i => i.status === 'out_of_stock').length;

  const filteredIngredients = ingredients.filter(i => {
    if (ingredientFilter === 'low') return i.status === 'low_stock';
    if (ingredientFilter === 'out') return i.status === 'out_of_stock';
    return true;
  });

  return (
    <div className="admin-wrapper" style={{ background: '#0B0F19', minHeight: '100vh', color: '#111827' }}>
      {/* Header Bar */}
      <header style={{ background: '#1E3A5F', color: '#FFFFFF', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(30, 58, 95, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#F97316', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '20px', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)' }}>
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '0.5px' }}>
              Manager Operations Control
            </h1>
            <span style={{ fontSize: '11px', background: '#D6EAF8', color: '#1E3A5F', padding: '2px 10px', borderRadius: '10px', fontWeight: 800, marginTop: '2px', display: 'inline-block' }}>
              FLOOR & INVENTORY CONTROL PORTAL
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={fetchIngredients}
            style={{
              background: '#F97316',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
            }}
          >
            <i className="fa-solid fa-rotate"></i> Refresh Data
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
            1. Vacant & Floor Tables ({vacantTablesCount} Free)
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
            2. Ingredients & Stock Left ({ingredients.length} Items)
          </button>
        </div>

        {/* TAB 1: VACANT & OCCUPIED TABLES */}
        {activeTab === 'tables' && (
          <div>
            {/* Table Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', border: '2px solid #10B981', background: '#F0FDF4', color: '#111827', boxShadow: '0 4px 15px rgba(16,185,129,0.1)' }}>
                <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 800, textTransform: 'uppercase' }}>Vacant / Free Tables</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#10B981', margin: '4px 0' }}>{vacantTablesCount}</div>
                <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>Available for immediate seating</div>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', border: '2px solid #EF4444', background: '#FEF2F2', color: '#111827', boxShadow: '0 4px 15px rgba(239,68,68,0.1)' }}>
                <div style={{ fontSize: '12px', color: '#991B1B', fontWeight: 800, textTransform: 'uppercase' }}>Occupied Tables</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#EF4444', margin: '4px 0' }}>{occupiedTablesCount}</div>
                <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>Currently dining customers</div>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', border: '2px solid #F59E0B', background: '#FFFBEB', color: '#111827', boxShadow: '0 4px 15px rgba(245,158,11,0.1)' }}>
                <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 800, textTransform: 'uppercase' }}>Current Occupancy</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#D97706', margin: '4px 0' }}>{occupancyRate}%</div>
                <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>{tables.length} Total Floor Tables</div>
              </div>
            </div>

            {/* Table Floor Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
              {filteredTables.map(t => {
                const isVacant = t.status === 'free';
                return (
                  <div 
                    key={t.num} 
                    style={{ 
                      padding: '20px', 
                      borderRadius: '16px', 
                      border: `2px solid ${isVacant ? '#10B981' : '#EF4444'}`,
                      background: '#FFFFFF',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                      color: '#111827'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E3A5F' }}>Table #{t.num}</div>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 900,
                        background: isVacant ? '#DCFCE7' : '#FEE2E2',
                        color: isVacant ? '#065F46' : '#991B1B'
                      }}>
                        {isVacant ? 'VACANT' : 'OCCUPIED'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px', fontWeight: 600 }}>
                      <div><i className="fa-solid fa-users" style={{ width: '18px', color: '#1E3A5F' }}></i> Capacity: <strong>{t.seats} Seats</strong></div>
                      <div><i className="fa-solid fa-layer-group" style={{ width: '18px', color: '#1E3A5F' }}></i> Zone: <strong>{t.zone}</strong></div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isVacant ? (
                        <button 
                          onClick={() => handleUpdateTableStatus(t.num, 'occupied')}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#FFFFFF', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-user-plus"></i> Mark Occupied
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateTableStatus(t.num, 'free')}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#10B981', color: '#FFFFFF', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-check"></i> Mark Vacant (Free)
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div 
                onClick={() => setIngredientFilter('all')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: ingredientFilter === 'all' ? '3px solid #1E3A5F' : '2px solid #D6EAF8', background: '#FFFFFF', boxShadow: '0 4px 15px rgba(30,58,95,0.06)', color: '#111827' }}
              >
                <div style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 800, textTransform: 'uppercase' }}>Total Tracked Ingredients</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#1E3A5F', margin: '4px 0' }}>{ingredients.length}</div>
                <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 700 }}>Click to view all items</div>
              </div>

              <div 
                onClick={() => setIngredientFilter('low')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: ingredientFilter === 'low' ? '3px solid #F59E0B' : '2px solid #FCD34D', background: '#FFFBEB', boxShadow: '0 4px 15px rgba(245,158,11,0.08)', color: '#111827' }}
              >
                <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 800, textTransform: 'uppercase' }}>Low Stock Warnings</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#D97706', margin: '4px 0' }}>{lowStockCount}</div>
                <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 800 }}>⚠️ Click to filter low stock items</div>
              </div>

              <div 
                onClick={() => setIngredientFilter('out')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: ingredientFilter === 'out' ? '3px solid #EF4444' : '2px solid #FCA5A5', background: '#FEF2F2', boxShadow: '0 4px 15px rgba(239,68,68,0.08)', color: '#111827' }}
              >
                <div style={{ fontSize: '12px', color: '#991B1B', fontWeight: 800, textTransform: 'uppercase' }}>Out of Stock</div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#DC2626', margin: '4px 0' }}>{outOfStockCount}</div>
                <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 800 }}>🚨 Click to filter out of stock items</div>
              </div>
            </div>

            {/* Controls Bar */}
            <div style={{ background: '#FFFFFF', padding: '18px 24px', borderRadius: '16px', marginBottom: '20px', border: '1.5px solid #D6EAF8', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#1E3A5F' }}>
                <i className="fa-solid fa-cubes-stacked" style={{ color: '#F97316', marginRight: '8px' }}></i>
                Real-Time Ingredient Stock Tracker ({filteredIngredients.length} Items Shown)
              </h2>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setIngredientFilter('low')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1.5px solid #F59E0B',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: ingredientFilter === 'low' ? '#F59E0B' : '#FFFBEB',
                    color: ingredientFilter === 'low' ? '#FFF' : '#B45309'
                  }}
                >
                  ⚠️ Low Stock ({lowStockCount})
                </button>
                <button 
                  onClick={() => setIngredientFilter('out')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1.5px solid #EF4444',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: ingredientFilter === 'out' ? '#EF4444' : '#FEF2F2',
                    color: ingredientFilter === 'out' ? '#FFF' : '#B91C1C'
                  }}
                >
                  🚨 Out of Stock ({outOfStockCount})
                </button>
                <button 
                  onClick={() => setIngredientFilter('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1.5px solid #1E3A5F',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: ingredientFilter === 'all' ? '#1E3A5F' : '#D6EAF8',
                    color: ingredientFilter === 'all' ? '#FFF' : '#1E3A5F'
                  }}
                >
                  📋 All Items ({ingredients.length})
                </button>
                <button 
                  onClick={() => setIsAddIngredientOpen(true)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '12px',
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

            {/* INGREDIENTS HIGH CONTRAST TABLE */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '2px solid #D6EAF8', overflow: 'hidden', boxShadow: '0 6px 25px rgba(30,58,95,0.08)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#1E3A5F', color: '#FFFFFF' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>ID</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Ingredient Name</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Category</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Initial Stock</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Current Stock</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Reorder Threshold</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Cost / Unit</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Shelf Life</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900 }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 900, textAlign: 'right' }}>Restock Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map((ing, idx) => {
                      const curStock = ing.current_stock !== undefined ? ing.current_stock : ing.quantity;
                      const initStock = ing.initial_stock || 50;
                      const threshold = ing.reorder_threshold || ing.minThreshold || 5;
                      const isLow = ing.is_low_stock || ing.status === 'low_stock' || curStock <= threshold;
                      const isOut = curStock <= 0;

                      return (
                        <tr key={ing._id || ing.ingredient_id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: '#1E3A5F' }}>
                            {ing.ingredient_id || 'ING'}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 900, color: '#111827', fontSize: '14px' }}>
                            {ing.name}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#D6EAF8', color: '#1E3A5F', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                              {ing.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#111827', fontWeight: 700 }}>
                            {initStock} {ing.unit}
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
                          <td style={{ padding: '14px 16px', color: '#4B5563', fontWeight: 600 }}>
                            {ing.shelf_life_days || 30} days
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
                            <button 
                              onClick={() => handleRestockIngredient(ing._id, 10)}
                              style={{ 
                                padding: '8px 14px', 
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                              }}
                            >
                              +10 {ing.unit} Restock
                            </button>
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

      </div>

      {/* Add New Ingredient Modal */}
      {isAddIngredientOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass" style={{ width: '400px', padding: '24px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h3 style={{ marginTop: 0, color: '#FFF', fontSize: '18px', fontWeight: 800 }}>Add New Ingredient to Stock</h3>
            <form onSubmit={handleAddIngredientSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Ingredient Name</label>
                <input type="text" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} required placeholder="e.g. Fresh Butter" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Category</label>
                <select value={newIngCategory} onChange={(e) => setNewIngCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}>
                  <option value="Produce" style={{ color: '#000' }}>Produce</option>
                  <option value="Meat & Seafood" style={{ color: '#000' }}>Meat & Seafood</option>
                  <option value="Dairy & Oils" style={{ color: '#000' }}>Dairy & Oils</option>
                  <option value="Beverages & Teas" style={{ color: '#000' }}>Beverages & Teas</option>
                  <option value="Pantry" style={{ color: '#000' }}>Pantry</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Initial Qty</label>
                  <input type="number" value={newIngQty} onChange={(e) => setNewIngQty(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Unit</label>
                  <select value={newIngUnit} onChange={(e) => setNewIngUnit(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}>
                    <option value="kg" style={{ color: '#000' }}>kg</option>
                    <option value="L" style={{ color: '#000' }}>L</option>
                    <option value="units" style={{ color: '#000' }}>units</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Save Ingredient</button>
                <button type="button" onClick={() => setIsAddIngredientOpen(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
