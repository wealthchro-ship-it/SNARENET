import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitReport } from '../../services/auth';
import { useSettings } from '../../hooks/useSettings';
import Spinner, { InlineSpinner } from '../../components/Spinner';
import { setPageTitle } from '../../utils/seo';
import './report.css';

const STEPS = ['Your Information', 'Incident', 'Scammer', 'Transaction', 'Evidence', 'Consent'];

const SCAM_TYPES = [
  'Bank Transfer',
  'Cryptocurrency',
  'Investment',
  'Fake Store',
  'Phishing',
  'Social Media',
  'Romance Scam',
  'Impersonation',
  'Account Takeover',
  'Other',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'ZAR', 'KES', 'GHS', 'INR', 'Other'];

const EMPTY = {
  victim: { fullName: '', email: '', phone: '', whatsapp: '', country: '', state: '', preferredContact: 'Email' },
  incident: { type: '', date: '', time: '', amount: '', currency: 'USD', country: '', description: '' },
  scammer: {
    name: '', alias: '', phone: '', email: '', socialMedia: '', website: '',
    bankName: '', accountName: '', accountNumber: '', walletAddress: '', otherInformation: '',
  },
  transaction: { reference: '', transactionId: '', cryptoHash: '', sendingPlatform: '', receivingPlatform: '', paymentMethod: '' },
  evidence: { description: '', links: '', urls: '' },
  consent: false,
  caseId: '',
};

function validateStep(step, form) {
  const errors = {};

  if (step === 0) {
    if (!form.victim.fullName.trim()) errors['victim.fullName'] = 'Full name is required';
    if (form.victim.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.victim.email.trim())) {
      errors['victim.email'] = 'Enter a valid email address';
    }
  }

  if (step === 1) {
    if (!form.incident.type) errors['incident.type'] = 'Select the type of scam';
    if (!form.incident.description.trim() || form.incident.description.trim().length < 20) {
      errors['incident.description'] = 'Please describe what happened (at least 20 characters)';
    }
  }

  if (step === 5 && !form.consent) {
    errors.consent = 'You must confirm the consent statement to submit';
  }

  return errors;
}

export default function Report() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setPageTitle('Report a Scam');
  }, []);

  const set = (section, key, value) => {
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
  };

  const setRaw = (patch) => setForm((f) => ({ ...f, ...patch }));

  const goNext = () => {
    const errs = validateStep(step, form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async () => {
    const errs = validateStep(5, form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      victim: {
        fullName: form.victim.fullName.trim(),
        email: form.victim.email.trim(),
        phone: form.victim.phone.trim(),
        whatsapp: form.victim.whatsapp.trim(),
        country: form.victim.country.trim(),
        state: form.victim.state.trim(),
        preferredContact: form.victim.preferredContact,
      },
      incident: {
        type: form.incident.type,
        date: form.incident.date,
        time: form.incident.time,
        amount: form.incident.amount.trim(),
        currency: form.incident.currency,
        country: form.incident.country.trim(),
        description: form.incident.description.trim(),
      },
      scammer: Object.fromEntries(
        Object.entries(form.scammer).map(([k, v]) => [k, String(v).trim()])
      ),
      transaction: Object.fromEntries(
        Object.entries(form.transaction).map(([k, v]) => [k, String(v).trim()])
      ),
      evidence: {
        description: form.evidence.description.trim(),
        links: form.evidence.links
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        urls: form.evidence.urls
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      },
      consent: true,
    };

    try {
      const { caseId } = await submitReport(payload);
      sessionStorage.setItem('snarenet_last_case', JSON.stringify({ caseId, org: settings.organizationName }));
      navigate('/report/success');
    } catch (err) {
      setSubmitError(err.message || 'Your report could not be submitted. Please try again.');
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fieldError = (path) => {
    if (!errors[path]) return null;
    return <div className="field-error" role="alert">{errors[path]}</div>;
  };

  const input = (section, key, label, opts = {}) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`${section}-${key}`}>
        {label}{opts.required ? ' *' : ''}
      </label>
      <input
        id={`${section}-${key}`}
        className="form-control"
        type={opts.type || 'text'}
        value={form[section]?.[key] || ''}
        onChange={(e) => set(section, key, e.target.value)}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
      />
      {opts.hint ? <div className="form-hint">{opts.hint}</div> : null}
      {fieldError(`${section}.${key}`)}
    </div>
  );

  const textarea = (section, key, label, opts = {}) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`${section}-${key}`}>
        {label}{opts.required ? ' *' : ''}
      </label>
      <textarea
        id={`${section}-${key}`}
        className="form-control"
        rows={opts.rows || 5}
        value={form[section]?.[key] || ''}
        onChange={(e) => set(section, key, e.target.value)}
        placeholder={opts.placeholder}
        maxLength={opts.maxLength}
      />
      {opts.hint ? <div className="form-hint">{opts.hint}</div> : null}
      {fieldError(`${section}.${key}`)}
    </div>
  );

  const select = (section, key, label, options, opts = {}) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`${section}-${key}`}>
        {label}{opts.required ? ' *' : ''}
      </label>
      <select
        id={`${section}-${key}`}
        className="form-control"
        value={form[section]?.[key] || ''}
        onChange={(e) => set(section, key, e.target.value)}
      >
        {opts.placeholderOption ? <option value="">{opts.placeholderOption}</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {fieldError(`${section}.${key}`)}
    </div>
  );

  return (
    <div className="report-page container">
      <div className="report-head">
        <div className="eyebrow">Secure Report</div>
        <h1 className="section-title">Report a Suspected Scam</h1>
        <p className="muted">
          Provide as much accurate information as you have. All fields marked optional can be left blank.
        </p>
      </div>

      {submitError && (
        <div className="alert alert-error" style={{ maxWidth: 780, margin: '0 auto 20px' }} role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      <div className="report-stepper" role="tablist" aria-label="Report progress">
        {STEPS.map((label, i) => (
          <span key={label} className={`step-part ${i === step ? 'has-active' : ''}`} style={{ display: 'contents' }}>
            {i > 0 && <span className="step-sep" aria-hidden="true" />}
            <span
              className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              aria-current={i === step ? 'step' : undefined}
            >
              <span className="num" aria-hidden="true">{i < step ? '✓' : i + 1}</span>
              {label}
            </span>
          </span>
        ))}
      </div>

      <div className="card report-card">
        {/* STEP 1 — Your Information */}
        {step === 0 && (
          <section aria-label="Your information">
            <h2 className="step-title">Your Information</h2>
            <p className="step-desc">
              How we can reach you about this case. We only collect what is needed to communicate.
            </p>

            <div className="form-row">
              <div>{input('victim', 'fullName', 'Full Name', { required: true, autoComplete: 'name' })}</div>
              <div>{input('victim', 'email', 'Email', { type: 'email', required: true, autoComplete: 'email' })}</div>
              <div>{input('victim', 'phone', 'Phone', { autoComplete: 'tel' })}</div>
              <div>{input('victim', 'whatsapp', 'WhatsApp Number')}</div>
              <div>{input('victim', 'country', 'Country')}</div>
              <div>{input('victim', 'state', 'State / Region')}</div>
            </div>

            <div className="form-section-label">Preferred Contact Method</div>
            <div className="form-row">
              <div className="checkbox" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                  {['Email', 'Phone', 'WhatsApp'].map((m) => (
                    <label key={m} className="checkbox" htmlFor={`contact-${m}`} style={{ gap: 8 }}>
                      <input
                        id={`contact-${m}`}
                        type="radio"
                        name="preferredContact"
                        checked={form.victim.preferredContact === m}
                        onChange={() => set('victim', 'preferredContact', m)}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STEP 2 — Incident */}
        {step === 1 && (
          <section aria-label="Incident information">
            <h2 className="step-title">Incident Information</h2>
            <p className="step-desc">What happened, when, and the amount involved.</p>

            <div className="form-row">
              <div>{select('incident', 'type', 'Scam Type', SCAM_TYPES, { required: true, placeholderOption: 'Select scam type' })}</div>
              <div>{input('incident', 'date', 'Date', { type: 'date' })}</div>
              <div>{input('incident', 'time', 'Approximate Time', { type: 'time' })}</div>
              <div className="form-row" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {input('incident', 'amount', 'Amount Lost', { type: 'text', placeholder: 'e.g. 2500' })}
                </div>
                <div style={{ width: 130 }}>
                  {select('incident', 'currency', 'Currency', CURRENCIES)}
                </div>
              </div>
              <div>{input('incident', 'country', 'Country of Incident')}</div>
            </div>

            <div>{textarea('incident', 'description', 'Description', { required: true, rows: 6, placeholder: 'Describe what happened in as much detail as you can...' })}</div>
          </section>
        )}

        {/* STEP 3 — Scammer */}
        {step === 2 && (
          <section aria-label="Scammer information">
            <h2 className="step-title">Scammer Information</h2>
            <p className="step-desc">Everything you know about the person or entity. All fields optional.</p>

            <div className="form-row">
              <div>{input('scammer', 'name', 'Name')}</div>
              <div>{input('scammer', 'alias', 'Alias / Username')}</div>
              <div>{input('scammer', 'phone', 'Phone')}</div>
              <div>{input('scammer', 'email', 'Email', { type: 'email' })}</div>
              <div>{input('scammer', 'socialMedia', 'Social Media Profile')}</div>
              <div>{input('scammer', 'website', 'Website')}</div>
              <div>{input('scammer', 'bankName', 'Bank Name')}</div>
              <div>{input('scammer', 'accountName', 'Account Name')}</div>
              <div>{input('scammer', 'accountNumber', 'Account Number')}</div>
              <div>{input('scammer', 'walletAddress', 'Crypto Wallet Address')}</div>
            </div>

            <div>{textarea('scammer', 'otherInformation', 'Other Identifying Information', { rows: 4, hint: 'Vehicle of communication, IP-related context you may have, etc.' })}</div>
          </section>
        )}

        {/* STEP 4 — Transaction */}
        {step === 3 && (
          <section aria-label="Transaction information">
            <h2 className="step-title">Transaction Information</h2>
            <p className="step-desc">Identifying the money trail helps the investigation. All fields optional.</p>

            <div className="form-row">
              <div>{input('transaction', 'reference', 'Transaction Reference')}</div>
              <div>{input('transaction', 'transactionId', 'Transaction ID')}</div>
              <div>{input('transaction', 'cryptoHash', 'Crypto Transaction Hash', { hint: '0x... or bc1q... transaction hash' })}</div>
              <div>{input('transaction', 'sendingPlatform', 'Sending Platform', { placeholder: 'e.g. Revolut, Coinbase, bank name' })}</div>
              <div>{input('transaction', 'receivingPlatform', 'Receiving Platform')}</div>
              <div>{input('transaction', 'paymentMethod', 'Payment Method', { placeholder: 'e.g. bank transfer, card, crypto' })}</div>
            </div>
          </section>
        )}

        {/* STEP 5 — Evidence */}
        {step === 4 && (
          <section aria-label="Evidence information">
            <h2 className="step-title">Evidence Information</h2>
            <p className="step-desc">
              Describe the evidence you have. You can paste public file links and relevant URLs.
            </p>

            <div>{textarea('evidence', 'description', 'Evidence Description', { rows: 4, hint: 'e.g. chat logs, call records, transfer receipts you can provide.' })}</div>

            <div className="form-section-label">Evidence / File Links</div>
            <p className="form-hint" style={{ marginTop: 0 }}>One URL per line. Paste links to publicly accessible images or documents.</p>
            <div className="form-group">
              <textarea
                className="form-control mono"
                style={{ minHeight: 90, fontSize: 13.5 }}
                placeholder={'https://...\nhttps://...'}
                value={form.evidence.links}
                onChange={(e) => set('evidence', 'links', e.target.value)}
              />
            </div>

            <div className="form-section-label">Relevant URLs</div>
            <p className="form-hint" style={{ marginTop: 0 }}>Websites, profiles or pages related to the fraud. One per line.</p>
            <div className="form-group">
              <textarea
                className="form-control mono"
                style={{ minHeight: 90, fontSize: 13.5 }}
                placeholder={'https://...\nhttps://...'}
                value={form.evidence.urls}
                onChange={(e) => set('evidence', 'urls', e.target.value)}
              />
            </div>

            <div className="privacy-note">
              <span aria-hidden="true">🔒</span>
              <span>Do not submit passwords, OTPs, PINs, seed phrases or private keys. Never share banking login credentials.</span>
            </div>
          </section>
        )}

        {/* STEP 6 — Consent */}
        {step === 5 && (
          <section aria-label="Review and consent">
            <h2 className="step-title">Review & Consent</h2>
            <p className="step-desc">Confirm before submitting. You cannot edit after this point.</p>

            <div className="alert alert-info mb-3">
              <span aria-hidden="true">ℹ️</span>
              <span>
                Double-check the information you provided. A Case ID is generated once you submit — keep it for your records.
              </span>
            </div>

            <label className="checkbox" htmlFor="consent">
              <input
                id="consent"
                type="checkbox"
                checked={form.consent}
                onChange={(e) => { setRaw({ consent: e.target.checked }); if (errors.consent) setErrors((er) => ({ ...er, consent: undefined })); }}
              />
              <span>
                I confirm that the information provided is accurate to the best of my knowledge and I
                consent to being contacted regarding this report.
              </span>
            </label>
            {fieldError('consent')}

            <div className="privacy-note" style={{ borderColor: 'rgba(229,57,53,.4)', background: 'rgba(229,57,53,.07)', color: '#ffb4ab' }}>
              <span aria-hidden="true">⚠️</span>
              <span>Submission does not guarantee recovery. Reports are confidential and only handled by the authorized investigation team.</span>
            </div>
          </section>
        )}

        <div className="report-nav">
          <div className="left">
            {step > 0 && (
              <button type="button" className="btn btn-secondary" onClick={goBack} disabled={submitting}>
                ← Back
              </button>
            )}
            <Link to="/" className="btn btn-ghost">Cancel</Link>
          </div>
          <div className="right">
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                Continue →
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={onSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <InlineSpinner /> Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}