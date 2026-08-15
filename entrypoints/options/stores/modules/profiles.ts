import { action, computed, observable, runInAction, toJS } from 'mobx';
import { looseEqual, namespace } from '@/utils/misc';
import { setProxy } from '@/utils/proxy';
import {
  profilesItem,
  proxyModeItem,
  selectedProfileItem
} from '@/utils/storage';

// Pre-0.1.0 kept everything in localStorage, which the background worker cannot
// read. These keys only exist to move those installs over to browser.storage.
export const PROFILES = `${namespace}.profiles`;
export const SELECTED_PROFILE = `${namespace}.selectedProfile`;
export const PROXY_MODE = `${namespace}.proxyMode`;

export type Scheme = 'http' | 'https' | 'socks4' | 'socks5';
export type ProxyRules =
  | 'singleProxy'
  | 'proxyForHttps'
  | 'proxyForHttp'
  | 'proxyForFtp';

export const ProxyMode = {
  Direct: 'direct',
  SystemProxy: 'system',
  FixedServers: 'fixed_servers'
} as const;

export type ProxyMode = (typeof ProxyMode)[keyof typeof ProxyMode];

export type Profile = {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  proxyRules: ProxyRules;
  scheme?: Scheme;
  host: string;
  port?: number;
  username?: string;
  password?: string;
  bypassList?: string[];
};

/**
 * Copies pre-0.1.0 settings out of localStorage. Self-clearing: the legacy keys
 * are dropped once they land in browser.storage, so this is a no-op afterwards.
 * On failure the legacy copy is left alone so the next load can retry.
 */
async function migrateLegacyStorage() {
  const legacyProfiles = localStorage.getItem(PROFILES);
  const legacySelected = localStorage.getItem(SELECTED_PROFILE);
  const legacyMode = localStorage.getItem(PROXY_MODE);
  if (!legacyProfiles && !legacySelected && !legacyMode) return;

  try {
    await Promise.all([
      legacyProfiles && profilesItem.setValue(JSON.parse(legacyProfiles)),
      legacySelected &&
        selectedProfileItem.setValue(JSON.parse(legacySelected)),
      legacyMode && proxyModeItem.setValue(legacyMode as ProxyMode)
    ]);
  } catch (error) {
    console.error('Error migrating settings from localStorage:', error);
    return;
  }

  localStorage.removeItem(PROFILES);
  localStorage.removeItem(SELECTED_PROFILE);
  localStorage.removeItem(PROXY_MODE);
}

export class ProfilesStore {
  @observable accessor profiles: Profile[] = [];
  @observable accessor selectedProfile: Profile | null = null;
  @observable accessor currentMode: ProxyMode = ProxyMode.Direct;

  /**
   * browser.storage is async, so the store starts empty and has to be filled in
   * before the first render. Entry points await this.
   */
  async hydrate() {
    await migrateLegacyStorage();

    const [profiles, selectedProfile, currentMode] = await Promise.all([
      profilesItem.getValue(),
      selectedProfileItem.getValue(),
      proxyModeItem.getValue()
    ]);

    runInAction(() => {
      this.profiles = profiles;
      this.selectedProfile = selectedProfile;
      this.currentMode = currentMode;
    });

    this.watchStorage();
  }

  /**
   * The popup and the options page are separate documents backed by the same
   * storage, so each has to pick up what the other writes instead of holding on
   * to the snapshot it took when it opened.
   *
   * storage.onChanged also fires in the context that did the writing, so each
   * watcher bails out when storage already matches what it holds. Otherwise
   * every local save would swap the observables for equal-but-new values and
   * churn every component keyed on their identity.
   */
  private watchStorage() {
    profilesItem.watch(value => {
      const next = value ?? [];
      if (looseEqual(toJS(this.profiles), next)) return;
      runInAction(() => {
        this.profiles = next;
      });
    });
    selectedProfileItem.watch(value => {
      if (looseEqual(toJS(this.selectedProfile), value)) return;
      runInAction(() => {
        this.selectedProfile = value;
      });
    });
    proxyModeItem.watch(value => {
      const next = value ?? ProxyMode.Direct;
      if (this.currentMode === next) return;
      runInAction(() => {
        this.currentMode = next;
      });
    });
  }

  private persistProfiles() {
    profilesItem.setValue(toJS(this.profiles)).catch(error => {
      console.error('Error saving profiles:', error);
    });
  }

  private persistSelectedProfile() {
    selectedProfileItem.setValue(toJS(this.selectedProfile)).catch(error => {
      console.error('Error saving the selected profile:', error);
    });
  }

  /**
   * The background worker keeps its own copy of the active profile — including
   * the credentials it answers proxy auth challenges with — so any edit to the
   * profile currently routing traffic has to be pushed through to it. Without
   * this the user has to re-pick the profile in the popup for a changed host or
   * password to take effect.
   */
  private syncProxy() {
    const profile =
      this.currentMode === ProxyMode.FixedServers
        ? toJS(this.selectedProfile)
        : null;
    setProxy(this.currentMode, profile).catch(error => {
      console.error('Error syncing proxy:', error);
    });
  }

  /**
   * Re-checks the cached selection against the profile list after a mutation,
   * and re-applies the proxy when the active profile changed or disappeared.
   */
  private reconcileSelection() {
    const selected = this.selectedProfile;
    if (!selected) return;

    const current = this.profiles.find(profile => profile.id === selected.id);
    if (!current) {
      // The active profile was deleted or replaced by a restore: tear the proxy
      // down so its credentials stop being offered.
      this.setCurrentMode(ProxyMode.Direct);
      this.selectProfile(null);
      this.syncProxy();
      return;
    }

    if (!looseEqual(toJS(current), toJS(selected))) {
      this.setSelectedProfile(toJS(current));
      this.syncProxy();
    }
  }

  @action
  setProfiles(profiles: Profile[]) {
    this.profiles = profiles;
    this.persistProfiles();
    this.reconcileSelection();
  }

  @action
  setCurrentMode(mode: ProxyMode) {
    this.currentMode = mode;
    proxyModeItem.setValue(mode).catch(error => {
      console.error('Error saving the proxy mode:', error);
    });
  }

  @action
  setSelectedProfile(profile: Profile) {
    this.selectedProfile = profile;
    this.persistSelectedProfile();
  }

  @action
  addProfile(profile: Profile) {
    this.profiles.push(profile);
    this.persistProfiles();
  }

  @action
  removeProfile(profile: Profile) {
    this.profiles = this.profiles.filter(p => p.id !== profile.id);
    this.persistProfiles();
    this.reconcileSelection();
  }

  @action
  updateProfile(profile: Profile) {
    const index = this.profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      this.profiles[index] = profile;
      this.persistProfiles();
      this.reconcileSelection();
    }
  }

  getProfileById(id: string) {
    return this.profiles.find(profile => profile.id === id);
  }

  @action
  selectProfile(profile: Profile | null) {
    if (profile) {
      this.setCurrentMode(ProxyMode.FixedServers);
    }
    this.selectedProfile = profile;
    this.persistSelectedProfile();
  }

  @action
  exportProfiles(): string {
    return JSON.stringify(this.profiles, null, 2);
  }

  @computed
  get getProfiles(): Profile[] {
    return toJS(this.profiles);
  }

  @computed
  get getSelectedProfile() {
    return toJS(this.selectedProfile);
  }

  @computed
  get availableProfiles(): Profile[] {
    return this.profiles.filter(profile => profile.enabled);
  }
}

const profiles = new ProfilesStore();

export default profiles;
