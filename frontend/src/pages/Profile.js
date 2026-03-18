import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function Profile() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileId = id || user?.id;
  const isOwn = !id || Number(id) === Number(user?.id);

  useEffect(() => {
    if (!profileId) { navigate('/signin'); return; }
    api.get(`/users/${profileId}`).then(r => setProfile(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [profileId]);

  if (loading) return <div className="app-layout"><Sidebar /><div className="main-content"><div className="loading-wrap"><div className="spinner" /></div></div></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {id && <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>}
            <span className="page-topbar-title">{isOwn ? 'My Profile' : `${profile?.username}'s Profile`}</span>
          </div>
          {isOwn && (
            <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/signin'); }}>
              Sign Out
            </button>
          )}
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
            {/* Profile card */}
            <div>
              <div className="card fade-up" style={{ textAlign: 'center', marginBottom: 12 }}>
                <div className="avatar" style={{ width: 72, height: 72, fontSize: 28, margin: '0 auto 14px' }}>
                  {profile?.username?.[0]?.toUpperCase()}
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 4 }}>{profile?.username}</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{profile?.rating || '—'}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({profile?.rating_count || 0} reviews)</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Member since {new Date(profile?.created_at).getFullYear()}
                </div>
              </div>

              <div className="grid-2 fade-up fade-up-1" style={{ marginBottom: 12 }}>
                <div className="stat-card" style={{ textAlign: 'center', padding: '16px' }}>
                  <div className="stat-value" style={{ fontSize: 26 }}>{profile?.completed_tasks || 0}</div>
                  <div className="stat-label">Tasks Done</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'center', padding: '16px' }}>
                  <div className="stat-value" style={{ fontSize: 26, color: 'var(--green)' }}>{profile?.rating || '—'}</div>
                  <div className="stat-label">Rating</div>
                </div>
              </div>

              {isOwn && (
                <div className="card fade-up fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/create-task')}>
                    Create New Task
                  </button>
                  <button className="btn btn-secondary btn-lg" onClick={() => navigate('/my-tasks')}>
                    View My Tasks
                  </button>
                  {user?.role === 'admin' && (
                    <button className="btn btn-lg" onClick={() => navigate('/admin')}
                      style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', justifyContent: 'center' }}>
                      Admin Panel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="fade-up fade-up-2">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                Reviews {profile?.comments?.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({profile.comments.length})</span>}
              </h3>
              {(!profile?.comments || profile.comments.length === 0) ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 14 }}>
                  No reviews yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {profile.comments.map((c, i) => (
                    <div key={i} className="card card-sm">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{c.rater_name}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} width="12" height="12" viewBox="0 0 24 24"
                              fill={s <= c.score ? '#f59e0b' : 'none'}
                              stroke={s <= c.score ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{c.comment}</p>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        {new Date(c.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
