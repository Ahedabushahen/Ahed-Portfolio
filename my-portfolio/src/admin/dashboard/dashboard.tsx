import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getResumeMeta, saveResumeMeta } from '../../services/cvService';
import { uploadCVWithProgress } from '../../services/storageService';
import { useToast } from '../../hooks/useToast';
import type { ResumeMeta } from '../../types';
import AdminLayout from '../layout';
import './dashboard.css';

const CV_FILENAME = 'Ahed_Abu_Shahen_CV.pdf';

interface Stats {
  totalMessages: number;
  newMessages: number;
  totalProjects: number;
  totalCerts: number;
}

function formatDate(meta: ResumeMeta | null): string {
  if (!meta?.updatedAt) return '—';
  const ts = meta.updatedAt;
  const ms = typeof ts.toMillis === 'function' ? ts.toMillis() : Number(ts);
  return new Date(ms).toLocaleString();
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<Stats>({
    totalMessages: 0, newMessages: 0, totalProjects: 0, totalCerts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // CV section state
  const [resumeMeta, setResumeMeta] = useState<ResumeMeta | null>(null);
  const [cvMetaLoading, setCvMetaLoading] = useState(true);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [messagesSnap, newSnap, projectsSnap, certsSnap] = await Promise.all([
          getDocs(collection(db, 'messages')),
          getDocs(query(collection(db, 'messages'), where('status', '==', 'new'))),
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'certifications')),
        ]);
        setStats({
          totalMessages: messagesSnap.size,
          newMessages: newSnap.size,
          totalProjects: projectsSnap.size,
          totalCerts: certsSnap.size,
        });
      } catch {
        // keep default zeros
      } finally {
        setStatsLoading(false);
      }
    }

    async function fetchResumeMeta() {
      try {
        const meta = await getResumeMeta();
        setResumeMeta(meta);
      } catch {
        // keep null
      } finally {
        setCvMetaLoading(false);
      }
    }

    void fetchStats();
    void fetchResumeMeta();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }
    setCvFile(file);
  }

  async function handleUploadCV() {
    if (!cvFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      let storagePath: string;

      try {
        const result = await uploadCVWithProgress(
          cvFile,
          setUploadProgress,
          resumeMeta?.storagePath
        );
        storagePath = result.storagePath;
      } catch (err) {
        console.error('[CV Upload] Storage upload failed:', err);
        toast.error('Storage upload failed. Check Firebase Storage rules and try again.');
        return;
      }

      try {
        await saveResumeMeta({ storagePath, fileName: CV_FILENAME });
      } catch (err) {
        console.error('[CV Upload] Firestore save failed:', err);
        toast.error('File uploaded but Firestore save failed. Check console for details.');
        return;
      }

      // Re-fetch so the UI shows the fresh updatedAt from Firestore
      const updated = await getResumeMeta();
      setResumeMeta(updated);

      setCvFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('CV uploaded and saved! The portfolio will now serve the new file.');
    } catch (err) {
      console.error('[CV Upload] Unexpected error:', err);
      toast.error('Upload failed. Check the browser console for details.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }

  function clearSelection() {
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const STAT_CARDS = [
    { label: 'Total Messages', value: stats.totalMessages, icon: '✉', color: 'purple' },
    { label: 'Unread Messages', value: stats.newMessages, icon: '🔔', color: 'cyan', highlight: true },
    { label: 'Projects', value: stats.totalProjects, icon: '⬡', color: 'purple' },
    { label: 'Certifications', value: stats.totalCerts, icon: '✦', color: 'cyan' },
  ];

  return (
    <AdminLayout>
      <div className="dashboard">

        {/* ── Header ── */}
        <div className="dashboard__hero">
          <div>
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__subtitle">
              Welcome back{user?.email ? `, ${user.email}` : ''}!
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="dashboard__stats">
          {STAT_CARDS.map((card) => (
            <div
              key={card.label}
              className={`stat-card${card.highlight ? ' stat-card--highlight' : ''}`}
            >
              <div className={`stat-card__icon stat-card__icon--${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="stat-card__label">{card.label}</p>
                <p className="stat-card__value">{statsLoading ? '—' : card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CV / Resume Section ── */}
        <div className="cv-section">
          <div className="cv-section__header">
            <div className="cv-section__title-block">
              <div className="cv-section__icon">📄</div>
              <div>
                <h2 className="cv-section__title">CV / Resume</h2>
                <p className="cv-section__subtitle">
                  Upload a new PDF — the portfolio will serve it instantly, no redeploy needed.
                </p>
              </div>
            </div>
          </div>

          {/* Current CV info */}
          {!cvMetaLoading && (
            <div className="cv-meta">
              {resumeMeta ? (
                <>
                  <div className="cv-meta__row">
                    <span className="cv-meta__label">File</span>
                    <span className="cv-meta__value">{resumeMeta.fileName}</span>
                  </div>
                  <div className="cv-meta__row">
                    <span className="cv-meta__label">Last updated</span>
                    <span className="cv-meta__value">{formatDate(resumeMeta)}</span>
                  </div>
                  <div className="cv-meta__row">
                    <span className="cv-meta__label">Storage path</span>
                    <span className="cv-meta__value cv-meta__value--mono">
                      {resumeMeta.storagePath}
                    </span>
                  </div>
                </>
              ) : (
                <p className="cv-meta__empty">
                  No CV in Firebase yet — portfolio uses the static{' '}
                  <code>/assets/cv.pdf</code> fallback.
                </p>
              )}
            </div>
          )}

          <div className="cv-section__body">
            {/* Drop zone */}
            <div className={`cv-drop${cvFile ? ' cv-drop--selected' : ''}`}>
              <input
                id="cv-upload"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="cv-drop__input"
              />
              {cvFile ? (
                <div className="cv-drop__preview">
                  <span className="cv-drop__file-icon">📄</span>
                  <div className="cv-drop__file-info">
                    <span className="cv-drop__filename">{cvFile.name}</span>
                    <span className="cv-drop__filesize">
                      {(cvFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    className="cv-drop__clear"
                    onClick={clearSelection}
                    aria-label="Remove selected file"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label htmlFor="cv-upload" className="cv-drop__label">
                  <span className="cv-drop__icon">↑</span>
                  <span className="cv-drop__text">Click to select a PDF</span>
                  <span className="cv-drop__hint">
                    {resumeMeta ? 'This will replace the current CV' : 'No CV uploaded yet'}
                  </span>
                </label>
              )}
            </div>

            {/* Upload button + progress */}
            <div className="cv-section__upload-col">
              <button
                className="btn btn--primary cv-section__upload-btn"
                onClick={handleUploadCV}
                disabled={!cvFile || uploading}
              >
                {uploading
                  ? uploadProgress > 0
                    ? `Uploading… ${uploadProgress}%`
                    : 'Uploading…'
                  : resumeMeta
                  ? 'Replace CV'
                  : 'Upload CV'}
              </button>
              {uploading && (
                <div className="cv-progress">
                  {uploadProgress > 0 ? (
                    <div
                      className="cv-progress__bar"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  ) : (
                    <div className="cv-progress__bar cv-progress__bar--indeterminate" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="dashboard__links">
          {[
            { href: '/admin/content', label: 'Edit Site Content' },
            { href: '/admin/messages', label: 'View Messages' },
            { href: '/admin/projects', label: 'Manage Projects' },
            { href: '/admin/certifications', label: 'Manage Certifications' },
          ].map((link) => (
            <a key={link.href} href={link.href} className="dashboard__quick-link">
              {link.label} →
            </a>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}
