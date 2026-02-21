import { useState, useEffect } from 'react';
import './navbar.css';

function getInitialTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  const NAV_SECTIONS = ['about', 'experience', 'education', 'projects', 'certifications', 'contact'];

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__brand" onClick={() => scrollTo('hero')}>
        <span className="navbar__dot" />
        Ahed
      </div>

      <ul className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}>
        {NAV_SECTIONS.map((s) => (
          <li key={s}>
            <button onClick={() => scrollTo(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          </li>
        ))}
        <li>
          <a href="/admin" className="navbar__admin-link">Admin</a>
        </li>
      </ul>

      <div className="navbar__right">
        <button
          className="navbar__theme-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <button
          className={`navbar__burger${menuOpen ? ' navbar__burger--open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
