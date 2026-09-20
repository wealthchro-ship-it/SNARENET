export default function Spinner({ label = 'Loading...', size = 'lg' }) {
  return (
    <div className="loading-block" role="status">
      <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function InlineSpinner({ size = 'sm' }) {
  return <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} aria-hidden="true" />;
}