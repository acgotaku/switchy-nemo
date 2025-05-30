import { action, computed, observable, toJS } from 'mobx';
import { namespace } from '@/utils/misc';

export const PROFILES = `${namespace}.profiles`;
export const SELECTED_PROFILE = `${namespace}.selectedProfile`;

export type Scheme = 'http' | 'https' | 'socks4' | 'socks5';
export type ProxyRules =
  | 'singleProxy'
  | 'proxyForHttps'
  | 'proxyForHttp'
  | 'proxyForFtp';

export type Profile = {
  id: string;
  name: string;
  proxyRules: ProxyRules;
  scheme?: Scheme;
  host: string;
  port?: number;
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

  @action
  setProfiles(profiles: Profile[]) {
    this.profiles = profiles;
    localStorage.setItem(PROFILES, JSON.stringify(profiles));
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
  }

  @action
  updateProfile(profile: Profile) {
    const index = this.profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      this.profiles[index] = profile;
      localStorage.setItem(PROFILES, JSON.stringify(this.profiles));
    }
  }

  @action
  getProfileById(id: string) {
    return this.profiles.find(profile => profile.id === id);
  }

  @action
  selectProfile(profile: Profile) {
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
}

const profiles = new ProfilesStore();

export default profiles;
