import React, { useState, useEffect, useMemo } from 'react';

export default function AIRecommender({ 
  menuItems = [], 
  activeCustomerSession, 
  onAddToCart,
  formatPrice 
}) {
  // Contextual Signals State
  const [weather, setWeather] = useState('Rainy'); // 'Rainy', 'Chilly', 'Sunny', 'Pleasant'
  const [liveTemp, setLiveTemp] = useState(24);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [budget, setBudget] = useState(600); // Max budget limit in INR
  const [dietary, setDietary] = useState('All'); // 'All', 'Veg', 'Non-Veg', 'Vegan'

  // Time of day detection
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Morning Breakfast';
    if (hour >= 11 && hour < 16) return 'Afternoon Lunch';
    if (hour >= 16 && hour < 20) return 'Evening High Tea & Snacks';
    return 'Late Night Dinner';
  }, []);

  // Auto-fetch Live Local Weather via Open-Meteo API
  useEffect(() => {
    if ("geolocation" in navigator) {
      setWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const data = await res.json();
            if (data && data.current_weather) {
              const temp = Math.round(data.current_weather.temperature);
              const code = data.current_weather.weathercode;
              setLiveTemp(temp);

              if (code >= 51 && code <= 99) {
                setWeather('Rainy');
              } else if (temp <= 18) {
                setWeather('Chilly');
              } else if (temp >= 30) {
                setWeather('Sunny');
              } else {
                setWeather('Pleasant');
              }
            }
          } catch (err) {
            console.log('Open-Meteo API fallback:', err);
          } finally {
            setWeatherLoading(false);
          }
        },
        () => setWeatherLoading(false),
        { timeout: 5000 }
      );
    }
  }, []);

  // Calculate recommendation strictly adhering to selected BUDGET, WEATHER, and DIETARY preferences
  const recommendation = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return null;

    // Filter menu items matching dietary preference
    let eligible = menuItems.filter(item => {
      if (dietary === 'Veg') return item.dietary_type === 'Veg' || item.dietary_type === 'Vegan';
      if (dietary === 'Non-Veg') return item.dietary_type === 'Non-Veg';
      if (dietary === 'Vegan') return item.dietary_type === 'Vegan';
      return true;
    });

    if (eligible.length === 0) eligible = menuItems;

    // Keyword scoring helpers for weather matching
    const scoreItemForWeather = (item) => {
      const nameStr = (item.name || '').toLowerCase();
      const catStr = (item.category || '').toLowerCase();
      let s = 0;

      if (weather === 'Rainy') {
        if (nameStr.includes('soup') || nameStr.includes('chai') || nameStr.includes('coffee') || nameStr.includes('tea')) s += 10;
        if (nameStr.includes('tikka') || nameStr.includes('momos') || nameStr.includes('corn') || nameStr.includes('kebab')) s += 8;
        if (nameStr.includes('paneer') || nameStr.includes('chicken')) s += 5;
      } else if (weather === 'Chilly') {
        if (nameStr.includes('kebab') || nameStr.includes('soup') || nameStr.includes('wings') || nameStr.includes('sizzl')) s += 10;
        if (nameStr.includes('butter') || nameStr.includes('dal') || nameStr.includes('biryani') || nameStr.includes('rogan')) s += 8;
      } else if (weather === 'Sunny') {
        if (catStr.includes('beverage') || nameStr.includes('mojito') || nameStr.includes('soda') || nameStr.includes('cold coffee') || nameStr.includes('shake')) s += 10;
        if (nameStr.includes('salad') || nameStr.includes('bruschetta') || nameStr.includes('spring roll') || nameStr.includes('nachos')) s += 8;
      } else { // Pleasant
        if (nameStr.includes('pizza') || nameStr.includes('pasta') || nameStr.includes('biryani') || nameStr.includes('burger')) s += 8;
      }

      return s + (item.rating || 4.5);
    };

    // Find valid 2-item combos where item1.price + item2.price <= budget
    let validPairs = [];
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        const item1 = eligible[i];
        const item2 = eligible[j];
        const comboPrice = (item1.price || 0) + (item2.price || 0);

        if (comboPrice <= budget) {
          const pairScore = scoreItemForWeather(item1) + scoreItemForWeather(item2);
          validPairs.push({ item1, item2, comboPrice, score: pairScore });
        }
      }
    }

    // Sort valid pairs by weather score descending
    validPairs.sort((a, b) => b.score - a.score);

    let promptMsg = "";
    if (weather === 'Rainy') {
      promptMsg = `🌧️ Rainy comfort dining (${liveTemp}°C)! Warm up within your ₹${budget} budget:`;
    } else if (weather === 'Chilly') {
      promptMsg = `❄️ Chilly weather outside (${liveTemp}°C)! Hot delicacies under ₹${budget}:`;
    } else if (weather === 'Sunny') {
      promptMsg = `☀️ Sunny & warm today (${liveTemp}°C)! Chilled drinks & light bites under ₹${budget}:`;
    } else {
      promptMsg = `✨ Pleasant weather dining! Bestselling combo under ₹${budget}:`;
    }

    if (validPairs.length > 0) {
      const bestPair = validPairs[0];
      return {
        type: 'combo',
        promptMsg,
        item1: bestPair.item1,
        item2: bestPair.item2,
        totalPrice: bestPair.comboPrice,
        budget
      };
    }

    // Fallback: If no 2-item combo fits under tight budget, pick the best single dish <= budget
    const affordableSingles = eligible.filter(item => item.price <= budget);
    if (affordableSingles.length > 0) {
      affordableSingles.sort((a, b) => scoreItemForWeather(b) - scoreItemForWeather(a));
      const bestSingle = affordableSingles[0];
      return {
        type: 'single',
        promptMsg: `💡 Budget Special: Single dish recommendation under ₹${budget}:`,
        item1: bestSingle,
        item2: null,
        totalPrice: bestSingle.price,
        budget
      };
    }

    // Ultimate fallback if budget is extremely low
    const lowestPricedItem = [...eligible].sort((a, b) => a.price - b.price)[0] || menuItems[0];
    return {
      type: 'single',
      promptMsg: `💡 Budget Special: Lowest priced dish recommendation:`,
      item1: lowestPricedItem,
      item2: null,
      totalPrice: lowestPricedItem.price,
      budget
    };

  }, [menuItems, weather, budget, dietary, liveTemp]);

  if (!recommendation) return null;

  const { type, promptMsg, item1, item2, totalPrice } = recommendation;
  const custName = activeCustomerSession?.customerName || localStorage.getItem('user_name') || 'Guest Diner';

  return (
    <div className="ai-recommender-card glass" style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(15, 23, 42, 0.95))',
      border: '1.5px solid rgba(139, 92, 246, 0.45)',
      borderRadius: '20px',
      padding: '20px 24px',
      marginBottom: '24px',
      boxShadow: '0 12px 35px rgba(139, 92, 246, 0.25)'
    }}>
      {/* Header Bar with Context Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '18px', boxShadow: '0 4px 15px rgba(139,92,246,0.4)' }}>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
              AI Automated Food Recommender
            </h3>
            <span style={{ fontSize: '11px', color: '#C4B5FD', fontWeight: 800, letterSpacing: '0.5px' }}>
              LIVE WEATHER &bull; {timeOfDay.toUpperCase()} &bull; {custName}
            </span>
          </div>
        </div>

        {/* Interactive Context Toggles */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Weather Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 800 }}>WEATHER:</span>
            <select 
              value={weather} 
              onChange={(e) => setWeather(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#F59E0B', fontWeight: 800, fontSize: '11px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="Rainy" style={{ background: '#0F172A', color: '#FFF' }}>🌧️ Rainy ({liveTemp}°C)</option>
              <option value="Chilly" style={{ background: '#0F172A', color: '#FFF' }}>❄️ Chilly ({liveTemp}°C)</option>
              <option value="Sunny" style={{ background: '#0F172A', color: '#FFF' }}>☀️ Sunny ({liveTemp}°C)</option>
              <option value="Pleasant" style={{ background: '#0F172A', color: '#FFF' }}>🌤️ Pleasant ({liveTemp}°C)</option>
            </select>
          </div>

          {/* Budget Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 800 }}>BUDGET:</span>
            <select 
              value={budget} 
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: '#10B981', fontWeight: 800, fontSize: '11px', cursor: 'pointer', outline: 'none' }}
            >
              <option value={250} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹250</option>
              <option value={400} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹400</option>
              <option value={600} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹600</option>
              <option value={800} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹800</option>
              <option value={1200} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹1200</option>
              <option value={2000} style={{ background: '#0F172A', color: '#FFF' }}>Unlimited ₹2000+</option>
            </select>
          </div>

          {/* Dietary Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 800 }}>DIET:</span>
            <select 
              value={dietary} 
              onChange={(e) => setDietary(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#C4B5FD', fontWeight: 800, fontSize: '11px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="All" style={{ background: '#0F172A', color: '#FFF' }}>All</option>
              <option value="Veg" style={{ background: '#0F172A', color: '#FFF' }}>🌱 Veg Only</option>
              <option value="Non-Veg" style={{ background: '#0F172A', color: '#FFF' }}>🍗 Non-Veg Only</option>
              <option value="Vegan" style={{ background: '#0F172A', color: '#FFF' }}>🌿 Vegan Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Conversational Recommendation Output */}
      <div style={{ background: 'rgba(0, 0, 0, 0.45)', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#F3F4F6', marginBottom: '10px', lineHeight: '1.4' }}>
            "{promptMsg} <strong>{type === 'combo' ? `Would you like ${item1.name} + ${item2.name} Combo?` : `Would you like ${item1.name}?`}</strong>"
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,159,28,0.18)', color: 'var(--primary)', padding: '5px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', border: '1px solid rgba(255,159,28,0.35)' }}>
              🥣 {item1.name} ({formatPrice(item1.price)})
            </span>
            
            {type === 'combo' && item2 && (
              <>
                <span style={{ color: '#9CA3AF', fontWeight: 900 }}>+</span>
                <span style={{ background: 'rgba(16,185,129,0.18)', color: '#10B981', padding: '5px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', border: '1px solid rgba(16,185,129,0.35)' }}>
                  🍱 {item2.name} ({formatPrice(item2.price)})
                </span>
              </>
            )}

            <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFF', marginLeft: '6px' }}>
              = Total: <strong style={{ color: '#10B981' }}>{formatPrice(totalPrice)}</strong>
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid #10B981', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
              ✓ Under ₹{budget} Budget
            </span>
          </div>
        </div>

        {/* 1-Click Add Combo to Cart */}
        <button
          onClick={() => {
            onAddToCart(item1._id || item1.dish_id);
            if (type === 'combo' && item2) {
              onAddToCart(item2._id || item2.dish_id);
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            color: '#FFF',
            border: 'none',
            padding: '14px 22px',
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.45)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fa-solid fa-cart-plus"></i> {type === 'combo' ? `Add Combo to Order (${formatPrice(totalPrice)})` : `Add Item to Order (${formatPrice(totalPrice)})`}
        </button>
      </div>
    </div>
  );
}
