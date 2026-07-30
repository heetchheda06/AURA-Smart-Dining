import React, { useState, useEffect } from 'react';

export default function QueueModal({ isOpen, onClose, customerName = "Guest Diner", partySize = 2, onTableFreed }) {
  const [queueList, setQueueList] = useState([]);
  const [myPosition, setMyPosition] = useState(1);
  const [freedTableNum, setFreedTableNum] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/tables/queue');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setQueueList(data.data);
          const idx = data.data.findIndex(q => 
            q.customerName && q.customerName.toLowerCase() === customerName.toLowerCase()
          );
          if (idx !== -1) setMyPosition(idx + 1);
          else setMyPosition(data.data.length || 1);
        }
      }
    } catch (e) {
      console.error("Error fetching queue in QueueModal:", e);
    }
  };

  if (!isOpen) return null;

  const estWait = Math.max(5, myPosition * 6);

  return (
    <div className="modal-overlay active" id="queue-modal" style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)' }}>
      <div style={{ maxWidth: '460px', width: '92%', background: '#FFFFFF', border: '2px solid #D6EAF8', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', color: '#111827', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '18px', right: '18px', background: '#D6EAF8', border: 'none', color: '#1E3A5F', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', boxShadow: '0 6px 20px rgba(239,68,68,0.4)', animation: 'pulse 2s infinite' }}>
            <i className="fa-solid fa-clock"></i>
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1E3A5F', margin: '0 0 6px 0' }}>
            Seating Waitlist Active
          </h3>

          <p style={{ color: '#64748B', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px', fontWeight: 700 }}>
            Hello <strong style={{ color: '#F97316' }}>{customerName}</strong>! All floor tables are currently dining. You are placed in live real-time waitlist queue.
          </p>

          <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '18px', border: '1.5px solid #D6EAF8', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.5px' }}>Estimated Seating Wait Time</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#F97316', margin: '4px 0' }}>~{estWait} Mins</div>
            <div style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 900 }}>
              Position: <span style={{ background: '#1E3A5F', color: '#FFF', padding: '2px 8px', borderRadius: '8px' }}>#{myPosition} in Queue</span> &bull; {partySize} Guests
            </div>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: '12px', padding: '12px', fontSize: '12px', color: '#065F46', fontWeight: 800, marginBottom: '20px' }}>
            <i className="fa-solid fa-bell" style={{ marginRight: '6px' }}></i>
            You will receive an instant notification as soon as a table is vacated upon bill payment!
          </div>

          <button 
            onClick={onClose}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1E3A5F, #0F172A)', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,58,95,0.3)' }}
          >
            Stay in Queue & View Digital Menu
          </button>
        </div>

      </div>
    </div>
  );
}
