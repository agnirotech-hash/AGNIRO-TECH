
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Crop, RegionName } from "@/lib/crop-data";
import { AiAdvisorForm } from "./ai-advisor-form";

interface AiAdvisorDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedCrop: Crop | null;
  selectedRegion: RegionName | null;
  // selectedCountryName prop removed, as it's always Uganda
}

export function AiAdvisorDialog({ isOpen, onOpenChange, selectedCrop, selectedRegion }: AiAdvisorDialogProps) {
  if (!selectedCrop) { 
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl">AI Planting Advisor</DialogTitle>
          <DialogDescription>
            Get AI-powered advice for <span className="font-semibold text-primary">{selectedCrop.name}</span> 
            {selectedRegion ? <> in the <span className="font-semibold text-primary">{selectedRegion}</span> region</> : ''}
            {' '}of <span className="font-semibold text-primary">Uganda</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AiAdvisorForm 
            selectedCrop={selectedCrop} 
            selectedRegion={selectedRegion} 
            // selectedCountryName prop removed
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
