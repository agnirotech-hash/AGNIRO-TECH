
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Crop } from "@/lib/crop-data";
import { CropGrowthTrackerForm } from "./crop-growth-tracker-form";

interface CropGrowthTrackerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedCrop: Crop | null;
}

export function CropGrowthTrackerDialog({ isOpen, onOpenChange, selectedCrop }: CropGrowthTrackerDialogProps) {
  if (!selectedCrop) { 
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[800px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crop Growth Tracker & Health Analyzer</DialogTitle>
          <DialogDescription>
            Analyze <span className="font-semibold text-primary">{selectedCrop.name}</span> health by uploading an image and get simulated growth advice.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CropGrowthTrackerForm 
            selectedCrop={selectedCrop}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

    