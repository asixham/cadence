import { Service } from "@/app/data/services";
import { ServiceTile } from "./ServiceTile";
import { AddTileButton } from "./AddTileButton";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { AppSettings } from "@/app/hooks/useSettings";

interface TileGridProps {
  tiles: string[];
  displayTiles: string[];
  getService: (id: string) => Service | undefined;
  isEditing: boolean;
  draggedTile: string | null;
  dragOverTile: string | null;
  onRemove: (tileId: string) => void;
  onDragStart: (tileId: string) => void;
  onDragOver: (e: React.DragEvent, tileId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, tileId: string) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent, tileId: string) => void;
  onTouchMove: (e: React.TouchEvent, tileId: string) => void;
  onTouchEnd: (e: React.TouchEvent, tileId: string) => void;
  onAddTile: () => void;
  settings: AppSettings;
}

export function TileGrid({
  tiles,
  displayTiles,
  getService,
  isEditing,
  draggedTile,
  dragOverTile,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onAddTile,
  settings,
}: TileGridProps) {
  const getAnimationSpeed = () => {
    switch (settings.animationSpeed) {
      case 'fast': return { stiffness: 1200, damping: 20 };
      case 'normal': return { stiffness: 500, damping: 30 };
      case 'slow': return { stiffness: 300, damping: 40 };
      default: return { stiffness: 500, damping: 30 };
    }
  };
  // Show empty state if no tiles
  if (displayTiles.length === 0) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6 text-white/60">
          <Inbox className="w-16 h-16" />
          <p className="text-lg font-medium">No apps in this category</p>
          {isEditing && (
            <div className="mt-4">
              <AddTileButton onClick={onAddTile} size="large" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full">
      <div className="p-4 md:p-6 w-full max-w-full">
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))`,
            gap: `${settings.gap}px`,
          }}
        >
          {displayTiles.map((tileId) => {
            const service = getService(tileId);
            if (!service) return null;

            return (
              <motion.div
                key={tileId}
                layout
                initial={false}
                transition={{
                  type: "spring",
                  ...getAnimationSpeed(),
                }}
                className="w-full"
                style={{
                  aspectRatio: '6/3',
                }}
              >
                <ServiceTile
                  service={service}
                  tileId={tileId}
                  isEditing={isEditing}
                  isDragged={draggedTile === tileId}
                  isDragOver={dragOverTile === tileId}
                  onRemove={onRemove}
                  onClick={() => {
                    if (!isEditing && !draggedTile) {
                      if (settings.openInNewTab) {
                        window.open(service.url, '_blank');
                      } else {
                        window.location.href = service.url;
                      }
                    }
                  }}
                  onDragStart={() => onDragStart(tileId)}
                  onDragOver={(e) => onDragOver(e, tileId)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, tileId)}
                  onDragEnd={onDragEnd}
                  onTouchStart={(e) => onTouchStart(e, tileId)}
                  onTouchMove={(e) => onTouchMove(e, tileId)}
                  onTouchEnd={(e) => onTouchEnd(e, tileId)}
                  settings={settings}
                />
              </motion.div>
            );
          })}

          {/* Add tile button */}
          {isEditing && <AddTileButton onClick={onAddTile} />}
        </div>
      </div>
    </div>
  );
}

