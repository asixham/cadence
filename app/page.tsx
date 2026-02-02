"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TileGrid } from "@/components/TileGrid";
import { AddServiceModal } from "@/components/AddServiceModal";
import { BottomNav } from "@/components/BottomNav";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AppIframe } from "@/components/AppIframe";
import { NavSlider } from "@/components/NavSlider";
import { useTiles } from "./hooks/useTiles";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useSettings } from "./hooks/useSettings";
import { useCustomServices } from "./hooks/useCustomServices";
import { getService } from "./utils/serviceUtils";
import { isMobileDevice } from "./utils/deviceUtils";
import { openWithYouTubeRedirect } from "./utils/navigationUtils";
import { MdErrorOutline, MdReportProblem, MdCheck } from "react-icons/md";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Category = 'all' | 'streaming' | 'music' | 'games';

export default function Home() {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [showEmbedError, setShowEmbedError] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [isCheckingEmbed, setIsCheckingEmbed] = useState(false);
  const [showEmbeddingWarning, setShowEmbeddingWarning] = useState(false);
  const [pendingEmbedUrl, setPendingEmbedUrl] = useState<string | null>(null);
  const [isReportingEmbed, setIsReportingEmbed] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

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

      {/* Embed check loading spinner */}
      {isCheckingEmbed && (
        <div 
          className="fixed inset-0 bg-black/75 z-[9997] flex items-center justify-center"
          style={{ 
            pointerEvents: 'all',
            bottom: '80px', // Exclude bottom nav
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
        {iframeUrl ? (
          <AppIframe
            url={iframeUrl}
            isNavVisible={isNavVisible}
            onClose={() => {
              setIframeUrl(null);
              setIsNavVisible(true);
            }}
          />
        ) : (
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
            onLaunchInIframe={async (url) => {
              // Show loading spinner while checking
              setIsCheckingEmbed(true);
              
              // Check if URL can be embedded before launching
              try {
                const response = await fetch('/api/check-embed', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ url }),
                });
                
                const data = await response.json();
                
                setIsCheckingEmbed(false);
                
                if (!data.canEmbed) {
                  // Site blocks embedding, show dialog
                  setPendingUrl(url);
                  setShowEmbedError(true);
                  return;
                }
                
                // Can be embedded - check if we should show warning
                if (settings.showEmbeddingWarning) {
                  setPendingEmbedUrl(url);
                  setShowEmbeddingWarning(true);
                  return;
                }
                
                // Can be embedded, launch in iframe (warning disabled)
                setIframeUrl(url);
                setIsNavVisible(true);
                setActiveCategory('all'); // Reset to 'all' when launching app
              } catch (error) {
                // If check fails, assume it can be embedded and try anyway
                // Client-side detection in AppIframe will catch errors
                console.error('Failed to check embed status:', error);
                setIsCheckingEmbed(false);
                
                // Check if we should show warning even on error
                if (settings.showEmbeddingWarning) {
                  setPendingEmbedUrl(url);
                  setShowEmbeddingWarning(true);
                  return;
                }
                
                setIframeUrl(url);
                setIsNavVisible(true);
                setActiveCategory('all');
              }
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {isNavVisible && (
          <BottomNav
            key="bottom-nav"
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing(!isEditing)}
            onOpenSettings={() => setShowSettings(true)}
            isSettingsOpen={showSettings}
            isIframeMode={!!iframeUrl}
            onHome={() => {
              setIframeUrl(null);
              setIsNavVisible(true);
            }}
            onHideNav={() => setIsNavVisible(false)}
            onCategoryClick={(category) => {
              // Exit iframe mode and navigate to category
              setIframeUrl(null);
              setIsNavVisible(true);
              setActiveCategory(category);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isNavVisible && iframeUrl && (
          <NavSlider key="nav-slider" onShowNav={() => setIsNavVisible(true)} />
        )}
      </AnimatePresence>

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

      {/* Embed Error Dialog */}
      <AlertDialog open={showEmbedError} onOpenChange={setShowEmbedError}>
        <AlertDialogContent className="bg-[#1e1e1e] text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-2xl font-semibold">
              Can't Embed This App
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 text-base">
              This app doesn't support embedding in Cadence, but you can still visit it. Click "Continue" to be redirected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-end">
            <AlertDialogCancel
              onClick={() => {
                setShowEmbedError(false);
                setPendingUrl(null);
              }}
              className={cn(
                "flex-1 sm:flex-initial px-6 py-4 rounded-lg",
                "bg-white/5 text-white",
                "hover:bg-white/10",
                "text-lg font-medium",
                "touch-manipulation"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              Go Home
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingUrl) {
                  setShowEmbedError(false);
                  openWithYouTubeRedirect(pendingUrl);
                  setPendingUrl(null);
                }
              }}
              className={cn(
                "flex-1 sm:flex-initial px-6 py-4 rounded-lg",
                "bg-white/10 text-white",
                "hover:bg-white/20",
                "text-lg font-medium",
                "touch-manipulation"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embedding Warning Dialog */}
      <AlertDialog open={showEmbeddingWarning} onOpenChange={setShowEmbeddingWarning}>
        <AlertDialogContent className="bg-[#1e1e1e] text-white max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-between">
              <AlertDialogTitle className="text-white text-2xl font-semibold">
                App Embedding Notice
              </AlertDialogTitle>
              <button
                onClick={() => setShowReportConfirm(true)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReportConfirm(true);
                }}
                disabled={isReportingEmbed}
                className={cn(
                  "p-2 rounded-md",
                  "bg-white/5 text-white/60",
                  "hover:bg-white/10 hover:text-white/80",
                  "active:bg-white/15",
                  "touch-manipulation",
                  "transition-all duration-200",
                  isReportingEmbed && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <MdReportProblem className="w-6 h-6" />
              </button>
            </div>
            <AlertDialogDescription className="text-white/60 text-base">
              This app likely supports embedding, but some links within it may be blocked. If you encounter issues, you can always return home using the navigation bar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-end">
            <AlertDialogCancel
              onClick={() => {
                setShowEmbeddingWarning(false);
                setPendingEmbedUrl(null);
              }}
              className={cn(
                "flex-1 sm:flex-initial px-6 py-4 rounded-lg",
                "bg-white/5 text-white",
                "hover:bg-white/10",
                "text-lg font-medium",
                "touch-manipulation"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingEmbedUrl) {
                  setShowEmbeddingWarning(false);
                  setIframeUrl(pendingEmbedUrl);
                  setIsNavVisible(true);
                  setActiveCategory('all');
                  setPendingEmbedUrl(null);
                }
              }}
              className={cn(
                "flex-1 sm:flex-initial px-6 py-4 rounded-lg",
                "bg-white/10 text-white",
                "hover:bg-white/20",
                "text-lg font-medium",
                "touch-manipulation"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Embed Confirmation Dialog */}
      <AlertDialog 
        open={showReportConfirm} 
        onOpenChange={(open) => {
          // Prevent closing during submission or success
          if (reportStatus === 'submitting' || reportStatus === 'success') {
            return;
          }
          setShowReportConfirm(open);
          if (!open) {
            setReportStatus('idle');
          }
        }}
      >
        <AlertDialogContent 
          className="bg-[#1e1e1e] text-white max-w-md"
          style={{ zIndex: 90 }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-2xl font-semibold">
              Report Embedding Issue
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 text-base">
              Are you sure you want to report that this site does not support embedding?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-end">
            <AlertDialogCancel
              onClick={() => {
                if (reportStatus === 'submitting' || reportStatus === 'success') return;
                setShowReportConfirm(false);
              }}
              disabled={reportStatus === 'submitting' || reportStatus === 'success'}
              className={cn(
                "flex-1 sm:flex-initial px-6 py-4 rounded-lg",
                "bg-white/5 text-white",
                "hover:bg-white/10",
                "text-lg font-medium",
                "touch-manipulation"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!pendingEmbedUrl || reportStatus !== 'idle') return;
                setReportStatus('submitting');
                try {
                  const response = await fetch('/api/report-embed', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: pendingEmbedUrl }),
                  });
                  if (response.ok) {
                    setReportStatus('success');
                    setTimeout(() => {
                      setShowReportConfirm(false);
                      setReportStatus('idle');
                    }, 1500);
                  } else {
                    setReportStatus('idle');
                  }
                } catch (error) {
                  console.error('Failed to report embed issue:', error);
                  setReportStatus('idle');
                }
              }}
              disabled={reportStatus !== 'idle'}
              className={cn(
                "flex-1 sm:flex-initial px-6 py-4 rounded-lg",
                "bg-white/10 text-white",
                "hover:bg-white/20",
                "text-lg font-medium",
                "touch-manipulation",
                "flex items-center justify-center gap-2",
                reportStatus !== 'idle' && "opacity-75 cursor-not-allowed"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              {reportStatus === 'submitting' && (
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              {reportStatus === 'success' && (
                <MdCheck className="w-5 h-5" />
              )}
              <span>
                {reportStatus === 'submitting' ? 'Submitting...' : 
                 reportStatus === 'success' ? 'Reported' : 
                 'Report'}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
