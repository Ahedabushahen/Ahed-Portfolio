import { useEffect, useState } from 'react';
import { getSiteContent } from '../../services/firestoreService';
import type { EducationEntry } from '../../types';
import './education.css';

const DEFAULTS: EducationEntry[] = [
  {
    school: 'Tel-Hai University of Kiryat Shmona',
    degree: 'BSc in Computer Science',
    start: 'Mar 2022',
    end: 'Nov 2025',
    details: 'GPA: 90.19 | Algorithms: 98 | Operating Systems: 87',
  },
];

export default function Education() {
  const [entries, setEntries] = useState<EducationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteContent()
      .then((content) => {
        setEntries(content.education?.length ? content.education : DEFAULTS);
      })
      .catch(() => setEntries(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && entries.length === 0) return null;

  return (
    <section id="education" className="education section">
      <div className="section__inner">
        <p className="section__label">Academic Background</p>
        <h2 className="section__title">Education</h2>

        <div className="education__timeline">
          {loading
            ? Array.from({ length: 1 }).map((_, i) => (
                <div key={i} className="education__item education__item--skeleton">
                  <div className="skeleton skeleton--line" style={{ width: '40%' }} />
                  <div className="skeleton skeleton--line" style={{ width: '60%', marginTop: '0.5rem' }} />
                </div>
              ))
            : entries.map((entry, i) => (
                <div key={i} className="education__item">
                  <div className="education__dot" />
                  <div className="education__body">
                    <div className="education__header">
                      <div>
                        <h3 className="education__degree">{entry.degree}</h3>
                        <p className="education__school">{entry.school}</p>
                      </div>
                      <span className="education__period">
                        {entry.start} — {entry.end}
                      </span>
                    </div>
                    {entry.details && (
                      <p className="education__details">{entry.details}</p>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
