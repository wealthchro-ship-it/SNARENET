import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { changeCredentials } from '../../services/auth';
import { uploadImage, MAX_UPLOAD_SIZE } from '../../services/upload';
import { setPageTitle } from '../../utils/seo';
import Logo from '../../components/Logo';
import Spinner, { InlineSpinner } from '../../components/Spinner';
import SmartImage from '../../components/SmartImage';
import './admin.css';

const DEFAULT_IMAGES = {
  heroImageUrl:
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
  aboutImageUrl:
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80',
  ctaImageUrl:
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80',
};

const EMPTY = {
  organizationName: '',
  tagline: '',
  description: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#E53935',
  secondaryColor: '#0D1117',
  contactEmail: '',
  contactPhone: '',
  website: '',
  heroHeading: '',
  heroDescription: '',
  disclaimer: '',
  privacyNotice: '',
  footerText: '',
  heroImageUrl: '',
  aboutImageUrl: '',
  ctaImageUrl: '',
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  smtpFromEmail: '',
  smtpFromName: '',
};

function Field({ label, value, onChange, hint, type = 'text', mono = false }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={`set-${label.replace(/\s+/g, '-').toLowerCase()}`}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={`set-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className="form-control"
          rows={value && value.length > 140 ? 5 : 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : type === 'color' ? (
        <div className="flex">
          <input
            id={`set-${label.replace(/\s+/g, '-').toLowerCase()}`}
            type="color"
            className="color-input"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#0D1117'}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            className="form-control mono"
            style={{ maxWidth: 140 }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <input
          id={`set-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className={`form-control${mono ? ' mono' : ''}`}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? <div className="form-hint">{hint}</div> : null}
    </div>
  );
}

function UploadButton({ fieldName, onUploaded, label = 'Upload from device' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (PNG, JPG, GIF, WEBP, SVG, ICO).');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setError('Image must be under 5 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await uploadImage(file, fieldName);
      onUploaded(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="upload-btn-wrap">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={busy}
      >
        {busy ? (
          <><InlineSpinner /> Uploading...</>
        ) : (
          <>🖫 {label}</>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
        style={{ display: 'none' }}
        onChange={pick}
      />
      {error ? <span className="upload-err">{error}</span> : null}
    </span>
  );
}

export default function AdminSettings() {
  const { settings: publicSettings, reload } = useSettings();
  const { admin, refresh } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sec, setSec] = useState({ currentPassword: '', email: '', newPassword: '', confirmPassword: '' });
  const [secSaving, setSecSaving] = useState(false);
  const [secMsg, setSecMsg] = useState(null);
  const [smtp, setSmtp] = useState({ testing: false, to: '', msg: null });

  useEffect(() => {
    setPageTitle('Settings');
    api
      .get('/api/admin/settings')
      .then((data) => setForm(({ ...EMPTY, ...data })))
      .catch((err) => setError(err.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSec((s) => (s.email ? s : { ...s, email: admin?.email || '' }));
  }, [admin?.email]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await api.patch('/api/admin/settings', form);
      setSuccess(true);
      reload();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveSecurity = async () => {
    if (secSaving) return;
    setSecMsg(null);
    if (!sec.currentPassword) {
      setSecMsg({ type: 'error', text: 'Enter your current password to make changes.' });
      return;
    }
    if (sec.newPassword && sec.newPassword !== sec.confirmPassword) {
      setSecMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSecSaving(true);
    try {
      const payload = { currentPassword: sec.currentPassword };
      const newEmail = sec.email.trim().toLowerCase();
      if (newEmail && newEmail !== (admin?.email || '').toLowerCase()) payload.email = newEmail;
      if (sec.newPassword) {
        payload.newPassword = sec.newPassword;
        payload.confirmPassword = sec.confirmPassword;
      }
      await changeCredentials(payload);
      await refresh();
      setSec((s) => ({ currentPassword: '', email: newEmail || s.email, newPassword: '', confirmPassword: '' }));
      setSecMsg({ type: 'success', text: 'Login details updated successfully.' });
    } catch (err) {
      setSecMsg({ type: 'error', text: err.message || 'Could not update login details.' });
    } finally {
      setSecSaving(false);
    }
  };

  const testSmtp = async () => {
    if (smtp.testing) return;
    setSmtp((s) => ({ ...s, testing: true, msg: null }));
    const to = smtp.to.trim() || form.smtpFromEmail.trim() || admin?.email || '';
    if (!to) {
      setSmtp((s) => ({ ...s, testing: false, msg: { type: 'error', text: 'Enter a recipient email or a From email first.' } }));
      return;
    }
    try {
      await api.post('/api/admin/settings/test-email', { ...form, to });
      setSmtp((s) => ({ ...s, msg: { type: 'success', text: `Test email sent to ${to}. Check the inbox (and spam folder).` } }));
    } catch (err) {
      setSmtp((s) => ({ ...s, msg: { type: 'error', text: err.message || 'Could not send the test email.' } }));
    } finally {
      setSmtp((s) => ({ ...s, testing: false }));
    }
  };

  if (loading) return <Spinner label="Loading settings..." />;

  return (
    <div className="reveal">
      <div className="page-head flex-between">
        <div>
          <h1>Settings</h1>
          <div className="sub">
            Branding and public content update the live site immediately — no rebuild required.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? <><InlineSpinner /> Saving...</> : 'Save Changes'}
        </button>
      </div>

      {error && <div className="alert alert-error mb-3">{error}</div>}
      {success && (
        <div className="alert alert-success mb-3" role="status">
          <span>✓ Settings saved. The public site has been updated.</span>
        </div>
      )}

      {/* Live preview */}
      <div className="card mb-4">
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>Live Preview</h3>
        <div className="brand-preview">
          <div className="preview-row">
            <span className="plabel">Current Logo</span>
            <span>
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  style={{ height: 40 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              {form.logoUrl ? (
                <>
                  {' '}
                  <span className="muted" style={{ fontSize: 13 }}>(if the image fails to load, the text logo below is used)</span>
                </>
              ) : (
                <span className="muted" style={{ fontSize: 13 }}>No logo set — text logo used.</span>
              )}
            </span>
          </div>

          <div className="preview-row">
            <span className="plabel">Preview</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <PreviewLogo name={form.organizationName} url={form.logoUrl} />
              <span className="muted" style={{ fontSize: 13 }}>Preview of the navbar logo and name.</span>
            </span>
          </div>

          <div className="preview-row">
            <span className="plabel">Organization Name</span>
            <span style={{ fontWeight: 700 }}>{form.organizationName || 'SnareNet'}</span>
          </div>

          <div className="preview-row">
            <span className="plabel">Favicon</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src={form.faviconUrl || '/favicon.svg'}
                alt="Favicon preview"
                style={{ width: 24, height: 24 }}
                onError={(e) => { e.currentTarget.src = '/favicon.svg'; }}
              />
              <span className="muted" style={{ fontSize: 13 }}>
                {form.faviconUrl ? 'Custom favicon configured.' : 'Default favicon in use.'}
              </span>
            </span>
          </div>

          <div className="preview-row">
            <span className="plabel">Colors</span>
            <span>
              <span className="color-dot" style={{ background: form.primaryColor }} />
              Primary: <b className="mono">{form.primaryColor}</b>
              <span className="color-dot" style={{ background: form.secondaryColor, marginLeft: 18 }} />
              Secondary: <b className="mono">{form.secondaryColor}</b>
            </span>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Organization */}
        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Organization</h3>
          <Field label="Organization Name" value={form.organizationName} onChange={(v) => set('organizationName', v)} />
          <Field label="Tagline" value={form.tagline} onChange={(v) => set('tagline', v)} />
          <Field label="Description" type="textarea" value={form.description} onChange={(v) => set('description', v)} />
          <Field
            label="Contact Email"
            type="email"
            value={form.contactEmail}
            onChange={(v) => set('contactEmail', v)}
          />
          <Field label="Contact Phone" value={form.contactPhone} onChange={(v) => set('contactPhone', v)} />
          <Field label="Website" value={form.website} onChange={(v) => set('website', v)} />
        </div>

        {/* Branding */}
        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Branding</h3>
          <Field
            label="Logo URL"
            value={form.logoUrl}
            onChange={(v) => set('logoUrl', v)}
            hint="Public image URL, or use your own file from a phone or computer below."
          />
          <UploadButton fieldName="logo" onUploaded={(url) => set('logoUrl', url)} label="Upload logo" />
          <Field label="Favicon URL" value={form.faviconUrl} onChange={(v) => set('faviconUrl', v)} />
          <UploadButton fieldName="favicon" onUploaded={(url) => set('faviconUrl', url)} label="Upload favicon" />
          <div className="form-row">
            <div>
              <Field label="Primary Color" type="color" value={form.primaryColor} onChange={(v) => set('primaryColor', v)} />
            </div>
            <div>
              <Field label="Secondary Color" type="color" value={form.secondaryColor} onChange={(v) => set('secondaryColor', v)} />
            </div>
          </div>
          <div className="alert alert-info" style={{ fontSize: 13.5 }}>
            Use any public image URL, or upload a file from your phone or computer — uploaded images
            are stored securely and served by the platform.
          </div>
        </div>

        {/* Images */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 17, marginBottom: 6 }}>Images</h3>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
            Public image links, or upload a picture straight from your phone or computer. Leave a
            field empty to use the built-in default image. Applied instantly — no rebuild required.
          </p>
          <div className="img-field">
            <div className="img-field-main">
              <Field
                label="Hero Image URL"
                value={form.heroImageUrl}
                onChange={(v) => set('heroImageUrl', v)}
                hint="Background visual behind the headline on the home page."
                mono
              />
              <div className="img-actions">
                <UploadButton fieldName="heroImage" onUploaded={(url) => set('heroImageUrl', url)} label="Upload hero image" />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => set('heroImageUrl', DEFAULT_IMAGES.heroImageUrl)}
                >
                  Reset to default
                </button>
              </div>
            </div>
            <div className="img-preview">
              <ImageFieldPreview value={form.heroImageUrl} fallback={DEFAULT_IMAGES.heroImageUrl} label="Hero" />
            </div>
          </div>

          <div className="img-field">
            <div className="img-field-main">
              <Field
                label="About Image URL"
                value={form.aboutImageUrl}
                onChange={(v) => set('aboutImageUrl', v)}
                hint="Image above the transaction trail in the Evidence & Trails section."
                mono
              />
              <div className="img-actions">
                <UploadButton fieldName="aboutImage" onUploaded={(url) => set('aboutImageUrl', url)} label="Upload about image" />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => set('aboutImageUrl', DEFAULT_IMAGES.aboutImageUrl)}
                >
                  Reset to default
                </button>
              </div>
            </div>
            <div className="img-preview">
              <ImageFieldPreview value={form.aboutImageUrl} fallback={DEFAULT_IMAGES.aboutImageUrl} label="About" />
            </div>
          </div>

          <div className="img-field">
            <div className="img-field-main">
              <Field
                label="CTA Background Image URL"
                value={form.ctaImageUrl}
                onChange={(v) => set('ctaImageUrl', v)}
                hint="Background behind the final “Have you been scammed?” call-to-action."
                mono
              />
              <div className="img-actions">
                <UploadButton fieldName="ctaImage" onUploaded={(url) => set('ctaImageUrl', url)} label="Upload CTA image" />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => set('ctaImageUrl', DEFAULT_IMAGES.ctaImageUrl)}
                >
                  Reset to default
                </button>
              </div>
            </div>
            <div className="img-preview">
              <ImageFieldPreview value={form.ctaImageUrl} fallback={DEFAULT_IMAGES.ctaImageUrl} label="CTA" />
            </div>
          </div>
        </div>

        {/* Email (SMTP) notifications */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 17, marginBottom: 6 }}>Email Notifications (SMTP)</h3>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
            Connect your email provider so reporters automatically receive emails: the tracking
            code (Case ID) after they submit, and every later update on their case. Leave SMTP
            empty to run without email — reports still work, just no emails are sent.
          </p>

          {smtp.msg && (
            <div className={`alert ${smtp.msg.type === 'success' ? 'alert-success' : 'alert-error'} mb-3`} role={smtp.msg.type === 'success' ? 'status' : 'alert'}>
              {smtp.msg.text}
            </div>
          )}

          <div className="form-row">
            <div>
              <Field
                label="SMTP Host"
                value={form.smtpHost}
                onChange={(v) => set('smtpHost', v)}
                hint="e.g. smtp.gmail.com, smtp.zoho.com, mail.example.com"
              />
            </div>
            <div>
              <Field
                label="Port"
                type="number"
                value={String(form.smtpPort)}
                onChange={(v) => set('smtpPort', Number(v.replace(/\D/g, '')) || 587)}
                hint="Commonly 587 (STARTTLS) or 465 (SSL)."
              />
            </div>
          </div>
          <div className="form-row">
            <div>
              <Field
                label="User"
                value={form.smtpUser}
                onChange={(v) => set('smtpUser', v)}
                hint="SMTP username (often the full email address). Optional for some relays."
              />
            </div>
            <div>
              <Field
                label="Password"
                type="password"
                value={form.smtpPass}
                onChange={(v) => set('smtpPass', v)}
                hint="App-specific or SMTP password. Leave as-is to keep the current one."
              />
            </div>
          </div>
          <div className="form-row">
            <div>
              <Field
                label="From Email"
                type="email"
                value={form.smtpFromEmail}
                onChange={(v) => set('smtpFromEmail', v)}
                hint="The address emails are sent from. Must usually match your SMTP account."
              />
            </div>
            <div>
              <Field
                label="From Name"
                value={form.smtpFromName}
                onChange={(v) => set('smtpFromName', v)}
                hint="Display name shown to recipients (defaults to the organization name)."
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="checkbox" htmlFor="set-smtp-secure">
              <input
                id="set-smtp-secure"
                type="checkbox"
                checked={form.smtpSecure}
                onChange={(e) => set('smtpSecure', e.target.checked)}
              />
              <span>Use a secure (SSL/TLS) connection — enable this for port 465.</span>
            </label>
          </div>

          <div className="smtp-test">
            <div className="flex">
              <input
                id="smtp-test-to"
                className="form-control"
                type="email"
                style={{ maxWidth: 320 }}
                placeholder="Test recipient (defaults to From email)"
                value={smtp.to}
                onChange={(e) => setSmtp((s) => ({ ...s, to: e.target.value }))}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={testSmtp}
                disabled={smtp.testing}
              >
                {smtp.testing ? <><InlineSpinner /> Sending...</> : 'Send Test Email'}
              </button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 10, maxWidth: 720 }}>
              The test uses the values shown above (saved or not). For Gmail, create an
              “App password” and use it here; for Zoho, allow SMTP access in the security
              settings.
            </p>
          </div>
        </div>

        {/* Login details / security */}
        <div className="card security-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 17, marginBottom: 6 }}>Login Details</h3>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
            Update the email address or password you use to sign in. Your current password is
            required for any change.
          </p>

          {secMsg && (
            <div className={`alert ${secMsg.type === 'success' ? 'alert-success' : 'alert-error'} mb-3`} role={secMsg.type === 'success' ? 'status' : 'alert'}>
              {secMsg.text}
            </div>
          )}

          <div className="form-row">
            <div>
              <Field label="Current Password" type="password" value={sec.currentPassword} onChange={(v) => setSec((s) => ({ ...s, currentPassword: v }))} hint="Your existing password, required to confirm changes." />
            </div>
            <div>
              <Field label="New Email" type="email" value={sec.email} onChange={(v) => setSec((s) => ({ ...s, email: v }))} hint="Leave unchanged to keep your current email." />
            </div>
          </div>
          <div className="form-row">
            <div>
              <Field label="New Password" type="password" value={sec.newPassword} onChange={(v) => setSec((s) => ({ ...s, newPassword: v }))} hint="At least 8 characters. Leave empty to keep the current password." />
            </div>
            <div>
              <Field label="Confirm New Password" type="password" value={sec.confirmPassword} onChange={(v) => setSec((s) => ({ ...s, confirmPassword: v }))} hint="Re-type the new password." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={saveSecurity} disabled={secSaving}>
              {secSaving ? <><InlineSpinner /> Saving...</> : 'Update Login Details'}
            </button>
          </div>
        </div>

        {/* Public content */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Public Content</h3>
          <div className="form-row">
            <div>
              <Field label="Hero Heading" value={form.heroHeading} onChange={(v) => set('heroHeading', v)} />
            </div>
            <div>
              <Field label="Hero Description" type="textarea" value={form.heroDescription} onChange={(v) => set('heroDescription', v)} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <Field label="Disclaimer" type="textarea" value={form.disclaimer} onChange={(v) => set('disclaimer', v)} />
            </div>
            <div>
              <Field label="Privacy Notice" type="textarea" value={form.privacyNotice} onChange={(v) => set('privacyNotice', v)} />
            </div>
          </div>
          <Field label="Footer Text" value={form.footerText} onChange={(v) => set('footerText', v)} hint="You can use {year} and {orgName} placeholders." />
        </div>
      </div>

      <div className="mt-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <><InlineSpinner /> Saving...</> : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

function ImageFieldPreview({ value, fallback, label }) {
  return (
    <div className="img-preview-box">
      <span className="muted" style={{ fontSize: 12 }}>{label} preview</span>
      <div className="img-preview-frame">
        <SmartImage src={value || fallback} alt={`${label} preview`} className="img-preview-img" />
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        {value ? 'Custom image — leave empty to use default.' : 'Default image in use.'}
      </span>
    </div>
  );
}

function PreviewLogo({ name, url }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{ height: 40 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18 }}>
      <span className="logo-mark">S</span>
      {name || 'SnareNet'}
    </span>
  );
}