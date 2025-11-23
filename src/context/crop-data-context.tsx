
"use client";

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { Crop, Region, RainfallDataPoint, RegionName, CropType } from '@/lib/crop-data';
import { UGANDA_INITIAL_CROPS, UGANDA_REGIONS, UGANDA_RAINFALL_DATA } from '@/lib/crop-data';

const LOCAL_STORAGE_CROPS_KEY = "agniro_userCrops_uganda";

interface CropDataContextType {
  crops: Crop[];
  regions: Region[];
  rainfallData: RainfallDataPoint[];
  defaultRegionName?: RegionName;

  addCrop: (newCrop: Omit<Crop, 'id'>) => void;
  deleteCrop: (cropId: string) => void;
  editCrop: (updatedCrop: Crop) => void;
  updateCropImage: (cropId: string, imageDataUri: string | null) => void;
  reorderCrops: (draggedId: string, targetId: string) => void;
  updateCropPlantingDate: (cropId: string, datePlanted: string | null) => void;
}

const CropDataContext = createContext<CropDataContextType | undefined>(undefined);

export function CropDataProvider({ children }: { children: ReactNode }) {
  const [crops, setCrops] = useState<Crop[]>(() => {
    if (typeof window !== 'undefined') {
      const storedCrops = localStorage.getItem(LOCAL_STORAGE_CROPS_KEY);
      if (storedCrops) {
        let parsedCropsSource: any[] = [];
        try {
          parsedCropsSource = JSON.parse(storedCrops);
          if (!Array.isArray(parsedCropsSource)) {
            console.warn("Stored crops data was not an array, resetting to default.");
            parsedCropsSource = [];
          }
        } catch (e) {
          console.error("Failed to parse crops from localStorage for initial state:", e);
          // Fall through to use UGANDA_INITIAL_CROPS if parsing fails
        }

        if (parsedCropsSource.length > 0) {
            return parsedCropsSource
            .map((cropData: any, index: number) => {
                if (!cropData || typeof cropData !== 'object') {
                    console.warn(`Invalid crop data at index ${index}, skipping.`);
                    return null; 
                }
                return {
                    id: cropData.id || `legacy-crop-${index}-${Date.now()}`,
                    name: cropData.name || "Unnamed Crop",
                    region: cropData.region || UGANDA_REGIONS[0]?.name || ("Northern" as RegionName),
                    plantingMonths: Array.isArray(cropData.plantingMonths) ? cropData.plantingMonths : [],
                    weedingInfo: cropData.weedingInfo || "N/A",
                    harvestMonths: Array.isArray(cropData.harvestMonths) ? cropData.harvestMonths : [],
                    type: cropData.type || ("Traditional" as CropType), 
                    notes: cropData.notes || "No notes.",
                    iconHint: cropData.iconHint || "",
                    datePlanted: cropData.datePlanted || undefined,
                    uploadedImageDataUri: cropData.uploadedImageDataUri || undefined,
                };
            })
            .filter((crop): crop is Crop => crop !== null); 
        }
      }
    }
    // Fallback to initial crops if localStorage fails, is empty, or contained only invalid data
    return UGANDA_INITIAL_CROPS.map((crop, index) => ({
        ...crop,
        id: crop.id || `initial-crop-${index}-${Date.now()}`,
        datePlanted: crop.datePlanted || undefined,
        uploadedImageDataUri: crop.uploadedImageDataUri || undefined,
    }));
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CROPS_KEY, JSON.stringify(crops));
    }
  }, [crops]);


  const addCrop = (newCropData: Omit<Crop, 'id' | 'uploadedImageDataUri'> & { uploadedImageDataUri?: string; datePlanted?: string }) => {
    const uniqueId = `ug-${newCropData.region.toLowerCase().replace(/\s+/g, '-')}-${newCropData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    let imageToUse = newCropData.uploadedImageDataUri || undefined;

    const existingCropWithSameNameAndImage = crops.find(
      (c) => c.name.toLowerCase() === newCropData.name.toLowerCase() && c.uploadedImageDataUri
    );

    if (existingCropWithSameNameAndImage && !imageToUse) {
      imageToUse = existingCropWithSameNameAndImage.uploadedImageDataUri;
    }

    const cropWithId: Crop = {
        ...newCropData,
        id: uniqueId,
        datePlanted: newCropData.datePlanted || undefined,
        uploadedImageDataUri: imageToUse,
    };
    setCrops(prevCrops => [cropWithId, ...prevCrops]);
  };

  const deleteCrop = (cropId: string) => {
    setCrops(prevCrops => prevCrops.filter(crop => crop.id !== cropId));
  };

  const editCrop = (updatedCrop: Crop) => {
    setCrops(prevCrops =>
      prevCrops.map(crop => (crop.id === updatedCrop.id ? { ...updatedCrop, datePlanted: updatedCrop.datePlanted || undefined } : crop))
    );
  };

  const updateCropImage = (cropId: string, imageDataUri: string | null) => {
    setCrops(prevCrops =>
      prevCrops.map(crop =>
        crop.id === cropId ? { ...crop, uploadedImageDataUri: imageDataUri || undefined } : crop
      )
    );
  };

  const reorderCrops = (draggedId: string, targetId: string) => {
    setCrops(prevCrops => {
      const currentCrops = Array.from(prevCrops);
      const draggedItem = currentCrops.find(c => c.id === draggedId);

      if (!draggedItem) return prevCrops;

      const itemsWithoutDragged = currentCrops.filter(c => c.id !== draggedId);
      const targetIndexInRemaining = itemsWithoutDragged.findIndex(c => c.id === targetId);

      if (targetIndexInRemaining === -1) {
        itemsWithoutDragged.push(draggedItem);
      } else {
        itemsWithoutDragged.splice(targetIndexInRemaining, 0, draggedItem);
      }
      return itemsWithoutDragged;
    });
  };

  const updateCropPlantingDate = (cropId: string, datePlanted: string | null) => {
    setCrops(prevCrops =>
      prevCrops.map(crop =>
        crop.id === cropId ? { ...crop, datePlanted: datePlanted ?? undefined } : crop
      )
    );
  };


  return (
    <CropDataContext.Provider value={{
      crops,
      regions: UGANDA_REGIONS,
      rainfallData: UGANDA_RAINFALL_DATA,
      defaultRegionName: UGANDA_REGIONS.length > 0 ? UGANDA_REGIONS[0].name : undefined,
      addCrop,
      deleteCrop,
      editCrop,
      updateCropImage,
      reorderCrops,
      updateCropPlantingDate,
    }}>
      {children}
    </CropDataContext.Provider>
  );
}

export function useCropData() {
  const context = useContext(CropDataContext);
  if (context === undefined) {
    throw new Error('useCropData must be used within a CropDataProvider');
  }
  return context;
}
