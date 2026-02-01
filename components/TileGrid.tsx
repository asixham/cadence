import { Service } from "@/app/data/services";
import { ServiceTile } from "./ServiceTile";
import { AddTileButton } from "./AddTileButton";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

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
}: TileGridProps) {
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
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-4 gap-2 md:gap-5">
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
                  stiffness: 500,
                  damping: 30,
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
                      window.open(service.url, '_blank');
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

