import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import ToastContainer from '../../components/toast';
import './admin-layout.css';

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
  { path: '/admin/content', label: 'Content', icon: '✎' },
  { path: '/admin/projects', label: 'Projects', icon: '⬡' },
  { path: '/admin/certifications', label: 'Certifications', icon: '✦' },
  { path: '/admin/messages', label: 'Messages', icon: '✉' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/admin');
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span>⚡</span>
          <span>Admin</span>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
            >
              <span className="admin-nav-link__icon">{item.icon}</span>
              <span className="admin-nav-link__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <a href="/" className="admin-sidebar__portfolio-link">
            ← Portfolio
          </a>
          <button className="admin-sidebar__logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>

      <ToastContainer />
    </div>
  );
}
