// TaskStatus.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function TaskStatus() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    api.get(`/tasks/${id}`).then(r => setTask(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/tasks/${id}/complete`);
      navigate(`/tasks/${id}/rate`);
    } catch (err) { alert(err.response?.data?.error || 'Error'); setCompleting(false); }
  };

  if (loading) return <div className="app-layout"><Sidebar /><div className="main-content"><div className="loading-wrap"><div className="spinner" /></div></div></div>;

  const isOwner = user?.id === task?.customer_id;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <span className="page-topbar-title">Task Status</span>
          </div>
          <span className={`badge badge-${task?.status}`}>
            {task?.status === 'open' ? 'Open' : task?.status === 'in_progress' ? 'In Progress' : 'Completed'}
          </span>
        </div>

        <div className="page-body">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="card fade-up" style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, marginBottom: 20 }}>{task?.title}</h2>

              {task?.helper_id && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Helper</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{task.helper_name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{task.helper_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{task.helper_rating ? `${task.helper_rating} rating` : 'New member'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="divider" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Time</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {new Date(task?.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {task?.location_name && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Location</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{task.location_name}</div>
                  </div>
                )}
              </div>
            </div>

            {isOwner && task?.status === 'in_progress' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleComplete} disabled={completing}>
                  {completing ? 'Completing...' : 'Mark as Completed'}
                </button>
                <button className="btn btn-secondary" onClick={() => navigate(`/chat/${id}`)}>
                  Message Helper
                </button>
              </div>
            )}
            {!isOwner && task?.status === 'in_progress' && (
              <button className="btn btn-secondary btn-lg" onClick={() => navigate(`/chat/${id}`)}>
                Message Customer
              </button>
            )}
            {task?.status === 'completed' && (
              <div style={{ background: 'var(--green-pale)', border: '1px solid var(--green-border)', borderRadius: 12, padding: '20px', textAlign: 'center', color: 'var(--green)', fontWeight: 600 }}>
                Task completed successfully
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
