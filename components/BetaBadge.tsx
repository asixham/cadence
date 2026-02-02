"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { MdInfo } from "react-icons/md";

interface BetaBadgeProps {
  className?: string;
}

export function BetaBadge({ className }: BetaBadgeProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDialog(true);
        }}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-md",
          "bg-yellow-500/20 text-yellow-400",
          "hover:bg-yellow-500/30 active:bg-yellow-500/40",
          "transition-all duration-200 touch-manipulation",
          "text-xs font-medium",
          className
        )}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        <span className="text-md">BETA</span>
        <MdInfo className="w-4 h-4" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog} modal={true}>
        <DialogContent className="bg-[#1e1e1e] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-semibold">
              Beta Features
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-white/60 text-base">
            Beta features are experimental and may have unexpected behavior or limitations. 
            They're provided to give you early access to new functionality.
          </DialogDescription>

          <div className="space-y-4 py-4">
            <div className="text-white/80 text-base leading-relaxed">
              <p className="mb-3">
                <strong>What to expect:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-white/60 text-sm ml-2">
                <li>Features may not work as expected</li>
                <li>Some functionality might be incomplete</li>
                <li>You may encounter bugs or errors</li>
                <li>Settings or behavior may change in future updates</li>
              </ul>
            </div>

            <div className="text-white/80 text-base leading-relaxed">
              <p className="mb-2">
                <strong>Recommendation:</strong>
              </p>
              <p className="text-white/60 text-sm">
                Only use beta features if you're confident with navigating Cadence and 
                comfortable troubleshooting if something doesn't work as expected.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

