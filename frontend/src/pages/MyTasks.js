import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    api.get('/tasks/my').then(r => setTasks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const counts = {
    all: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <span className="page-topbar-title">My Tasks</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-task')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Task
          </button>
        </div>

        <div className="page-body">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'open', label: 'Open' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' },
            ].map(f => (
              <button
                key={f.key}
                className={`chip ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span style={{ marginLeft: 5, opacity: 0.7, fontSize: 11 }}>
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          {loading && <div className="loading-wrap"><div className="spinner" /></div>}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div style={{ width: 48, height: 48, background: 'var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>No tasks in this category</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-task')}>Create a task</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {filtered.map((task, i) => (
              <Link
                key={task.id}
                to={task.status === 'in_progress' ? `/tasks/${task.id}/status` : `/tasks/${task.id}`}
                className="task-card fade-up"
                style={{ animationDelay: `${i * 0.04}s`, opacity: 0, borderLeft: `3px solid ${task.status === 'open' ? '#16a34a' : task.status === 'in_progress' ? '#d97706' : '#0284c7'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span className="task-card-title">{task.title}</span>
                  <span className={`badge badge-${task.status}`} style={{ marginLeft: 8, flexShrink: 0 }}>
                    {task.status === 'open' ? 'Open' : task.status === 'in_progress' ? 'In Progress' : 'Done'}
                  </span>
                </div>
                {task.description && <p className="task-card-desc">{task.description}</p>}
                <div className="task-card-meta">
                  {task.category && <span className="task-meta-item">{task.category}</span>}
                  {task.payment && <span className="task-meta-item" style={{ color: 'var(--green)', fontWeight: 700 }}>{task.payment} ₸</span>}
                  {task.helper_name && (
                    <span className="task-meta-item">
                      <svg viewBox="0 0 24 24" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {task.helper_name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
