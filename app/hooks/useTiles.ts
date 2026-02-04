import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { syncManager } from "@/app/utils/syncUtils";

const STORAGE_KEY = 'cadence-tiles';
const DEFAULT_TILES = [
  'netflix', 'youtube', 'disney-plus', 'hulu',
  'spotify', 'plex', 'twitch', 'paramount-plus',
  'google-maps', 'waze', 'weather', 'teslafi',
  'chess', 'solitaire', 'tetris', '2048'
];

export function useTiles() {
  const { user, loading: authLoading } = useAuth();
  const hasLoadedFromServer = useRef(false);
  const prevUserRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  // Initialize state based on whether user is signed in
  const [tiles, setTiles] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      // If user is signed in, we'll load from server, so start with empty/default
      // If not signed in, use localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_TILES;
        }
      }
    }
    return DEFAULT_TILES;
  });

  const [displayTiles, setDisplayTiles] = useState<string[]>(tiles);
  // Start with loading true if we need to load from server (user is signed in)
  const [isLoading, setIsLoading] = useState(() => {
    // We'll determine this after auth loads
    return false;
  });

  // Sync displayTiles with tiles
  useEffect(() => {
    setDisplayTiles(tiles);
  }, [tiles]);

  // Handle user sign in/out and initial load
  useEffect(() => {
    // Wait for auth to finish loading before checking user state
    if (authLoading) {
      return;
    }

    const currentUserId = user?.id || null;
    const prevUserId = prevUserRef.current;

    // Initial mount - user is already signed in
    if (isInitialMount.current && currentUserId && !hasLoadedFromServer.current) {
      isInitialMount.current = false;
      setIsLoading(true);
      
      // Immediately fetch from server and ignore localStorage
      syncManager.loadFromServer().then(data => {
        if (data.tiles && Array.isArray(data.tiles) && data.tiles.length > 0) {
          // User has saved tiles on server, load them (ignore localStorage)
          setTiles(data.tiles);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tiles));
        } else {
          // User has no saved tiles, use defaults
          setTiles(DEFAULT_TILES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TILES));
        }
        hasLoadedFromServer.current = true;
        setIsLoading(false);
      }).catch(() => {
        // On error, fall back to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setTiles(JSON.parse(saved));
          } catch {
            setTiles(DEFAULT_TILES);
          }
        } else {
          setTiles(DEFAULT_TILES);
        }
        hasLoadedFromServer.current = true;
        setIsLoading(false);
      });
    }
    // Initial mount - user is not signed in
    else if (isInitialMount.current && !currentUserId && !hasLoadedFromServer.current) {
      isInitialMount.current = false;
      // Use localStorage, no loading needed
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTiles(parsed);
        } catch {
          setTiles(DEFAULT_TILES);
        }
      } else {
        setTiles(DEFAULT_TILES);
      }
      hasLoadedFromServer.current = true;
    }
    // User just signed in
    else if (currentUserId && !prevUserId) {
      setIsLoading(true);
      hasLoadedFromServer.current = false;
      
      // Immediately fetch from server and ignore localStorage
      syncManager.loadFromServer().then(data => {
        if (data.tiles && Array.isArray(data.tiles) && data.tiles.length > 0) {
          // User has saved tiles on server, load them (ignore localStorage)
          setTiles(data.tiles);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tiles));
        } else {
          // User has no saved tiles, use defaults
          setTiles(DEFAULT_TILES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TILES));
        }
        hasLoadedFromServer.current = true;
        setIsLoading(false);
      }).catch(() => {
        // On error, fall back to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setTiles(JSON.parse(saved));
          } catch {
            setTiles(DEFAULT_TILES);
          }
        } else {
          setTiles(DEFAULT_TILES);
        }
        hasLoadedFromServer.current = true;
        setIsLoading(false);
      });
    }
    // User just signed out
    else if (!currentUserId && prevUserId) {
      // Save current state to localStorage before signing out
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
      hasLoadedFromServer.current = false;
    }

    prevUserRef.current = currentUserId;
  }, [user, authLoading, tiles]);

  // Save to localStorage whenever tiles change (but don't sync to server)
  // Server sync only happens when checkmark is pressed
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedFromServer.current) {
      // Always save to localStorage for offline use
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
    }
  }, [tiles]);

  const addTiles = (newTileIds: string[]) => {
    setTiles(prev => [...prev, ...newTileIds]);
  };

  const removeTile = (tileId: string) => {
    setTiles(prev => prev.filter(id => id !== tileId));
  };

  const reorderTiles = (newOrder: string[]) => {
    setTiles(newOrder);
  };

  // Explicit sync function for when user exits edit mode (checkmark pressed)
  const syncTiles = async () => {
    if (user) {
      // Save to localStorage first
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
      // Then sync to server
      await syncManager.syncTiles(tiles, user.id, { immediate: true });
    } else {
      // If not signed in, just save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
    }
  };

  return {
    tiles,
    displayTiles,
    setDisplayTiles,
    addTiles,
    removeTile,
    reorderTiles,
    syncTiles, // Expose sync function
    isLoading, // Expose loading state
  };
}

