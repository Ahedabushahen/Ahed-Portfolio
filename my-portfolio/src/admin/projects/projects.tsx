import { useEffect, useRef, useState } from 'react';
import { getProjects, addProject, updateProject, deleteProject } from '../../services/firestoreService';
import { uploadProjectImage, deleteProjectImage } from '../../services/storageService';
import { useToast } from '../../hooks/useToast';
import type { Project } from '../../types';
import AdminLayout from '../layout';
import './projects.css';

interface ProjectForm {
  title: string;
  description: string;
  technologies: string;
  liveUrl: string;
  githubUrl: string;
}

const EMPTY_FORM: ProjectForm = {
  title: '', description: '', technologies: '', liveUrl: '', githubUrl: '',
};

export default function AdminProjects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchProjects() {
    try {
      setProjects(await getProjects());
    } catch {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchProjects(); }, []);

  function openAdd() {
    setEditId(null);
    setEditImageUrl(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  }

  function openEdit(project: Project) {
    setEditId(project.id);
    setEditImageUrl(project.imageUrl ?? null);
    setForm({
      title: project.title,
      description: project.description,
      technologies: project.technologies.join(', '),
      liveUrl: project.liveUrl ?? '',
      githubUrl: project.githubUrl ?? '',
    });
    setImageFile(null);
    setImagePreview(project.imageUrl ?? null);
    setShowForm(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setEditImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);

    const techs = form.technologies.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (editId) {
        let imageUrl = editImageUrl ?? undefined;
        if (imageFile) {
          if (editImageUrl) await deleteProjectImage(editImageUrl);
          imageUrl = await uploadProjectImage(imageFile, editId);
        } else if (!imagePreview && editImageUrl) {
          await deleteProjectImage(editImageUrl);
          imageUrl = undefined;
        }
        await updateProject(editId, {
          title: form.title.trim(),
          description: form.description.trim(),
          technologies: techs,
          liveUrl: form.liveUrl.trim() || undefined,
          githubUrl: form.githubUrl.trim() || undefined,
          imageUrl,
        });
        toast.success('Project updated.');
      } else {
        const tempId = crypto.randomUUID();
        let imageUrl: string | undefined;
        if (imageFile) {
          imageUrl = await uploadProjectImage(imageFile, tempId);
        }
        await addProject({
          title: form.title.trim(),
          description: form.description.trim(),
          technologies: techs,
          liveUrl: form.liveUrl.trim() || undefined,
          githubUrl: form.githubUrl.trim() || undefined,
          imageUrl,
        });
        toast.success('Project added.');
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      setImageFile(null);
      setImagePreview(null);
      await fetchProjects();
    } catch {
      toast.error('Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;
    try {
      if (project.imageUrl) await deleteProjectImage(project.imageUrl);
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast.success('Project deleted.');
    } catch {
      toast.error('Failed to delete project.');
    }
  }

  return (
    <AdminLayout>
      <div className="admin-projects">
        <div className="admin-projects__header">
          <h1>Projects</h1>
          <button className="btn btn--primary" onClick={openAdd}>+ Add Project</button>
        </div>

        {showForm && (
          <div className="project-form-panel">
            <h2>{editId ? 'Edit Project' : 'New Project'}</h2>
            <form onSubmit={handleSubmit} className="project-form">
              <div className="project-form__row">
                <div className="form-group">
                  <label>Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="My Awesome Project" required />
                </div>
                <div className="form-group">
                  <label>Stack (comma-separated)</label>
                  <input name="technologies" value={form.technologies} onChange={handleChange} placeholder="React, TypeScript, Firebase" />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="A brief description…" required />
              </div>

              <div className="project-form__row">
                <div className="form-group">
                  <label>Live URL</label>
                  <input name="liveUrl" value={form.liveUrl} onChange={handleChange} placeholder="https://…" type="url" />
                </div>
                <div className="form-group">
                  <label>GitHub URL</label>
                  <input name="githubUrl" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/…" type="url" />
                </div>
              </div>

              <div className="form-group">
                <label>Project Image</label>
                <div className="image-upload">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button type="button" className="image-preview__remove" onClick={clearImage} aria-label="Remove image">×</button>
                    </div>
                  ) : (
                    <label className="image-upload__drop" htmlFor="project-image">
                      <span>Click to upload image</span>
                      <span className="image-upload__hint">PNG, JPG, WebP up to 5MB</span>
                    </label>
                  )}
                  <input
                    id="project-image"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="image-upload__input"
                  />
                </div>
              </div>

              <div className="project-form__actions">
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Update Project' : 'Add Project'}
                </button>
                <button type="button" className="btn btn--outline" onClick={cancelForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading && <p className="admin-loading">Loading projects…</p>}

        {!loading && projects.length === 0 && (
          <p className="admin-empty">No projects yet. Add your first one!</p>
        )}

        {!loading && projects.length > 0 && (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-admin-card">
                {project.imageUrl ? (
                  <div className="project-admin-card__image" style={{ backgroundImage: `url(${project.imageUrl})` }} />
                ) : (
                  <div className="project-admin-card__image project-admin-card__image--placeholder">
                    <span>No Image</span>
                  </div>
                )}
                <div className="project-admin-card__body">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-admin-card__tags">
                    {project.technologies.map((t) => (
                      <span key={t} className="project-card__tag">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="project-admin-card__actions">
                  <button className="btn-sm btn-sm--ghost" onClick={() => openEdit(project)}>Edit</button>
                  <button className="btn-sm btn-sm--danger" onClick={() => void handleDelete(project)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
