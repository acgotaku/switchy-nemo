import type { Profile, ProxyMode } from '@options/stores/modules/profiles';
import { MessageType, type Message } from '@/utils/proxy';

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

export const PROXY_AUTH_KEY = 'proxyAuth';

// The service worker is torn down while the proxy stays active, so credentials
// cannot live in a closure variable — they have to be re-readable on wake-up.
async function readProxyAuth(): Promise<ProxyAuth | null> {
  const stored = await browser.storage.local.get(PROXY_AUTH_KEY);
  const auth = stored[PROXY_AUTH_KEY] as ProxyAuth | undefined;
  return auth?.username ? auth : null;
}

function writeProxyAuth(profile: Profile | null) {
  const username = profile?.username ?? '';
  const password = profile?.password ?? '';
  return username
    ? browser.storage.local.set({ [PROXY_AUTH_KEY]: { username, password } })
    : browser.storage.local.remove(PROXY_AUTH_KEY);
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

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      switch (message.type) {
        case MessageType.SaveProfile: {
          const { profiles, currentMode, selectedProfile } = message;
          browser.storage.local
            .set({
              profiles: profiles || [],
              currentMode: currentMode || 'direct',
              selectedProfile: selectedProfile || null
            })
            .then(() => {
              sendResponse({ success: true });
            });
          // Indicates that the response will be sent asynchronously
          return true;
        }
        case MessageType.SetProxy: {
          const { currentMode, selectedProfile } = message;
          const mode = currentMode || 'direct';
          // A profile only applies in fixed_servers mode; anything else has to
          // drop the stored credentials so they are not offered afterwards.
          const activeProfile =
            mode === 'fixed_servers' ? (selectedProfile ?? null) : null;

          const config: Config = { mode };

          if (activeProfile) {
            config.rules = {
              singleProxy: {
                scheme: activeProfile.scheme || 'http',
                host: activeProfile.host,
                port: activeProfile.port || 80
              },
              bypassList: activeProfile.bypassList || []
            };
          }

          Promise.all([
            browser.proxy.settings.set({ value: config }),
            writeProxyAuth(activeProfile)
          ])
            .then(() => {
              attemptedRequests.clear();
              sendResponse({ success: true });
            })
            .catch(error => {
              console.error('Error setting proxy:', error);
              sendResponse({ success: false, error: error.message });
            });
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
