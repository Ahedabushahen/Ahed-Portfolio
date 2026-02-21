import { useEffect, useState } from 'react';
import { getSiteContent } from '../../services/firestoreService';
import type { ExperienceEntry } from '../../types';
import './experience.css';

const DEFAULTS: ExperienceEntry[] = [
  {
    company: 'BMC Software',
    role: 'Software Engineer',
    start: '2024',
    end: '2026',
    bullets: [
      'Developed a proprietary LLM Judge system integrating Large Language Models for AI-driven product evaluation.',
      'Built backend and automation components for the JETT AI platform using Python, TypeScript, Angular, and Robot Framework.',
      'Supported and improved CI/CD pipelines (Jenkins), including automation, testing, and production deployments.',
      'Designed RESTful APIs using FastAPI for AI-driven platform components with high-performance backend services.',
      'Containerized backend services using Docker for consistent development and production environments.',
    ],
  },
];

export default function Experience() {
  const [entries, setEntries] = useState<ExperienceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteContent().then((content) => {
      setEntries(content.experience?.length ? content.experience : DEFAULTS);
    }).catch(() => setEntries(DEFAULTS)).finally(() => setLoading(false));
  }, []);

  if (!loading && entries.length === 0) return null;

  return (
    <section id="experience" className="experience section">
      <div className="section__inner">
        <p className="section__label">Career</p>
        <h2 className="section__title">Experience</h2>

        <div className="experience__timeline">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="experience__item experience__item--skeleton">
                  <div className="skeleton skeleton--line" style={{ width: '40%' }} />
                  <div className="skeleton skeleton--line" style={{ width: '60%', marginTop: '0.5rem' }} />
                </div>
              ))
            : entries.map((entry, i) => (
                <div key={i} className="experience__item">
                  <div className="experience__dot" />
                  <div className="experience__body">
                    <div className="experience__header">
                      <div>
                        <h3 className="experience__role">{entry.role}</h3>
                        <p className="experience__company">{entry.company}</p>
                      </div>
                      <span className="experience__period">
                        {entry.start} — {entry.end}
                      </span>
                    </div>
                    {entry.bullets.length > 0 && (
                      <ul className="experience__bullets">
                        {entry.bullets.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
