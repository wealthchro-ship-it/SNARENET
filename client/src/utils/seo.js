export function applyBranding(settings) {
  if (!settings) return;

  const root = document.documentElement;

  if (settings.primaryColor && /^#[0-9a-fA-F]{3,8}$/.test(settings.primaryColor)) {
    root.style.setProperty('--primary-color', settings.primaryColor);
  }
  if (settings.secondaryColor && /^#[0-9a-fA-F]{3,8}$/.test(settings.secondaryColor)) {
    root.style.setProperty('--secondary-color', settings.secondaryColor);
  }

  const orgName = settings.organizationName || 'SnareNet';
  const tagline =
    settings.tagline || 'Follow the trail. Understand what happened.';

  document.title = `${orgName} | Report a Scam`;

  setMeta('description', settings.description || 'Report scams and fraud.');
  setMeta('og:title', `${orgName} | Report a Scam`);
  setMeta('og:description', settings.description || 'Report scams and fraud.');
  setMeta('og:site_name', orgName);

  setBrandFavicon(settings.faviconUrl);
}

export function setBrandFavicon(faviconUrl) {
  const link =
    document.querySelector("link[rel='icon']") || document.createElement('link');
  link.rel = 'icon';
  link.href = faviconUrl || '/favicon.svg';
  document.head.appendChild(link);
}

export function setPageTitle(title) {
  const orgName = getOrgName() || 'SnareNet';
  document.title = title ? `${title} | ${orgName}` : `${orgName} | Report a Scam`;
}

export function setBrandFaviconFromUrl(url) {
  setBrandFavicon(url);
}

export function getOrgName() {
  return (
    document.querySelector('meta[name="snarenet-org"]')?.content || 'SnareNet'
  );
}

export function setOrgTag(orgName) {
  let meta = document.querySelector('meta[name="snarenet-org"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'snarenet-org');
    document.head.appendChild(meta);
  }
  meta.content = orgName || 'SnareNet';
}

function setMeta(attr, content) {
  let meta = document.querySelector(`meta[${attr === 'description' ? 'name' : 'property'}="${attr}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    if (attr === 'description') meta.setAttribute('name', attr);
    else meta.setAttribute('property', attr);
    document.head.appendChild(meta);
  }
  meta.content = content || '';
}