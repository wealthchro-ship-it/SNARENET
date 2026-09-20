import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { useSettings } from '../hooks/useSettings';
import { setPageTitle } from '../utils/seo';

export default function PublicLayout() {
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setPageTitle('');
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, (doc.scrollTop || window.scrollY) / max) : 0;
      setProgress(p);
      setScrolled((window.scrollY || doc.scrollTop) > 24);
      setShowTop((window.scrollY || doc.scrollTop) > 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerText = (settings.footerText || '© {year} {orgName}. All rights reserved.')
    .replace('{year}', String(new Date().getFullYear()))
    .replace('{orgName}', settings.organizationName || 'SnareNet');

  const year = new Date().getFullYear();

  return (
    <div className="public-shell">
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <nav className="container nav" aria-label="Main navigation">
          <Link to="/" aria-label={`${settings.organizationName} home`} onClick={() => setMenuOpen(false)}>
            <Logo />
          </Link>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <li><a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a></li>
            <li><a href="/#investigations" onClick={() => setMenuOpen(false)}>What We Investigate</a></li>
            <li><a href="/#reviews" onClick={() => setMenuOpen(false)}>Reviews</a></li>
            <li><a href="/#faq" onClick={() => setMenuOpen(false)}>FAQ</a></li>
          </ul>

          <div className="nav-cta">
            <Link to="/report" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
              Report a Scam
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Logo />
              <p className="muted" style={{ maxWidth: 320, marginTop: 14 }}>
                {settings.tagline}
              </p>
            </div>

            <div className="footer-col">
              <h4>Explore</h4>
              <a href="/#how-it-works">How It Works</a>
              <a href="/#investigations">What We Investigate</a>
              <a href="/#reviews">Reviews</a>
              <a href="/#faq">FAQ</a>
            </div>

            <div className="footer-col">
              <h4>Resources</h4>
              <Link to="/report">Report a Scam</Link>
              <a href="/#track-case">Check Case Status</a>
              <a href="/#disclaimer">Disclaimer</a>
              <a href="/#privacy">Privacy</a>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              )}
              {settings.contactPhone && <a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a>}
              {settings.website && <a href={settings.website} target="_blank" rel="noopener noreferrer">{settings.website}</a>}
              {!settings.contactEmail && !settings.contactPhone && (
                <span className="muted">Contact details pending configuration.</span>
              )}
            </div>
          </div>

          <div className="footer-bottom">
            <span>{footerText}</span>
            <span>Do not share passwords, OTPs, PINs or private keys.</span>
          </div>
        </div>
      </footer>

      <button
        type="button"
        className={`back-to-top ${showTop ? 'visible' : ''}`}
        onClick={backToTop}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}