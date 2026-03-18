import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function RatingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get(`/tasks/${id}`).then(r => setTask(r.data)).catch(() => {}); }, [id]);

  const handleSubmit = async () => {
    if (!score) return alert('Please select a rating');
    setLoading(true);
    try {
      await api.post('/ratings', { task_id: parseInt(id), rated_id: task.helper_id, score, comment });
      navigate('/my-tasks');
    } catch (err) { alert(err.response?.data?.error || 'Error'); setLoading(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <span className="page-topbar-title">Rate Helper</span>
          </div>
        </div>

        <div className="page-body">
          <div style={{ maxWidth: 480, margin: '0 auto' }} className="fade-up">
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, margin: '0 auto 14px' }}>
                  {task?.helper_name?.[0]?.toUpperCase() || '?'}
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 4 }}>
                  How was your experience?
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>with {task?.helper_name}</p>
              </div>

              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setScore(s)}
                    style={{
                      background: 'none', border: 'none', padding: '4px',
                      cursor: 'pointer', transition: 'transform 0.1s',
                      transform: s <= (hover || score) ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24"
                      fill={s <= (hover || score) ? '#f59e0b' : 'none'}
                      stroke={s <= (hover || score) ? '#f59e0b' : '#d1d5db'}
                      strokeWidth="1.5"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Share your experience (optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Tell others about working with this helper..."
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading || !score} style={{ flex: 2 }}>
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/my-tasks')} style={{ flex: 1 }}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
