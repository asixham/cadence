import { Service } from "@/app/data/services";
import { getLogoUrl, getFallbackLogoUrl, getSecondFallbackLogoUrl } from "@/app/data/services";
import { cn } from "@/lib/utils";

interface ServiceTileProps {
  service: Service;
  tileId: string;
  isEditing: boolean;
  isDragged: boolean;
  isDragOver: boolean;
  onRemove: (tileId: string) => void;
  onClick: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function ServiceTile({
  service,
  tileId,
  isEditing,
  isDragged,
  isDragOver,
  onRemove,
  onClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: ServiceTileProps) {
  return (
    <div
      data-tile-id={tileId}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        "relative group aspect-[6/3] rounded-xl",
        "bg-gradient-to-br from-[#252525] to-[#1e1e1e]",
        "border border-white/10 hover:border-white/20",
        "active:scale-95 transition-all duration-300 ease-in-out",
        "cursor-pointer select-none shadow-lg",
        isEditing && "cursor-move",
        isDragged && "opacity-50 scale-95 z-50",
        isDragOver && "ring-2 ring-white/30 scale-105 border-white/40"
      )}
      style={{
        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
      }}
      onClick={onClick}
    >
      {/* Logo - Full size company logo (Apple TV style) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <div className="relative flex-1 w-full flex items-center justify-center">
          <img
            src={getLogoUrl(service)}
            alt={service.name}
            className="max-w-[70%] max-h-[60%] object-contain"
            style={{
              imageRendering: 'crisp-edges' as const,
              opacity: 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              // Try first fallback
              if (!img.src.includes('favicon.ico')) {
                img.src = getFallbackLogoUrl(service);
              } else if (!img.src.includes('google.com')) {
                // Try second fallback (Google favicon)
                img.src = getSecondFallbackLogoUrl(service);
              } else {
                // Final fallback - show first letter
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }
            }}
            onLoad={(e) => {
              // Ensure image is visible when loaded with smooth fade-in
              const img = e.target as HTMLImageElement;
              img.style.display = 'block';
              img.style.opacity = '1';
            }}
          />
          {/* Fallback icon if all logos fail */}
          <div className="hidden absolute inset-0 items-center justify-center text-3xl md:text-4xl font-bold text-white/70">
            {service.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="text-[8px] md:text-[9px] font-medium text-white/70 text-center leading-tight px-1 mt-1 line-clamp-2">
          {service.name}
        </div>
      </div>

      {/* Remove button (when editing) - always visible for touch screens */}
      {isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(tileId);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(tileId);
          }}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-500 active:bg-red-600 flex items-center justify-center text-white text-sm font-bold z-10 touch-manipulation"
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          ×
        </button>
      )}

      {/* Drag handle (when editing) - larger for touch */}
      {isEditing && (
        <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white/80 text-xs touch-none pointer-events-none">
          ⋮⋮
        </div>
      )}
    </div>
  );
}

