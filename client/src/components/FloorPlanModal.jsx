import React, { useState } from 'react';

export default function FloorPlanModal({ 
  isOpen, 
  onClose, 
  tables, 
  partySize, 
  onConfirmTable 
}) {
  const [selectedTableNum, setSelectedTableNum] = useState(null);

  if (!isOpen) return null;

  // Group tables by zone
  const zones = {
    'Main Hall': tables.filter(t => t.zone === 'Main Hall'),
    'Window Front': tables.filter(t => t.zone === 'Window Front'),
    'Outdoor Patio': tables.filter(t => t.zone === 'Outdoor Patio')
  };

  const handleSelectTable = (table) => {
    setSelectedTableNum(table.num);
  };

  const selectedTable = tables.find(t => t.num === selectedTableNum);

  const handleConfirm = () => {
    if (selectedTable) {
      onConfirmTable(selectedTable);
    }
  };

  const renderSeatDots = (count) => {
    const dots = [];
    for (let i = 0; i < count; i++) {
      dots.push(<span key={i} className="seat-dot-icon"></span>);
    }
    return <div className="seat-dots">{dots}</div>;
  };

  return (
    <div className="modal-overlay active" id="floorplan-modal">
      <div className="modal-card glass auth-card-wide">
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px' }}>Interactive 2D Restaurant Seat Model</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Click an available table matching your party size (<strong style={{ color: 'var(--primary)' }}>{partySize} Guests</strong>) to allot your seat.
            </p>
          </div>
          <div className="floorplan-legend">
            <div className="legend-item"><span className="legend-dot legend-free"></span> Free</div>
            <div className="legend-item"><span className="legend-dot legend-occupied"></span> Occupied</div>
            <div className="legend-item"><span className="legend-dot legend-reserved"></span> Reserved</div>
            <div className="legend-item"><span className="legend-dot legend-selected"></span> Selected</div>
          </div>
        </div>

        <div className="floorplan-wrapper">
          <div className="floor-grid">
            {Object.keys(zones).map((zoneName) => (
              <div key={zoneName} className="restaurant-zone">
                <span className="zone-title">{zoneName}</span>
                {zones[zoneName].map((table) => {
                  const isSelected = selectedTableNum === table.num;
                  let statusClass = `status-${table.status}`;
                  if (isSelected) statusClass = 'status-selected';
                  
                  return (
                    <div 
                      key={table.num} 
                      className={`table-node ${statusClass}`}
                      id={`table-node-${table.num}`}
                      onClick={() => handleSelectTable(table)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="table-num">
                        Table #0{table.num}
                        {table.status === 'occupied' && (
                          <span style={{ fontSize: '10px', background: 'rgba(230,57,70,0.2)', color: '#F87171', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px' }}>
                            BUSY
                          </span>
                        )}
                        {table.status === 'reserved' && (
                          <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.2)', color: '#F59E0B', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px' }}>
                            QUEUED
                          </span>
                        )}
                      </div>
                      <div className="table-seats-count">
                        {table.seats} Seats &bull; {table.status.toUpperCase()}
                      </div>
                      {renderSeatDots(table.seats)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', flexWrap: 'wrap', gap: '14px' }}>
          <div id="fp-selected-table-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {selectedTable ? (
              <>
                Table #{selectedTable.num} ({selectedTable.seats} Seats, {selectedTable.zone}) &bull;{' '}
                {selectedTable.status === 'free' ? (
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>FREE NOW</span>
                ) : (
                  <span style={{ color: '#F87171', fontWeight: 600 }}>
                    BUSY (Est. Wait ~{selectedTable.estWait || 15} mins)
                  </span>
                )}
              </>
            ) : (
              'No table selected. Click a node above.'
            )}
          </div>
          <button 
            className="btn-action btn-primary-action" 
            id="confirm-seat-btn"
            disabled={!selectedTableNum}
            onClick={handleConfirm}
          >
            {selectedTable && selectedTable.status === 'free' ? (
              <><i className="fa-solid fa-circle-check"></i> Allot Table #{selectedTable.num} & Enter Portal</>
            ) : selectedTable ? (
              <><i className="fa-solid fa-utensils"></i> Reserve Table #{selectedTable.num} & Pre-Order</>
            ) : (
              <><i className="fa-solid fa-circle-check"></i> Select a Table Node</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
