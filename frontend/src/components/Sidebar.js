import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Icons = {
  Home: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/></svg>,
  Map: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  Tasks: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  User: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  LogOut: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Leaf: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-3.75C7 17 8.5 16 10 15c2-1 4-1.5 6-1 1.5.4 3 1.2 4 2.5.5.7.8 1.5.8 2.5H2z"/><path d="M2 22s4-8 12-12"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" strokeWidth="2" fill="none" stroke="currentColor" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>,
  Menu: () => <svg viewBox="0 0 24 24" strokeWidth="2" fill="none" stroke="white" width="24" height="24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  HelpCircle: () => <svg viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

const navItems = [
  { label: 'Dashboard', icon: 'Home', path: '/' },
  { label: 'Map', icon: 'Map', path: '/map' },
  { label: 'New Task', icon: 'Plus', path: '/create-task' },
  { label: 'My Tasks', icon: 'Tasks', path: '/my-tasks' },
  { label: 'Profile', icon: 'User', path: '/profile' },
  { label: 'Support', icon: 'HelpCircle', path: '/support' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  
  const unread = notifications.filter(n => !n.is_read).length;
  const W = collapsed ? 0 : 240;

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotifClick = async (notif) => {
    await api.post(`/notifications/${notif.id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setShowNotif(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <>
      <div style={{
        width: 240,
        background: '#141f12',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 300,
        transform: collapsed ? 'translateX(-240px)' : 'translateX(0)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>
        {/* Лого */}
        <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ width: 32, height: 32, background: '#3d8c35', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Icons.Leaf />
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: 'white' }}>QolKomek</div>
            <div style={{ fontSize: 10, color: '#a8c4a5', marginTop: 1 }}>Local help network</div>
          </div>
          <button onClick={() => setCollapsed(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#a8c4a5', cursor: 'pointer', padding: 6, borderRadius: 8, marginTop: 4 }}>
            <Icons.ChevronLeft />
          </button>
        </div>

        {/* Навигация */}
        <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(168,196,165,0.4)', padding: '12px 10px 6px' }}>
            Main
          </div>
          {navItems.map(item => {
            const Icon = Icons[item.icon];
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                style={{ justifyContent: 'flex-start', padding: '10px 12px' }}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}

          {user?.role === 'admin' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(168,196,165,0.4)', padding: '12px 10px 6px' }}>
                Admin
              </div>
              <button
                className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
                onClick={() => navigate('/admin')}
                style={{ justifyContent: 'flex-start', padding: '10px 12px' }}
              >
                <Icons.Shield />
                Admin Panel
              </button>
            </>
          )}
        </nav>

        {/* Низ */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {user && (
            <button
              onClick={() => setShowNotif(v => !v)}
              className="nav-item"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 12px', position: 'relative', marginBottom: 4 }}
            >
              <Icons.Bell />
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#ef4444', color: 'white',
                  borderRadius: '50%', width: 18, height: 18, fontSize: 10,
                  fontWeight: 700, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )}

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 2 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#3d8c35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: 11, color: '#a8c4a5' }}>
                  {user.role === 'admin' ? 'Administrator' : 'Member'}
                </div>
              </div>
            </div>
          )}

          {user && (
            <button
              className="nav-item"
              onClick={() => { logout(); navigate('/signin'); }}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 12px' }}
            >
              <Icons.LogOut />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Кнопка открытия (Меню) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 400,
            width: 40, height: 40,
            background: '#141f12',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <Icons.Menu />
        </button>
      )}

      {/* Выпадающее окно уведомлений */}
      {showNotif && user && (
        <>
          <div onClick={() => setShowNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 400 }} />
          <div style={{
            position: 'fixed', left: 248, bottom: 80, width: 320,
            background: 'white', borderRadius: 14,
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8e0', zIndex: 500, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#151a14' }}>Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 12, color: '#3d8c35', fontWeight: 600, cursor: 'pointer' }}>
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8a9e87', fontSize: 13 }}>
                  No notifications yet
                </div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f4f6f3', background: n.is_read ? 'white' : '#edf7eb' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, color: '#151a14' }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Спейсер для расталкивания контента */}
      <div style={{ width: W, flexShrink: 0, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }} />
    </>
  );
}