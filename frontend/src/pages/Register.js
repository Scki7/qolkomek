import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: 'var(--green-mid)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M2 22c1.25-1.25 2.5-2.5 3.75-3.75C7 17 8.5 16 10 15c2-1 4-1.5 6-1 1.5.4 3 1.2 4 2.5.5.7.8 1.5.8 2.5H2z"/>
              <path d="M2 22s4-8 12-12"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'white', marginBottom: 8 }}>Join QolKomek</div>
          <div style={{ fontSize: 13, color: 'var(--sidebar-text)', lineHeight: 1.6 }}>
            Become part of the local help community. Post tasks or earn money helping others.
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '20px' }}>
          <div style={{ fontSize: 12, color: 'var(--sidebar-text)', lineHeight: 1.8 }}>
            <div>— Create and manage local tasks</div>
            <div>— Connect with verified helpers nearby</div>
            <div>— Build your reputation with ratings</div>
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
              <input className="form-input" placeholder="Your name" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/signin" style={{ color: 'var(--green)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
