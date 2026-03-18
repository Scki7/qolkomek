import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

const CATEGORIES = ['Moving', 'Repairs', 'Shopping', 'Gardening', 'IT Help', 'Photography', 'Tutoring', 'Pets'];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTasks, setMyTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      user ? api.get('/tasks/my') : Promise.resolve({ data: [] }),
      api.get('/tasks', { params: { status: 'open' } }),
    ]).then(([my, all]) => {
      setMyTasks(my.data.slice(0, 3));
      setRecentTasks(all.data.slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <span className="page-topbar-title">
            {user ? `Good day, ${user.username}` : 'Welcome to QolKomek'}
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-task')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Task
          </button>
        </div>

        <div className="page-body">
          {/* Hero banner */}
          <div className="fade-up" style={{
            background: 'linear-gradient(135deg, #141f12 0%, #2d5a26 100%)',
            borderRadius: 20, padding: '36px 40px', marginBottom: 28,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            overflow: 'hidden', position: 'relative'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                Local Help Network
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: 'white', marginBottom: 12, lineHeight: 1.25, maxWidth: 340 }}>
                Connect with trusted helpers in your neighborhood
              </h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button className="btn btn-primary" onClick={() => navigate('/create-task')} style={{ background: '#4fad44' }}>
                  Post a Task
                </button>
                <button className="btn" onClick={() => navigate('/map')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
                  Browse Map
                </button>
              </div>
            </div>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 260, height: 260, borderRadius: '50%', background: 'rgba(79,173,68,0.07)', pointerEvents: 'none' }}/>
            <div style={{ position: 'absolute', right: 80, bottom: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', pointerEvents: 'none' }}/>
          </div>

          {/* Stats row */}
          {user && (
            <div className="grid-4 fade-up fade-up-1" style={{ marginBottom: 28 }}>
              {[
                { label: 'Total Tasks', value: myTasks.length, color: 'var(--text)' },
                { label: 'Open', value: myTasks.filter(t => t.status === 'open').length, color: 'var(--green)' },
                { label: 'In Progress', value: myTasks.filter(t => t.status === 'in_progress').length, color: '#d97706' },
                { label: 'Completed', value: myTasks.filter(t => t.status === 'completed').length, color: '#0284c7' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: user ? '1.2fr 0.8fr' : '1fr', gap: 24, marginBottom: 32 }}>
            {/* My tasks */}
            {user && (
              <div className="fade-up fade-up-2">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700 }}>My Recent Tasks</h2>
                  <Link to="/my-tasks" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>View all</Link>
                </div>
                {loading ? (
                  <div className="loading-wrap" style={{ minHeight: 100 }}><div className="spinner" /></div>
                ) : myTasks.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>No tasks yet</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-task')}>Create first task</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {myTasks.map(task => (
                      <Link key={task.id} to={`/tasks/${task.id}`} className="task-card card-sm">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="task-card-title" style={{ marginBottom: 0 }}>{task.title}</span>
                          <span className={`badge badge-${task.status}`}>
                            {task.status === 'open' ? 'Open' : task.status === 'in_progress' ? 'In Progress' : 'Done'}
                          </span>
                        </div>
                        {task.category && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{task.category}</div>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            <div className="fade-up fade-up-3">
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Browse by Category</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => navigate(`/map?category=${encodeURIComponent(cat)}`)}
                    style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 500, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', color: 'var(--text-2)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-border)'; e.currentTarget.style.color = 'var(--green)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
                  >{cat}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent tasks grid */}
          {recentTasks.length > 0 && (
            <div className="fade-up fade-up-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recent Open Tasks</h2>
                <Link to="/map" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>See on map</Link>
              </div>
              <div className="grid-3">
                {recentTasks.map(task => (
                  <Link key={task.id} to={`/tasks/${task.id}`} className="task-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="task-card-title">{task.title}</span>
                    </div>
                    {task.description && <p className="task-card-desc">{task.description}</p>}
                    <div className="task-card-meta">
                      {task.category && (
                        <span className="task-meta-item">
                          <svg viewBox="0 0 24 24" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                          {task.category}
                        </span>
                      )}
                      {task.payment && <span className="task-meta-item" style={{ color: 'var(--green)', fontWeight: 600 }}>{task.payment} ₸</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
