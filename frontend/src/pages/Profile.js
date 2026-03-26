import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

// --- КРАСИВЫЕ КОМПОНЕНТЫ (Твой дизайн) ---
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

// --- ЛОГИЧЕСКИЕ КОМПОНЕНТЫ (Исправленные) ---

function BioEditor({ currentBio, onSave }) {
  const [bio, setBio] = useState(currentBio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBio(currentBio || '');
  }, [currentBio]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // ПУТЬ: Должен соответствовать app.use('/api/skills', skillRoutes) в server.js
      await api.put('/skills/bio', { bio });
      onSave(bio); // Обновляем в родителе Profile
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Bio save error:", e.response?.data || e.message);
      alert("Ошибка сохранения: " + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>About me / My skills</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
        Tell us what you're good at — AI will use this to match you with tasks.
      </p>
      <textarea
        className="form-textarea"
        rows={5}
        placeholder="e.g. I'm good at plumbing..."
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
    if (!bio?.trim()) {
      setError('Fill in the "About me" section first!');
      return;
    }
    setLoading(true); setError(''); setTasks(null);
    try {
      // ПУТЬ: app.use('/api/ai', aiRoutes)
      const r = await api.post('/ai/match-tasks', { bio });
      setTasks(r.data.tasks || []);
    } catch (e) {
      setError('Could not get recommendations. Check AI logs.');
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
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>AI matches your skills with open tasks.</p>
      {error && <div className="error-banner" style={{ marginBottom: 12, color: 'red' }}>{error}</div>}
      <button className="btn btn-primary btn-sm" onClick={fetchMatches} disabled={loading}>
        {loading ? 'Searching...' : '✦ Find matching tasks'}
      </button>

      {tasks && tasks.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(t => (
            <div key={t.id} style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                <span style={{ fontWeight: 700, color: 'var(--green)' }}>{t.payment} ₸</span>
              </div>
              <p style={{ fontSize: 12, color: '#15803d', fontStyle: 'italic', marginBottom: 10 }}>{t.reason}</p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/tasks/${t.id}`)}>Open task →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- ОСНОВНОЙ КОМПОНЕНТ PROFILE ---

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
      .catch(err => console.error("Profile fetch error:", err))
      .finally(() => setLoading(false));
  }, [profileId, navigate]);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const tabs = [
    { key: 'reviews', label: `Reviews${profile?.comments?.length ? ` (${profile.comments.length})` : ''}` },
    ...(isOwn ? [
      { key: 'bio',      label: 'About me' },
      { key: 'ai_tasks', label: '✦ AI Tasks' },
    ] : []),
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <span className="page-topbar-title">{isOwn ? 'My Profile' : `Profile: ${profile?.username}`}</span>
          {isOwn && <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/signin'); }}>Sign Out</button>}
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
            {/* Левая колонка */}
            <div>
              <HelperCertificate profile={profile} />
              <div className="card card-sm" style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{profile?.completed_tasks || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tasks done</div>
              </div>
              {isOwn && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => navigate('/create-task')}>Create Task</button>
                </div>
              )}
            </div>

            {/* Правая колонка с табами */}
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#eee', borderRadius: 10, padding: 4 }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                    flex: 1, padding: '8px', borderRadius: 8, 
                    background: activeTab === t.key ? 'white' : 'transparent',
                    border: 'none', fontWeight: 600, cursor: 'pointer'
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'reviews' && (
                <div className="card">Reviews section (will render from profile.comments)</div>
              )}

              {activeTab === 'bio' && isOwn && (
                <BioEditor currentBio={profile?.bio} onSave={(newBio) => setProfile(p => ({...p, bio: newBio}))} />
              )}

              {activeTab === 'ai_tasks' && isOwn && (
                <AITaskMatch bio={profile?.bio} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}