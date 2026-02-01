import { useState, useEffect } from "react";

const STORAGE_KEY = 'cadence-tiles';
const DEFAULT_TILES = [
  'netflix', 'youtube', 'disney-plus', 'hulu',
  'spotify', 'plex', 'twitch', 'paramount-plus',
  'google-maps', 'waze', 'weather', 'teslafi',
  'chess', 'solitaire', 'tetris', '2048'
];

export function useTiles() {
  const [tiles, setTiles] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
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

  // Sync displayTiles with tiles
  useEffect(() => {
    setDisplayTiles(tiles);
  }, [tiles]);

  // Save to localStorage whenever tiles change
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  return {
    tiles,
    displayTiles,
    setDisplayTiles,
    addTiles,
    removeTile,
    reorderTiles,
  };
}

