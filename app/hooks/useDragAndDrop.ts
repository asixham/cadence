import { useState, useRef } from "react";

interface UseDragAndDropProps {
  displayTiles: string[];
  setDisplayTiles: (tiles: string[]) => void;
  onReorder: (tiles: string[]) => void;
  isEditing: boolean;
}

export function useDragAndDrop({
  displayTiles,
  setDisplayTiles,
  onReorder,
  isEditing,
}: UseDragAndDropProps) {
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [dragOverTile, setDragOverTile] = useState<string | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = (tileId: string) => {
    setDraggedTile(tileId);
  };

  const handleDragOver = (e: React.DragEvent, tileId: string) => {
    e.preventDefault();
    if (draggedTile && draggedTile !== tileId) {
      setDragOverTile(tileId);

      const currentIndex = displayTiles.indexOf(draggedTile);
      const targetIndex = displayTiles.indexOf(tileId);

      if (currentIndex !== targetIndex) {
        const newTiles = [...displayTiles];
        newTiles.splice(currentIndex, 1);
        newTiles.splice(targetIndex, 0, draggedTile);
        setDisplayTiles(newTiles);
      }
    }
  };

  const handleDragLeave = () => {
    // Don't reset dragOverTile here to keep the visual feedback
  };

  const handleDrop = (e: React.DragEvent, targetTileId: string) => {
    e.preventDefault();
    if (draggedTile && draggedTile !== targetTileId) {
      onReorder(displayTiles);
    }
    setDraggedTile(null);
    setDragOverTile(null);
  };

  const handleDragEnd = () => {
    if (draggedTile) {
      onReorder(displayTiles);
    }
    setDraggedTile(null);
    setDragOverTile(null);
  };

  // Touch handlers for mobile drag and drop - optimized for Tesla touch screens
  const handleTouchStart = (e: React.TouchEvent, tileId: string) => {
    if (!isEditing) return;

    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });

    // Reduced long press time for easier activation (150ms instead of 300ms)
    const timer = setTimeout(() => {
      setDraggedTile(tileId);
      setTouchStartPos(null);
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 150);
    longPressTimerRef.current = timer;
  };

  const handleTouchMove = (e: React.TouchEvent, tileId: string) => {
    if (!isEditing) return;

    const touch = e.touches[0];
    
    // If we have a touch start position, check if user is moving
    if (longPressTimerRef.current && touchStartPos) {
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);

      // More sensitive movement detection (5px instead of 10px)
      if (deltaX > 5 || deltaY > 5) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        // Start dragging immediately if moved enough
        if (deltaX > 10 || deltaY > 10) {
          setDraggedTile(tileId);
          setTouchStartPos(null);
        }
      }
    }

    if (!draggedTile) return;

    e.preventDefault();
    e.stopPropagation();
    
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetTile = element?.closest('[data-tile-id]');

    if (targetTile) {
      const targetId = targetTile.getAttribute('data-tile-id');
      if (targetId && targetId !== draggedTile) {
        setDragOverTile(targetId);

        const currentIndex = displayTiles.indexOf(draggedTile);
        const targetIndex = displayTiles.indexOf(targetId);

        if (currentIndex !== targetIndex) {
          const newTiles = [...displayTiles];
          newTiles.splice(currentIndex, 1);
          newTiles.splice(targetIndex, 0, draggedTile);
          setDisplayTiles(newTiles);
        }
      }
    } else {
      setDragOverTile(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, tileId: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isEditing) return;

    if (draggedTile) {
      onReorder(displayTiles);
      // Haptic feedback on drop
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }

    setDraggedTile(null);
    setDragOverTile(null);
    setTouchStartPos(null);
  };

  return {
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
  };
}

