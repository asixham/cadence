import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { syncManager } from "@/app/utils/syncUtils";

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
  const { user } = useAuth();
  const hasLoadedFromServer = useRef(false);
  const prevUserRef = useRef<string | null>(null);

  // Initialize state based on whether user is signed in
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      // If user is signed in, we'll load from server, so start with defaults
      // If not signed in, use localStorage
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

  // Handle user sign in/out and initial load
  useEffect(() => {
    const currentUserId = user?.id || null;
    const prevUserId = prevUserRef.current;

    // User just signed in
    if (currentUserId && !prevUserId) {
      hasLoadedFromServer.current = false;
      
      // Immediately fetch from server and ignore localStorage
      syncManager.loadFromServer().then(data => {
        if (data.settings) {
          // Merge server settings with defaults, giving priority to server settings
          // But exclude tiles from settings merge (tiles are handled separately)
          const { tiles, ...serverSettings } = data.settings;
          setSettings(prev => ({ ...DEFAULT_SETTINGS, ...serverSettings }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...serverSettings }));
        } else {
          // User has no saved settings, use defaults
          setSettings(DEFAULT_SETTINGS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        }
        hasLoadedFromServer.current = true;
      }).catch(() => {
        // On error, fall back to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          } catch {
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        hasLoadedFromServer.current = true;
      });
    }
    // User just signed out
    else if (!currentUserId && prevUserId) {
      // Save current state to localStorage before signing out
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      hasLoadedFromServer.current = false;
    }
    // User is not signed in and wasn't before - use localStorage
    else if (!currentUserId && !prevUserId && !hasLoadedFromServer.current) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      hasLoadedFromServer.current = true;
    }

    prevUserRef.current = currentUserId;
  }, [user]);

  // Save to localStorage and sync to server whenever settings change
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedFromServer.current) {
      // Always save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      // Sync to server if user is signed in (immediate for settings)
      if (user) {
        syncManager.syncSettings(settings, user.id, { immediate: true });
      }
    }
  }, [settings, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      syncManager.cleanup();
    };
  }, []);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Explicit sync function
  const syncSettings = async () => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      await syncManager.syncSettings(settings, user.id, { immediate: true });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  };

  return {
    settings,
    updateSetting,
    resetSettings,
    syncSettings, // Expose sync function
  };
}

