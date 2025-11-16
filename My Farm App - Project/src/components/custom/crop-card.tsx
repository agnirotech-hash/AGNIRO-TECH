
"use client";

import type { Crop } from "@/lib/crop-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthTimeline } from "./month-timeline";
import { Coffee, Sun, Bot, Trash2, Pencil, AlertTriangle, UploadCloud, Leaf, CalendarIcon as CalendarIconLucide } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useCropData } from "@/context/crop-data-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";


interface CropCardProps {
  crop: Crop | null | undefined;
  onOpenAiAdvisor: (crop: Crop) => void;
  onDeleteCrop: (cropId: string) => void;
  onOpenGrowthTracker: (crop: Crop) => void; 
  regionAccentVar?: string;
}

const getIconFallback = (crop: Crop): React.ReactNode => {
  const hint = crop.iconHint?.toLowerCase() || "";
  const name = crop.name.toLowerCase();

  if (hint.includes("coffee") || name.includes("coffee")) {
    return <Coffee className="h-6 w-6" />;
  }
  if (hint.includes("sunflower") || name.includes("sunflower")) {
    return <Sun className="h-6 w-6" />;
  }
  // Default placeholder
  return <Image src="https://placehold.co/40x40.png" alt={crop.name} width={24} height={24} className="rounded-sm object-cover" data-ai-hint={crop.iconHint || "plant leaf"} />;
};


export function CropCard({ crop, onOpenAiAdvisor, onDeleteCrop, onOpenGrowthTracker, regionAccentVar }: CropCardProps) {
  const { updateCropImage, reorderCrops, updateCropPlantingDate } = useCropData();
  const { toast } = useToast();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, cropId: string) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUri = reader.result as string;
        updateCropImage(cropId, imageDataUri);
        toast({ title: "Crop Image Updated", description: "Image will be used for this crop in this session." });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "Image Upload Error", description: "Could not read the image file." });
      };
      reader.readAsDataURL(file);
    } else if (file) {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please select an image file." });
    }
  }, [updateCropImage, toast]);


  if (!crop || !crop.id) { 
    console.warn("CropCard received null, undefined, or ID-less crop prop:", crop);
    return (
      <Card className="flex flex-col h-full shadow-lg border-destructive bg-destructive/10">
        <CardHeader className="flex-row items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">Invalid crop data provided to card.</p>
        </CardContent>
      </Card>
    );
  }

  const IconDisplay = crop.uploadedImageDataUri ? (
    <Image src={crop.uploadedImageDataUri} alt={crop.name} width={40} height={40} className="rounded-md object-cover" />
  ) : (
    getIconFallback(crop)
  );

  const imageInputId = `upload-crop-${crop.id}`;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/crop-id", crop.id);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging-card");
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("dragging-card");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.currentTarget.classList.add("drag-over-card");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("drag-over-card");
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over-card");
    const draggedId = e.dataTransfer.getData("application/crop-id");
    if (draggedId && draggedId !== crop.id) {
      reorderCrops(draggedId, crop.id);
    }
  };

  return (
    <Card
      className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow"
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      id={`crop-card-${crop.id}`} 
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">{crop.name}</CardTitle>
            {crop.type && (
              <Badge variant={crop.type === "Modern" ? "default" : "secondary"}
                    className={`mt-1 ${crop.type === "Modern" ? `bg-accent text-accent-foreground` : `bg-secondary text-secondary-foreground`}`} >
                {crop.type}
              </Badge>
            )}
          </div>
          <div className="p-1 rounded-md flex-shrink-0" style={regionAccentVar ? { backgroundColor: `hsl(var(${regionAccentVar}-bg) / 0.3)`} : {}} >
             {IconDisplay}
          </div>
        </div>
         <div className="mt-2">
            <Label htmlFor={imageInputId} className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
                <UploadCloud className="h-3 w-3" /> Change Image (Session)
            </Label>
            <Input
                id={imageInputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, crop.id)}
            />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-3">{crop.notes}</p>
        <div>
          <h4 className="text-sm font-medium mb-1">Planting & Harvest Calendar:</h4>
          <MonthTimeline 
            plantingMonths={crop.plantingMonths} 
            harvestMonths={crop.harvestMonths}
            regionAccentVar={regionAccentVar}
          />
        </div>
        {crop.weedingInfo && crop.weedingInfo.toLowerCase() !== "n/a" && crop.weedingInfo.toLowerCase() !== "minimal" && (
          <p className="text-xs text-muted-foreground mt-3">
            <span className="font-medium">Weeding:</span> {crop.weedingInfo}
          </p>
        )}
         <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Date Planted: {crop.datePlanted ? format(new Date(crop.datePlanted), "PPP") : <em className="text-xs">Not set</em>}
            </p>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7">
                    <CalendarIconLucide className="h-4 w-4" />
                    <span className="sr-only">Set Planting Date</span>
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={crop.datePlanted ? new Date(crop.datePlanted) : undefined}
                    onSelect={(date) => {
                    updateCropPlantingDate(crop.id, date ? date.toISOString() : null);
                    setIsDatePickerOpen(false);
                    toast({title: "Planting Date Updated", description: `${crop.name} planting date ${date ? 'set to ' + format(date, "PPP") : 'cleared'}.`})
                    }}
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAiAdvisor(crop)}
              className="flex-1 min-w-[120px] hover:bg-accent hover:text-accent-foreground"
            >
              <Bot className="mr-2 h-4 w-4" /> AI Advisor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenGrowthTracker(crop)}
              className="flex-1 min-w-[120px] hover:bg-primary/10 hover:border-primary"
            >
              <Leaf className="mr-2 h-4 w-4" /> CGT
            </Button>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
            <Button asChild variant="outline" size="icon" className="hover:border-primary hover:text-primary" aria-label={`Edit ${crop.name}`}>
                <Link href={`/edit-crop/${crop.id}`}>
                    <Pencil className="h-4 w-4" />
                </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDeleteCrop(crop.id)}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              aria-label={`Delete ${crop.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
