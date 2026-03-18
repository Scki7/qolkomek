import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
    </svg>
  ),
  Map: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Leaf: () => (
    <svg viewBox="0 0 24 24" strokeWidth="1.8">
      <path d="M2 22c1.25-1.25 2.5-2.5 3.75-3.75C7 17 8.5 16 10 15c2-1 4-1.5 6-1 1.5.4 3 1.2 4 2.5.5.7.8 1.5.8 2.5H2z"/>
      <path d="M2 22s4-8 12-12"/>
    </svg>
  ),
};

const navItems = [
  { label: 'Dashboard', icon: 'Home', path: '/' },
  { label: 'Map', icon: 'Map', path: '/map' },
  { label: 'New Task', icon: 'Plus', path: '/create-task' },
  { label: 'My Tasks', icon: 'Tasks', path: '/my-tasks' },
  { label: 'Profile', icon: 'User', path: '/profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <Icons.Leaf />
        </div>
        <div className="sidebar-brand">QolKomek</div>
        <div className="sidebar-tagline">Local help network</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {navItems.map(item => {
          const Icon = Icons[item.icon];
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <div className="nav-section-label">Admin</div>
            <button
              className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              <Icons.Shield />
              Admin Panel
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        {user ? (
          <>
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div className="sidebar-username">{user.username}</div>
                <div className="sidebar-role">
                  {user.role === 'admin' ? 'Administrator' : 'Member'}
                </div>
              </div>
            </div>
            <button
              className="nav-item"
              onClick={() => { logout(); navigate('/signin'); }}
              style={{ marginTop: 4 }}
            >
              <Icons.LogOut />
              Sign Out
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/signin')}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
