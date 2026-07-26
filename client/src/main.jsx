import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#fff', textAlign: 'center', background: '#0a0b0e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: 'serif', color: '#F87171', fontSize: '24px', marginBottom: '10px' }}>Something went wrong.</h2>
          <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px', maxWidth: '500px' }}>{this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', background: '#FF9F1C', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
