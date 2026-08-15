import { storage } from '#imports';
import type { Profile, ProxyMode } from '@options/stores/modules/profiles';

// `local:` maps onto browser.storage.local, which is the one storage area both
// the extension pages and the background worker can reach. Keeping every piece
// of shared state here is what lets the worker rebuild the proxy on its own.
export const PROFILES_KEY = 'local:profiles';
export const SELECTED_PROFILE_KEY = 'local:selectedProfile';
export const PROXY_MODE_KEY = 'local:proxyMode';

export const profilesItem = storage.defineItem<Profile[]>(PROFILES_KEY, {
  fallback: []
});

export const selectedProfileItem = storage.defineItem<Profile | null>(
  SELECTED_PROFILE_KEY,
  { fallback: null }
);

export const proxyModeItem = storage.defineItem<ProxyMode>(PROXY_MODE_KEY, {
  fallback: 'direct'
});

/**
 * Whether a proxy mode has ever been written. `proxyModeItem.getValue()` cannot
 * answer this because it substitutes the fallback for a missing key, and a
 * fresh install must be told apart from one deliberately set to `direct`.
 */
export async function hasStoredProxyMode(): Promise<boolean> {
  return (await storage.getItem<ProxyMode>(PROXY_MODE_KEY)) !== null;
}
