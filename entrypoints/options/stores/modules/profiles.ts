import { action, computed, observable, toJS } from 'mobx';
import { looseEqual, namespace } from '@/utils/misc';
import { setProxy } from '@/utils/proxy';

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

export class ProfilesStore {
  @observable accessor profiles: Profile[] = localStorage.getItem(PROFILES)
    ? JSON.parse(localStorage.getItem(PROFILES) || '')
    : [];
  @observable accessor selectedProfile: Profile | null = localStorage.getItem(
    SELECTED_PROFILE
  )
    ? JSON.parse(localStorage.getItem(SELECTED_PROFILE) || '')
    : null;
  @observable accessor currentMode: ProxyMode = localStorage.getItem(PROXY_MODE)
    ? (localStorage.getItem(PROXY_MODE) as ProxyMode)
    : 'direct';

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
    localStorage.setItem(PROFILES, JSON.stringify(profiles));
    this.reconcileSelection();
  }

  @action
  setCurrentMode(mode: ProxyMode) {
    this.currentMode = mode;
    localStorage.setItem(PROXY_MODE, mode);
  }

  @action
  setSelectedProfile(profile: Profile) {
    this.selectedProfile = profile;
    localStorage.setItem(SELECTED_PROFILE, JSON.stringify(profile));
  }

  @action
  addProfile(profile: Profile) {
    this.profiles.push(profile);
    localStorage.setItem(PROFILES, JSON.stringify(this.profiles));
  }

  @action
  removeProfile(profile: Profile) {
    this.profiles = this.profiles.filter(p => p.id !== profile.id);
    localStorage.setItem(PROFILES, JSON.stringify(this.profiles));
    this.reconcileSelection();
  }

  @action
  updateProfile(profile: Profile) {
    const index = this.profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      this.profiles[index] = profile;
      localStorage.setItem(PROFILES, JSON.stringify(this.profiles));
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
    localStorage.setItem(SELECTED_PROFILE, JSON.stringify(profile));
  }

  @action
  syncProfiles() {
    const profiles = localStorage.getItem(PROFILES);
    if (profiles) {
      this.profiles = JSON.parse(profiles);
    }
    const selectedProfile = localStorage.getItem(SELECTED_PROFILE);
    if (selectedProfile) {
      this.selectedProfile = JSON.parse(selectedProfile);
    }
  }

  @action
  saveProfiles() {
    localStorage.setItem(PROFILES, JSON.stringify(this.profiles));
    localStorage.setItem(
      SELECTED_PROFILE,
      JSON.stringify(this.selectedProfile)
    );
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
