interface AddTileButtonProps {
  onClick: () => void;
  size?: 'default' | 'large';
}

export function AddTileButton({ onClick, size = 'default' }: AddTileButtonProps) {
  const isLarge = size === 'large';
  
  return (
    <div
      onClick={onClick}
      className={`
        ${isLarge ? 'w-[200px] h-[100px]' : 'aspect-[6/3]'}
        rounded-xl bg-white/5 border-2 border-dashed border-white/20 
        hover:border-white/40 hover:bg-white/10 
        transition-all duration-200 cursor-pointer 
        flex flex-col items-center justify-center
        touch-manipulation
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      <div className={`${isLarge ? 'text-5xl mb-3' : 'text-3xl mb-2'} text-white/60`}>+</div>
      <div className={`${isLarge ? 'text-base' : 'text-xs'} text-white/40`}>Add Tile</div>
    </div>
  );
}

