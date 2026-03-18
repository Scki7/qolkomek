import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div style={{ marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, background: 'var(--green-mid)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M2 22c1.25-1.25 2.5-2.5 3.75-3.75C7 17 8.5 16 10 15c2-1 4-1.5 6-1 1.5.4 3 1.2 4 2.5.5.7.8 1.5.8 2.5H2z"/>
              <path d="M2 22s4-8 12-12"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'white', marginBottom: 8 }}>QolKomek</div>
          <div style={{ fontSize: 13, color: 'var(--sidebar-text)', lineHeight: 1.6 }}>
            Your local help network. Find trusted people nearby for everyday tasks.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {['Post tasks and find local helpers', 'Real-time chat with your helper', 'Rate and review after completion'].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(79,173,68,0.3)', border: '1px solid rgba(79,173,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4fad44" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, color: 'var(--sidebar-text)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Enter your credentials to access your account</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--green)', fontWeight: 600 }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
