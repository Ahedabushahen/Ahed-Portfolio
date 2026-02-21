import { useEffect, useState } from 'react';
import {
  getCertifications,
  addCertification,
  updateCertification,
  deleteCertification,
} from '../../services/firestoreService';
import { useToast } from '../../hooks/useToast';
import type { Certification } from '../../types';
import AdminLayout from '../layout';
import './certifications.css';

interface CertForm {
  name: string;
  issuer: string;
  date: string;
  url: string;
}

const EMPTY_FORM: CertForm = { name: '', issuer: '', date: '', url: '' };

export default function AdminCertifications() {
  const { toast } = useToast();
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CertForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function fetchCerts() {
    try {
      setCerts(await getCertifications());
    } catch {
      toast.error('Failed to load certifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchCerts(); }, []);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(cert: Certification) {
    setEditId(cert.id);
    setForm({ name: cert.name, issuer: cert.issuer, date: cert.date, url: cert.url ?? '' });
    setShowForm(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.issuer.trim() || !form.date.trim()) return;
    setSaving(true);
    const data = {
      name: form.name.trim(),
      issuer: form.issuer.trim(),
      date: form.date.trim(),
      url: form.url.trim() || undefined,
    };
    try {
      if (editId) {
        await updateCertification(editId, data);
        toast.success('Certification updated.');
      } else {
        await addCertification(data);
        toast.success('Certification added.');
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      await fetchCerts();
    } catch {
      toast.error('Failed to save certification.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this certification?')) return;
    try {
      await deleteCertification(id);
      setCerts((prev) => prev.filter((c) => c.id !== id));
      toast.success('Certification deleted.');
    } catch {
      toast.error('Failed to delete certification.');
    }
  }

  return (
    <AdminLayout>
      <div className="admin-certs">
        <div className="admin-certs__header">
          <h1>Certifications</h1>
          <button className="btn btn--primary" onClick={openAdd}>+ Add Certification</button>
        </div>

        {showForm && (
          <div className="cert-form-panel">
            <h2>{editId ? 'Edit Certification' : 'New Certification'}</h2>
            <form onSubmit={handleSubmit} className="cert-form">
              <div className="cert-form__row">
                <div className="form-group">
                  <label>Certificate Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Introduction to DevOps" required />
                </div>
                <div className="form-group">
                  <label>Issuer *</label>
                  <input name="issuer" value={form.issuer} onChange={handleChange} placeholder="IBM" required />
                </div>
              </div>
              <div className="cert-form__row">
                <div className="form-group">
                  <label>Date *</label>
                  <input name="date" value={form.date} onChange={handleChange} placeholder="Jan 2026" required />
                </div>
                <div className="form-group">
                  <label>Certificate URL</label>
                  <input name="url" type="url" value={form.url} onChange={handleChange} placeholder="https://…" />
                </div>
              </div>
              <div className="cert-form__actions">
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Update' : 'Add'}
                </button>
                <button type="button" className="btn btn--outline" onClick={() => { setShowForm(false); setEditId(null); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && <p className="admin-loading">Loading certifications…</p>}

        {!loading && certs.length === 0 && (
          <p className="admin-empty">No certifications yet. Add your first one!</p>
        )}

        {!loading && certs.length > 0 && (
          <div className="certs-list">
            {certs.map((cert) => (
              <div key={cert.id} className="cert-row">
                <div className="cert-row__badge">{cert.issuer.slice(0, 2).toUpperCase()}</div>
                <div className="cert-row__info">
                  <strong className="cert-row__name">{cert.name}</strong>
                  <span className="cert-row__meta">{cert.issuer} · {cert.date}</span>
                  {cert.url && (
                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="cert-row__link">
                      View Certificate ↗
                    </a>
                  )}
                </div>
                <div className="cert-row__actions">
                  <button className="btn-sm btn-sm--ghost" onClick={() => openEdit(cert)}>Edit</button>
                  <button className="btn-sm btn-sm--danger" onClick={() => void handleDelete(cert.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
