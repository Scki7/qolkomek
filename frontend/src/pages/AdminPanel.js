import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    Promise.all([api.get('/users'), api.get('/users/admin/reports')])
      .then(([u, r]) => { setUsers(u.data); setReports(r.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleBlock = async (userId, block) => {
    try {
      await api.post(`/users/${userId}/${block ? 'block' : 'unblock'}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: block } : u));
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <span className="page-topbar-title">Admin Panel</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            <span>{users.length} users</span>
            <span>{reports.length} reports</span>
          </div>
        </div>

        <div className="page-body">
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--border)', borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 24 }}>
            {[{ key: 'users', label: 'Users' }, { key: 'reports', label: 'Reports' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '7px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.12s',
                  background: tab === t.key ? 'white' : 'transparent',
                  color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: tab === t.key ? 'var(--shadow)' : 'none'
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading && <div className="loading-wrap"><div className="spinner" /></div>}

          {/* Users */}
          {!loading && tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar" style={{ width: 40, height: 40, fontSize: 15, background: u.is_blocked ? '#fee2e2' : 'var(--green-pale)', color: u.is_blocked ? '#dc2626' : 'var(--green)' }}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                    <div>{u.role}</div>
                    <div>{u.rating || 0} rating</div>
                  </div>
                  {u.is_blocked && (
                    <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>Blocked</span>
                  )}
                  {u.role !== 'admin' && (
                    <button className={`btn btn-sm ${u.is_blocked ? 'btn-primary' : 'btn-danger'}`}
                      onClick={() => handleBlock(u.id, !u.is_blocked)}>
                      {u.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reports */}
          {!loading && tab === 'reports' && (
            reports.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: 14 }}>
                No reports filed
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map(r => (
                  <div key={r.id} className="card card-sm">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#dc2626' }}>{r.reporter_name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}> reported </span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.reported_name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.reason}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
