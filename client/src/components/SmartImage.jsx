import { useState } from 'react';

export default function SmartImage({
  src,
  alt = '',
  className = '',
  fallback = '',
  eager = false,
  ...rest
}) {
  const [broken, setBroken] = useState(false);

  const url = broken ? fallback : src;
  if (!url) return null;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      fetchpriority={eager ? 'high' : 'auto'}
      onError={() => setBroken(true)}
      {...rest}
    />
  );
}