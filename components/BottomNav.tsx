import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Grid3x3, Tv, Music, Gamepad2, Edit2, Check } from "lucide-react";

type Category = 'all' | 'streaming' | 'music' | 'games';

interface BottomNavProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function BottomNav({ activeCategory, onCategoryChange, isEditing, onToggleEdit }: BottomNavProps) {
  const categories: { id: Category; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', icon: Grid3x3 },
    { id: 'streaming', icon: Tv },
    { id: 'music', icon: Music },
    { id: 'games', icon: Gamepad2 },
  ];

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
    <div className="w-full bg-[#1e1e1e] border-t border-white/10 py-3 px-6">
      <div className="flex items-center justify-between w-full">
        {/* Left: Edit button */}
        <div className="flex items-center min-w-[200px]">
          <button
            onClick={onToggleEdit}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleEdit();
            }}
            className={cn(
              "flex items-center justify-center p-2 rounded-full",
              "transition-all duration-200 touch-manipulation",
              "min-w-[50px] min-h-[50px]",
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
              <Check className="w-6 h-6" />
            ) : (
              <Edit2 className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Middle: Category icons in pill-shaped container */}
        <div className="flex items-center gap-12 bg-[#252525] rounded-full px-10 py-2">
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
                  "flex items-center justify-center p-3 rounded-full",
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
                <Icon className="w-7 h-7" />
              </button>
            );
          })}
        </div>

        {/* Right: Date and time */}
        <div className="text-white/80 text-lg font-medium min-w-[200px] text-right">
          <span className="text-white/40 text-xl font-bold">{dateTime}</span> 
        </div>
      </div>
    </div>
  );
}

