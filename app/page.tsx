"use client";

import { useState, useMemo, useEffect } from "react";
import { TileGrid } from "@/components/TileGrid";
import { AddServiceModal } from "@/components/AddServiceModal";
import { BottomNav } from "@/components/BottomNav";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useTiles } from "./hooks/useTiles";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useSettings } from "./hooks/useSettings";
import { useCustomServices } from "./hooks/useCustomServices";
import { getService } from "./utils/serviceUtils";
import { isMobileDevice } from "./utils/deviceUtils";
import { MdErrorOutline } from "react-icons/md";
import { cn } from "@/lib/utils";

type Category = 'all' | 'streaming' | 'music' | 'games';

export default function Home() {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if device is mobile
  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    // Also check on resize in case of device rotation or window resizing
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track loading state - wait for everything to initialize
  useEffect(() => {
    // Wait for next frame to ensure all hooks have initialized and DOM is ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const {
    tiles,
    displayTiles,
    setDisplayTiles,
    addTiles,
    removeTile,
    reorderTiles,
  } = useTiles();

  const { settings, updateSetting, resetSettings } = useSettings();
  const { customServices, addCustomService } = useCustomServices();

  // Filter tiles by category
  const filteredDisplayTiles = useMemo(() => {
    if (activeCategory === 'all') {
      return displayTiles;
    }
    return displayTiles.filter((tileId) => {
      const service = getService(tileId, customServices);
      // Custom services don't match any specific category, so exclude them when filtering
      if (tileId.startsWith('custom-')) {
        return false;
      }
      return service?.category === activeCategory;
    });
  }, [displayTiles, activeCategory, customServices]);

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
    <main className="h-dvh w-dvw bg-[#0a0a0a] text-white overflow-hidden flex flex-col relative">
      {/* Loading spinner - shows until everything is loaded */}
      {!isMobile && isLoading && (
        <div 
          className="fixed inset-0 bg-[#0a0a0a] z-[9998] flex items-center justify-center"
          style={{ 
            pointerEvents: 'all',
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay - prevents all interaction */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-[#0a0a0a] z-[9999] flex items-center justify-center"
          style={{ 
            pointerEvents: 'all',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onClick={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onTouchEnd={(e) => e.preventDefault()}
        >
          <div className="text-center px-8 max-w-md">
            <div className="flex justify-center mb-6">
              <MdErrorOutline className="w-16 h-16 text-white/80" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Mobile Not Supported
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              This experience is not available on mobile devices. Please access Cadence from your Tesla or another desktop device.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <TileGrid
          tiles={tiles}
          displayTiles={filteredDisplayTiles}
          getService={(id) => getService(id, customServices)}
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
        customServices={customServices}
        onAddCustomService={addCustomService}
      />
      </main>
  );
}
