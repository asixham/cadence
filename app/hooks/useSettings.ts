import { useState, useEffect } from "react";

export interface AppSettings {
  // Layout
  columns: number;
  tileSize: 'small' | 'medium' | 'large' | 'custom';
  customTileSize: number; // in pixels
  gap: number; // gap between tiles in pixels
  
  // Appearance
  tileBorderRadius: number;
  showTileLabels: boolean;
  
  // Behavior
  animationSpeed: 'fast' | 'normal' | 'slow';
  launchInIframe: boolean;
  showEmbeddingWarning: boolean; // Show warning when launching embeddable apps
}

const STORAGE_KEY = 'cadence-settings';

const DEFAULT_SETTINGS: AppSettings = {
  columns: 4,
  tileSize: 'medium',
  customTileSize: 120,
  gap: 24,
  tileBorderRadius: 12,
  showTileLabels: false,
  animationSpeed: 'normal',
  launchInIframe: false,
  showEmbeddingWarning: true, // Default to true (show warning by default)
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_SETTINGS, ...parsed };
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}

