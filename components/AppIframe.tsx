"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { openWithYouTubeRedirect } from "@/app/utils/navigationUtils";
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

interface AppIframeProps {
  url: string;
  isNavVisible: boolean;
  onClose: () => void;
}

export function AppIframe({ url, isNavVisible, onClose }: AppIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasError, setHasError] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContinue = () => {
    onClose();
    setTimeout(() => {
      openWithYouTubeRedirect(url);
    }, 100);
  };

  const handleGoHome = () => {
    onClose();
  };

  return (
    <>
      <AlertDialog open={hasError} onOpenChange={() => {}}>
        <AlertDialogContent className="bg-[#1e1e1e] text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-2xl font-semibold">
              App Not Supported
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 text-base">
              This app does not support Cadence embedding. Would you like to visit it anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-end">
            <AlertDialogCancel
              onClick={handleGoHome}
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
              onClick={handleContinue}
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

      <iframe
        ref={iframeRef}
        src={url}
        className={cn(
          "w-full bg-[#0a0a0a]",
          isNavVisible ? "h-[calc(100dvh-80px)]" : "h-dvh"
        )}
        style={{
          transition: 'height 0.3s ease-in-out',
        }}
        allow="fullscreen"
        allowFullScreen
      />
    </>
  );
}

