import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

const STATUS_CONFIG = {
  open:        { label: 'Open',        dot: '#16a34a', bg: '#dcfce7', text: '#15803d' },
  in_progress: { label: 'In Progress', dot: '#d97706', bg: '#fef3c7', text: '#b45309' },
  completed:   { label: 'Completed',   dot: '#0284c7', bg: '#e0f2fe', text: '#0369a1' },
};

function RoleBadge({ isOwner }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 6,
      background: isOwner ? '#f0fdf4' : '#faf5ff',
      color: isOwner ? '#16a34a' : '#7c3aed',
      border: `1px solid ${isOwner ? '#bbf7d0' : '#ede9fe'}`,
    }}>
      {isOwner ? 'Customer' : 'Helper'}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: cfg.bg, color: cfg.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function TaskCard({ task, userId }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const isOwner = Number(task.customer_id) === Number(userId);
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8e0',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      borderLeft: `4px solid ${cfg.dot}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#c8e6c4'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8e0'; }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#151a14', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <RoleBadge isOwner={isOwner} />
            {task.category && (
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{task.category}</span>
            )}
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {new Date(task.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {task.payment > 0 && (
            <span style={{ fontWeight: 700, color: '#2d6a27', fontSize: 15, fontFamily: "'DM Serif Display', serif" }}>
              {Number(task.payment).toLocaleString()} ₸
            </span>
          )}
          <StatusBadge status={task.status} />
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f0', padding: '20px 20px 20px 24px', background: '#fafcfa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {task.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{task.description}</p>
              </div>
            )}

            {task.location_name && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Location</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ fontSize: 14, color: '#374151' }}>{task.location_name}</span>
                </div>
              </div>
            )}

            {isOwner && task.helper_name && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Helper</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                    {task.helper_name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{task.helper_name}</span>
                  {task.helper_rating > 0 && (
                    <span style={{ fontSize: 12, color: '#6b7280' }}>★ {task.helper_rating}</span>
                  )}
                </div>
              </div>
            )}

            {!isOwner && task.customer_name && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Posted by</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>
                    {task.customer_name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{task.customer_name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {task.status === 'in_progress' && (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/tasks/${task.id}/status`)}
                >
                  View Status
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/chat/${task.id}`)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Open Chat
                </button>
              </>
            )}

            {task.status === 'open' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                View Task
              </button>
            )}

            {task.status === 'completed' && isOwner && task.helper_id && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/tasks/${task.id}/rate`)}
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
              >
                Leave Review
              </button>
            )}

            {task.status === 'completed' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                View Details
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all'); // all | customer | helper

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    api.get('/tasks/my')
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = tasks.filter(t => {
    const statusOk = filter === 'all' || t.status === filter;
    const roleOk = roleFilter === 'all'
      || (roleFilter === 'customer' && Number(t.customer_id) === Number(user?.id))
      || (roleFilter === 'helper' && Number(t.helper_id) === Number(user?.id));
    return statusOk && roleOk;
  });

  const counts = {
    all: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const asCustomer = tasks.filter(t => Number(t.customer_id) === Number(user?.id)).length;
  const asHelper = tasks.filter(t => Number(t.helper_id) === Number(user?.id)).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <span className="page-topbar-title">My Tasks</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-task')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Task
          </button>
        </div>

        <div className="page-body">
          {/* Summary cards */}
          {!loading && tasks.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Total', value: tasks.length, color: '#151a14' },
                { label: 'Open', value: counts.open, color: '#16a34a' },
                { label: 'In Progress', value: counts.in_progress, color: '#d97706' },
                { label: 'Completed', value: counts.completed, color: '#0284c7' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '16px 20px' }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            {/* Status filter */}
            <div style={{ display: 'flex', gap: 6 }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    background: filter === f.key ? '#2d6a27' : '#f1f5f0',
                    color: filter === f.key ? 'white' : '#6b7280',
                  }}>
                  {f.label}
                  <span style={{ marginLeft: 5, opacity: 0.7, fontSize: 11 }}>{counts[f.key]}</span>
                </button>
              ))}
            </div>

            {/* Role filter */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f0', borderRadius: 10, padding: 3 }}>
              {[['all','All'],['customer','As Customer'],['helper','As Helper']].map(([k, l]) => (
                <button key={k} onClick={() => setRoleFilter(k)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.12s',
                    background: roleFilter === k ? 'white' : 'transparent',
                    color: roleFilter === k ? '#151a14' : '#9ca3af',
                    boxShadow: roleFilter === k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {l}
                  {k === 'customer' && asCustomer > 0 && <span style={{ marginLeft: 4, opacity: 0.6 }}>{asCustomer}</span>}
                  {k === 'helper' && asHelper > 0 && <span style={{ marginLeft: 4, opacity: 0.6 }}>{asHelper}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks list */}
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 20px' }}>
              <div style={{ width: 56, height: 56, background: '#f1f5f0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              </div>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks match this filter'}
              </p>
              {tasks.length === 0 && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-task')}>
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(task => (
                <TaskCard key={task.id} task={task} userId={user?.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}