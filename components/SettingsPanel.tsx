"use client";

import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MdClose, MdSettings, MdDirectionsCar, MdEvStation, MdAutoMode, MdLock, MdLightbulb, MdEventSeat, MdMonitor, MdSchedule, MdShield, MdBuild, MdStorage, MdNavigation, MdAssessment } from "react-icons/md";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    setIsDragging(false); // Start as false, only set to true if horizontal movement detected
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - startY.current);
    
    // Only start dragging if horizontal movement is dominant
    if (!isDragging && Math.abs(deltaX) > 10 && deltaX > deltaY * 1.5) {
      setIsDragging(true);
    }
    
    if (isDragging && deltaX > 0) {
      e.preventDefault();
      e.stopPropagation();
      setDragOffset(Math.min(deltaX, 400)); // Cap at 400px
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    // If dragged more than 20% of panel width or 100px to the right, close the panel
    const threshold = Math.max(100, (contentRef.current?.offsetWidth || 0) * 0.2);
    if (dragOffset > threshold) {
      onOpenChange(false);
    } else {
      // Snap back
      setDragOffset(0);
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
        <SheetContent
          ref={contentRef}
          side="right"
        className={cn(
          " bg-[#1e1e1e] border-white/10",
          "overflow-y-auto relative",
          "[&>button]:hidden",
          isDragging && "transition-none"
        )}
          style={{
            transform: dragOffset > 0 ? `translateX(${dragOffset}px)` : undefined,
            position: 'fixed',
            top: '0',
            right: '0',
            bottom: '80px',
            height: 'calc(100dvh - 105px)',
            width: '50%',
            maxWidth: 'none',
            zIndex: 60,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPointerDownOutside={(e) => {
            // Allow closing by clicking outside
            onOpenChange(false);
          }}
          onEscapeKeyDown={() => {
            onOpenChange(false);
          }}
        >

        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="text-white text-2xl font-semibold">
              Settings
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center justify-center p-2 rounded-md",
                "transition-all duration-200 touch-manipulation",
                "min-w-[40px] min-h-[40px]",
                "text-white/60 hover:text-white/80 active:text-white"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </SheetHeader>

        <div 
          className="space-y-2"
          style={{ touchAction: isDragging ? 'none' : 'pan-y' }}
        >
          {/* Settings categories - matching Tesla UI style */}
          {[
            { id: 'controls', label: 'Controls', icon: MdSettings },
            { id: 'dynamics', label: 'Dynamics', icon: MdDirectionsCar },
            { id: 'charging', label: 'Charging', icon: MdEvStation },
            { id: 'autopilot', label: 'Autopilot', icon: MdAutoMode },
            { id: 'locks', label: 'Locks', icon: MdLock },
            { id: 'lights', label: 'Lights', icon: MdLightbulb },
            { id: 'seats', label: 'Seats', icon: MdEventSeat },
            { id: 'display', label: 'Display', icon: MdMonitor },
            { id: 'schedule', label: 'Schedule', icon: MdSchedule },
            { id: 'safety', label: 'Safety', icon: MdShield },
            { id: 'service', label: 'Service', icon: MdBuild },
            { id: 'software', label: 'Software', icon: MdStorage },
            { id: 'navigation', label: 'Navigation', icon: MdNavigation },
            { id: 'trips', label: 'Trips', icon: MdAssessment },
          ].map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-md",
                  "text-left text-white/80 hover:text-white",
                  "hover:bg-white/10 transition-colors",
                  "touch-manipulation"
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <Icon className="w-6 h-6" />
                <span className="text-lg font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

