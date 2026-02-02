"use client";

import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { MdClose, MdGridOn, MdPalette, MdTune, MdSearch, MdSettings, MdRefresh, MdInfo, MdLink, MdWork, MdMic, MdSend } from "react-icons/md";
import { cn } from "@/lib/utils";
import { AppSettings } from "@/app/hooks/useSettings";
import { Button } from "./ui/button";
import { BetaBadge } from "./BetaBadge";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

type SettingsCategory = 'layout' | 'appearance' | 'behavior' | 'general' | 'about';

export function SettingsPanel({ open, onOpenChange, settings, updateSetting, resetSettings }: SettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('layout');
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recognitionRef = useRef<any>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't start dragging if touch is on an interactive element (slider, button, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('[role="slider"], button, input, select')) {
      return;
    }
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't handle if touch is on an interactive element
    const target = e.target as HTMLElement;
    if (target.closest('[role="slider"], button, input, select')) {
      return;
    }
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - startY.current);
    
    if (!isDragging && Math.abs(deltaX) > 10 && Math.abs(deltaX) > deltaY * 1.5 && deltaX < 0) {
      setIsDragging(true);
    }
    
    if (isDragging && deltaX < 0) {
      e.preventDefault();
      e.stopPropagation();
      setDragOffset(Math.min(Math.abs(deltaX), 400));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = Math.max(100, (contentRef.current?.offsetWidth || 0) * 0.2);
    if (dragOffset > threshold) {
      onOpenChange(false);
    } else {
      setDragOffset(0);
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setFeedbackMessage((prev: string) => prev + finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: feedbackMessage.trim(),
          email: feedbackEmail.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Thank you for your feedback!');
        setFeedbackMessage('');
        setFeedbackEmail('');
        setShowFeedbackDialog(false);
      } else {
        alert('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { id: SettingsCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'layout', label: 'Layout', icon: MdGridOn },
    { id: 'appearance', label: 'Appearance', icon: MdPalette },
    { id: 'behavior', label: 'Behavior', icon: MdTune },
    { id: 'general', label: 'General', icon: MdSettings },
    { id: 'about', label: 'About', icon: MdInfo },
  ];

  const filteredCategories = categories.filter(cat =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent
        ref={contentRef}
        side="left"
        className={cn(
          "bg-[#1e1e1e] p-0",
          "overflow-hidden relative",
          "[&>button]:hidden",
          isDragging && "transition-none"
        )}
        style={{
          transform: dragOffset > 0 ? `translateX(-${dragOffset}px)` : undefined,
          position: 'fixed',
          top: '0',
          left: '0',
          bottom: '80px',
          height: 'calc(100dvh - 105px)',
          width: '75%',
          maxWidth: 'none',
          zIndex: 60,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDownOutside={(e) => {
          onOpenChange(false);
        }}
        onEscapeKeyDown={() => {
          onOpenChange(false);
        }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Search bar at top */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="relative">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 text-white/60" />
              <Input
                type="text"
                placeholder="Search Settings"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-15 pr-4 py-4 text-lg bg-transparent text-white placeholder-white/40 h-14"
                autoFocus={false}
                tabIndex={-1}
              />
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden py-2" style={{ minHeight: 0 }}>
            {/* Category list on left */}
            <div 
              className="overflow-y-auto bg-[#1e1e1e] relative"
              style={{ 
                width: '350px', 
                minWidth: '350px', 
                maxWidth: '350px',
                flexShrink: 0,
                flexGrow: 0,
                zIndex: 10,
              }}
            >
              <div className="py-2 px-6">
                {filteredCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  return (
                    <Button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      variant="ghost"
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCategory(category.id);
                      }}
                      className={cn(
                        "w-full justify-start flex gap-4 px-4 py-5 rounded-lg my-1",
                        "transition-all duration-200 touch-manipulation",
                        "text-left",
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:text-white/80 active:text-white hover:bg-white/5"
                      )}
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        minHeight: '64px',
                      }}
                    >
                      <Icon className="w-12 h-12" />
                      <span className="text-xl font-medium">{category.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Settings content on right */}
            <div 
              className="flex-1 overflow-y-auto px-6 py-2" 
              style={{ 
                touchAction: isDragging ? 'none' : 'pan-y', 
                minWidth: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {activeCategory === 'general' && (
                <div className="space-y-8">
                  <div>
                    <label className="text-white/80 text-xl font-medium mb-4 block">
                      Reset Settings
                    </label>
                    <p className="text-white/60 text-base mb-6">
                      Reset all settings to their default values. This action cannot be undone.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-3 px-6 py-4 rounded-lg",
                            "transition-all duration-200 touch-manipulation",
                            "bg-red-500/20 text-white",
                            "hover:bg-red-500/30",
                            "active:bg-red-500/40"
                          )}
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            minHeight: '64px',
                          }}
                        >
                          <MdRefresh className="w-6 h-6" />
                          <span className="text-lg font-medium">Reset to Default</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#1e1e1e] text-white max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white text-2xl font-semibold">
                            Reset Settings
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/60 text-base">
                            Are you sure you want to reset all settings to their default values? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row gap-3 sm:justify-end">
                          <AlertDialogCancel
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
                            onClick={resetSettings}
                            className={cn(
                              "flex-1 sm:flex-initial px-6 py-4 rounded-lg",
                              "bg-red-500/20 text-white",
                              "hover:bg-red-500/30",
                              "text-lg font-medium",
                              "touch-manipulation"
                            )}
                            style={{
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation',
                              minHeight: '56px',
                            }}
                          >
                            Reset
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              {activeCategory === 'layout' && (
                <div className="space-y-8">
                  <div>
                    <label className="text-white/80 text-xl font-medium mb-4 block">
                      Columns per Row
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[3, 4, 5, 6].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => updateSetting('columns', cols)}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateSetting('columns', cols);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg",
                            "transition-all duration-200 touch-manipulation",
                            settings.columns === cols
                              ? "bg-white/15 text-white"
                              : "bg-white/5 text-white/60 hover:text-white/80"
                          )}
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                          }}
                        >
                          <div className="flex gap-1">
                            {Array.from({ length: cols }).map((_, i) => (
                              <div
                                key={i}
                                className="w-3 h-3 bg-white/40 rounded-sm"
                              />
                            ))}
                          </div>
                          <span className="text-base font-medium">{cols}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-white/80 text-xl font-medium mb-4 block">
                      Tile Size
                    </label>
                    <Select
                      value={settings.tileSize}
                      onValueChange={(value: AppSettings['tileSize']) => updateSetting('tileSize', value)}
                    >
                      <SelectTrigger className="w-full bg-white/5 text-white h-14 text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e1e1e] z-[100]" style={{ zIndex: 100 }}>
                        <SelectItem value="small" className="text-white text-lg py-3">Small (80px)</SelectItem>
                        <SelectItem value="medium" className="text-white text-lg py-3">Medium (120px)</SelectItem>
                        <SelectItem value="large" className="text-white text-lg py-3">Large (160px)</SelectItem>
                        <SelectItem value="custom" className="text-white text-lg py-3">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.tileSize === 'custom' && (
                    <div>
                      <label className="text-white/80 text-xl font-medium mb-4 block">
                        Custom Tile Size
                      </label>
                      <Select
                        value={settings.customTileSize.toString()}
                        onValueChange={(value) => updateSetting('customTileSize', parseInt(value))}
                      >
                        <SelectTrigger className="w-full bg-white/5 text-white h-14 text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1e1e] z-[100]" style={{ zIndex: 100 }}>
                          {[60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200].map((size) => (
                            <SelectItem key={size} value={size.toString()} className="text-white text-lg py-3">
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="text-white/80 text-xl font-medium mb-4 block">
                      Gap Between Tiles
                    </label>
                    <div className="flex gap-4">
                      {[8, 16, 24, 32].map((gap) => (
                        <button
                          key={gap}
                          onClick={() => updateSetting('gap', gap)}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateSetting('gap', gap);
                          }}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-3 p-4 rounded-lg",
                            "transition-all duration-200 touch-manipulation",
                            settings.gap === gap
                              ? "bg-white/15 text-white"
                              : "bg-white/5 text-white/60 hover:text-white/80"
                          )}
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                          }}
                        >
                          <div className="flex gap-1 items-center">
                            <div className="w-8 h-8 bg-white/40 rounded" />
                            <div 
                              className="bg-white/20"
                              style={{ width: `${gap}px`, height: '4px' }}
                            />
                            <div className="w-8 h-8 bg-white/40 rounded" />
                          </div>
                          <span className="text-base font-medium">{gap}px</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'appearance' && (
                <div className="space-y-8">
                  <div>
                    <label className="text-white/80 text-xl font-medium mb-4 block">
                      Tile Border Radius
                    </label>
                    <div className="flex gap-4">
                      {[0, 8, 12, 16].map((radius) => (
                        <button
                          key={radius}
                          onClick={() => updateSetting('tileBorderRadius', radius)}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateSetting('tileBorderRadius', radius);
                          }}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-3 p-4 rounded-lg",
                            "transition-all duration-200 touch-manipulation",
                            settings.tileBorderRadius === radius
                              ? "bg-white/15 text-white"
                              : "bg-white/5 text-white/60 hover:text-white/80"
                          )}
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                          }}
                        >
                          <div
                            className="w-20 h-12 bg-gradient-to-br from-[#252525] to-[#1e1e1e]"
                            style={{ borderRadius: `${radius}px` }}
                          />
                          <span className="text-base font-medium">{radius}px</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <label className="text-white/80 text-xl font-medium block">
                        Show Tile Labels
                      </label>
                      <p className="text-white/60 text-base mt-2">Display service names below tiles</p>
                    </div>
                    <Switch
                      checked={settings.showTileLabels}
                      onCheckedChange={(checked) => updateSetting('showTileLabels', checked)}
                      className="scale-125"
                    />
                  </div>
                </div>
              )}

              {activeCategory === 'behavior' && (
                <div className="space-y-8">
                  <div>
                    <label className="text-white/80 text-xl font-medium mb-4 block">
                      Animation Speed
                    </label>
                    <Select
                      value={settings.animationSpeed}
                      onValueChange={(value: AppSettings['animationSpeed']) => updateSetting('animationSpeed', value)}
                    >
                      <SelectTrigger className="w-full bg-white/5 text-white h-14 text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e1e1e] z-[100]" style={{ zIndex: 100 }}>
                        <SelectItem value="fast" className="text-white text-lg py-3">Fast</SelectItem>
                        <SelectItem value="normal" className="text-white text-lg py-3">Normal</SelectItem>
                        <SelectItem value="slow" className="text-white text-lg py-3">Slow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <label className="text-white/80 text-xl font-medium">
                            App Embedding
                          </label>
                          <BetaBadge />
                        </div>
                        <Switch
                          checked={settings.launchInIframe}
                          onCheckedChange={(checked) => updateSetting('launchInIframe', checked)}
                          className="scale-125"
                        />
                      </div>
                      <p className="text-white/60 text-base">
                        Launch apps within Cadence instead of navigating away. Not all apps support this feature.
                      </p>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between py-4 pl-4 border-l-2 transition-colors",
                      settings.launchInIframe 
                        ? "border-white/20" 
                        : "border-white/5 opacity-50"
                    )}>
                      <div className="flex-1">
                        <label 
                          className={cn(
                            "text-white/80 text-xl font-medium block",
                            !settings.launchInIframe && "text-white/40"
                          )}
                        >
                          Show Embedding Warning
                        </label>
                        <p className={cn(
                          "text-white/60 text-base mt-2",
                          !settings.launchInIframe && "text-white/30"
                        )}>
                          Display a warning when launching embeddable apps about potential blocked links
                        </p>
                      </div>
                      <Switch
                        checked={settings.showEmbeddingWarning}
                        onCheckedChange={(checked) => updateSetting('showEmbeddingWarning', checked)}
                        disabled={!settings.launchInIframe}
                        className="scale-125"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'about' && (
                <div className="space-y-8">
                  {/* Cadence Logo and Version */}
                  <div className="flex flex-col gap-2 py-4">
                    <div className="text-4xl font-bold text-white/50 tracking-tight">
                      Cadence
                    </div>
                    <div className="text-white/60 text-sm">
                      Version 0.1.0
                    </div>
                    <div className="text-white/60 text-sm">
                      Made by Anthony Ham
                    </div>
                    {/* Social Icons */}
                    <div className="flex items-center gap-4 mt-2">
                      <a
                        href="https://www.linkedin.com/in/xnthiny"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg",
                          "bg-white/5",
                          "hover:bg-white/10",
                          "transition-all duration-200 touch-manipulation",
                          "text-white"
                        )}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation',
                        }}
                      >
                        <MdWork className="w-5 h-5" />
                      </a>
                      <a
                        href="https://anthonymham.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg",
                          "bg-white/5",
                          "hover:bg-white/10",
                          "transition-all duration-200 touch-manipulation",
                          "text-white"
                        )}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation',
                        }}
                      >
                        <MdLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="my-8" />

                  {/* Description */}
                  <div className="space-y-4">
                    <div className="text-white/80 text-base leading-relaxed">
                      Cadence is a customizable entertainment hub designed for Tesla vehicles. It provides quick access to your favorite streaming services, music platforms, web apps, and games in a clean, touch-friendly interface.
                    </div>
                    <div className="text-white/60 text-sm leading-relaxed">
                      Customize your layout, appearance, and behavior to create the perfect entertainment experience for your drive.
                    </div>
                  </div>

                  {/* Feedback Button */}
                  <div className="pt-4">
                    <Button
                      onClick={() => setShowFeedbackDialog(true)}
                      variant="default"
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowFeedbackDialog(true);
                      }}
                      className={cn(
                        "bg-white/10 hover:bg-white/20 flex gap-3 px-6 py-4 rounded-lg",
                        "justify-start",
                        "transition-all duration-200 touch-manipulation",
                        "text-white"
                      )}
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        minHeight: '64px',
                      }}
                    >
                      <MdSend className="w-6 h-6 text-white/80" />
                      <span className="text-lg font-medium">Send Feedback</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent 
          className="bg-[#1e1e1e] text-white max-w-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-semibold">
              Send Feedback
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-white/60 text-base">
            Share your thoughts, suggestions, or report issues. Your feedback helps improve Cadence.
          </DialogDescription>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-white/80 text-base font-medium mb-2 block">
                Message
              </label>
              <Textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Enter your feedback..."
                className="w-full px-4 py-3 rounded-lg bg-white/5 text-white placeholder-white/40 text-base min-h-[120px] resize-none focus:ring-0"
                rows={5}
                autoFocus={false}
              />
            </div>

            <div>
              <label className="text-white/80 text-base font-medium mb-2 block">
                Email (optional)
              </label>
              <Input
                type="email"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-white/5 text-white placeholder-white/40 focus:ring-0 focus:outline-none h-14 text-base"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleVoiceInput}
                disabled={isRecording}
                variant="default"
                className={cn(
                  "flex items-center gap-2",
                  "transition-all duration-200 touch-manipulation",
                  isRecording
                    ? "bg-red-500/20 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <MdMic className={cn("w-5 h-5", isRecording && "animate-pulse")} />
                <span className="text-base font-medium">
                  {isRecording ? "Recording..." : "Use Microphone"}
                </span>
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <DialogClose
              className={cn(
                "px-6 py-4 rounded-lg",
                "bg-white/5 text-white",
                "hover:bg-white/10",
                "text-lg font-medium touch-manipulation"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedbackMessage.trim() || isSubmitting}
              variant="default"
              className={cn(
                "bg-white/15 text-white",
                "hover:bg-white/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-lg font-medium touch-manipulation"
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '56px',
              }}
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
