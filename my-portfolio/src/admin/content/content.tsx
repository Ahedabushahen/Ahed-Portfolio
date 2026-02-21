import { useEffect, useState } from 'react';
import { getSiteContent, saveSiteContent } from '../../services/firestoreService';
import { useToast } from '../../hooks/useToast';
import type { AboutData, ExperienceEntry, EducationEntry, SiteContent } from '../../types';
import AdminLayout from '../layout';
import './content.css';

type Tab = 'about' | 'skills' | 'experience' | 'education';

const EMPTY_EXPERIENCE: ExperienceEntry = {
  company: '', role: '', start: '', end: '', bullets: [],
};
const EMPTY_EDUCATION: EducationEntry = {
  school: '', degree: '', start: '', end: '', details: '',
};

export default function AdminContent() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('about');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // About
  const [about, setAbout] = useState<AboutData>({
    name: '', title: '', summary: '', location: '', email: '',
    socials: { github: '', linkedin: '' }, resumeUrl: '',
  });

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Experience
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);

  // Education
  const [education, setEducation] = useState<EducationEntry[]>([]);

  useEffect(() => {
    getSiteContent().then((content) => {
      if (content.about) setAbout(content.about);
      if (content.skills) setSkills(content.skills);
      if (content.experience) setExperience(content.experience);
      if (content.education) setEducation(content.education);
    }).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const data: Partial<SiteContent> = {};
      if (tab === 'about') data.about = about;
      if (tab === 'skills') data.skills = skills;
      if (tab === 'experience') data.experience = experience;
      if (tab === 'education') data.education = education;
      await saveSiteContent(data);
      toast.success('Saved successfully!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Skill helpers ──────────────────────────────────────────────────────────
  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
    }
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  // ── Experience helpers ─────────────────────────────────────────────────────
  function updateExp(i: number, field: keyof ExperienceEntry, value: string | string[]) {
    setExperience((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );
  }

  function addBullet(i: number) {
    setExperience((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, bullets: [...e.bullets, ''] } : e))
    );
  }

  function updateBullet(expIdx: number, bulletIdx: number, value: string) {
    setExperience((prev) =>
      prev.map((e, i) => {
        if (i !== expIdx) return e;
        const bullets = [...e.bullets];
        bullets[bulletIdx] = value;
        return { ...e, bullets };
      })
    );
  }

  function removeBullet(expIdx: number, bulletIdx: number) {
    setExperience((prev) =>
      prev.map((e, i) => {
        if (i !== expIdx) return e;
        return { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIdx) };
      })
    );
  }

  function removeExp(i: number) {
    setExperience((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Education helpers ──────────────────────────────────────────────────────
  function updateEdu(i: number, field: keyof EducationEntry, value: string) {
    setEducation((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );
  }

  function removeEdu(i: number) {
    setEducation((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="admin-loading">Loading content…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-content">
        <div className="admin-content__header">
          <h1>Site Content</h1>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="content-tabs">
          {(['about', 'skills', 'experience', 'education'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`content-tab${tab === t ? ' content-tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── About Tab ── */}
        {tab === 'about' && (
          <div className="content-panel">
            <div className="content-form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input value={about.name} onChange={(e) => setAbout({ ...about, name: e.target.value })} placeholder="Ahed Abu Shahen" />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input value={about.title} onChange={(e) => setAbout({ ...about, title: e.target.value })} placeholder="Software Engineer" />
              </div>
              <div className="form-group content-form-grid--full">
                <label>Summary</label>
                <textarea rows={4} value={about.summary} onChange={(e) => setAbout({ ...about, summary: e.target.value })} placeholder="Professional summary…" />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={about.location} onChange={(e) => setAbout({ ...about, location: e.target.value })} placeholder="City, Country" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={about.email} onChange={(e) => setAbout({ ...about, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label>GitHub Username</label>
                <input value={about.socials?.github ?? ''} onChange={(e) => setAbout({ ...about, socials: { ...about.socials, github: e.target.value } })} placeholder="your-username" />
              </div>
              <div className="form-group">
                <label>LinkedIn Username</label>
                <input value={about.socials?.linkedin ?? ''} onChange={(e) => setAbout({ ...about, socials: { ...about.socials, linkedin: e.target.value } })} placeholder="your-username" />
              </div>
              <div className="form-group content-form-grid--full">
                <label>Resume URL</label>
                <input type="url" value={about.resumeUrl} onChange={(e) => setAbout({ ...about, resumeUrl: e.target.value })} placeholder="https://drive.google.com/…" />
              </div>
            </div>
          </div>
        )}

        {/* ── Skills Tab ── */}
        {tab === 'skills' && (
          <div className="content-panel">
            <div className="skills-input-row">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Type a skill and press Enter…"
                className="skills-input"
              />
              <button className="btn btn--primary" onClick={addSkill}>Add</button>
            </div>
            <div className="skills-chips">
              {skills.map((skill) => (
                <span key={skill} className="skill-chip">
                  {skill}
                  <button className="skill-chip__remove" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>×</button>
                </span>
              ))}
              {skills.length === 0 && <p className="admin-empty">No skills yet. Add some above.</p>}
            </div>
          </div>
        )}

        {/* ── Experience Tab ── */}
        {tab === 'experience' && (
          <div className="content-panel">
            <button className="btn btn--outline content-panel__add-btn" onClick={() => setExperience((prev) => [{ ...EMPTY_EXPERIENCE }, ...prev])}>
              + Add Entry
            </button>
            {experience.length === 0 && <p className="admin-empty">No experience entries yet.</p>}
            {experience.map((entry, i) => (
              <div key={i} className="entry-card">
                <div className="entry-card__header">
                  <span className="entry-card__index">#{i + 1}</span>
                  <button className="btn-sm btn-sm--danger" onClick={() => removeExp(i)}>Remove</button>
                </div>
                <div className="content-form-grid">
                  <div className="form-group">
                    <label>Company</label>
                    <input value={entry.company} onChange={(e) => updateExp(i, 'company', e.target.value)} placeholder="BMC Software" />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input value={entry.role} onChange={(e) => updateExp(i, 'role', e.target.value)} placeholder="Software Engineer" />
                  </div>
                  <div className="form-group">
                    <label>Start</label>
                    <input value={entry.start} onChange={(e) => updateExp(i, 'start', e.target.value)} placeholder="2024" />
                  </div>
                  <div className="form-group">
                    <label>End</label>
                    <input value={entry.end} onChange={(e) => updateExp(i, 'end', e.target.value)} placeholder="Present" />
                  </div>
                </div>
                <div className="bullets-editor">
                  <div className="bullets-editor__label">
                    <span>Bullets</span>
                    <button className="btn-sm btn-sm--ghost" onClick={() => addBullet(i)}>+ Add Bullet</button>
                  </div>
                  {entry.bullets.map((b, j) => (
                    <div key={j} className="bullet-row">
                      <input value={b} onChange={(e) => updateBullet(i, j, e.target.value)} placeholder="Describe what you did…" />
                      <button className="bullet-remove" onClick={() => removeBullet(i, j)} aria-label="Remove bullet">×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Education Tab ── */}
        {tab === 'education' && (
          <div className="content-panel">
            <button className="btn btn--outline content-panel__add-btn" onClick={() => setEducation((prev) => [{ ...EMPTY_EDUCATION }, ...prev])}>
              + Add Entry
            </button>
            {education.length === 0 && <p className="admin-empty">No education entries yet.</p>}
            {education.map((entry, i) => (
              <div key={i} className="entry-card">
                <div className="entry-card__header">
                  <span className="entry-card__index">#{i + 1}</span>
                  <button className="btn-sm btn-sm--danger" onClick={() => removeEdu(i)}>Remove</button>
                </div>
                <div className="content-form-grid">
                  <div className="form-group">
                    <label>School</label>
                    <input value={entry.school} onChange={(e) => updateEdu(i, 'school', e.target.value)} placeholder="Tel-Hai University" />
                  </div>
                  <div className="form-group">
                    <label>Degree</label>
                    <input value={entry.degree} onChange={(e) => updateEdu(i, 'degree', e.target.value)} placeholder="BSc in Computer Science" />
                  </div>
                  <div className="form-group">
                    <label>Start</label>
                    <input value={entry.start} onChange={(e) => updateEdu(i, 'start', e.target.value)} placeholder="Mar 2022" />
                  </div>
                  <div className="form-group">
                    <label>End</label>
                    <input value={entry.end} onChange={(e) => updateEdu(i, 'end', e.target.value)} placeholder="Nov 2025" />
                  </div>
                  <div className="form-group content-form-grid--full">
                    <label>Details (GPA, notable grades…)</label>
                    <input value={entry.details ?? ''} onChange={(e) => updateEdu(i, 'details', e.target.value)} placeholder="GPA: 90.19, Algorithms: 98…" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
