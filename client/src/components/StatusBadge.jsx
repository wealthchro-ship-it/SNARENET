const LABELS = {
  NEW: 'New',
  UNDER_REVIEW: 'Under Review',
  INVESTIGATING: 'Investigating',
  SCAMMER_IDENTIFIED: 'Scammer Identified',
  RECOVERY_IN_PROGRESS: 'Recovery in Progress',
  RECOVERED: 'Recovered',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

export default function StatusBadge({ status }) {
  const key = String(status || 'NEW').replace(/\s+/g, '_').toUpperCase();
  return <span className={`badge badge-${key.toLowerCase()}`}>{LABELS[key] || status}</span>;
}

export { LABELS };