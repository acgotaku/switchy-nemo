import type { Profile, ProxyMode } from '@options/stores/modules/profiles';
import { MessageType, type Message } from '@/utils/proxy';
import {
  hasStoredProxyMode,
  proxyModeItem,
  selectedProfileItem
} from '@/utils/storage';

type Config = {
  mode: ProxyMode;
  rules?: {
    singleProxy?: {
      scheme: string;
      host: string;
      port: number;
    };
    bypassList?: string[];
  };
};

type ProxyAuth = {
  username: string;
  password: string;
};

// A profile only describes servers for fixed_servers; every other mode has to
// drop it so stale rules and credentials are not carried over.
function resolveProfile(mode: ProxyMode, profile: Profile | null) {
  return mode === 'fixed_servers' ? profile : null;
}

function buildConfig(mode: ProxyMode, profile: Profile | null): Config {
  const config: Config = { mode };

  if (profile) {
    config.rules = {
      singleProxy: {
        scheme: profile.scheme || 'http',
        host: profile.host,
        port: profile.port || 80
      },
      bypassList: profile.bypassList || []
    };
  }

  return config;
}

/**
 * Credentials are read back out of the stored selection rather than kept in a
 * copy of their own. The service worker is torn down while the proxy stays
 * active, so they have to come from storage either way — and a second copy can
 * only drift from the profile it was taken from.
 */
async function readProxyAuth(): Promise<ProxyAuth | null> {
  const [mode, profile] = await Promise.all([
    proxyModeItem.getValue(),
    selectedProfileItem.getValue()
  ]);

  const activeProfile = resolveProfile(mode, profile);
  const username = activeProfile?.username ?? '';

  return username
    ? { username, password: activeProfile?.password ?? '' }
    : null;
}

// Chrome re-fires onAuthRequired for the same requestId when the credentials it
// was handed are rejected, so answering every time turns a wrong password into
// an endless retry loop. Each request gets one attempt; after that we bow out
// and let the browser prompt the user.
const AUTH_ATTEMPT_TTL = 60_000;
const attemptedRequests = new Map<string, number>();

function pruneAttempts(now: number) {
  for (const [requestId, attemptedAt] of attemptedRequests) {
    if (now - attemptedAt > AUTH_ATTEMPT_TTL) {
      attemptedRequests.delete(requestId);
    }
  }
}

async function applyProxy(mode: ProxyMode, profile: Profile | null) {
  const activeProfile = resolveProfile(mode, profile);

  await browser.proxy.settings.set({ value: buildConfig(mode, activeProfile) });

  attemptedRequests.clear();
}

/**
 * Re-asserts the stored proxy on browser start and on update.
 */
async function restoreProxy() {
  // A fresh install has nothing to say about the proxy yet, and calling set()
  // anyway would hand the extension control of the browser's proxy settings
  // before the user has picked anything.
  if (!(await hasStoredProxyMode())) return;

  const [mode, profile] = await Promise.all([
    proxyModeItem.getValue(),
    selectedProfileItem.getValue()
  ]);

  // fixed_servers without a profile has no rules to apply and would be rejected.
  if (mode === 'fixed_servers' && !profile) return;

  await applyProxy(mode, profile);
}

export default defineBackground(() => {
  const restore = () => {
    restoreProxy().catch(error => {
      console.error('Error restoring proxy:', error);
    });
  };

  browser.runtime.onStartup.addListener(restore);
  browser.runtime.onInstalled.addListener(restore);

  browser.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      switch (message.type) {
        case MessageType.SetProxy: {
          const { currentMode, selectedProfile } = message;

          applyProxy(currentMode || 'direct', selectedProfile ?? null)
            .then(() => {
              sendResponse({ success: true });
            })
            .catch(error => {
              console.error('Error setting proxy:', error);
              sendResponse({ success: false, error: error.message });
            });
          // Indicates that the response will be sent asynchronously
          return true;
        }
      }
    }
  );

  browser.webRequest.onAuthRequired.addListener(
    (details, callback) => {
      // asyncBlocking always hands us a callback, and the request stays blocked
      // until it is invoked, so every branch below has to call it exactly once.
      if (!callback) return;

      // Only Proxy-Authenticate challenges get our credentials. Without this,
      // any site answering 401 could harvest the proxy username and password.
      if (!details.isProxy) {
        callback({});
        return;
      }

      const now = Date.now();
      pruneAttempts(now);
      if (attemptedRequests.has(details.requestId)) {
        callback({});
        return;
      }

      readProxyAuth()
        .then(auth => {
          // Returning an empty response leaves the challenge for the browser's
          // own login dialog instead of silently consuming it.
          if (!auth) {
            callback({});
            return;
          }
          attemptedRequests.set(details.requestId, now);
          callback({ authCredentials: auth });
        })
        .catch(error => {
          console.error('Error reading proxy credentials:', error);
          callback({});
        });
    },
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
  );
});
