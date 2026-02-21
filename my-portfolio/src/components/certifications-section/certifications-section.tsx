import { useEffect, useState } from 'react';
import { getCertifications } from '../../services/firestoreService';
import type { Certification } from '../../types';
import './certifications-section.css';

export default function CertificationsSection() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCertifications()
      .then(setCerts)
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && certs.length === 0) return null;

  return (
    <section id="certifications" className="certifications section">
      <div className="section__inner">
        <p className="section__label">Credentials</p>
        <h2 className="section__title">Certifications</h2>

        <div className="certs__grid">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="cert-card cert-card--skeleton" />
              ))
            : certs.map((cert) => (
                <a
                  key={cert.id}
                  href={cert.url ?? '#'}
                  target={cert.url ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className={`cert-card${cert.url ? '' : ' cert-card--no-link'}`}
                >
                  <div className="cert-card__issuer-badge">{cert.issuer.slice(0, 2).toUpperCase()}</div>
                  <div className="cert-card__body">
                    <h3 className="cert-card__name">{cert.name}</h3>
                    <p className="cert-card__issuer">{cert.issuer}</p>
                    <p className="cert-card__date">{cert.date}</p>
                  </div>
                  {cert.url && <span className="cert-card__arrow">↗</span>}
                </a>
              ))}
        </div>
      </div>
    </section>
  );
}
