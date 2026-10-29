import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';
export type UnitSystem = 'metric' | 'imperial';

type SettingsState = {
  themePreference: ThemePreference;
  unitSystem: UnitSystem;
  setThemePreference: (preference: ThemePreference) => void;
  setUnitSystem: (system: UnitSystem) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  unitSystem: 'metric',
  setThemePreference: (themePreference) => set({ themePreference }),
  setUnitSystem: (unitSystem) => set({ unitSystem }),
}));
