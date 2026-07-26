import React, { useState, useEffect, useMemo } from 'react';

export default function AIRecommender({ 
  menuItems, 
  activeCustomerSession, 
  onAddToCart,
  formatPrice 
}) {
  // Contextual Signals State
  const [weather, setWeather] = useState('Rainy'); // 'Rainy', 'Chilly', 'Sunny', 'Pleasant'
  const [liveTemp, setLiveTemp] = useState(24);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [budget, setBudget] = useState(600); // Max budget in INR
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

              // Map WMO Weather Codes
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

  // Compute AI Recommendation Combo based on Weather, Time, Budget, and Dietary Preferences
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

    // Contextual scoring logic
    let starter = null;
    let mainOrDrink = null;
    let promptMsg = "";

    if (weather === 'Rainy') {
      promptMsg = `🌧️ It's raining today! Warm up with our signature hot comfort combo:`;
      starter = eligible.find(i => i.name.toLowerCase().includes('soup') || i.name.toLowerCase().includes('tikka') || i.name.toLowerCase().includes('corn') || i.name.toLowerCase().includes('momos')) || eligible[0];
      mainOrDrink = eligible.find(i => (i._id !== starter?._id) && (i.name.toLowerCase().includes('paneer') || i.name.toLowerCase().includes('chicken') || i.name.toLowerCase().includes('tea') || i.name.toLowerCase().includes('coffee'))) || eligible[1];
    } else if (weather === 'Chilly') {
      promptMsg = `❄️ Crisp chilly weather outside (${liveTemp}°C)! Perfect time for rich, piping-hot delicacies:`;
      starter = eligible.find(i => i.name.toLowerCase().includes('kebab') || i.name.toLowerCase().includes('soup') || i.name.toLowerCase().includes('wings')) || eligible[0];
      mainOrDrink = eligible.find(i => (i._id !== starter?._id) && (i.name.toLowerCase().includes('butter') || i.name.toLowerCase().includes('dal') || i.name.toLowerCase().includes('biryani'))) || eligible[1];
    } else if (weather === 'Sunny') {
      promptMsg = `☀️ Sunny & warm today (${liveTemp}°C)! Refresh yourself with cool drinks & light bites:`;
      starter = eligible.find(i => i.name.toLowerCase().includes('salad') || i.name.toLowerCase().includes('nachos') || i.name.toLowerCase().includes('bruschetta')) || eligible[0];
      mainOrDrink = eligible.find(i => (i._id !== starter?._id) && (i.category.toLowerCase().includes('beverages') || i.name.toLowerCase().includes('mojito') || i.name.toLowerCase().includes('shake'))) || eligible[1];
    } else {
      promptMsg = `✨ Pleasant dining weather (${liveTemp}°C)! Chef recommends our bestselling pairing:`;
      starter = eligible[0];
      mainOrDrink = eligible[1] || eligible[0];
    }

    if (!starter) starter = menuItems[0];
    if (!mainOrDrink) mainOrDrink = menuItems[1] || menuItems[0];

    const comboPrice = (starter.price || 200) + (mainOrDrink.price || 300);

    return {
      promptMsg,
      starter,
      mainOrDrink,
      comboPrice,
      isWithinBudget: comboPrice <= budget
    };
  }, [menuItems, weather, budget, dietary, liveTemp]);

  if (!recommendation) return null;

  const { promptMsg, starter, mainOrDrink, comboPrice } = recommendation;

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
              LIVE WEATHER &bull; {timeOfDay.toUpperCase()} &bull; {activeCustomerSession.customerName}
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
              <option value={400} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹400</option>
              <option value={600} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹600</option>
              <option value={900} style={{ background: '#0F172A', color: '#FFF' }}>Under ₹900</option>
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
            "{promptMsg} <strong>Would you like {starter.name} + {mainOrDrink.name} Combo?</strong>"
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,159,28,0.18)', color: 'var(--primary)', padding: '5px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', border: '1px solid rgba(255,159,28,0.35)' }}>
              🥣 {starter.name} ({formatPrice(starter.price)})
            </span>
            <span style={{ color: '#9CA3AF', fontWeight: 900 }}>+</span>
            <span style={{ background: 'rgba(16,185,129,0.18)', color: '#10B981', padding: '5px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', border: '1px solid rgba(16,185,129,0.35)' }}>
              🍱 {mainOrDrink.name} ({formatPrice(mainOrDrink.price)})
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFF', marginLeft: '6px' }}>
              = Total: <strong style={{ color: 'var(--primary)' }}>{formatPrice(comboPrice)}</strong>
            </span>
          </div>
        </div>

        {/* 1-Click Add Combo to Cart */}
        <button
          onClick={() => {
            onAddToCart(starter._id || starter.dish_id);
            onAddToCart(mainOrDrink._id || mainOrDrink.dish_id);
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
          <i className="fa-solid fa-cart-plus"></i> Add Combo to Order ({formatPrice(comboPrice)})
        </button>
      </div>
    </div>
  );
}
