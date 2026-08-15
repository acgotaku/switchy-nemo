import { action, computed, observable, runInAction, toJS } from 'mobx';
import { looseEqual } from '@/utils/misc';
import { setProxy } from '@/utils/proxy';
import {
  profilesItem,
  proxyModeItem,
  selectedProfileItem
} from '@/utils/storage';

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

export class ProfilesStore {
  @observable accessor profiles: Profile[] = [];
  @observable accessor selectedProfile: Profile | null = null;
  @observable accessor currentMode: ProxyMode = ProxyMode.Direct;

  // Until storage has been read the observables hold defaults, not the user's
  // settings. Persisting those would write an empty list over real profiles, so
  // nothing is saved before this flips.
  private hydrated = false;

  /**
   * browser.storage is async, so the store starts empty and has to be filled in
   * before the first render. Entry points await this.
   *
   * Never rejects: a storage failure leaves the store unhydrated and read-only
   * rather than taking the whole page down with it.
   */
  async hydrate() {
    try {
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
      this.hydrated = true;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
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
    if (!this.hydrated) return;
    profilesItem.setValue(toJS(this.profiles)).catch(error => {
      console.error('Error saving profiles:', error);
    });
  }

  private persistSelectedProfile() {
    if (!this.hydrated) return;
    selectedProfileItem.setValue(toJS(this.selectedProfile)).catch(error => {
      console.error('Error saving the selected profile:', error);
    });
  }

  private persistCurrentMode() {
    if (!this.hydrated) return;
    proxyModeItem.setValue(this.currentMode).catch(error => {
      console.error('Error saving the proxy mode:', error);
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
    if (!this.hydrated) return;
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
    this.persistCurrentMode();
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
