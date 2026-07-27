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

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setTables(data.data || []);
    } catch (err) {
      console.error(err);
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
    <div className="admin-wrapper" style={{ background: '#0B0F19', minHeight: '100vh', color: '#F3F4F6' }}>
      
      {/* Header */}
      <header className="admin-header glass" style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.3)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff' }}>
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, fontFamily: 'Playfair Display, serif', color: '#FFF' }}>Manager Operations Control</h1>
              <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#C4B5FD', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                FLOOR & INVENTORY ONLY
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Logged in as: <strong>{managerName}</strong> &bull; Manager Role View</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn-action" 
            onClick={() => { fetchTables(); fetchIngredients(); showToast("🔄 Floor & Inventory refreshed!"); }} 
            style={{ background: '#D6EAF8', borderColor: '#1E3A5F', color: '#1E3A5F', fontWeight: 800 }}
            title="Refresh Floor & Inventory Data"
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Data
          </button>
          <button className="btn-action" onClick={onLogout} style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444', color: '#FCA5A5' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Switch Account
          </button>
        </div>
      </header>

      <div style={{ padding: '24px 28px' }}>

        {/* Toast */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: '80px', right: '28px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: '#FFF', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-circle-info"></i> {toastMessage}
          </div>
        )}

        {/* Top Navigation Tabs for Manager */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('tables')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid',
              borderColor: activeTab === 'tables' ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'tables' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
              color: activeTab === 'tables' ? '#C4B5FD' : '#9CA3AF',
              fontWeight: 800,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '10px'
            }}
          >
            <i className="fa-solid fa-chair" style={{ fontSize: '20px', color: activeTab === 'tables' ? '#8B5CF6' : '#9CA3AF' }}></i>
            1. Vacant & Floor Tables ({vacantTablesCount} Free)
          </button>

          <button 
            onClick={() => setActiveTab('ingredients')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid',
              borderColor: activeTab === 'ingredients' ? '#10B981' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'ingredients' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
              color: activeTab === 'ingredients' ? '#6EE7B7' : '#9CA3AF',
              fontWeight: 800,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '10px'
            }}
          >
            <i className="fa-solid fa-boxes-packing" style={{ fontSize: '20px', color: activeTab === 'ingredients' ? '#10B981' : '#9CA3AF' }}></i>
            2. Ingredients & Stock Left ({ingredients.length} Items)
          </button>
        </div>

        {/* TAB 1: VACANT & OCCUPIED TABLE MANAGEMENT */}
        {activeTab === 'tables' && (
          <div>
            {/* Table Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ fontSize: '12px', color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase' }}>Vacant / Free Tables</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#10B981', margin: '4px 0' }}>{vacantTablesCount}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Available for immediate seating</div>
              </div>

              <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 700, textTransform: 'uppercase' }}>Occupied Tables</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#EF4444', margin: '4px 0' }}>{occupiedTablesCount}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Currently dining customers</div>
              </div>

              <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
                <div style={{ fontSize: '12px', color: '#FCD34D', fontWeight: 700, textTransform: 'uppercase' }}>Current Occupancy</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B', margin: '4px 0' }}>{occupancyRate}%</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{tables.length} Total Floor Tables</div>
              </div>
            </div>

            {/* Table Filters */}
            <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#FFF' }}>
                <i className="fa-solid fa-map-location-dot" style={{ color: '#8B5CF6', marginRight: '8px' }}></i>
                Real-Time Restaurant Table Floor Plan
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setTableFilter('vacant')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: tableFilter === 'vacant' ? '#10B981' : 'rgba(255,255,255,0.05)',
                    color: tableFilter === 'vacant' ? '#FFF' : '#9CA3AF'
                  }}
                >
                  Vacant Tables Only ({vacantTablesCount})
                </button>
                <button 
                  onClick={() => setTableFilter('occupied')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: tableFilter === 'occupied' ? '#EF4444' : 'rgba(255,255,255,0.05)',
                    color: tableFilter === 'occupied' ? '#FFF' : '#9CA3AF'
                  }}
                >
                  Occupied Tables ({occupiedTablesCount})
                </button>
                <button 
                  onClick={() => setTableFilter('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: tableFilter === 'all' ? '#8B5CF6' : 'rgba(255,255,255,0.05)',
                    color: tableFilter === 'all' ? '#FFF' : '#9CA3AF'
                  }}
                >
                  All Tables ({tables.length})
                </button>
              </div>
            </div>

            {/* Table Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
              {filteredTables.map(t => {
                const isVacant = t.status === 'free';
                return (
                  <div 
                    key={t.num} 
                    className="glass"
                    style={{ 
                      padding: '20px', 
                      borderRadius: '16px', 
                      border: '1px solid',
                      borderColor: isVacant ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                      background: isVacant ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFF' }}>Table #{t.num}</div>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 800,
                        background: isVacant ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isVacant ? '#34D399' : '#FCA5A5'
                      }}>
                        {isVacant ? 'VACANT' : 'OCCUPIED'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>
                      <div><i className="fa-solid fa-users" style={{ width: '18px' }}></i> Capacity: <strong>{t.seats} Seats</strong></div>
                      <div><i className="fa-solid fa-layer-group" style={{ width: '18px' }}></i> Zone: <strong>{t.zone}</strong></div>
                    </div>

                    {/* Manager Table Controls */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isVacant ? (
                        <button 
                          onClick={() => handleUpdateTableStatus(t.num, 'occupied')}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #EF4444', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-user-plus"></i> Mark Occupied
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateTableStatus(t.num, 'free')}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
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

        {/* TAB 2: INGREDIENTS & STOCK LEFT MANAGEMENT */}
        {activeTab === 'ingredients' && (
          <div>
            {/* Stock Overview Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div 
                className="glass" 
                onClick={() => setIngredientFilter('all')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: ingredientFilter === 'all' ? '2px solid #10B981' : '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}
              >
                <div style={{ fontSize: '12px', color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase' }}>Total Tracked Ingredients</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#10B981', margin: '4px 0' }}>{ingredients.length}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Click to view all items</div>
              </div>

              <div 
                className="glass" 
                onClick={() => setIngredientFilter('low')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: ingredientFilter === 'low' ? '2px solid #F59E0B' : '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.08)' }}
              >
                <div style={{ fontSize: '12px', color: '#FCD34D', fontWeight: 700, textTransform: 'uppercase' }}>Low Stock Warnings</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B', margin: '4px 0' }}>{lowStockCount}</div>
                <div style={{ fontSize: '12px', color: '#FCD34D', fontWeight: 700 }}>⚠️ Click to filter low stock items</div>
              </div>

              <div 
                className="glass" 
                onClick={() => setIngredientFilter('out')}
                style={{ cursor: 'pointer', padding: '20px', borderRadius: '16px', border: ingredientFilter === 'out' ? '2px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}
              >
                <div style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 700, textTransform: 'uppercase' }}>Out of Stock</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#EF4444', margin: '4px 0' }}>{outOfStockCount}</div>
                <div style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 700 }}>🚨 Click to filter out of stock items</div>
              </div>
            </div>

            {/* Ingredient Controls Header */}
            <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#FFF' }}>
                <i className="fa-solid fa-cubes-stacked" style={{ color: '#10B981', marginRight: '8px' }}></i>
                Real-Time Ingredient Stock & Supply Tracker
              </h2>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setIngredientFilter('low')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #F59E0B',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: ingredientFilter === 'low' ? '#F59E0B' : 'rgba(245, 158, 11, 0.15)',
                    color: ingredientFilter === 'low' ? '#FFF' : '#FCD34D'
                  }}
                >
                  <i className="fa-solid fa-triangle-exclamation"></i> Low Stock ({lowStockCount})
                </button>
                <button 
                  onClick={() => setIngredientFilter('out')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #EF4444',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: ingredientFilter === 'out' ? '#EF4444' : 'rgba(239, 68, 68, 0.15)',
                    color: ingredientFilter === 'out' ? '#FFF' : '#FCA5A5'
                  }}
                >
                  <i className="fa-solid fa-circle-xmark"></i> Out of Stock ({outOfStockCount})
                </button>
                <button 
                  onClick={() => setIngredientFilter('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #10B981',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: ingredientFilter === 'all' ? '#10B981' : 'rgba(16, 185, 129, 0.15)',
                    color: ingredientFilter === 'all' ? '#FFF' : '#6EE7B7'
                  }}
                >
                  <i className="fa-solid fa-list-check"></i> All Items ({ingredients.length})
                </button>
                <button 
                  onClick={() => setIsAddIngredientOpen(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                    color: '#FFF'
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Add New Ingredient
                </button>
              </div>
            </div>
            {/* Ingredients Stock Table */}
            <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}>
                      <th style={{ padding: '12px' }}>ID</th>
                      <th style={{ padding: '12px' }}>Ingredient Name</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Initial Stock</th>
                      <th style={{ padding: '12px' }}>Current Stock</th>
                      <th style={{ padding: '12px' }}>Reorder Threshold</th>
                      <th style={{ padding: '12px' }}>Cost / Unit</th>
                      <th style={{ padding: '12px' }}>Shelf Life</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Restock Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map(ing => {
                      const curStock = ing.current_stock !== undefined ? ing.current_stock : ing.quantity;
                      const initStock = ing.initial_stock || 50;
                      const threshold = ing.reorder_threshold || ing.minThreshold || 5;
                      const isLow = ing.is_low_stock || ing.status === 'low_stock' || curStock <= threshold;
                      const isOut = curStock <= 0;

                      return (
                        <tr key={ing._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#9CA3AF' }}>
                            {ing.ingredient_id || 'ING'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#FFF' }}>
                            {ing.name}
                          </td>
                          <td style={{ padding: '12px', color: '#9CA3AF' }}>
                            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                              {ing.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#9CA3AF', fontWeight: 600 }}>
                            {initStock} {ing.unit}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: isOut ? '#EF4444' : isLow ? '#F59E0B' : '#10B981', fontSize: '14px' }}>
                            {curStock} {ing.unit}
                          </td>
                          <td style={{ padding: '12px', color: '#9CA3AF' }}>
                            {threshold} {ing.unit}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#F59E0B' }}>
                            ₹{ing.cost_per_unit || 100}
                          </td>
                          <td style={{ padding: '12px', color: '#9CA3AF' }}>
                            {ing.shelf_life_days || 30} days
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: isOut ? 'rgba(239, 68, 68, 0.2)' : isLow ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: isOut ? '#FCA5A5' : isLow ? '#FCD34D' : '#6EE7B7'
                            }}>
                              {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleRestockIngredient(ing._id, 10)}
                              style={{ 
                                padding: '6px 12px', 
                                borderRadius: '6px',
                                border: '1px solid #10B981',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#6EE7B7',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="fa-solid fa-plus"></i> +10 {ing.unit}
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
