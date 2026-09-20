import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchPublicSettings } from '../services/settings';
import { applyBranding, setOrgTag } from '../utils/seo';

const CACHE_KEY = 'snarenet_settings_cache';
const CACHE_TTL = 5 * 60 * 1000;

const SettingsContext = createContext(null);

const DEFAULTS = {
  organizationName: 'SnareNet',
  tagline: 'Follow the trail. Understand what happened.',
  description:
    'Report suspected scams and fraudulent transactions and provide information that may assist an investigation.',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#E53935',
  secondaryColor: '#0D1117',
  contactEmail: '',
  contactPhone: '',
  website: '',
  heroHeading: 'Scammed? Report It. Start the Investigation.',
  heroDescription:
    'Provide the information you have about a suspected scam or fraudulent transaction. Our team can review the available details and determine the appropriate next steps.',
  disclaimer:
    'SnareNet does not guarantee recovery of lost funds. Every case depends on the available evidence, transaction trails, cooperation from relevant platforms or institutions, and applicable laws.',
  privacyNotice:
    'Never submit your password, OTP, PIN, banking login, crypto seed phrase or private key.',
  footerText: '© {year} {orgName}. All rights reserved.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
  aboutImageUrl:
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80',
  ctaImageUrl:
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80',
};

const IMAGE_KEYS = ['heroImageUrl', 'aboutImageUrl', 'ctaImageUrl'];

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readCache() || DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apply = useCallback((s) => {
    const merged = { ...DEFAULTS, ...s };
    IMAGE_KEYS.forEach((key) => {
      if (!merged[key]) merged[key] = DEFAULTS[key];
    });
    setSettings(merged);
    setOrgTag(merged.organizationName);
    applyBranding(merged);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: merged }));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicSettings();
      apply(data);
    } catch (err) {
      setError(err.message || 'Could not load settings');
      apply(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    apply(settings);
    loadSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SettingsContext.Provider value={{ settings, loading, error, reload: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}