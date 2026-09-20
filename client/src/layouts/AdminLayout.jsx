import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import Logo from '../components/Logo';
import { setPageTitle } from '../utils/seo';
import { useEffect } from 'react';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/cases', label: 'Cases' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setPageTitle('Admin');
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <header className="site-header">
        <nav className="container nav" aria-label="Admin navigation">
          <Link to="/admin/dashboard" aria-label="Admin home">
            <Logo />
          </Link>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle admin navigation"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          <ul className={`nav-links nav-links-admin ${menuOpen ? 'open' : ''}`}>
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <div className="admin-user" title={admin?.email || 'Administrator'}>
              {(admin?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </nav>
      </header>

      <main className="container admin-main">
        <Outlet />
      </main>

      <style>{`
        .nav-links-admin a.active { color: var(--primary-color); background: var(--primary-soft); }
        .admin-user {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--primary-soft); color: var(--primary-color);
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 15px; border: 1px solid rgba(229,57,53,.35);
        }
        .admin-main { padding-top: 32px; padding-bottom: 80px; min-height: 70vh; }
      `}</style>
    </div>
  );
}