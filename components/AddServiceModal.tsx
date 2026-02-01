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
import { Input } from "./ui/input";
import { AddCustomServiceDialog } from "./AddCustomServiceDialog";
import { MdAdd } from "react-icons/md";

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTiles: string[];
  onAdd: (serviceIds: string[]) => void;
  customServices: Service[];
  onAddCustomService: (name: string, url: string) => void;
}

export function AddServiceModal({
  open,
  onOpenChange,
  existingTiles,
  onAdd,
  customServices,
  onAddCustomService,
}: AddServiceModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showCustomServiceDialog, setShowCustomServiceDialog] = useState(false);

  // Combine all services (regular + custom)
  const combinedServices = [...allServices, ...customServices];

  const filteredServices = searchQuery
    ? combinedServices.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !existingTiles.includes(s.id)
      )
    : combinedServices.filter(s => !existingTiles.includes(s.id));

  const groupedServices = filteredServices.reduce((acc, service) => {
    // Use 'custom' category for custom services, otherwise use the service's category
    const category = service.id.startsWith('custom-') ? 'custom' : service.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Sort categories: custom first, then others
  const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
    if (a === 'custom') return -1;
    if (b === 'custom') return 1;
    return a.localeCompare(b);
  });

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#252525] text-white max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-semibold">Add Services</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-7 rounded-lg bg-white/5 focus:ring-0 focus:outline-none focus:border-0 text-white placeholder-white/40 mb-6"
              />

              <div className="space-y-6">
                {sortedCategories.map((category) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                      {category === 'custom' ? 'Custom' : category}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {groupedServices[category].map((service) => (
                        <div
                          key={service.id}
                          className={cn(
                            "flex items-center gap-3 px-5 py-4 rounded-lg transition cursor-pointer",
                            selectedServices.has(service.id)
                              ? "bg-white/10"
                              : "bg-white/5 hover:bg-white/10"
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

        <DialogFooter className="flex-row gap-3 justify-between">
          <Button
            onClick={() => setShowCustomServiceDialog(true)}
            className="bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            variant="default"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Custom Service</span>
          </Button>
          <div className="flex gap-3">
            <Button
              variant="default"
              onClick={handleCancel}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selectedServices.size === 0}
              className="bg-white text-black hover:bg-white/90"
              variant="default"
            >
              Add {selectedServices.size > 0 ? `${selectedServices.size} ` : ''}Service{selectedServices.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <AddCustomServiceDialog
        open={showCustomServiceDialog}
        onOpenChange={setShowCustomServiceDialog}
        onAdd={onAddCustomService}
      />
    </>
  );
}

