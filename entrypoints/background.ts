import { Profile, ProxyMode } from '@options/stores/modules/profiles';
export const MessageType = {
  SaveProfile: 'saveProfile',
  SetProxy: 'setProxy'
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export type Message = {
  type: MessageType;
  profiles?: Profile[];
  currentMode?: ProxyMode;
  selectedProfile?: Profile | null;
};

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

export default defineBackground(() => {
  let username = '';
  let password = '';
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

          const config: Config = {
            mode: currentMode || 'direct'
          };

          if (selectedProfile) {
            config.rules = {
              singleProxy: {
                scheme: selectedProfile.scheme || 'http',
                host: selectedProfile.host,
                port: selectedProfile.port || 80
              },
              bypassList: selectedProfile.bypassList || []
            };
            username = selectedProfile.username || '';
            password = selectedProfile.password || '';
          }

          browser.proxy.settings
            .set({
              value: config
            })
            .then(() => {
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
    () => {
      return {
        authCredentials: {
          username: username,
          password: password
        }
      };
    },
    { urls: ['<all_urls>'] },
    ['blocking']
  );
});
