import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'support', label: 'Support' },
  { key: 'reports', label: 'Reports' },
];

function StatCard({ label, value, color = '#151a14', alert }) {
  return (
    <div style={{ background: 'white', border: `1px solid ${alert ? '#fecaca' : '#e2e8e0'}`, borderRadius: 14, padding: '18px 20px', position: 'relative' }}>
      {alert && <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />}
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function TicketThread({ ticket, onBack, onRefresh }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = React.useRef(null);

  useEffect(() => {
    api.get(`/support/${ticket.id}`).then(r => setData(r.data)).catch(() => {});
  }, [ticket.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/support/${ticket.id}/reply`, { content: reply.trim() });
      setData(prev => ({ ...prev, messages: [...prev.messages, res.data] }));
      setReply('');
      onRefresh();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSending(false); }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this ticket?')) return;
    await api.post(`/support/${ticket.id}/close`).catch(() => {});
    onBack();
    onRefresh();
  };

  const STATUS_COLORS = {
    open: { bg: '#dcfce7', text: '#15803d' },
    answered: { bg: '#e0f2fe', text: '#0369a1' },
    closed: { bg: '#f1f5f0', text: '#9ca3af' },
  };
  const sc = STATUS_COLORS[data?.ticket?.status] || STATUS_COLORS.open;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      {/* Ticket header */}
      <div style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '16px 20px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to tickets
          </button>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{data?.ticket?.subject || ticket.subject}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            From: <strong style={{ color: '#374151' }}>{data?.ticket?.user_name}</strong>
            {' · '}{data?.ticket?.user_email}
            {' · '}{data?.ticket?.category}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>
            {data?.ticket?.status || ticket.status}
          </span>
          {data?.ticket?.status !== 'closed' && (
            <button onClick={handleClose} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: '#f1f5f0', color: '#6b7280', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              Close Ticket
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
        {!data ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : data.messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.is_admin ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '65%', padding: '12px 16px', borderRadius: 14,
              background: msg.is_admin ? '#2d6a27' : 'white',
              color: msg.is_admin ? 'white' : '#151a14',
              border: msg.is_admin ? 'none' : '1px solid #e2e8e0',
              borderBottomRightRadius: msg.is_admin ? 4 : 14,
              borderBottomLeftRadius: msg.is_admin ? 14 : 4,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
                {msg.is_admin ? '🛡️ Support' : msg.sender_name}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{msg.content}</div>
              <div style={{ fontSize: 10, marginTop: 6, opacity: 0.55 }}>
                {new Date(msg.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {data?.ticket?.status !== 'closed' && (
        <div style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
            placeholder="Type your reply..."
            rows={2}
            style={{ flex: 1, background: '#f4f6f3', border: '1.5px solid transparent', borderRadius: 10, padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#3d8c35'}
            onBlur={e => e.target.style.borderColor = 'transparent'}
          />
          <button onClick={handleReply} disabled={sending || !reply.trim()}
            style={{ width: 40, height: 40, borderRadius: 10, background: reply.trim() ? '#2d6a27' : '#e2e8e0', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: reply.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, t, r, s] = await Promise.all([
        api.get('/users'),
        api.get('/users/admin/tasks'),
        api.get('/users/admin/reports'),
        api.get('/support'),
      ]);
      setUsers(u.data);
      setTasks(t.data);
      setReports(r.data);
      setTickets(s.data);
    } catch {}
    finally { setLoading(false); }
  };

  const action = async (url, id, fn) => {
    setActionLoading(id);
    try { await api.post(url); fn(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setActionLoading(null); }
  };

  const handleBlock = (u) => action(
    `/users/${u.id}/${u.is_blocked ? 'unblock' : 'block'}`, u.id,
    () => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x))
  );

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`).catch(() => {});
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const unreadTickets = tickets.filter(t => parseInt(t.unread_count) > 0).length;

  const STATUS_TICKET = {
    open: { bg: '#dcfce7', text: '#15803d', label: 'Open' },
    answered: { bg: '#e0f2fe', text: '#0369a1', label: 'Answered' },
    closed: { bg: '#f1f5f0', text: '#9ca3af', label: 'Closed' },
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <span className="page-topbar-title">Admin Panel</span>
          <span style={{ fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 20 }}>
            Administrator
          </span>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <StatCard label="Total Users" value={users.length} />
            <StatCard label="Blocked" value={users.filter(u => u.is_blocked).length} color="#dc2626" alert={users.filter(u => u.is_blocked).length > 0} />
            <StatCard label="Open Tasks" value={tasks.filter(t => t.status === 'open').length} color="#16a34a" />
            <StatCard label="Support Tickets" value={tickets.filter(t => t.status !== 'closed').length} color="#d97706" alert={unreadTickets > 0} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f0', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 24 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSelectedTicket(null); }} style={{
                padding: '8px 20px', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.12s', position: 'relative',
                background: tab === t.key ? 'white' : 'transparent',
                color: tab === t.key ? '#151a14' : '#9ca3af',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
                {t.label}
                {t.key === 'support' && unreadTickets > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                )}
              </button>
            ))}
          </div>

          {loading && <div className="loading-wrap"><div className="spinner" /></div>}

          {/* USERS */}
          {!loading && tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, opacity: u.is_blocked ? 0.65 : 1 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: u.role === 'admin' ? '#fef3c7' : u.is_blocked ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: u.role === 'admin' ? '#b45309' : u.is_blocked ? '#dc2626' : '#16a34a' }}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{u.username}</span>
                      {u.role === 'admin' && <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '2px 7px', borderRadius: 6, border: '1px solid #fde68a' }}>ADMIN</span>}
                      {u.is_blocked && <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 7px', borderRadius: 6 }}>BLOCKED</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {u.email} · ⭐ {u.rating || 0} · {u.tasks_created || 0} posted · {u.tasks_helped || 0} helped
                    </div>
                  </div>
                  {u.id !== user?.id && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleBlock(u)} disabled={actionLoading === u.id}
                        style={{ padding: '7px 14px', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer', background: u.is_blocked ? '#dcfce7' : '#fee2e2', color: u.is_blocked ? '#16a34a' : '#dc2626' }}>
                        {actionLoading === u.id ? '...' : u.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TASKS */}
          {!loading && tab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: t.status === 'open' ? '#16a34a' : t.status === 'in_progress' ? '#d97706' : '#0284c7' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      By {t.customer_name}{t.helper_name && ` · Helper: ${t.helper_name}`}{t.category && ` · ${t.category}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {t.payment > 0 && <span style={{ fontWeight: 700, color: '#2d6a27', fontSize: 13 }}>{Number(t.payment).toLocaleString()} ₸</span>}
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: t.status === 'open' ? '#dcfce7' : t.status === 'in_progress' ? '#fef3c7' : '#e0f2fe', color: t.status === 'open' ? '#15803d' : t.status === 'in_progress' ? '#b45309' : '#0369a1' }}>
                      {t.status === 'open' ? 'Open' : t.status === 'in_progress' ? 'In Progress' : 'Done'}
                    </span>
                    <button onClick={() => handleDeleteTask(t.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUPPORT */}
          {!loading && tab === 'support' && (
            selectedTicket ? (
              <TicketThread ticket={selectedTicket} onBack={() => setSelectedTicket(null)} onRefresh={fetchAll} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tickets.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '64px', color: '#9ca3af', fontSize: 14 }}>No support tickets yet</div>
                )}
                {tickets.map(ticket => {
                  const sc = STATUS_TICKET[ticket.status] || STATUS_TICKET.open;
                  const hasUnread = parseInt(ticket.unread_count) > 0;
                  return (
                    <div key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      style={{ background: 'white', border: `1px solid ${hasUnread ? '#bbf7d0' : '#e2e8e0'}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = hasUnread ? '#bbf7d0' : '#e2e8e0'; }}
                    >
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f1f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#6b7280', flexShrink: 0 }}>
                        {ticket.user_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontWeight: hasUnread ? 700 : 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</span>
                          {hasUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {ticket.user_name} · {ticket.category}
                          · {new Date(ticket.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          · {ticket.message_count} messages
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text, flexShrink: 0 }}>
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* REPORTS */}
          {!loading && tab === 'reports' && (
            reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px', color: '#9ca3af', fontSize: 14 }}>No reports filed</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 14 }}>
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>{r.reporter_name}</span>
                        <span style={{ color: '#9ca3af' }}> reported </span>
                        <span style={{ fontWeight: 700 }}>{r.reported_name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: r.status === 'pending' ? '#fef3c7' : '#dcfce7', color: r.status === 'pending' ? '#b45309' : '#15803d' }}>
                        {r.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 6 }}>{r.reason}</p>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {new Date(r.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}