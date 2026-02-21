import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Message } from '../../types';
import AdminLayout from '../layout';
import './message-detail.css';

function formatDate(ts: Message['createdAt'] | Message['repliedAt']) {
  if (!ts) return '—';
  return ts.toDate().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminMessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!id) return;
    async function fetchMessage() {
      const snap = await getDoc(doc(db, 'messages', id!));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Message;
        setMessage(data);
        if (data.replyText) setReply(data.replyText);
        if (data.status === 'new') {
          await updateDoc(doc(db, 'messages', id!), { status: 'read' });
          setMessage((prev) => prev ? { ...prev, status: 'read' } : prev);
        }
      }
      setLoading(false);
    }
    void fetchMessage();
  }, [id]);

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!message || !reply.trim()) return;

    setSending(true);
    setSendStatus('idle');
    try {
      await updateDoc(doc(db, 'messages', message.id), {
        status: 'replied',
        replyText: reply.trim(),
        repliedAt: serverTimestamp(),
      });
      setMessage((prev) =>
        prev ? { ...prev, status: 'replied', replyText: reply.trim() } : prev
      );
      setSendStatus('success');
    } catch {
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="admin-loading">Loading message…</p>
      </AdminLayout>
    );
  }

  if (!message) {
    return (
      <AdminLayout>
        <p className="admin-empty">Message not found.</p>
        <button className="btn btn--outline" onClick={() => navigate('/admin/messages')}>
          ← Back
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="msg-detail">
        <div className="msg-detail__header">
          <button className="msg-detail__back" onClick={() => navigate('/admin/messages')}>
            ← Messages
          </button>
          <span className={`msg-status msg-status--${message.status}`}>
            {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
          </span>
        </div>

        <div className="msg-detail__card">
          <h2 className="msg-detail__subject">
            {message.subject ?? '(no subject)'}
          </h2>

          <div className="msg-detail__meta">
            <div className="msg-detail__meta-item">
              <span className="msg-detail__meta-label">From</span>
              <span>{message.name} &lt;{message.email}&gt;</span>
            </div>
            <div className="msg-detail__meta-item">
              <span className="msg-detail__meta-label">Received</span>
              <span>{formatDate(message.createdAt)}</span>
            </div>
            {message.repliedAt && (
              <div className="msg-detail__meta-item">
                <span className="msg-detail__meta-label">Replied</span>
                <span>{formatDate(message.repliedAt)}</span>
              </div>
            )}
          </div>

          <div className="msg-detail__body">
            <p>{message.message}</p>
          </div>
        </div>

        {message.replyText && (
          <div className="msg-detail__previous-reply">
            <h3>Previous Reply</h3>
            <p>{message.replyText}</p>
          </div>
        )}

        <div className="msg-detail__reply">
          <h3>Send Reply</h3>
          <form onSubmit={handleSendReply}>
            <div className="form-group">
              <label htmlFor="reply-text">Reply to {message.name}</label>
              <textarea
                id="reply-text"
                rows={6}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply here…"
                required
              />
            </div>

            {sendStatus === 'success' && (
              <p className="msg-detail__feedback msg-detail__feedback--success">
                ✓ Reply sent and saved successfully.
              </p>
            )}
            {sendStatus === 'error' && (
              <p className="msg-detail__feedback msg-detail__feedback--error">
                ✗ Failed to send reply. Please try again.
              </p>
            )}

            <div className="msg-detail__reply-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={sending || !reply.trim()}
              >
                {sending ? 'Sending…' : 'Send Reply'}
              </button>
              <span className="msg-detail__reply-hint">
                Reply will be saved to Firestore
              </span>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
