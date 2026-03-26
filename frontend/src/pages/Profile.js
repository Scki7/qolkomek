import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

const Star = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24"
    fill={filled ? '#f59e0b' : 'none'}
    stroke={filled ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function getLevel(completedTasks) {
  if (completedTasks >= 50) return { label: 'Expert',      color: '#7c3aed', bg: '#ede9fe' };
  if (completedTasks >= 15) return { label: 'Experienced', color: '#0369a1', bg: '#e0f2fe' };
  if (completedTasks >= 5)  return { label: 'Active',      color: '#15803d', bg: '#dcfce7' };
  return                           { label: 'Newcomer',    color: '#92400e', bg: '#fef3c7' };
}

function HelperCertificate({ profile }) {
  const level = getLevel(profile.completed_tasks || 0);
  return (
    <div style={{
      background: 'linear-gradient(135deg, #141f12 0%, #1e3a1a 100%)',
      borderRadius: 16, padding: '28px 24px', color: 'white',
      position: 'relative', overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#3d8c35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {profile.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginBottom: 4 }}>{profile.username}</div>
          <div style={{ display: 'inline-block', background: level.bg, color: level.color, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
            {level.label}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: profile.bio ? 20 : 0 }}>
        {[
          { label: 'Tasks',   value: profile.completed_tasks || 0 },
          { label: 'Rating',  value: profile.rating ? `${profile.rating}★` : '—' },
          { label: 'Reviews', value: profile.rating_count || 0 },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {profile.bio && (
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>About me</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{profile.bio}</p>
        </div>
      )}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}>
        <span>QolKomek Platform</span>
        <span>since {profile.created_at ? new Date(profile.created_at).getFullYear() : 2026}</span>
      </div>
    </div>
  );
}

function BioEditor({ currentBio, onSave }) {
  const [bio, setBio] = useState(currentBio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setBio(currentBio || ''); }, [currentBio]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/skills/bio', { bio });
      onSave(bio);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Save error: ' + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>About me / My skills</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
        Tell us what you're good at — AI will use this to match you with tasks and recommend you to customers.
      </p>
      <textarea
        className="form-textarea"
        rows={5}
        placeholder="e.g. I'm good at plumbing and minor electrical work. I can also help with moving. I have a car."
        value={bio}
        onChange={e => setBio(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        {saved && <span style={{ color: 'var(--green)', fontSize: 13 }}>✓ Saved</span>}
      </div>
    </div>
  );
}

function AITaskMatch({ bio }) {
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchMatches = async () => {
    if (!bio?.trim()) { setError('Fill in the "About me" section first!'); return; }
    setLoading(true); setError(''); setTasks(null);
    try {
      const r = await api.post('/ai/match-tasks', { bio });
      setTasks(r.data.tasks || []);
    } catch (e) {
      setError('Could not get recommendations. Try again later.');
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>AI — Find tasks for me</div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
        AI reads your "About me" and finds open tasks that match your skills.
      </p>
      {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}
      <button className="btn btn-primary btn-sm" onClick={fetchMatches} disabled={loading}>
        {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Searching...</> : '✦ Find matching tasks'}
      </button>

      {tasks && tasks.length === 0 && (
        <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 13 }}>No matching open tasks found</div>
      )}

      {tasks && tasks.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(t => (
            <div key={t.id} style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                {t.payment && <span style={{ fontWeight: 700, color: 'var(--green)', flexShrink: 0, marginLeft: 8 }}>{t.payment} ₸</span>}
              </div>
              {t.description && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                  {t.description.slice(0, 120)}{t.description.length > 120 ? '...' : ''}
                </p>
              )}
              <p style={{ fontSize: 12, color: '#15803d', fontStyle: 'italic', marginBottom: 10 }}>{t.reason}</p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/tasks/${t.id}`)}>Open task →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIPriceSuggest() {
  const [form, setForm] = useState({ task_title: '', task_description: '', task_category: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.task_title.trim()) { setError('Enter a task title'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await api.post('/ai/suggest-price', form);
      setResult(r.data);
    } catch (e) {
      setError('AI error. Try again later.');
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>AI — Price estimate</div>
      </div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <input className="form-input" placeholder="Task title" value={form.task_title}
          onChange={e => setForm(p => ({ ...p, task_title: e.target.value }))} />
      </div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <textarea className="form-textarea" rows={2} placeholder="Description (optional)"
          value={form.task_description}
          onChange={e => setForm(p => ({ ...p, task_description: e.target.value }))} />
      </div>
      <div className="form-group" style={{ marginBottom: 14 }}>
        <input className="form-input" placeholder="Category (cleaning, repair...)" value={form.task_category}
          onChange={e => setForm(p => ({ ...p, task_category: e.target.value }))} />
      </div>
      {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}
      <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
        {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Analyzing...</> : '✦ Get price estimate'}
      </button>
      {result && (
        <div style={{ marginTop: 16, background: '#f6f3ff', borderRadius: 12, padding: 16, border: '1px solid #e9d5ff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Minimum',     value: result.min_price,         color: '#64748b' },
              { label: 'Recommended', value: result.recommended_price, color: '#7c3aed' },
              { label: 'Maximum',     value: result.max_price,         color: '#15803d' },
            ].map(p => (
              <div key={p.label} style={{ textAlign: 'center', background: 'white', borderRadius: 10, padding: '10px 8px', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: p.color }}>{p.value?.toLocaleString()} ₸</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>{result.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');
  const profileId = id || user?.id;
  const isOwn = !id || Number(id) === Number(user?.id);

  useEffect(() => {
    if (!profileId) { navigate('/signin'); return; }
    api.get(`/users/${profileId}`)
      .then(r => setProfile(r.data))
      .catch(err => console.error('Profile fetch error:', err))
      .finally(() => setLoading(false));
  }, [profileId, navigate]);

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content"><div className="loading-wrap"><div className="spinner" /></div></div>
    </div>
  );

  const tabs = [
    { key: 'reviews',  label: `Reviews${profile?.comments?.length ? ` (${profile.comments.length})` : ''}` },
    ...(isOwn ? [
      { key: 'bio',      label: 'About me' },
      { key: 'ai_tasks', label: '✦ AI Tasks' },
      { key: 'ai_price', label: '✦ AI Price' },
    ] : []),
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {id && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
            )}
            <span className="page-topbar-title">{isOwn ? 'My Profile' : `Profile: ${profile?.username}`}</span>
          </div>
          {isOwn && (
            <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/signin'); }}>
              Sign Out
            </button>
          )}
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

            {/* Левая колонка */}
            <div>
              <HelperCertificate profile={profile} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div className="card card-sm" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{profile?.completed_tasks || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tasks done</div>
                </div>
                <div className="card card-sm" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>{profile?.rating || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Rating</div>
                </div>
              </div>
              {isOwn && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/create-task')}>Create Task</button>
                  <button className="btn btn-secondary btn-lg" onClick={() => navigate('/my-tasks')}>My Tasks</button>
                  {user?.role === 'admin' && (
                    <button className="btn btn-lg" onClick={() => navigate('/admin')}
                      style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', justifyContent: 'center' }}>
                      Admin Panel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Правая колонка */}
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg)', borderRadius: 10, padding: 4 }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: activeTab === t.key ? 'white' : 'transparent',
                    color: activeTab === t.key ? 'var(--text)' : 'var(--text-muted)',
                    boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Отзывы */}
              {activeTab === 'reviews' && (
                (!profile?.comments || profile.comments.length === 0) ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: 14 }}>
                    No reviews yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {profile.comments.map((c, i) => (
                      <div key={i} className="card card-sm">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{c.rater_name}</span>
                          <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(s => <Star key={s} filled={s <= c.score} />)}</div>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{c.comment}</p>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                          {new Date(c.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'bio' && isOwn && (
                <BioEditor currentBio={profile?.bio} onSave={(newBio) => setProfile(p => ({ ...p, bio: newBio }))} />
              )}

              {activeTab === 'ai_tasks' && isOwn && (
                <AITaskMatch bio={profile?.bio} />
              )}

              {activeTab === 'ai_price' && isOwn && (
                <AIPriceSuggest />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}