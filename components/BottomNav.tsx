import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MdGridOn, MdTv, MdMusicNote, MdSportsEsports, MdEdit, MdCheck, MdSettings, MdFullscreen } from "react-icons/md";
import { isFullscreen, getAppUrl } from "@/app/utils/navigationUtils";
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

type Category = 'all' | 'streaming' | 'music' | 'games';

interface BottomNavProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
}

export function BottomNav({ activeCategory, onCategoryChange, isEditing, onToggleEdit, onOpenSettings, isSettingsOpen }: BottomNavProps) {
  const [isInFullscreen, setIsInFullscreen] = useState(false);
  
  const categories: { id: Category; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', icon: MdGridOn },
    { id: 'streaming', icon: MdTv },
    { id: 'music', icon: MdMusicNote },
    { id: 'games', icon: MdSportsEsports },
  ];

  // Check Tesla Theater mode status
  useEffect(() => {
    const checkFullscreen = () => {
      setIsInFullscreen(isFullscreen());
    };
    
    checkFullscreen();
    
    // Check again after a short delay to catch referrer changes
    const timeout = setTimeout(checkFullscreen, 100);
    
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const [showFullscreenDialog, setShowFullscreenDialog] = useState(false);

  const handleFullscreenConfirm = () => {
    const appUrl = getAppUrl();
    const encodedUrl = encodeURIComponent(appUrl);
    const redirectUrl = `https://www.youtube.com/redirect?q=${encodedUrl}`;
    
    window.location.href = redirectUrl;
  };

  // Get current date and time
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${day}, ${month} ${date}, ${displayHours}:${displayMinutes} ${ampm}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = days[now.getDay()];
      const month = months[now.getMonth()];
      const date = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      setDateTime(`${day}, ${month} ${date}, ${displayHours}:${displayMinutes} ${ampm}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black py-3 px-6 relative z-50">
      <div className="flex items-center justify-between w-full">
        {/* Left: Settings button and Fullscreen button */}
        <div className="flex items-center gap-4 min-w-[200px]">
          {!isInFullscreen && (
            <AlertDialog open={showFullscreenDialog} onOpenChange={setShowFullscreenDialog}>
              <AlertDialogTrigger asChild>
                <button
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFullscreenDialog(true);
                  }}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-md",
                    "transition-all duration-200 touch-manipulation",
                    "min-w-[60px] min-h-[60px]",
                    "text-white/60 hover:text-white/80 active:text-white"
                  )}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <MdFullscreen className="w-8 h-8" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#1e1e1e] text-white max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white text-2xl font-semibold">
                    Enter Fullscreen Mode
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60 text-base">
                    After clicking "Go to site" on the next page, the app will open in fullscreen mode.
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
                    onClick={handleFullscreenConfirm}
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
          )}
          <button
            onClick={onOpenSettings}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenSettings();
            }}
            className={cn(
              "flex items-center justify-center p-2 rounded-md",
              "transition-all duration-200 touch-manipulation",
              "min-w-[60px] min-h-[60px]",
              isSettingsOpen
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white/80 active:text-white"
            )}
            style={{
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <MdSettings className="w-8 h-8" />
          </button>
        </div>

        {/* Middle: Category icons in pill-shaped container */}
        <div className="flex items-center gap-16 rounded-md px-2 py-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCategoryChange(category.id);
                }}
                className={cn(
                  "flex items-center justify-center p-2 rounded-md",
                  "transition-all duration-200 touch-manipulation",
                  "min-w-[60px] min-h-[60px]",
                  activeCategory === category.id
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white/80 active:text-white"
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <Icon className="w-8 h-8" />
              </button>
            );
          })}
        </div>

        {/* Right: Edit button */}
        <div className="flex items-center gap-4 min-w-[200px] justify-end">
          <button
            onClick={onToggleEdit}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleEdit();
            }}
            className={cn(
              "flex items-center justify-center p-2 rounded-md",
              "transition-all duration-200 touch-manipulation",
              "min-w-[60px] min-h-[60px]",
              isEditing
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white/80 active:text-white"
            )}
            style={{
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {isEditing ? (
              <MdCheck className="w-8 h-8" />
            ) : (
              <MdEdit className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

