import { useState } from "react";
import { Service, allServices, getLogoUrl, getFallbackLogoUrl, getSecondFallbackLogoUrl } from "@/app/data/services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTiles: string[];
  onAdd: (serviceIds: string[]) => void;
}

export function AddServiceModal({
  open,
  onOpenChange,
  existingTiles,
  onAdd,
}: AddServiceModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  const filteredServices = searchQuery
    ? allServices.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !existingTiles.includes(s.id)
      )
    : allServices.filter(s => !existingTiles.includes(s.id));

  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const toggleServiceSelection = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleAdd = () => {
    onAdd(Array.from(selectedServices));
    setSelectedServices(new Set());
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedServices(new Set());
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#252525] border-white/10 text-white max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Add Services</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40 mb-6"
          />

          <div className="space-y-6">
            {Object.entries(groupedServices).map(([category, services]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg border transition cursor-pointer",
                        selectedServices.has(service.id)
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                      onClick={() => toggleServiceSelection(service.id)}
                    >
                      <Checkbox
                        checked={selectedServices.has(service.id)}
                        onCheckedChange={() => toggleServiceSelection(service.id)}
                      />
                      <img
                        src={getLogoUrl(service)}
                        alt={service.name}
                        className="w-6 h-6 object-contain flex-shrink-0 rounded-[7px]"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          // Try fallbacks
                          if (!img.src.includes('favicon.ico')) {
                            img.src = getFallbackLogoUrl(service);
                          } else if (!img.src.includes('google.com')) {
                            img.src = getSecondFallbackLogoUrl(service);
                          } else {
                            img.style.display = 'none';
                          }
                        }}
                      />
                      <div className="text-sm font-medium text-white flex-1">
                        {service.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedServices.size === 0}
            className="bg-white text-black hover:bg-white/90"
          >
            Add {selectedServices.size > 0 ? `${selectedServices.size} ` : ''}Service{selectedServices.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

