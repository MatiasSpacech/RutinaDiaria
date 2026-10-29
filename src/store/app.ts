import { create } from 'zustand';

import { initDatabase } from '@/db/client';
import { getProfile } from '@/db/repositories/profile';
import type { Profile } from '@/domain/types';
import { useSettingsStore } from '@/store/settings';

type AppState = {
  ready: boolean;
  initError: string | null;
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  initError: null,
  profile: null,
  setProfile: (profile) => set({ profile }),
}));

export function initializeApp() {
  initDatabase();
  const profile = getProfile();
  useSettingsStore.getState().setThemePreference(profile.themePreference);
  useSettingsStore.getState().setUnitSystem(profile.unitSystem);
  useAppStore.setState({ profile, ready: true, initError: null });
}
