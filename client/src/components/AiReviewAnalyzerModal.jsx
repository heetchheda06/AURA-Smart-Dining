import React, { useState, useEffect } from 'react';

export default function AiReviewAnalyzerModal({ isOpen, onClose }) {
  const [aiData, setAiData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    if (isOpen && !aiData) {
      handleAnalyzeWithGemini();
    }
  }, [isOpen]);

  const handleAnalyzeWithGemini = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/reviews/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setAiData(data.data);
        showToast("✨ Gemini AI Review Analysis complete!");
      } else {
        showToast("⚠️ AI Analysis failed.");
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Error connecting to AI Analysis engine.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#F8FAFC',
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '92vh',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '2px solid #8B5CF6'
      }}>
        {/* Toast Alert */}
        {toastMessage && (
          <div style={{ position: 'absolute', top: '20px', right: '24px', background: '#8B5CF6', color: '#FFF', padding: '12px 20px', borderRadius: '12px', fontWeight: 800, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 1000000 }}>
            {toastMessage}
          </div>
        )}

        {/* Modal Header Bar */}
        <header style={{ background: '#1E3A5F', color: '#FFFFFF', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#8B5CF6', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#FFF', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)' }}>
              <i className="fa-solid fa-brain"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#FFF', letterSpacing: '0.3px' }}>
                Gemini 2.5 AI Customer Review & Sentiment Analyzer
              </h2>
              <span style={{ fontSize: '12px', color: '#C4B5FD', fontWeight: 700 }}>
                Executive Restaurant Business Intelligence & Sentiment Analysis Engine
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleAnalyzeWithGemini}
              disabled={analyzing}
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                color: '#FFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`fa-solid ${analyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
              {analyzing ? 'Analyzing with Gemini...' : 'Re-Analyze Customer Reviews'}
            </button>

            <button 
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>

        {/* Modal Scrollable Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#111827' }}>
          
          {analyzing ? (
            <div style={{ textAlign: 'center', padding: '80px', background: '#FFFFFF', borderRadius: '20px', border: '2px solid #D6EAF8' }}>
              <i className="fa-solid fa-brain fa-pulse" style={{ fontSize: '48px', color: '#8B5CF6', marginBottom: '16px' }}></i>
              <h3 style={{ color: '#1E3A5F', fontWeight: 900, margin: 0 }}>Gemini AI is evaluating customer reviews...</h3>
              <p style={{ color: '#64748B', fontSize: '13px', marginTop: '6px' }}>Processing sentiment, category ratings out of 5, repeat complaints & business health score.</p>
            </div>
          ) : aiData ? (
            <div>

              {/* Summary Metric Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '16px', border: '1.5px solid #D6EAF8', boxShadow: '0 4px 15px rgba(30,58,95,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Overall Rating</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#1E3A5F', margin: '4px 0' }}>{aiData.overallRating} / 5</div>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 800 }}>★ Avg Customer Rating</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '16px', border: '1.5px solid #D6EAF8', boxShadow: '0 4px 15px rgba(30,58,95,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Total Reviews</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#1E3A5F', margin: '4px 0' }}>{aiData.totalReviews}</div>
                  <div style={{ fontSize: '11px', color: '#1E3A5F', fontWeight: 800 }}>💬 Sample & Customer Logs</div>
                </div>

                <div style={{ background: '#DCFCE7', padding: '18px', borderRadius: '16px', border: '1.5px solid #6EE7B7' }}>
                  <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 800, textTransform: 'uppercase' }}>Positive %</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#065F46', margin: '4px 0' }}>{aiData.positivePct}%</div>
                  <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 800 }}>😊 Satisfied Diners</div>
                </div>

                <div style={{ background: '#FEF3C7', padding: '18px', borderRadius: '16px', border: '1.5px solid #FCD34D' }}>
                  <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 800, textTransform: 'uppercase' }}>Neutral %</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#92400E', margin: '4px 0' }}>{aiData.neutralPct}%</div>
                  <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 800 }}>😐 Moderate Feedback</div>
                </div>

                <div style={{ background: '#FEE2E2', padding: '18px', borderRadius: '16px', border: '1.5px solid #FCA5A5' }}>
                  <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 800, textTransform: 'uppercase' }}>Negative %</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#991B1B', margin: '4px 0' }}>{aiData.negativePct}%</div>
                  <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 800 }}>😟 Needs Attention</div>
                </div>

                <div style={{ background: '#1E3A5F', padding: '18px', borderRadius: '16px', border: '2px solid #F97316', color: '#FFF' }}>
                  <div style={{ fontSize: '11px', color: '#D6EAF8', fontWeight: 800, textTransform: 'uppercase' }}>Business Health</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#F97316', margin: '4px 0' }}>{aiData.businessHealthScore} / 100</div>
                  <div style={{ fontSize: '11px', color: '#D6EAF8', fontWeight: 800 }}>🏥 Health Score</div>
                </div>
              </div>

              {/* Sentiment Bar Distribution Visual */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1.5px solid #D6EAF8', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E3A5F', marginBottom: '10px' }}>
                  📊 Overall Sentiment Distribution Visual Bar Chart
                </div>
                <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                  <div style={{ width: `${aiData.positivePct}%`, background: '#10B981', color: '#FFF', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Positive ({aiData.positivePct}%)
                  </div>
                  <div style={{ width: `${aiData.neutralPct}%`, background: '#F59E0B', color: '#FFF', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Neutral ({aiData.neutralPct}%)
                  </div>
                  <div style={{ width: `${aiData.negativePct}%`, background: '#EF4444', color: '#FFF', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Negative ({aiData.negativePct}%)
                  </div>
                </div>
              </div>

              {/* Category-Wise Analysis Grid */}
              <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '18px', border: '1.5px solid #D6EAF8', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1E3A5F', fontWeight: 900, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-list-check" style={{ color: '#F97316' }}></i> Category-Wise Ratings & Explanations (Out of 5.0)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {aiData.categories && aiData.categories.map((cat, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 900, color: '#1E3A5F', fontSize: '14px' }}>{cat.name}</span>
                        <span style={{ background: '#1E3A5F', color: '#FFF', padding: '3px 10px', borderRadius: '10px', fontWeight: 900, fontSize: '12px' }}>
                          {cat.score} / 5.0
                        </span>
                      </div>

                      <div style={{ background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ width: `${(cat.score / 5) * 100}%`, background: cat.score >= 4.5 ? '#10B981' : cat.score >= 4.0 ? '#F59E0B' : '#EF4444', height: '100%' }}></div>
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: '#4B5563', fontWeight: 600, lineHeight: '1.4' }}>
                        {cat.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Strategic Insights & Action Roadmap */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                
                {/* Top Strengths */}
                <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '18px', border: '1.5px solid #6EE7B7' }}>
                  <h4 style={{ margin: '0 0 14px 0', color: '#065F46', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }}></i> Top 5 Restaurant Strengths
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#1E3A5F', fontSize: '13px', fontWeight: 700, lineHeight: '1.8' }}>
                    {aiData.insights?.strengths?.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Top Complaints & Key Issue */}
                <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '18px', border: '1.5px solid #FCA5A5' }}>
                  <h4 style={{ margin: '0 0 14px 0', color: '#991B1B', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ color: '#EF4444' }}></i> Top Customer Complaints
                  </h4>
                  <ul style={{ margin: '0 0 14px 0', paddingLeft: '20px', color: '#991B1B', fontSize: '13px', fontWeight: 700, lineHeight: '1.8' }}>
                    {aiData.insights?.complaints?.map((cmp, i) => (
                      <li key={i}>{cmp}</li>
                    ))}
                  </ul>

                  <div style={{ background: '#FEE2E2', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #EF4444' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#991B1B', textTransform: 'uppercase' }}>🔥 Most Repeated Issue:</span>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#7F1D1D', marginTop: '2px' }}>
                      {aiData.insights?.mostRepeatedIssue}
                    </div>
                  </div>
                </div>

              </div>

              {/* Priority Improvement Roadmap */}
              <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '18px', border: '1.5px solid #D6EAF8' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1E3A5F', fontWeight: 900, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-road" style={{ color: '#8B5CF6' }}></i> Priority Business Improvement Roadmap
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  
                  {/* High Priority */}
                  <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '14px', borderLeft: '4px solid #EF4444' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#991B1B', textTransform: 'uppercase', marginBottom: '8px' }}>
                      🔴 High Priority (Immediate Fix)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#7F1D1D', fontWeight: 700, lineHeight: '1.6' }}>
                      {aiData.insights?.priorityActions?.high?.map((act, i) => <li key={i}>{act}</li>)}
                    </ul>
                  </div>

                  {/* Medium Priority */}
                  <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '14px', borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#92400E', textTransform: 'uppercase', marginBottom: '8px' }}>
                      🟡 Medium Priority (Process Tweak)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#78350F', fontWeight: 700, lineHeight: '1.6' }}>
                      {aiData.insights?.priorityActions?.medium?.map((act, i) => <li key={i}>{act}</li>)}
                    </ul>
                  </div>

                  {/* Low Priority */}
                  <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '14px', borderLeft: '4px solid #10B981' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#065F46', textTransform: 'uppercase', marginBottom: '8px' }}>
                      🟢 Low Priority (Future Enhancement)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#064E3B', fontWeight: 700, lineHeight: '1.6' }}>
                      {aiData.insights?.priorityActions?.low?.map((act, i) => <li key={i}>{act}</li>)}
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', background: '#FFFFFF', borderRadius: '16px', border: '2px solid #D6EAF8' }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '36px', color: '#8B5CF6', marginBottom: '12px' }}></i>
              <h4 style={{ margin: 0, color: '#1E3A5F', fontWeight: 900 }}>Click 'Re-Analyze Customer Reviews' to fetch Gemini AI Insights</h4>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
