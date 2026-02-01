"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddCustomServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, url: string) => void;
}

export function AddCustomServiceDialog({
  open,
  onOpenChange,
  onAdd,
}: AddCustomServiceDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    // Reset error
    setError("");

    // Validate inputs
    if (!name.trim()) {
      setError("Service name is required");
      return;
    }

    if (!url.trim()) {
      setError("Service URL is required");
      return;
    }

    // Validate URL format
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    // Add the service
    onAdd(name.trim(), formattedUrl);
    
    // Reset form
    setName("");
    setUrl("");
    setError("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName("");
    setUrl("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className="bg-[#252525] text-white max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{ zIndex: 90 }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-semibold">
            Add Custom Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-white/80 text-base font-medium mb-2 block">
              Service Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g., My Custom App"
              className="w-full bg-white/5 text-white placeholder-white/40 focus:ring-0 focus:outline-none h-14 text-base"
              autoFocus={false}
            />
          </div>

          <div>
            <label className="text-white/80 text-base font-medium mb-2 block">
              Service URL
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="https://example.com"
              className="w-full bg-white/5 text-white placeholder-white/40 focus:ring-0 focus:outline-none h-14 text-base"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-end">
          <Button
            variant="default"
            onClick={handleCancel}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !url.trim()}
            className="bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            variant="default"
          >
            Add Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

