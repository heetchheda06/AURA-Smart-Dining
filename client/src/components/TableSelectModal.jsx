import React, { useState, useEffect } from 'react';

export default function TableSelectModal({ isOpen, onClose, customerName, loginType = "guest", onConfirmTable, onJoinQueue }) {
  const [tables, setTables] = useState([]);
  const [selectedTableNum, setSelectedTableNum] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  const fetchTables = async () => {
    setLoading(true);
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

      // Cross-check active orders
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
      
      // Auto-select first vacant table if available
      const firstVacant = loadedTables.find(t => t.status === 'free');
      if (firstVacant) setSelectedTableNum(firstVacant.num);
      else setSelectedTableNum(null);

    } catch (err) {
      console.error(err);
      setTables(default20Tables);
      setSelectedTableNum(1);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const vacantTables = tables.filter(t => t.status === 'free');
  const isFullHouse = vacantTables.length === 0;
  const selectedTableObj = tables.find(t => t.num === selectedTableNum) || vacantTables[0] || default20Tables[0];

  const handleConfirm = async () => {
    if (!selectedTableNum) return;

    try {
      // Update table to occupied in DB with live customer login details
      await fetch(`/api/tables/${selectedTableNum}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'occupied',
          customerName: customerName || 'Guest Customer',
          loginType: loginType || 'guest'
        })
      });
    } catch (e) {
      console.error(e);
    }

    if (onConfirmTable) {
      onConfirmTable(selectedTableObj.num, selectedTableObj.seats, selectedTableObj.zone);
    }
    onClose();
  };

  const handleJoinQueueClick = async () => {
    try {
      await fetch('/api/tables/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName || 'Guest Customer',
          partySize: 2
        })
      });
    } catch (e) {}

    if (onJoinQueue) onJoinQueue(customerName || 'Guest Customer');
    onClose();
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)' }}>
      <div style={{ maxWidth: '720px', width: '92%', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', border: '2px solid #D6EAF8', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 60px rgba(30,58,95,0.2)', color: '#111827', position: 'relative' }}>
        
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#D6EAF8', border: 'none', color: '#1E3A5F', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '24px', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}>
            <i className="fa-solid fa-chair"></i>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1E3A5F', margin: 0 }}>
              Welcome, {customerName && customerName !== 'Member' && customerName !== 'Google Member' && customerName !== 'Google Diner' ? customerName : 'Heet Chheda'}! Pick Your Dining Table
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 700 }}>
              {isFullHouse 
                ? "⚠️ All floor tables are currently occupied! Join the live waitlist queue."
                : `Choose your preferred vacant table (${vacantTables.length} free tables).`}
            </p>
          </div>
        </div>

        {/* Full House Banner if no tables vacant */}
        {isFullHouse && (
          <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: '16px', padding: '18px', marginBottom: '20px', textAlign: 'center' }}>
            <i className="fa-solid fa-clock" style={{ fontSize: '32px', color: '#EF4444', marginBottom: '8px', display: 'block' }}></i>
            <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#991B1B', margin: 0 }}>Full House — All 20 Tables Occupied!</h4>
            <p style={{ fontSize: '13px', color: '#B91C1C', marginTop: '4px', marginBottom: '16px', fontWeight: 700 }}>
              Tables will be vacated as soon as seated customers complete & pay their bills.
            </p>
            <button
              onClick={handleJoinQueueClick}
              style={{
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-users-line"></i> Join Live Seating Waitlist Queue
            </button>
          </div>
        )}

        {/* Table Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#4B5563', fontWeight: 700 }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#F97316', marginBottom: '12px', display: 'block' }}></i>
            Loading live floor plan tables...
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
              {tables.map(t => {
                const isVacant = t.status === 'free';
                const isSelected = selectedTableNum === t.num;

                return (
                  <div
                    key={t.num}
                    onClick={() => {
                      if (isVacant) setSelectedTableNum(t.num);
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: isSelected ? '3px solid #F97316' : isVacant ? '1.5px solid #6EE7B7' : '1.5px solid #FCA5A5',
                      background: isSelected ? '#FEF3C7' : isVacant ? '#F0FDF4' : '#FEF2F2',
                      cursor: isVacant ? 'pointer' : 'not-allowed',
                      opacity: isVacant ? 1 : 0.65,
                      boxShadow: isSelected ? '0 4px 15px rgba(249,115,22,0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#1E3A5F' }}>
                        Table #{t.num}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: isVacant ? '#DCFCE7' : '#FEE2E2',
                        color: isVacant ? '#065F46' : '#991B1B'
                      }}>
                        {isVacant ? 'VACANT' : 'BUSY'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>
                      <div><i className="fa-solid fa-users" style={{ color: '#1E3A5F', width: '14px' }}></i> {t.seats} Seats</div>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: '#F97316', width: '14px' }}></i> {t.zone}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Banner & Confirm CTA */}
            {!isFullHouse && selectedTableNum && (
              <div style={{ background: '#F8FAFC', border: '1.5px solid #D6EAF8', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>Selected Dining Table</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E3A5F' }}>
                    Table #{selectedTableObj.num} &bull; {selectedTableObj.seats} Seats ({selectedTableObj.zone})
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-check"></i> Seat Me at Table #{selectedTableObj.num}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
