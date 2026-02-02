"use client";

import { motion } from "framer-motion";
import { MdKeyboardArrowUp } from "react-icons/md";
import { cn } from "@/lib/utils";

interface NavSliderProps {
  onShowNav: () => void;
}

export function NavSlider({ onShowNav }: NavSliderProps) {
  return (
    <motion.button
      onClick={onShowNav}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onShowNav();
      }}
      className={cn(
        "fixed bottom-0 left-1/2 -translate-x-1/2",
        "w-32 h-12 rounded-t-2xl",
        "bg-white/10 hover:bg-white/15 active:bg-white/20",
        "flex items-center justify-center",
        "touch-manipulation",
        "z-50",
        "shadow-lg"
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.1, ease: "easeInOut" }}
    >
      <MdKeyboardArrowUp className="w-8 h-8 text-white" />
    </motion.button>
  );
}

