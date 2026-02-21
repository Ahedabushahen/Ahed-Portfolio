import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import type { Message } from '../../types';
import AdminLayout from '../layout';
import './messages.css';

function formatDate(ts: Message['createdAt']) {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const STATUS_LABELS: Record<Message['status'], string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchMessages() {
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message));
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchMessages(); }, []);

  async function handleMarkRead(id: string) {
    await updateDoc(doc(db, 'messages', id), { status: 'read' });
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m))
    );
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this message?')) return;
    await deleteDoc(doc(db, 'messages', id));
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <AdminLayout>
      <div className="admin-messages">
        <div className="admin-messages__header">
          <h1>Messages</h1>
          <span className="admin-messages__count">{messages.length} total</span>
        </div>

        {loading && <p className="admin-loading">Loading messages…</p>}

        {!loading && messages.length === 0 && (
          <p className="admin-empty">No messages yet.</p>
        )}

        {!loading && messages.length > 0 && (
          <div className="messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-row message-row--${msg.status}`}
              >
                <div
                  className="message-row__main"
                  onClick={() => navigate(`/admin/messages/${msg.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/messages/${msg.id}`)}
                >
                  <div className="message-row__info">
                    <span className={`msg-status msg-status--${msg.status}`}>
                      {STATUS_LABELS[msg.status]}
                    </span>
                    <strong className="message-row__name">{msg.name}</strong>
                    <span className="message-row__email">{msg.email}</span>
                  </div>
                  <p className="message-row__subject">
                    {msg.subject ?? '(no subject)'}
                  </p>
                  <p className="message-row__preview">
                    {msg.message.slice(0, 100)}{msg.message.length > 100 ? '…' : ''}
                  </p>
                  <span className="message-row__date">{formatDate(msg.createdAt)}</span>
                </div>

                <div className="message-row__actions">
                  {msg.status === 'new' && (
                    <button
                      className="btn-sm btn-sm--ghost"
                      onClick={() => void handleMarkRead(msg.id)}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    className="btn-sm btn-sm--primary"
                    onClick={() => navigate(`/admin/messages/${msg.id}`)}
                  >
                    Reply
                  </button>
                  <button
                    className="btn-sm btn-sm--danger"
                    onClick={() => void handleDelete(msg.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
