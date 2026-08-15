import type { Profile, ProxyMode } from '@options/stores/modules/profiles';

export const MessageType = {
  SetProxy: 'setProxy'
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export type Message = {
  type: MessageType;
  currentMode?: ProxyMode;
  selectedProfile?: Profile | null;
};

export type MessageResponse = {
  success: boolean;
  error?: string;
};

/**
 * Hands the resolved mode and profile to the background worker, which owns both
 * the proxy settings and the credentials used to answer proxy auth challenges.
 */
export function setProxy(
  currentMode: ProxyMode,
  selectedProfile: Profile | null
): Promise<MessageResponse> {
  const message: Message = {
    type: MessageType.SetProxy,
    currentMode,
    selectedProfile
  };
  return browser.runtime.sendMessage(message);
}
