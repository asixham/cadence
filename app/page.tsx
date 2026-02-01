"use client";

import { useState, useMemo } from "react";
import { TileGrid } from "@/components/TileGrid";
import { AddServiceModal } from "@/components/AddServiceModal";
import { BottomNav } from "@/components/BottomNav";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useTiles } from "./hooks/useTiles";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useSettings } from "./hooks/useSettings";
import { getService } from "./utils/serviceUtils";

type Category = 'all' | 'streaming' | 'music' | 'games';

export default function Home() {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const {
    tiles,
    displayTiles,
    setDisplayTiles,
    addTiles,
    removeTile,
    reorderTiles,
  } = useTiles();

  const { settings, updateSetting, resetSettings } = useSettings();

  // Filter tiles by category
  const filteredDisplayTiles = useMemo(() => {
    if (activeCategory === 'all') {
      return displayTiles;
    }
    return displayTiles.filter((tileId) => {
      const service = getService(tileId);
      return service?.category === activeCategory;
    });
  }, [displayTiles, activeCategory]);

  const {
    draggedTile,
    dragOverTile,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragAndDrop({
    displayTiles: activeCategory === 'all' ? displayTiles : filteredDisplayTiles,
    setDisplayTiles: (newTiles) => {
      if (activeCategory === 'all') {
        setDisplayTiles(newTiles);
      } else {
        // When reordering filtered tiles, merge with invisible tiles
        const visibleSet = new Set(newTiles);
        const invisible = displayTiles.filter(id => !visibleSet.has(id));
        setDisplayTiles([...newTiles, ...invisible]);
      }
    },
    onReorder: (newTiles) => {
      if (activeCategory === 'all') {
        reorderTiles(newTiles);
      } else {
        // Merge filtered order with invisible tiles
        const visibleSet = new Set(newTiles);
        const invisible = tiles.filter(id => !visibleSet.has(id));
        reorderTiles([...newTiles, ...invisible]);
      }
    },
    isEditing,
  });

  return (
    <main className="h-dvh w-dvw bg-[#0a0a0a] text-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden">
        <TileGrid
          tiles={tiles}
          displayTiles={filteredDisplayTiles}
          getService={getService}
          isEditing={isEditing}
          draggedTile={draggedTile}
          dragOverTile={dragOverTile}
          onRemove={removeTile}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onAddTile={() => setShowAddModal(true)}
          settings={settings}
        />
      </div>

      <BottomNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onOpenSettings={() => setShowSettings(true)}
        isSettingsOpen={showSettings}
      />

      <SettingsPanel
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        updateSetting={updateSetting}
        resetSettings={resetSettings}
      />

      <AddServiceModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        existingTiles={tiles}
        onAdd={addTiles}
      />
      </main>
  );
}
