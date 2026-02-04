/**
 * Syncing utility for managing data synchronization between local storage and server
 */

export interface SyncOptions {
  immediate?: boolean; // If true, sync immediately without debouncing
}

class SyncManager {
  private tileSyncTimeout: NodeJS.Timeout | null = null;
  private settingsSyncTimeout: NodeJS.Timeout | null = null;
  private isInitialLoad = false;

  /**
   * Sync tiles to server
   */
  async syncTiles(tiles: string[], userId: string | null, options: SyncOptions = {}) {
    // Only sync to server if user is signed in
    if (!userId) {
      return;
    }

    // Clear existing timeout
    if (this.tileSyncTimeout) {
      clearTimeout(this.tileSyncTimeout);
      this.tileSyncTimeout = null;
    }

    const performSync = async () => {
      try {
        await fetch('/api/settings/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            settings: { tiles } 
          }),
        });
      } catch (error) {
        console.error('Failed to sync tiles:', error);
      }
    };

    if (options.immediate) {
      await performSync();
    } else {
      // Debounce tile syncs (500ms)
      this.tileSyncTimeout = setTimeout(performSync, 500);
    }
  }

  /**
   * Sync settings to server
   */
  async syncSettings(settings: any, userId: string | null, options: SyncOptions = {}) {
    // Only sync to server if user is signed in
    if (!userId) {
      return;
    }

    // Clear existing timeout
    if (this.settingsSyncTimeout) {
      clearTimeout(this.settingsSyncTimeout);
      this.settingsSyncTimeout = null;
    }

    const performSync = async () => {
      try {
        await fetch('/api/settings/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        });
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    };

    if (options.immediate) {
      await performSync();
    } else {
      // Debounce settings syncs (300ms) - shorter than tiles since settings change less frequently
      this.settingsSyncTimeout = setTimeout(performSync, 300);
    }
  }

  /**
   * Load all data from server
   */
  async loadFromServer(): Promise<{ tiles?: string[], settings?: any }> {
    try {
      const response = await fetch('/api/settings/sync');
      const data = await response.json();
      return {
        tiles: data.settings?.tiles,
        settings: data.settings,
      };
    } catch (error) {
      console.error('Failed to load from server:', error);
      return {};
    }
  }

  /**
   * Set initial load flag (prevents syncing during initial load)
   */
  setInitialLoad(loading: boolean) {
    this.isInitialLoad = loading;
  }

  /**
   * Check if currently in initial load
   */
  getIsInitialLoad(): boolean {
    return this.isInitialLoad;
  }

  /**
   * Cleanup timeouts
   */
  cleanup() {
    if (this.tileSyncTimeout) {
      clearTimeout(this.tileSyncTimeout);
      this.tileSyncTimeout = null;
    }
    if (this.settingsSyncTimeout) {
      clearTimeout(this.settingsSyncTimeout);
      this.settingsSyncTimeout = null;
    }
  }
}

export const syncManager = new SyncManager();

