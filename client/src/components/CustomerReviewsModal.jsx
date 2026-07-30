import React, { useState, useEffect, useMemo } from 'react';

export default function CustomerReviewsModal({ isOpen, onClose, activeCustomerSession }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'ai_analysis'
  
  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', 5, 4, 3, 2, 1
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'

  // Submission Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // AI Analysis State
  const [aiData, setAiData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      fetchReviews();
      const sessionName = activeCustomerSession?.customerName || localStorage.getItem('user_name') || '';
      if (sessionName && sessionName !== 'Guest Diner' && sessionName !== 'AURA Customer') {
        setFormName(sessionName);
      }
    }
  }, [isOpen, activeCustomerSession]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formTitle.trim() || !formComment.trim()) {
      showToast("⚠️ Please fill in all fields before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formName.trim(),
          rating: Number(formRating),
          title: formTitle.trim(),
          comment: formComment.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("🎉 Thank you! Your review was submitted successfully!");
        setFormTitle('');
        setFormComment('');
        setIsFormOpen(false);
        fetchReviews(); // Instant refresh without page reload
      } else {
        showToast(`⚠️ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

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

  // Filter & Sort Logic
  const processedReviews = useMemo(() => {
    let result = [...reviews];

    if (ratingFilter !== 'all') {
      result = result.filter(r => Number(r.rating) === Number(ratingFilter));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.rating - b.rating);
    }

    return result;
  }, [reviews, ratingFilter, searchTerm, sortBy]);

  // Overall Statistics
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalCount).toFixed(1) : "5.0";
  const starCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
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
        border: '2px solid #D6EAF8'
      }}>
        {/* Toast Alert */}
        {toastMessage && (
          <div style={{ position: 'absolute', top: '20px', right: '24px', background: '#F97316', color: '#FFF', padding: '12px 20px', borderRadius: '12px', fontWeight: 800, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 1000000 }}>
            {toastMessage}
          </div>
        )}

        {/* Modal Header Bar */}
        <header style={{ background: '#1E3A5F', color: '#FFFFFF', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#F97316', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#FFF', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)' }}>
              <i className="fa-solid fa-star"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#FFF', letterSpacing: '0.3px' }}>
                Customer Reviews & Gemini AI Sentiment Analysis
              </h2>
              <span style={{ fontSize: '12px', color: '#D6EAF8', fontWeight: 700 }}>
                Live Customer Feedback & Strategic Business Intelligence Engine
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Tab Navigation Switches */}
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '14px', display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setActiveTab('reviews')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'reviews' ? '#F97316' : 'transparent',
                  color: '#FFF',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                💬 Reviews ({totalCount})
              </button>
              <button
                onClick={() => {
                  setActiveTab('ai_analysis');
                  if (!aiData) handleAnalyzeWithGemini();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'ai_analysis' ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'transparent',
                  color: '#FFF',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ✨ Gemini AI Insights
              </button>
            </div>

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
          
          {/* TAB 1: CUSTOMER REVIEWS DIRECTORY */}
          {activeTab === 'reviews' && (
            <div>
              
              {/* Top Rating Summary Banner */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px 24px', marginBottom: '22px', border: '1.5px solid #D6EAF8', boxShadow: '0 4px 15px rgba(30,58,95,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'center', paddingRight: '20px', borderRight: '2px solid #E2E8F0' }}>
                    <div style={{ fontSize: '38px', fontWeight: 900, color: '#1E3A5F', lineHeight: 1 }}>{avgRating}</div>
                    <div style={{ color: '#F59E0B', fontSize: '14px', margin: '4px 0' }}>
                      {'★'.repeat(Math.round(avgRating))}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>{totalCount} Customer Reviews</div>
                  </div>

                  {/* Rating breakdown bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = starCounts[star] || 0;
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#4B5563' }}>
                          <span style={{ width: '45px' }}>{star} Stars</span>
                          <div style={{ flex: 1, background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, background: '#F59E0B', height: '100%' }}></div>
                          </div>
                          <span style={{ width: '25px', textAlign: 'right' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write Review Button */}
                <button
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: '#FFF',
                    border: 'none',
                    padding: '14px 22px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(249, 115, 22, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-[#FFF] fa-pen-to-square"></i> {isFormOpen ? 'Cancel Submission' : 'Write a Review'}
                </button>
              </div>

              {/* Collapsible Submission Form */}
              {isFormOpen && (
                <form onSubmit={handleCreateReview} style={{ background: '#FFFFFF', padding: '24px', borderRadius: '18px', border: '2px solid #F97316', marginBottom: '24px', boxShadow: '0 10px 25px rgba(249,115,22,0.15)' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#1E3A5F', fontWeight: 900, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-star" style={{ color: '#F97316' }}></i> Share Your Dining Experience
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1E3A5F', marginBottom: '6px' }}>Your Full Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Rohan Sharma" 
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', outline: 'none', fontSize: '14px', fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1E3A5F', marginBottom: '6px' }}>Select Rating *</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '44px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setFormRating(star)}
                            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: star <= formRating ? '#F59E0B' : '#CBD5E1' }}
                          >
                            ★
                          </button>
                        ))}
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#F59E0B', marginLeft: '6px' }}>
                          ({formRating === 5 ? '5/5 Excellent' : formRating === 4 ? '4/5 Very Good' : formRating === 3 ? '3/5 Average' : formRating === 2 ? '2/5 Poor' : '1/5 Terrible'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1E3A5F', marginBottom: '6px' }}>Review Headline / Title *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Absolute Culinary Masterpiece & Fast Service!" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', outline: 'none', fontSize: '14px', fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1E3A5F', marginBottom: '6px' }}>Detailed Review Message *</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Tell us about the food quality, taste, staff behavior, cleanliness, and overall experience..." 
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', outline: 'none', fontSize: '14px', fontWeight: 600, resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: '#1E3A5F',
                      color: '#FFF',
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(30,58,95,0.3)'
                    }}
                  >
                    {submitting ? 'Submitting Review...' : 'Submit Review Now'}
                  </button>
                </form>
              )}

              {/* Controls Bar: Search, Filter & Sort */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1E3A5F' }}></i>
                  <input 
                    type="text"
                    placeholder="Search by customer name or dish keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '12px',
                      border: '1.5px solid #D6EAF8',
                      background: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Rating Filter */}
                  <select 
                    value={ratingFilter} 
                    onChange={(e) => setRatingFilter(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #D6EAF8', background: '#FFFFFF', fontWeight: 800, fontSize: '13px', color: '#1E3A5F', outline: 'none' }}
                  >
                    <option value="all">⭐ All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </select>

                  {/* Sort Order */}
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #D6EAF8', background: '#FFFFFF', fontWeight: 800, fontSize: '13px', color: '#1E3A5F', outline: 'none' }}
                  >
                    <option value="newest">🕒 Newest First</option>
                    <option value="oldest">⌛ Oldest First</option>
                    <option value="highest">📈 Highest Rating</option>
                    <option value="lowest">📉 Lowest Rating</option>
                  </select>
                </div>
              </div>

              {/* Reviews Cards List Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#1E3A5F' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <p style={{ fontWeight: 800 }}>Loading customer reviews...</p>
                </div>
              ) : processedReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#FFFFFF', borderRadius: '16px', border: '2px solid #D6EAF8' }}>
                  <i className="fa-solid fa-comment-slash" style={{ fontSize: '42px', color: '#F97316', marginBottom: '12px' }}></i>
                  <h3 style={{ margin: 0, color: '#1E3A5F', fontWeight: 900 }}>No reviews match your search filter</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Try clearing your search query or selecting "All Ratings".</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {processedReviews.map((rev) => (
                    <div 
                      key={rev._id || rev.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '18px',
                        padding: '20px',
                        border: '1.5px solid #D6EAF8',
                        boxShadow: '0 4px 18px rgba(30, 58, 95, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <div>
                        {/* Card Header: Avatar, Name & Verified Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img 
                              src={rev.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.customerName)}&background=1E3A5F&color=fff&bold=true`} 
                              alt={rev.customerName}
                              style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #F97316', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 900, color: '#1E3A5F', fontSize: '15px' }}>{rev.customerName}</div>
                              <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#065F46', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                                ✓ Verified Customer
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 900 }}>
                              {'★'.repeat(rev.rating)}
                              <span style={{ color: '#CBD5E1' }}>{'★'.repeat(5 - rev.rating)}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, marginTop: '2px' }}>
                              {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Title & Comment */}
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 900, color: '#111827', letterSpacing: '0.2px' }}>
                          "{rev.title}"
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: '1.5', fontWeight: 600 }}>
                          {rev.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: GEMINI AI ANALYSIS & INSIGHTS DASHBOARD */}
          {activeTab === 'ai_analysis' && (
            <div>
              {/* Action Banner */}
              <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(15, 23, 42, 0.95))', border: '2px solid #8B5CF6', padding: '20px 24px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 10px 30px rgba(139,92,246,0.25)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#FFF', fontSize: '20px', fontWeight: 900 }}>
                      Gemini 2.5 AI Customer Intelligence & Sentiment Engine
                    </h3>
                    <span style={{ background: '#8B5CF6', color: '#FFF', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px' }}>
                      POWERED BY GEMINI API
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: '#C4B5FD', fontSize: '13px', fontWeight: 700 }}>
                    Automatically analyzes sentiment, category ratings out of 5, key strengths, complaints, and strategic recommendations.
                  </p>
                </div>

                <button
                  onClick={handleAnalyzeWithGemini}
                  disabled={analyzing}
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                    color: '#FFF',
                    border: 'none',
                    padding: '14px 24px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className={`fa-solid ${analyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                  {analyzing ? 'Analyzing with Gemini API...' : 'Re-Analyze Reviews with AI'}
                </button>
              </div>

              {analyzing ? (
                <div style={{ textAlign: 'center', padding: '80px', background: '#FFFFFF', borderRadius: '20px', border: '2px solid #D6EAF8' }}>
                  <i className="fa-solid fa-brain fa-pulse" style={{ fontSize: '48px', color: '#8B5CF6', marginBottom: '16px' }}></i>
                  <h3 style={{ color: '#1E3A5F', fontWeight: 900, margin: 0 }}>Gemini AI is analyzing {totalCount} customer reviews...</h3>
                  <p style={{ color: '#64748B', fontSize: '13px', marginTop: '6px' }}>Evaluating sentiment, category scores, customer complaints & strategic roadmaps.</p>
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
                      📊 Overall Sentiment Distribution Visual Chart
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
              ) : null}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
