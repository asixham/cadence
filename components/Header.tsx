import { Button } from "@/components/ui/button";

interface HeaderProps {
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function Header({ isEditing, onToggleEdit }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Cadence</h1>
        <p className="text-xs text-white/60">Your entertainment hub</p>
      </div>
      <Button
        onClick={onToggleEdit}
        variant="outline"
        className="bg-white/10 text-white hover:bg-white/20"
      >
        {isEditing ? 'Done' : 'Edit'}
      </Button>
    </div>
  );
}

