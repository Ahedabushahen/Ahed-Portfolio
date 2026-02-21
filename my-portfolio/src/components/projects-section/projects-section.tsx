import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Project } from '../../types';
import './projects-section.css';

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];
        setProjects(data);
      } catch {
        // silently fail - show empty state
      } finally {
        setLoading(false);
      }
    }
    void fetchProjects();
  }, []);

  return (
    <section id="projects" className="projects section">
      <div className="section__inner">
        <p className="section__label">What I've Built</p>
        <h2 className="section__title">Projects</h2>

        {loading && (
          <div className="projects__loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="project-card project-card--skeleton" />
            ))}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <p className="projects__empty">No projects yet — check back soon!</p>
        )}

        {!loading && projects.length > 0 && (
          <div className="projects__grid">
            {projects.map((project) => (
              <article key={project.id} className="project-card">
                {project.imageUrl && (
                  <div
                    className="project-card__image"
                    style={{ backgroundImage: `url(${project.imageUrl})` }}
                  />
                )}
                <div className="project-card__body">
                  <h3 className="project-card__title">{project.title}</h3>
                  <p className="project-card__desc">{project.description}</p>
                  <div className="project-card__tags">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="project-card__tag">{tech}</span>
                    ))}
                  </div>
                  <div className="project-card__links">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-card__link project-card__link--live"
                      >
                        Live ↗
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-card__link project-card__link--github"
                      >
                        GitHub ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
