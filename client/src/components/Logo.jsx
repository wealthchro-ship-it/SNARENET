import { useSettings } from '../hooks/useSettings';

export default function Logo({ size = 'md', light = false }) {
  const { settings } = useSettings();
  const name = settings.organizationName || 'SnareNet';

  if (settings.logoUrl) {
    return (
      <span className="logo" style={light ? { color: '#fff' } : undefined} aria-label={name}>
        <img src={settings.logoUrl} alt={`${name} logo`} loading="lazy" />
        {size === 'lg' ? <span>{name}</span> : null}
      </span>
    );
  }

  return (
    <span className="logo" style={light ? { color: '#fff' } : undefined}>
      <span className="logo-text">
        <span className="logo-mark" aria-hidden="true">
          S
        </span>
        <span>{name}</span>
      </span>
    </span>
  );
}