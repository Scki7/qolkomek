import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function ChatPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [task, setTask] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${taskId}`);
      setMessages(res.data);
    } catch {}
  };

  useEffect(() => {
    if (!user) return navigate('/signin');
    api.get(`/tasks/${taskId}`).then(r => setTask(r.data)).catch(() => {});
    fetchMessages().finally(() => setLoading(false));
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [taskId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${taskId}`, { content: text.trim() });
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSending(false); }
  };

  const otherName = task ? (Number(user?.id) === Number(task.customer_id) ? task.helper_name : task.customer_name) : '...';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: '6px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{otherName?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>{otherName}</div>
              {task && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{task.title}</div>}
            </div>
          </div>
          {task && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/tasks/${taskId}/status`)}>
              View Task
            </button>
          )}
        </div>

        <div className="chat-layout">
          <div className="chat-messages">
            {loading && <div className="loading-wrap"><div className="spinner" /></div>}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60, fontSize: 14 }}>
                No messages yet. Start the conversation.
              </div>
            )}

            {messages.map((msg, i) => {
              const isMine = Number(msg.sender_id) === Number(user?.id);
              const showName = !isMine && (i === 0 || Number(messages[i-1]?.sender_id) !== Number(msg.sender_id));
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  {showName && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, paddingLeft: 4 }}>
                      {msg.sender_name}
                    </div>
                  )}
                  <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    {msg.content}
                    <div className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-bar">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              rows={1}
              style={{
                flex: 1, background: 'var(--bg)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', fontSize: 14,
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                maxHeight: 100, transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: text.trim() ? 'var(--green)' : 'var(--border)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s', flexShrink: 0, cursor: text.trim() ? 'pointer' : 'default'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
