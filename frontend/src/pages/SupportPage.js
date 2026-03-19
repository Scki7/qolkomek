import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

const CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'task', label: 'Task Problem' },
  { value: 'account', label: 'Account Issue' },
  { value: 'abuse', label: 'Report Abuse' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  open:     { bg: '#dcfce7', text: '#15803d', label: 'Open' },
  answered: { bg: '#e0f2fe', text: '#0369a1', label: 'Answered' },
  closed:   { bg: '#f1f5f0', text: '#9ca3af', label: 'Closed' },
};

function NewTicketForm({ onCreated }) {
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return setError('Please fill all fields');
    setError(''); setLoading(true);
    try {
      const res = await api.post('/support', form);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally { setLoading(false); }
  };

  return (
    <div className="card fade-up" style={{ maxWidth: 580 }}>
      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginBottom: 6 }}>New Support Ticket</h3>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>
        Describe your issue and our support team will get back to you as soon as possible.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input className="form-input" placeholder="Brief description of your issue" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-textarea" placeholder="Describe your problem in detail..." rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 140 }}>
            {loading ? 'Sending...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TicketView({ ticketId, onBack }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/support/${ticketId}`).then(r => setData(r.data)).catch(() => {});
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/support/${ticketId}/reply`, { content: reply.trim() });
      setData(prev => ({ ...prev, messages: [...prev.messages, res.data] }));
      setReply('');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSending(false); }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this ticket? You can still view it after.')) return;
    await api.post(`/support/${ticketId}/close`).catch(() => {});
    setData(prev => ({ ...prev, ticket: { ...prev.ticket, status: 'closed' } }));
  };

  const sc = STATUS_CONFIG[data?.ticket?.status] || STATUS_CONFIG.open;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '16px 20px', marginBottom: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to tickets
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{data?.ticket?.subject}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {CATEGORIES.find(c => c.value === data?.ticket?.category)?.label || data?.ticket?.category}
              {' · '}Ticket #{ticketId}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
            {data?.ticket?.status !== 'closed' && (
              <button onClick={handleClose} style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid #e2e8e0', background: 'white', color: '#6b7280', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
        {!data ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : data.messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.is_admin ? 'flex-start' : 'flex-end' }}>
            <div style={{
              maxWidth: '65%', padding: '12px 16px', borderRadius: 14,
              background: msg.is_admin ? 'white' : '#2d6a27',
              color: msg.is_admin ? '#151a14' : 'white',
              border: msg.is_admin ? '1px solid #e2e8e0' : 'none',
              borderBottomLeftRadius: msg.is_admin ? 4 : 14,
              borderBottomRightRadius: msg.is_admin ? 14 : 4,
            }}>
              {msg.is_admin && (
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: '#2d6a27' }}>
                  🛡️ QolKomek Support
                </div>
              )}
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{msg.content}</div>
              <div style={{ fontSize: 10, marginTop: 6, opacity: 0.55, textAlign: msg.is_admin ? 'left' : 'right' }}>
                {new Date(msg.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply */}
      {data?.ticket?.status !== 'closed' ? (
        <div style={{ background: 'white', border: '1px solid #e2e8e0', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
            placeholder="Add a reply..."
            rows={2}
            style={{ flex: 1, background: '#f4f6f3', border: '1.5px solid transparent', borderRadius: 10, padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
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
      ) : (
        <div style={{ textAlign: 'center', padding: '14px', fontSize: 13, color: '#9ca3af', background: '#f4f6f3', borderRadius: 12 }}>
          This ticket is closed
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | new | ticket
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    //if (!user) { navigate('/signin'); return; }
    api.get('/support').then(r => setTickets(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleCreated = (ticket) => {
    setTickets(prev => [ticket, ...prev]);
    setSelectedId(ticket.id);
    setView('ticket');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <span className="page-topbar-title">
            {view === 'new' ? 'New Ticket' : view === 'ticket' ? 'Support Ticket' : 'Support Center'}
          </span>
          {view === 'list' && (
            <button className="btn btn-primary btn-sm" onClick={() => setView('new')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Ticket
            </button>
          )}
          {view !== 'list' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back
            </button>
          )}
        </div>

        <div className="page-body">
          {view === 'new' && <NewTicketForm onCreated={handleCreated} />}

          {view === 'ticket' && selectedId && (
            <TicketView ticketId={selectedId} onBack={() => setView('list')} />
          )}

          {view === 'list' && (
            <>
              {/* Info banner */}
              <div style={{ background: 'linear-gradient(135deg, #141f12 0%, #2d5a26 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'white', marginBottom: 4 }}>Support Center</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    Having an issue? Our team typically responds within a few hours.
                  </div>
                </div>
                <button className="btn" onClick={() => setView('new')} style={{ background: '#4fad44', color: 'white', flexShrink: 0 }}>
                  Open Ticket
                </button>
              </div>

              {loading && <div className="loading-wrap"><div className="spinner" /></div>}

              {!loading && tickets.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                  <div style={{ width: 56, height: 56, background: '#f1f5f0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>No tickets yet</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setView('new')}>Create your first ticket</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tickets.map(ticket => {
                  const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  const hasUnread = parseInt(ticket.unread_count) > 0;
                  return (
                    <div key={ticket.id}
                      onClick={() => { setSelectedId(ticket.id); setView('ticket'); }}
                      style={{ background: 'white', border: `1px solid ${hasUnread ? '#bbf7d0' : '#e2e8e0'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14 }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: hasUnread ? 700 : 600, fontSize: 15 }}>{ticket.subject}</span>
                          {hasUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
                          {' · '}{ticket.message_count} messages
                          {' · '}{new Date(ticket.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: sc.bg, color: sc.text, flexShrink: 0 }}>
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}