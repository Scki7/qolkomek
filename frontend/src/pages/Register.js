// frontend/src/pages/Register.js — ПОЛНОСТЬЮ ЗАМЕНИТЬ
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a-z)', ok: /[a-z]/.test(password) },
    { label: 'Number (0-9)', ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
  const labels = ['Weak','Fair','Good','Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? colors[score-1] : '#e5e7eb', transition: 'background 0.2s' }} />
        ))}
      </div>
      {score > 0 && <div style={{ fontSize: 12, color: colors[score-1], fontWeight: 600, marginBottom: 6 }}>{labels[score-1]}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.ok ? '#16a34a' : '#9ca3af' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {c.ok ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="10"/>}
            </svg>
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: '#3d8c35', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-3.75C7 17 8.5 16 10 15c2-1 4-1.5 6-1 1.5.4 3 1.2 4 2.5.5.7.8 1.5.8 2.5H2z"/><path d="M2 22s4-8 12-12"/></svg>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'white', marginBottom: 8 }}>Join QolKomek</div>
          <div style={{ fontSize: 13, color: '#a8c4a5', lineHeight: 1.7 }}>
            — Post tasks, find local helpers<br/>
            — Real-time chat<br/>
            — Rate after completion
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-box">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Fill in your details to get started</p>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Your name" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <PasswordStrength password={form.password} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 12 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#8a9e87' }}>
            Already have an account? <Link to="/signin" style={{ color: '#3d8c35', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
