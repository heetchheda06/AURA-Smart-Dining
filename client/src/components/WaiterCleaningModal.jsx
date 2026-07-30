import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function WaiterCleaningModal({ isOpen, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/checkout/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchSessions();

    const handleRefresh = () => {
      fetchSessions();
    };

    socket.on('session:updated', handleRefresh);
    socket.on('session:payment_completed', () => {
      handleRefresh();
      showToast('🔔 New table payment completed! Added to cleaning queue.');
    });

    const interval = setInterval(fetchSessions, 4000);

    return () => {
      socket.off('session:updated');
      socket.off('session:payment_completed');
      clearInterval(interval);
    };
  }, [isOpen]);

  const handleUpdateCleaning = async (tableNum, cleaningStatus) => {
    try {
      const res = await fetch('/api/checkout/update-cleaning-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNum, cleaningStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Table #${tableNum} set to ${cleaningStatus === 'completed' ? 'VACANT' : 'Cleaning In Progress'}`);
        fetchSessions();
      }
    } catch (e) {}
  };

  if (!isOpen) return null;

  const cleaningQueue = sessions.filter(s => 
    s.status === 'Payment Completed' || 
    s.status === 'Cleaning Pending' || 
    s.status === 'Cleaning In Progress'
  );

  return (
    <div className="modal-overlay active" style={{ zIndex: 9999 }}>
      <div className="modal-card glass" style={{ maxWidth: '600px', width: '90%', padding: '24px', borderRadius: '20px', background: '#0F172A', color: '#FFF' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #1E3A5F', paddingBottom: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.2)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-broom"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF' }}>
              Waiter Table Cleaning Queue
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
              Real-time table sanitization &amp; vacating supervisor
            </p>
          </div>
        </div>

        {toastMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, marginBottom: '14px' }}>
            {toastMsg}
          </div>
        )}

        {cleaningQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
            All dining tables are clean and ready for new guests!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px', maxHeight: '380px', overflowY: 'auto' }}>
            {cleaningQueue.map((item, idx) => (
              <div key={idx} style={{ background: '#1E293B', padding: '16px', borderRadius: '14px', border: '1.5px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFF' }}>
                    Table #{item.tableNum}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 700, marginTop: '2px' }}>
                    Customer: {item.customerName || 'Diner'} • Bill Paid: <span style={{ color: '#34D399' }}>₹{item.grandTotal || 0}</span>
                  </div>
                  <span style={{ fontSize: '11px', background: item.status === 'Cleaning In Progress' ? '#FEF3C7' : '#FEE2E2', color: item.status === 'Cleaning In Progress' ? '#D97706' : '#DC2626', padding: '2px 8px', borderRadius: '6px', fontWeight: 900, marginTop: '6px', display: 'inline-block' }}>
                    {item.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleUpdateCleaning(item.tableNum, 'in_progress')}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#F59E0B', color: '#FFF', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Start Cleaning
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateCleaning(item.tableNum, 'completed')}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#10B981', color: '#FFF', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cleaning Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
