import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Компонент вставляется в TaskDetail.js когда заказчик смотрит отклики
// Пример использования:
// <AIHelperRecommend taskTitle={task.title} taskDescription={task.description} taskCategory={task.category} />

export default function AIHelperRecommend({ taskTitle, taskDescription, taskCategory }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchRecs = async () => {
    setLoading(true); setError(''); setOpen(true);
    try {
      const r = await api.post('/ai/recommend-helpers', {
        task_title: taskTitle,
        task_description: taskDescription,
        task_category: taskCategory,
      });
      setRecs(r.data.recommendations);
    } catch (e) {
      setError('Не удалось получить рекомендации. Попробуй позже.');
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {!open ? (
        <button
          onClick={fetchRecs}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
            background: 'linear-gradient(135deg, #ede9fe, #f3e8ff)',
            border: '1.5px solid #e9d5ff', color: '#7c3aed',
            fontWeight: 600, fontSize: 14, width: '100%', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
          </svg>
          ✦ AI: подобрать лучшего хелпера
        </button>
      ) : (
        <div style={{ background: '#faf5ff', borderRadius: 14, padding: 16, border: '1.5px solid #e9d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#581c87' }}>AI рекомендации</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7c3aed', fontSize: 13, padding: '12px 0' }}>
              <div style={{ width: 16, height: 16, border: '2px solid #e9d5ff', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.65s linear infinite' }} />
              Анализирую хелперов...
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          {recs && recs.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
              Подходящих хелперов пока нет
            </div>
          )}

          {recs && recs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recs.map((h, i) => (
                <div key={h.id} style={{
                  background: 'white', borderRadius: 12, padding: '12px 14px',
                  border: '1px solid #e9d5ff', display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  {/* Медаль */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#fef9f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{h.username}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#92400e' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {h.rating || '—'} · {h.completed_tasks} задач
                      </div>
                    </div>

                    {/* Навыки */}
                    {h.skills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {h.skills.slice(0, 3).map(s => (
                          <span key={s} style={{
                            background: '#f0fdf4', color: '#15803d',
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            border: '1px solid #bbf7d0',
                          }}>{s}</span>
                        ))}
                      </div>
                    )}

                    {/* AI объяснение */}
                    <p style={{ fontSize: 12, color: '#7c3aed', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {h.reason}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/profile/${h.id}`)}
                    style={{
                      flexShrink: 0, padding: '5px 10px',
                      background: '#ede9fe', color: '#7c3aed',
                      border: 'none', borderRadius: 8,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Профиль
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}