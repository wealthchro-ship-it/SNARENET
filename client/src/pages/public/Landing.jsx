import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { fetchPublicReviews } from '../../services/settings';
import { lookupCaseStatus } from '../../services/auth';
import Stars from '../../components/Stars';
import Spinner, { InlineSpinner } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import SmartImage from '../../components/SmartImage';
import TiltCard from '../../components/TiltCard';
import Reveal from '../../components/Reveal';
import { setPageTitle } from '../../utils/seo';
import './landing.css';

const ICONS = {
  shield: '🛡',
  bank: '🏦',
  crypto: '₿',
  investment: '📈',
  store: '🛒',
  phishing: '🎣',
  social: '👥',
  romance: '💔',
  impersonation: '🎭',
  account: '🔐',
  other: '⚠',
};

const INVESTIGATIONS = [
  { label: 'Bank Transfer Scam', icon: ICONS.bank },
  { label: 'Cryptocurrency Scam', icon: ICONS.crypto },
  { label: 'Investment Scam', icon: ICONS.investment },
  { label: 'Fake Online Store', icon: ICONS.store },
  { label: 'Phishing', icon: ICONS.phishing },
  { label: 'Social Media Scam', icon: ICONS.social },
  { label: 'Romance Scam', icon: ICONS.romance },
  { label: 'Impersonation', icon: ICONS.impersonation },
  { label: 'Account Fraud', icon: ICONS.account },
  { label: 'Other Digital Fraud', icon: ICONS.other },
];

const FAQS = [
  {
    q: 'Can you guarantee that my money will be recovered?',
    a: 'No. Recovery cannot be guaranteed. Each case depends on the available evidence, transaction trail, cooperation from relevant platforms or institutions, and applicable laws.',
  },
  {
    q: 'What information should I provide?',
    a: 'Provide as much accurate information as you have. You do not need to know everything about the suspected scammer. Transaction references, wallet addresses, dates, amounts and communications are all useful.',
  },
  {
    q: 'Can I report if I do not know who scammed me?',
    a: 'Yes. Provide whatever information you have. Even partial details can help establish the transaction trail.',
  },
  {
    q: 'What should I never submit?',
    a: 'Never submit passwords, OTPs, PINs, banking login credentials, crypto seed phrases or private keys. We will never ask for these.',
  },
  {
    q: 'What happens after I submit a report?',
    a: 'Your report is assigned a Case ID and recorded securely. The investigation team reviews the available information and may contact you using your preferred contact method for clarification.',
  },
  {
    q: 'Is my information kept private?',
    a: 'Yes. Reports are treated as confidential and are only visible to the authorized investigation team. No public case information, contact details, or financial data is exposed.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{q}</span>
        <span className="chev" aria-hidden="true">▼</span>
      </button>
      <div className="faq-a">
        <p>{a}</p>
      </div>
    </div>
  );
}

function TrustIcons() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Typewriter({ text = '', speed = 16 }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDone(true);
      return undefined;
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(text);
      setDone(true);
      return undefined;
    }
    let i = 0;
    setShown('');
    setDone(false);
    const timer = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className="typewriter" aria-label={text}>
      {shown}
      {!done && <span className="caret" aria-hidden="true" />}
    </span>
  );
}

export default function Landing() {
  const { settings, error } = useSettings();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);
  const [track, setTrack] = useState({ caseId: '', result: null, loading: false, error: null });

  const featured = reviews.filter((r) => r.featured && r.approved !== false);

  useEffect(() => {
    setPageTitle('');
    let mounted = true;
    fetchPublicReviews()
      .then((data) => mounted && setReviews(Array.isArray(data) ? data : []))
      .catch(() => mounted && setReviewsError(true))
      .finally(() => mounted && setReviewsLoading(false));
    return () => { mounted = false; };
  }, []);

  const featuredDisplay = featured.length ? featured : reviews;
  const showReviews = featuredDisplay.length > 0;

  const onTrack = async (e) => {
    e.preventDefault();
    const value = track.caseId.trim().toUpperCase();
    if (!value) return;
    setTrack((s) => ({ ...s, loading: true, error: null, result: null }));
    try {
      const data = await lookupCaseStatus(value);
      setTrack((s) => ({ ...s, result: data }));
    } catch (err) {
      setTrack((s) => ({ ...s, error: err.message || 'Case not found' }));
    } finally {
      setTrack((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-orbs" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-text">
            <div className="eyebrow">
              <Typewriter text="Suspected Scam or Fraud?" />
            </div>
            <h1 className="reveal" style={{ animationDelay: '0.05s' }}>
              {settings.heroHeading || 'Scammed? Report It. Start the Investigation.'}
            </h1>
            <p className="hero-sub reveal" style={{ animationDelay: '0.1s' }}>
              {settings.heroDescription ||
                'Provide the information you have about a suspected scam or fraudulent transaction. Our team can review the available details and determine the appropriate next steps.'}
            </p>

            <div className="hero-actions reveal" style={{ animationDelay: '0.15s' }}>
              <Link to="/report" className="btn btn-primary btn-lg shiny">
                Report a Scam
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                How It Works
              </a>
            </div>

            <div className="hero-trust-row reveal" style={{ animationDelay: '0.2s' }}>
              <span><TrustIcons /> Confidential reports</span>
              <span><TrustIcons /> Secure submission</span>
              <span><TrustIcons /> Case ID for tracking</span>
            </div>
          </div>

          <TiltCard className="hero-visual reveal" maxX={7} maxY={7}>
            <div className="hero-img-glow" aria-hidden="true" />
            <SmartImage
              src={settings.heroImageUrl}
              alt="Cybersecurity investigation dashboard"
              className="hero-img"
              eager
            />
            <div className="hero-img-shade" aria-hidden="true" />
            <div className="chip chip-tl">
              <span className="chip-ic" aria-hidden="true">🛡</span>
              <div>
                <div className="chip-lbl">Case</div>
                <div className="chip-val mono">SCR-2026-000001</div>
              </div>
            </div>
            <div className="chip chip-br">
              <span className="chip-ic pulsing" aria-hidden="true">●</span>
              <div>
                <div className="chip-lbl">Status</div>
                <div className="chip-val">UNDER_REVIEW</div>
              </div>
            </div>
            <div className="chip chip-bl">
              <span className="chip-ic" aria-hidden="true">🔍</span>
              <div>
                <div className="chip-lbl">Trail mapped</div>
                <div className="chip-val">3 hops · evidence found</div>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {error && (
        <div className="container">
          <div className="alert alert-warning mb-3">
            Could not load live organization settings. Showing defaults.
          </div>
        </div>
      )}

      {/* ===== DISCLAIMER / TRUST ===== */}
      <Reveal className="trust-strip" id="disclaimer">
        <div className="container trust-grid">
          <div className="trust-item">
            <span className="ic" aria-hidden="true">{ICONS.shield}</span>
            <div>
              <h3>Important disclaimer</h3>
              <p>{settings.disclaimer || 'SnareNet does not guarantee recovery of lost funds.'}</p>
            </div>
          </div>
          <div className="trust-item" id="privacy">
            <span className="ic" aria-hidden="true">🔒</span>
            <div>
              <h3>Never share credentials</h3>
              <p>{settings.privacyNotice || 'Never submit your password, OTP, PIN, banking login, crypto seed phrase or private key.'}</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" id="how-it-works">
        <div className="container">
          <Reveal className="center mb-4">
            <div className="eyebrow">The Process</div>
            <h2 className="section-title">How It Works</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              A clear, confidential pipeline from report to resolution.
            </p>
          </Reveal>

          <div className="steps-grid">
            {[
              ['Submit Your Report', 'Provide the details you have. Every accurate detail strengthens the trail.'],
              ['Case Review', 'The team reviews the submission, verifies completeness and categorizes the case.'],
              ['Investigation', 'Available digital trails are examined within the limits of the evidence and the law.'],
              ['Case Updates', 'You are contacted with status updates using your preferred contact method.'],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 90}>
                <TiltCard maxX={10} maxY={10} className="card card-hover step-card">
                  <span className="step-num">STEP 0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <span className="step-glow" aria-hidden="true" />
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT WE INVESTIGATE ===== */}
      <section className="section" id="investigations" style={{ background: 'var(--secondary-color)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <Reveal className="center mb-4">
            <div className="eyebrow">Scope</div>
            <h2 className="section-title">What We Investigate</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Cases involving fraudulent transfers, digital payments and online deception.
            </p>
          </Reveal>

          <div className="investigations-grid">
            {INVESTIGATIONS.map((item, i) => (
              <Reveal key={item.label} delay={(i % 5) * 60}>
                <TiltCard maxX={14} maxY={14} className="card card-hover inv-card">
                  <span className="ic" aria-hidden="true">{item.icon}</span>
                  <h3>{item.label}</h3>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY DETAILS MATTER ===== */}
      <section className="section" id="why-details">
        <div className="container why-grid">
          <Reveal>
            <div className="eyebrow">Evidence & Trails</div>
            <h2 className="section-title">Why Reporting Details Matter</h2>
            <p className="section-sub">
              Investigators work with the information that exists. Records like references, hashes and
              wallet addresses can reveal a trail that would otherwise be invisible.
            </p>

            <ul className="why-list" style={{ marginTop: 34 }}>
              {[
                ['↗', 'Transaction references & IDs', 'Let the team trace a payment through platforms and institutions.'],
                ['₿', 'Wallet & account identifiers', 'Blockchain hashes and bank details help establish where funds moved.'],
                ['⏱', 'Dates, times and amounts', 'Timelines narrow the search to the relevant activity.'],
                ['🖥', 'Profiles, websites & messages', 'Anything that identifies the person or entity behind the scam.'],
              ].map(([ic, title, body], i) => (
                <li key={title}>
                  <Reveal as="span" className="why-item" delay={i * 90}>
                    <span className="ic" aria-hidden="true">{ic}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="why-visual-wrap" delay={120}>
            <div className="why-visual">
              <div className="why-img-box">
                <SmartImage
                  src={settings.aboutImageUrl}
                  alt="Digital evidence and transaction trails"
                  className="why-img"
                />
                <div className="why-img-overlay" aria-hidden="true" />
                <div className="why-img-caption">
                  <span className="live-dot" aria-hidden="true" /> Evidence analyzed in the field
                </div>
              </div>
              <div className="why-trail">
                <div className="dot" style={{ background: 'var(--primary-color)' }} /> Transaction trail
                <div className="line">
                  <div className="label">You sent</div>
                  <div>$2,000 · Bank transfer · #{'REF2026A1'}</div>
                </div>
                <div className="line">
                  <div className="label">Intermediate account</div>
                  <div>Bank · 'GLOBAL TRADE LTD'</div>
                </div>
                <div className="line">
                  <div className="label">Final destination</div>
                  <div className="mono">0x3f2a…9c4e · Exchange</div>
                </div>
                <div className="line evidence-line">
                  <div className="scan-marker" aria-hidden="true" />
                  <div className="label" style={{ color: 'var(--primary-color)' }}>Evidence found</div>
                  <div>Case ready for investigation</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="section" id="reviews" style={{ background: 'var(--secondary-color)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <Reveal className="center mb-4">
            <div className="eyebrow">Reviews</div>
            <h2 className="section-title">What People Say</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Feedback shared by people we have assisted. Reviews are only published after review by the team.
            </p>
          </Reveal>

          {reviewsLoading && <Spinner label="Loading reviews..." />}

          {!reviewsLoading && reviewsError && (
            <div className="empty-state">
              <div className="icon" aria-hidden="true">💬</div>
              <h3>Reviews are temporarily unavailable</h3>
              <p>Please check back later.</p>
            </div>
          )}

          {!reviewsLoading && !reviewsError && !showReviews && (
            <div className="empty-state">
              <div className="icon" aria-hidden="true">💬</div>
              <h3 className="reveal">No reviews yet</h3>
              <p>Reviews from people we have assisted will appear here.</p>
            </div>
          )}

          {!reviewsLoading && showReviews && (
            <div className="reviews-grid">
              {featuredDisplay.map((review, i) => (
                <Reveal key={review.id} delay={(i % 3) * 80}>
                  <div className="card card-hover review-card">
                    <Stars rating={review.rating} />
                    <p className="quote" style={{ marginTop: 12 }}>"{review.review}"</p>
                    <div className="who">
                      <div>
                        <div className="name">— {review.name}</div>
                        {review.location ? <div className="loc">{review.location}</div> : null}
                      </div>
                      {review.featured ? <span className="badge badge-yes">Featured</span> : null}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== TRACK CASE ===== */}
      <section className="section-tight" id="track-case">
        <div className="container track-box">
          <Reveal className="card">
            <div className="center">
              <div className="eyebrow">Case Status</div>
              <h2 className="section-title" style={{ fontSize: 26 }}>Check Your Case</h2>
              <p className="muted" style={{ fontSize: 14.5 }}>
                Enter the Case ID you received after submitting a report. Only the status is shown.
              </p>
            </div>
            <form onSubmit={onTrack} className="flex" style={{ marginTop: 22, alignItems: 'stretch' }}>
              <label htmlFor="caseId" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
                Case ID
              </label>
              <input
                id="caseId"
                className="form-control mono"
                placeholder="SCR-2026-A82F31"
                value={track.caseId}
                onChange={(e) => setTrack((s) => ({ ...s, caseId: e.target.value, result: null, error: null }))}
              />
              <button type="submit" className="btn btn-primary shiny" disabled={track.loading || !track.caseId.trim()}>
                {track.loading ? <InlineSpinner /> : 'Check'}
              </button>
            </form>

            {track.error && <div className="alert alert-error mt-3">{track.error}</div>}
            {track.result && (
              <div className="track-result">
                <div className="muted" style={{ fontSize: 13 }}>Case ID</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 18 }}>{track.result.caseId}</div>
                <div className="mt-2" style={{ display: 'flex', justifyContent: 'center' }}>
                  <StatusBadge status={track.result.status} />
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section" id="faq" style={{ background: 'var(--secondary-color)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <Reveal className="center mb-4">
            <div className="eyebrow">FAQ</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </Reveal>
          <div className="faq-list">
            {FAQS.map((item, i) => (
              <Reveal key={item.q} delay={(i % 3) * 60}>
                <FaqItem q={item.q} a={item.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="final-cta" id="get-help">
        {settings.ctaImageUrl && (
          <div className="cta-bg" aria-hidden="true">
            <SmartImage src={settings.ctaImageUrl} alt="" className="cta-img" />
            <div className="cta-shade" />
          </div>
        )}
        <div className="cta-scan" aria-hidden="true" />
        <Reveal className="container" delay={60}>
          <div className="eyebrow">Get Help Now</div>
          <h2>Have you been scammed?</h2>
          <p>Submit a report with the information you have and start the investigation. Your Case ID lets you track progress — only you can see your status.</p>
          <div className="cta-actions">
            <Link to="/report" className="btn btn-primary btn-lg shiny">Report a Scam</Link>
            <a href="#track-case" className="btn btn-secondary btn-lg">Check Your Case</a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}