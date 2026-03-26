import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AIHelperRecommend from '../components/AIHelperRecommend'; // 🆕
import api from '../api';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [responses, setResponses] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data);
      if (res.data.customer_id === user?.id && res.data.status === 'open') {
        const rRes = await api.get(`/tasks/${id}/responses`);
        setResponses(rRes.data);
      }
    } catch { setError('Task not found'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleRespond = async () => {
    if (!user) return navigate('/signin');
    setActionLoading(true);
    try {
      await api.post(`/tasks/${id}/respond`, { message });
      setSuccess('Your offer has been sent to the customer.');
      setMessage('');
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
    finally { setActionLoading(false); }
  };

  const handleSelectHelper = async (helperId) => {
    setActionLoading(true);
    try {
      await api.post(`/tasks/${id}/select-helper`, { helper_id: helperId });
      navigate(`/tasks/${id}/status`);
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/my-tasks');
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  if (loading) return (
    <div className="app-layout"><Sidebar />
      <div className="main-content"><div className="loading-wrap"><div className="spinner" /></div></div>
    </div>
  );

  const isOwner = user?.id === task?.customer_id;
  const isHelper = user?.id === task?.helper_id;
  const canRespond = user && !isOwner && task?.status === 'open';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <span className="page-topbar-title">Task Details</span>
          </div>
          {isOwner && task?.status === 'open' && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete Task</button>
          )}
        </div>

        <div className="page-body">
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
            {/* Main */}
            <div>
              <div className="card fade-up" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, lineHeight: 1.2, flex: 1, marginRight: 16 }}>
                    {task?.title}
                  </h1>
                  <span className={`badge badge-${task?.status}`}>
                    {task?.status === 'open' ? 'Open' : task?.status === 'in_progress' ? 'In Progress' : 'Completed'}
                  </span>
                </div>

                {task?.description && (
                  <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>
                    {task.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  {task?.payment && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Payment</div>
                      <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 18 }}>{task.payment} ₸</div>
                    </div>
                  )}
                  {task?.category && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Category</div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{task.category}</div>
                    </div>
                  )}
                  {task?.location_name && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Location</div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{task.location_name}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Posted</div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      {new Date(task?.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Respond form */}
              {canRespond && (
                <div className="card fade-up fade-up-1">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Offer to Help</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Send a message to the customer explaining why you're a good fit.
                  </p>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="I can help you with this task because..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />
                  <button className="btn btn-primary" onClick={handleRespond} disabled={actionLoading}>
                    {actionLoading ? 'Sending...' : 'Send Offer'}
                  </button>
                </div>
              )}

              {/* 🆕 AI рекомендации — показываем только заказчику когда задача открыта */}
              {isOwner && task?.status === 'open' && (
                <div className="fade-up fade-up-1" style={{ marginBottom: 4 }}>
                  <AIHelperRecommend
                    taskTitle={task.title}
                    taskDescription={task.description}
                    taskCategory={task.category}
                  />
                </div>
              )}

              {/* Responses */}
              {isOwner && task?.status === 'open' && (
                <div className="fade-up fade-up-2">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                    Applicants {responses.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({responses.length})</span>}
                  </h3>
                  {responses.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 14 }}>
                      No one has applied yet. Share this task to get responses.
                    </div>
                  ) : (
                    responses.map(resp => (
                      <div key={resp.id} className="card" style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: resp.message ? 12 : 0 }}>
                          <div className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                            {resp.username?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Link to={`/profile/${resp.helper_id}`} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                              {resp.username}
                            </Link>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                              {resp.rating ? `${resp.rating} rating` : 'No rating yet'} · {resp.rating_count || 0} reviews
                            </div>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSelectHelper(resp.helper_id)}
                            disabled={actionLoading}
                          >
                            Choose Helper
                          </button>
                        </div>
                        {resp.message && (
                          <div style={{ fontSize: 13, color: 'var(--text-2)', background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }}>
                            "{resp.message}"
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* In progress actions */}
              {(isOwner || isHelper) && task?.status === 'in_progress' && (
                <div className="card fade-up" style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" onClick={() => navigate(`/tasks/${id}/status`)}>
                    View Task Status
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate(`/chat/${id}`)}>
                    Open Chat
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="card fade-up fade-up-1" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  Posted by
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                    {task?.customer_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <Link to={`/profile/${task?.customer_id}`} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                      {task?.customer_name}
                    </Link>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      {task?.customer_rating ? `${task.customer_rating} avg rating` : 'New member'}
                    </div>
                  </div>
                </div>
              </div>

              {task?.helper_id && (
                <div className="card fade-up fade-up-2">
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Assigned Helper
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                      {task?.helper_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <Link to={`/profile/${task?.helper_id}`} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                        {task?.helper_name}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                        {task?.helper_rating ? `${task.helper_rating} avg rating` : 'New member'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}