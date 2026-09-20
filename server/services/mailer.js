const nodemailer = require('nodemailer');
const { getSettings } = require('./settingsService');

const MASK = '********';

const STATUS_LABELS = {
  NEW: 'Received — pending initial review',
  UNDER_REVIEW: 'Under review by the team',
  INVESTIGATING: 'Investigation in progress',
  SCAMMER_IDENTIFIED: 'Suspect identified',
  RECOVERY_IN_PROGRESS: 'Recovery efforts are in progress',
  RECOVERED: 'Reported as recovered',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

const CONTACT_METHODS = {
  UNDER_REVIEW: 'Your case is now under review by our team.',
  INVESTIGATING: 'Your case is being investigated. Our team is working through the available transaction trail.',
  SCAMMER_IDENTIFIED: 'A suspect has been identified in connection with your report.',
  RECOVERY_IN_PROGRESS: 'Recovery efforts are now in progress. This can take time and is not guaranteed.',
  RECOVERED: 'Your case has been marked as recovered. Please confirm any recovered amount details with our team.',
  CLOSED: 'Your case has been closed.',
  ARCHIVED: 'Your case has been archived. You may contact us if you have new information to add.',
};

function mailConfig(settings) {
  const s = settings || {};
  return {
    host: (s.smtpHost || '').trim(),
    port: Number(s.smtpPort) || 587,
    secure: !!s.smtpSecure,
    user: (s.smtpUser || '').trim(),
    pass: (s.smtpPass || ''),
    fromName: (s.smtpFromName || '').trim() || (s.organizationName || '').trim() || 'SnareNet',
    fromEmail: (s.smtpFromEmail || '').trim(),
  };
}

function isConfigured(cfg) {
  return Boolean(cfg.host && cfg.fromEmail);
}

function createTransporter(cfg) {
  const auth = {};
  if (cfg.user) auth.user = cfg.user;
  if (cfg.pass) auth.pass = cfg.pass;
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    ...(auth.user || auth.pass ? { auth } : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: true },
  });
}

async function loadConfig(source) {
  const settings = source || (await getSettings());
  return { cfg: mailConfig(settings), settings };
}

async function sendEmail({ cfg, to, subject, text, html }) {
  if (!isConfigured(cfg)) {
    return { sent: false, reason: 'SMTP email is not configured. Add SMTP settings in the admin panel.' };
  }
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { sent: false, reason: 'Recipient email address is invalid.' };
  }
  const from = cfg.fromName
    ? `"${String(cfg.fromName).replace(/["\\]/g, '')}" <${cfg.fromEmail}>`
    : cfg.fromEmail;
  const transporter = createTransporter(cfg);
  const info = await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
}

function signOff(settings) {
  const org = settings.organizationName || 'SnareNet';
  const contact = settings.contactEmail || settings.smtpFromEmail || '';
  const lines = [`— The ${org} Team`];
  if (contact) lines.push(`Contact: ${contact}`);
  return lines.join('\n');
}

function buildMessage(settings, content) {
  const org = settings.organizationName || 'SnareNet';
  return {
    text: `${content.text}\n\n---\n${signOff(settings)}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1d23;line-height:1.55;max-width:620px;margin:0 auto;">
        <div style="border-bottom:3px solid #E53935;padding:16px 0;margin-bottom:20px;">
          <span style="font-size:20px;font-weight:800;color:#0D1117;">${escapeHtml(org)}</span>
        </div>
        ${content.html}
        <hr style="border:none;border-top:1px solid #e4e7eb;margin:24px 0 12px;" />
        <p style="font-size:13px;color:#6b7280;margin:0;">${escapeHtml(signOff(settings).replace(/\n/g, '<br />'))}</p>
      </div>`,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function caseBadge(caseId) {
  return `<div style="display:inline-block;background:#fdecea;color:#b3271f;border:1px solid #f2b8b3;border-radius:8px;padding:10px 18px;font-family:monospace;font-size:18px;font-weight:700;margin:8px 0;">${escapeHtml(caseId)}</div>`;
}

const para = (p) => `<p style="margin:8px 0;">${p}</p>`;

async function notifyReportSubmitted(report) {
  const email = (report.victim && report.victim.email) || '';
  if (!email) return { sent: false, reason: 'No reporter email provided' };
  const { cfg, settings } = await loadConfig();
  const content = {
    text: [
      `Dear ${report.victim.fullName || 'Reporter'},`,
      '',
      'Your scam report has been received.',
      '',
      `Case ID (tracking code): ${report.caseId}`,
      '',
      `Scam type: ${report.incident.type}`,
      report.incident.amount ? `Amount involved: ${report.incident.currency || ''} ${report.incident.amount}`.trim() : '',
      '',
      'Keep this Case ID — it is the fastest way to refer to your report.',
      '',
      'What happens next: our team will review the information you provided, ' +
        'investigate the available trail, and contact you using your preferred contact method ' +
        'if more information is needed.',
      '',
      'Please note: submission does not guarantee recovery of funds.',
    ].filter((l) => l !== undefined && l !== '').join('\n'),
    html:
      para(`Dear <b>${escapeHtml(report.victim.fullName || 'Reporter')}</b>,`) +
      para('Your scam report has been received.') +
      para(`Your <b>Case ID / tracking code</b> is:`) +
      caseBadge(report.caseId) +
      para(`Scam type: <b>${escapeHtml(report.incident.type)}</b>${report.incident.amount ? ` &nbsp;•&nbsp; Amount: <b>${escapeHtml(report.incident.currency || '')} ${escapeHtml(report.incident.amount)}</b>` : ''}`) +
      para('Keep this Case ID — it is the fastest way to refer to your report.') +
      para('Our team will review the information you provided, investigate the available trail, and contact you using your preferred contact method if more information is needed.') +
      para('<b>Please note:</b> submission does not guarantee recovery of funds.'),
  };
  const msg = buildMessage(settings, content);
  return sendEmail({
    cfg,
    to: email,
    subject: `Your Scam Report Has Been Received — Case ${report.caseId}`,
    ...msg,
  });
}

async function notifyStatusChanged(report, oldStatus) {
  const email = (report.victim && report.victim.email) || '';
  if (!email) return { sent: false, reason: 'No reporter email provided' };
  const { cfg, settings } = await loadConfig();
  const newLabel = STATUS_LABELS[report.status] || report.status;
  const oldLabel = STATUS_LABELS[oldStatus] || oldStatus;
  const detail = CONTACT_METHODS[report.status] || 'Give our team a little time to review your case.';
  const content = {
    text: [
      `Dear ${report.victim.fullName || 'Reporter'},`,
      '',
      `There is an update on your case ${report.caseId}.`,
      '',
      `Status changed from ${oldLabel} to ${newLabel}.`,
      '',
      detail,
      '',
      `If you have new information to add, reply to this email and reference your Case ID ${report.caseId}.`,
    ].join('\n'),
    html:
      para(`Dear <b>${escapeHtml(report.victim.fullName || 'Reporter')}</b>,`) +
      para(`There is an update on your case ${caseBadge(report.caseId)}`) +
      para(`<b>Status:</b> ${escapeHtml(newLabel)}`) +
      para(escapeHtml(detail)) +
      para(`If you have new information to add, reply to this email and reference your Case ID <b>${escapeHtml(report.caseId)}</b>.`),
  };
  const msg = buildMessage(settings, content);
  return sendEmail({
    cfg,
    to: email,
    subject: `Update on Your Scam Report (${report.caseId})`,
    ...msg,
  });
}

async function notifyNoteAdded(report, note) {
  const email = (report.victim && report.victim.email) || '';
  if (!email) return { sent: false, reason: 'No reporter email provided' };
  const { cfg, settings } = await loadConfig();
  const author = (note && note.author) || 'our team';
  if (!(note && note.text)) return { sent: false, reason: 'No note content' };
  const content = {
    text: [
      `Dear ${report.victim.fullName || 'Reporter'},`,
      '',
      `${author} added an update to your case ${report.caseId}:`,
      '',
      note.text,
      '',
      `If you have new information, reply to this email and reference Case ID ${report.caseId}.`,
    ].join('\n'),
    html:
      para(`Dear <b>${escapeHtml(report.victim.fullName || 'Reporter')}</b>,`) +
      para(`<b>${escapeHtml(author)}</b> added an update to your case ${caseBadge(report.caseId)}`) +
      `<div style="border-left:3px solid #E53935;background:#f8fafc;padding:12px 16px;border-radius:6px;margin:10px 0;white-space:pre-wrap;">${escapeHtml(note.text)}</div>` +
      para(`If you have new information, reply to this email and reference Case ID <b>${escapeHtml(report.caseId)}</b>.`),
  };
  const msg = buildMessage(settings, content);
  return sendEmail({
    cfg,
    to: email,
    subject: `New Update on Your Scam Report (${report.caseId})`,
    ...msg,
  });
}

async function sendTestEmail(source, to) {
  const { cfg, settings } = await loadConfig(source);
  const recipient = (to || '').trim() || cfg.fromEmail || '';
  if (!cfg.host || !cfg.fromEmail) {
    return { sent: false, reason: 'Configure a host and a “From” email address first.' };
  }
  const org = settings.organizationName || 'SnareNet';
  const content = {
    text: [
      'This is a test email from your SnareNet installation.',
      '',
      'If you can read this, your SMTP settings are working correctly and case ' +
        'notifications (tracking codes, status updates) will be delivered to reporters.',
    ].join('\n'),
    html:
      para('<b>This is a test email</b> from your SnareNet installation.') +
      para('If you can read this, your SMTP settings are working correctly and case notifications (tracking codes, status updates) will be delivered to reporters.'),
  };
  const msg = buildMessage({ ...settings, organizationName: org }, content);
  const result = await sendEmail({
    cfg,
    to: recipient,
    subject: `Test Email from ${org} — SMTP configured`,
    ...msg,
  });
  if (result.sent) result.recipient = recipient;
  return result;
}

async function safeNotify(fn) {
  try {
    return await fn();
  } catch (err) {
    // Email failures must never break report/case operations.
    // eslint-disable-next-line no-console
    console.error('Email notification error:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  MASK,
  mailConfig,
  isConfigured,
  sendEmail,
  sendTestEmail,
  notifyReportSubmitted,
  notifyStatusChanged,
  notifyNoteAdded,
  safeNotify,
};