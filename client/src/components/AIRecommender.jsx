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
  const [budget, setBudget] = useState(800); // Max budget limit in INR
  const [dietary, setDietary] = useState('All'); // 'All', 'Veg', 'Non-Veg', 'Vegan'
  const [isTodaysSpecial, setIsTodaysSpecial] = useState(false); // Today's Special mode
  const [selectedComboIdx, setSelectedComboIdx] = useState(0); // Option 0, 1, 2
  const [isGenerating, setIsGenerating] = useState(false);

  // Time of day detection
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Morning Breakfast';
    if (hour >= 11 && hour < 16) return 'Afternoon Lunch';
    if (hour >= 16 && hour < 20) return 'Evening High Tea & Snacks';
    return 'Late Night Dinner';
  }, []);

  // Trigger brief AI thinking pulse effect on option change
  const triggerAIPulse = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 350);
  };

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

  // Smart AI Multi-Combo & Budget Utilization Generator
  const allCombos = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];

    // Filter menu items matching dietary preference & Today's Special flag
    let eligible = menuItems.filter(item => {
      if (dietary === 'Veg' && !(item.dietary_type === 'Veg' || item.dietary_type === 'Vegan')) return false;
      if (dietary === 'Non-Veg' && item.dietary_type !== 'Non-Veg') return false;
      if (dietary === 'Vegan' && item.dietary_type !== 'Vegan') return false;
      if (dietary === 'Jain') {
        const txt = `${item.name || ''} ${item.ingredients || ''} ${item.desc || ''} ${item.tags || ''}`.toLowerCase();
        const forbidden = ['onion', 'onions', 'potato', 'potatoes', 'aloo', 'fries', 'garlic', 'ginger', 'radish', 'mooli', 'beetroot', 'beet', 'carrot', 'carrots', 'chicken', 'mutton', 'fish', 'prawn', 'prawns', 'beef', 'pork', 'egg', 'eggs', 'bacon', 'turkey', 'lamb'];
        if (forbidden.some(w => txt.includes(w))) return false;
      }
      if (isTodaysSpecial && !['chef-special', 'popular', 'bestselling', 'royal', 'tandoori'].includes(item.tag) && (item.rating || 0) < 4.8) return false;
      return true;
    });

    if (eligible.length < 2) {
      eligible = menuItems.filter(item => {
        if (dietary === 'Veg' && !(item.dietary_type === 'Veg' || item.dietary_type === 'Vegan')) return false;
        if (dietary === 'Non-Veg' && item.dietary_type !== 'Non-Veg') return false;
        if (dietary === 'Vegan' && item.dietary_type !== 'Vegan') return false;
        if (dietary === 'Jain') {
          const txt = `${item.name || ''} ${item.ingredients || ''} ${item.desc || ''} ${item.tags || ''}`.toLowerCase();
          const forbidden = ['onion', 'onions', 'potato', 'potatoes', 'aloo', 'fries', 'garlic', 'ginger', 'radish', 'mooli', 'beetroot', 'beet', 'carrot', 'carrots', 'chicken', 'mutton', 'fish', 'prawn', 'prawns', 'beef', 'pork', 'egg', 'eggs', 'bacon', 'turkey', 'lamb'];
          if (forbidden.some(w => txt.includes(w))) return false;
        }
        return true;
      });
    }

    if (eligible.length === 0) eligible = menuItems;

    // Weather scoring helper
    const scoreItem = (item) => {
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

      if (isTodaysSpecial && ['chef-special', 'popular', 'bestselling'].includes(item.tag)) s += 12;

      return s + (item.rating || 4.5);
    };

    const candidates = [];

    // 1. Search for 3-Item Combos (Starter + Main Course + Beverage/Dessert) under budget
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        for (let k = j + 1; k < eligible.length; k++) {
          const item1 = eligible[i];
          const item2 = eligible[j];
          const item3 = eligible[k];
          const totalPrice = (item1.price || 0) + (item2.price || 0) + (item3.price || 0);

          if (totalPrice <= budget) {
            // High score for maximizing budget utilization + weather match
            const budgetUtilRatio = totalPrice / budget; 
            const score = (scoreItem(item1) + scoreItem(item2) + scoreItem(item3)) * (1 + budgetUtilRatio);

            candidates.push({
              items: [item1, item2, item3],
              totalPrice,
              score,
              itemCount: 3
            });
          }
        }
      }
    }

    // 2. Search for 2-Item Combos under budget
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        const item1 = eligible[i];
        const item2 = eligible[j];
        const totalPrice = (item1.price || 0) + (item2.price || 0);

        if (totalPrice <= budget) {
          const budgetUtilRatio = totalPrice / budget;
          const score = (scoreItem(item1) + scoreItem(item2)) * (1 + budgetUtilRatio * 0.8);

          candidates.push({
            items: [item1, item2],
            totalPrice,
            score,
            itemCount: 2
          });
        }
      }
    }

    // 3. Single Item under budget (fallback or tight budget)
    eligible.forEach(item => {
      if (item.price <= budget) {
        candidates.push({
          items: [item],
          totalPrice: item.price,
          score: scoreItem(item),
          itemCount: 1
        });
      }
    });

    // Sort candidates by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Pick top 3 unique combos
    const uniqueCombos = [];
    const seenSignatures = new Set();

    for (const c of candidates) {
      const sig = c.items.map(it => it.name).sort().join(' + ');
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        uniqueCombos.push(c);
        if (uniqueCombos.length >= 3) break;
      }
    }

    return uniqueCombos;
  }, [menuItems, weather, budget, dietary, liveTemp, isTodaysSpecial]);

  const activeCombo = allCombos[selectedComboIdx] || allCombos[0];

  const custName = activeCustomerSession?.customerName || localStorage.getItem('user_name') || 'Guest Diner';

  if (!activeCombo) {
    return (
      <div className="ai-recommender-card glass" style={{ background: '#1E3A5F', padding: '16px', borderRadius: '16px', color: '#FFF', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontWeight: 700 }}>💡 Select a higher budget or adjust dietary filters to view AI recommendations.</p>
      </div>
    );
  }

  const { items, totalPrice, itemCount } = activeCombo;
  const budgetUtilization = Math.min(100, Math.round((totalPrice / budget) * 100));

  // Dynamic Prompt Message
  let promptMsg = "";
  if (isTodaysSpecial) {
    promptMsg = `🌟 CHEF'S TODAY SPECIAL FEAST! Exclusive ${itemCount}-course pairing tailored for your ₹${budget} budget:`;
  } else if (weather === 'Rainy') {
    promptMsg = `🌧️ Rainy comfort dining (${liveTemp}°C)! ${itemCount}-course hot meal utilizing ${budgetUtilization}% of your ₹${budget} budget:`;
  } else if (weather === 'Chilly') {
    promptMsg = `❄️ Chilly weather outside (${liveTemp}°C)! ${itemCount}-course piping-hot feast under ₹${budget}:`;
  } else if (weather === 'Sunny') {
    promptMsg = `☀️ Sunny & warm today (${liveTemp}°C)! Refreshing ${itemCount}-item meal under ₹${budget}:`;
  } else {
    promptMsg = `✨ Pleasant weather dining! Top AI ${itemCount}-course combo under ₹${budget}:`;
  }

  return (
    <div className="ai-recommender-card" style={{
      background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)',
      border: '1.5px solid #3B82F6',
      borderRadius: '20px',
      padding: '18px 22px',
      marginBottom: '24px',
      boxShadow: '0 12px 35px rgba(30, 58, 95, 0.25)',
      color: '#FFFFFF'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '18px', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}>
            <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.2px' }}>
              AI Food Recommender
            </h3>
            <span style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 800 }}>
              🌧️ Weather: {weather} ({liveTemp}°C)
            </span>
          </div>
        </div>

        {/* Minimal Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Budget Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '5px 12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.18)' }}>
            <span style={{ fontSize: '10.5px', color: '#93C5FD', fontWeight: 900 }}>BUDGET:</span>
            <select 
              value={budget} 
              onChange={(e) => { setBudget(Number(e.target.value)); setSelectedComboIdx(0); triggerAIPulse(); }}
              style={{ background: 'transparent', border: 'none', color: '#34D399', fontWeight: 900, fontSize: '11px', cursor: 'pointer', outline: 'none' }}
            >
              <option value={250} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹250</option>
              <option value={400} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹400</option>
              <option value={600} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹600</option>
              <option value={800} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹800</option>
              <option value={1000} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹1000</option>
              <option value={1400} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹1400</option>
              <option value={2000} style={{ background: '#0F172A', color: '#FFF' }}>Unlimited ₹2000+</option>
            </select>
          </div>

          {/* Dietary Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '5px 12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.18)' }}>
            <span style={{ fontSize: '10.5px', color: '#93C5FD', fontWeight: 900 }}>DIET:</span>
            <select 
              value={dietary} 
              onChange={(e) => { setDietary(e.target.value); triggerAIPulse(); }}
              style={{ background: 'transparent', border: 'none', color: '#C084FC', fontWeight: 900, fontSize: '11px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="All" style={{ background: '#0F172A', color: '#FFF' }}>All</option>
              <option value="Veg" style={{ background: '#0F172A', color: '#FFF' }}>🌱 Veg</option>
              <option value="Non-Veg" style={{ background: '#0F172A', color: '#FFF' }}>🍗 Non-Veg</option>
              <option value="Vegan" style={{ background: '#0F172A', color: '#FFF' }}>🌿 Vegan</option>
              <option value="Jain" style={{ background: '#0F172A', color: '#FFF' }}>🙏 Jain</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Option Selector Tabs */}
      {allCombos.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {allCombos.map((c, idx) => {
            const isSelected = selectedComboIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => { setSelectedComboIdx(idx); triggerAIPulse(); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: isSelected ? '1.5px solid #F97316' : '1px solid rgba(255,255,255,0.15)',
                  background: isSelected ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'rgba(15, 23, 42, 0.5)',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {idx === 0 ? '✨ Option A' : idx === 1 ? '🔥 Option B' : '🍹 Option C'} ({formatPrice(c.totalPrice)})
              </button>
            );
          })}
        </div>
      )}

      {/* Recommendation Display Box */}
      <div style={{
        background: '#0F172A',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1.5px solid #38BDF8',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        opacity: isGenerating ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          {/* Dish Badges List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {items.map((item, idx) => {
              const icons = ['🥣', '🍱', '☕', '🍰'];
              const bgColors = ['rgba(249, 115, 22, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(168, 85, 247, 0.2)', 'rgba(236, 72, 153, 0.2)'];
              const borderColors = ['#F97316', '#10B981', '#A855F7', '#EC4899'];
              const textColors = ['#FFEDD5', '#D1FAE5', '#F3E8FF', '#FCE7F3'];
              
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span style={{ color: '#38BDF8', fontWeight: 900, fontSize: '14px' }}>+</span>}
                  <span style={{
                    background: bgColors[idx % bgColors.length],
                    color: textColors[idx % textColors.length],
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '12.5px',
                    border: `1px solid ${borderColors[idx % borderColors.length]}`
                  }}>
                    {icons[idx % icons.length]} {item.name} ({formatPrice(item.price)})
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ fontSize: '13px', color: '#93C5FD', fontWeight: 800 }}>
            Total: <strong style={{ color: '#34D399', fontSize: '15px' }}>{formatPrice(totalPrice)}</strong>
            <span style={{ marginLeft: '10px', color: '#34D399', fontSize: '11px' }}>({budgetUtilization}% of ₹{budget} budget used)</span>
          </div>
        </div>

        {/* 1-Click Add Combo to Cart */}
        <button
          onClick={() => {
            items.forEach(item => {
              onAddToCart(item._id || item.dish_id);
            });
          }}
          style={{
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '14px',
            fontWeight: 900,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fa-solid fa-cart-plus" style={{ fontSize: '16px' }}></i> Add Combo ({formatPrice(totalPrice)})
        </button>
      </div>
    </div>
  );
}
