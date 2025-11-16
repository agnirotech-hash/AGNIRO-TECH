
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Crop, RegionName, CropType, Region } from "@/lib/crop-data";
import { ALL_MONTHS, UGANDA_REGIONS, UGANDA_RAINFALL_DATA } from "@/lib/crop-data"; // Direct import for Uganda data
import { useCropData } from "@/context/crop-data-context";
import { CropCard } from "@/components/custom/crop-card";
import { AiAdvisorDialog } from "@/components/custom/ai-advisor-dialog";
import { RegionMap } from "@/components/custom/region-map";
import { RainfallChart } from "@/components/custom/rainfall-chart";
import { FarmingArticles } from "@/components/custom/farming-articles";
import { AiChatbotSheet } from "@/components/custom/ai-chatbot-sheet"; 
import { CropGrowthTrackerDialog } from "@/components/custom/crop-growth-tracker-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter, CalendarDays, Info, PlusCircle, AreaChart, Map as MapIcon, Trash2, Newspaper, Leaf } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";


export default function HomePage() {
  const {
    crops: CROPS_DATA_FOR_UGANDA,
    deleteCrop,
    regions,
    defaultRegionName
  } = useCropData();

  const [selectedRegion, setSelectedRegion] = useState<RegionName | undefined>(undefined);
  const [selectedCropType, setSelectedCropType] = useState<CropType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMonth, setCurrentMonth] = useState<string>("All");

  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [selectedCropForAI, setSelectedCropForAI] = useState<Crop | null>(null);

  const [isGrowthTrackerOpen, setIsGrowthTrackerOpen] = useState(false);
  const [selectedCropForGrowthTracker, setSelectedCropForGrowthTracker] = useState<Crop | null>(null);


  const [activeInsightsTab, setActiveInsightsTab] = useState<"articles" | "map" | "rain">("articles"); 

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cropToDeleteId, setCropToDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (regions && regions.length > 0) {
      const initialRegion = defaultRegionName && regions.find(r => r.name === defaultRegionName)
                            ? defaultRegionName
                            : regions[0].name;
      setSelectedRegion(initialRegion as RegionName);
    } else {
      setSelectedRegion(undefined);
    }
    setSearchTerm("");
    setSelectedCropType("All");
    setCurrentMonth("All");
  }, [regions, defaultRegionName]);


  const filteredCrops = useMemo(() => {
    if (regions.length > 0 && !selectedRegion ) return []; 

    return CROPS_DATA_FOR_UGANDA.filter((crop) => {
      if (!crop) {
        console.warn("A null crop object was found in CROPS_DATA_FOR_UGANDA and skipped.");
        return false;
      }
      const regionMatch = !selectedRegion || crop.region === selectedRegion;
      const typeMatch = selectedCropType === "All" || crop.type === selectedCropType;
      const searchTermMatch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) || (crop.notes && crop.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const monthMatch = currentMonth === "All" || (crop.plantingMonths && crop.plantingMonths.includes(currentMonth)) || (crop.harvestMonths && crop.harvestMonths.includes(currentMonth));
      return regionMatch && typeMatch && searchTermMatch && monthMatch;
    });
  }, [CROPS_DATA_FOR_UGANDA, selectedRegion, selectedCropType, searchTerm, currentMonth, regions]);

  const handleOpenAiAdvisor = (crop: Crop) => {
    setSelectedCropForAI(crop);
    setIsAiAdvisorOpen(true);
  };

  const handleOpenGrowthTracker = (crop: Crop) => { 
    setSelectedCropForGrowthTracker(crop);
    setIsGrowthTrackerOpen(true);
  };

  const handleOpenDeleteDialog = (cropId: string) => {
    setCropToDeleteId(cropId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (cropToDeleteId) {
      const cropName = CROPS_DATA_FOR_UGANDA.find(c => c.id === cropToDeleteId)?.name || "Crop";
      deleteCrop(cropToDeleteId); 
      toast({
        title: "Crop Deleted",
        description: `${cropName} has been permanently removed from the calendar.`,
        variant: "destructive"
      });
      setCropToDeleteId(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const getRegionAccentVar = (regionName?: RegionName) => {
    if (!regionName || !regions) return undefined;
    const region = regions.find(r => r.name === regionName);
    return region ? region.accentVar : undefined;
  };

  const cropBeingDeleted = useMemo(() => {
    if (!cropToDeleteId) return null;
    return CROPS_DATA_FOR_UGANDA.find(c => c.id === cropToDeleteId);
  }, [cropToDeleteId, CROPS_DATA_FOR_UGANDA]);

  if (regions && regions.length > 0 && !selectedRegion) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading region data...</div>;
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary tracking-tight">AGNIRO Crop Calendar &amp; Advisor</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore optimal planting and harvesting periods for <span className="font-semibold text-accent">Uganda</span>, get AI advice, and view regional data.
        </p>
      </header>

      {regions && regions.length > 0 && selectedRegion ? (
        <Tabs value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as RegionName)} className="w-full mb-8">
          <TabsList className={`grid w-full grid-cols-2 md:grid-cols-${Math.min(regions.length, 4)} gap-2 p-1 h-auto`}>
            {regions.map((region) => (
              <TabsTrigger
                key={region.name}
                value={region.name}
                className="py-2.5 text-sm data-[state=active]:shadow-md transition-all duration-200 ease-in-out"
                style={selectedRegion === region.name ? { backgroundColor: `hsl(var(${region.accentVar}-bg))`, color: `hsl(var(${region.accentVar}-fg))`, borderColor: `hsl(var(${region.accentVar}-fg))` } : {}}
              >
                <MapPin className="mr-2 h-4 w-4" /> {region.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : (
         <Alert variant="default" className="mb-8 bg-card border-border">
          <Info className="h-5 w-5 text-accent" />
          <AlertTitle>Region Data Not Available</AlertTitle>
          <AlertDescription>
            Crop data displayed will be general for Uganda.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 p-6 bg-card rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full h-10 text-base"
              aria-label="Search crops"
            />
          </div>

          <div className="md:col-span-1">
            <Label className="text-sm font-medium text-foreground mb-2 flex items-center"><Filter className="h-4 w-4 mr-2"/>Crop Type</Label>
            <RadioGroup
              value={selectedCropType}
              onValueChange={(value) => setSelectedCropType(value as CropType | "All")}
              className="flex space-x-4 items-center"
            >
              {["All", "Traditional", "Modern"].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`type-${type}`} />
                  <Label htmlFor={`type-${type}`} className="font-normal text-sm">{type}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
           <div className="md:col-span-1">
            <Label htmlFor="month-filter" className="text-sm font-medium text-foreground mb-2 flex items-center"><CalendarDays className="h-4 w-4 mr-2"/>Activity Month</Label>
            <Select value={currentMonth} onValueChange={setCurrentMonth}>
              <SelectTrigger id="month-filter" className="w-full h-10 text-base">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Months</SelectItem>
                {ALL_MONTHS.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-10">
              <Link href={`/add-crop${selectedRegion ? `?region=${selectedRegion}` : ''}`}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Crop
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {filteredCrops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              onOpenAiAdvisor={handleOpenAiAdvisor}
              onDeleteCrop={handleOpenDeleteDialog} 
              onOpenGrowthTracker={handleOpenGrowthTracker}
              regionAccentVar={getRegionAccentVar(selectedRegion)}
            />
          ))}
        </div>
      ) : (
        <Alert variant="default" className="bg-card border-border flex flex-col items-center justify-center text-center p-8 rounded-lg shadow">
          <Info className="h-12 w-12 text-accent mb-4" />
          <AlertTitle className="text-xl font-semibold text-foreground">No Crops Found</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            No crops match your current filters {selectedRegion ? `for the ${selectedRegion} region` : ''} in Uganda.
            Try adjusting your search or filter criteria, or <Link href="/add-crop" className="text-accent underline hover:text-accent/80">add a new crop</Link>.
          </AlertDescription>
          <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCropType("All"); setCurrentMonth("All");}} className="mt-6">
            Clear Filters
          </Button>
        </Alert>
      )}

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-primary mb-6 text-center">
          Uganda Insights {selectedRegion ? `: ${selectedRegion}` : ''}
        </h2>
        <Tabs value={activeInsightsTab} onValueChange={(value) => setActiveInsightsTab(value as "articles" | "map" | "rain")} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 p-1 h-auto max-w-md mx-auto bg-orange-800 text-orange-50">
            <TabsTrigger value="map" className="py-2.5 text-sm data-[state=active]:shadow-md">
              <MapIcon className="mr-2 h-4 w-4" /> {selectedRegion ? 'Region Map' : 'Uganda Map'}
            </TabsTrigger>
            <TabsTrigger value="rain" className="py-2.5 text-sm data-[state=active]:shadow-md">
              <AreaChart className="mr-2 h-4 w-4" /> Rainfall Graph
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="mt-4">
            <RegionMap selectedRegionName={selectedRegion} />
          </TabsContent>
          <TabsContent value="rain" className="mt-4">
            <RainfallChart selectedRegionName={selectedRegion || "Average"} />
          </TabsContent>
        </Tabs>
      </section>


      <AiAdvisorDialog
        isOpen={isAiAdvisorOpen}
        onOpenChange={setIsAiAdvisorOpen}
        selectedCrop={selectedCropForAI}
        selectedRegion={selectedCropForAI ? selectedCropForAI.region : null}
      />

      <CropGrowthTrackerDialog
        isOpen={isGrowthTrackerOpen}
        onOpenChange={setIsGrowthTrackerOpen}
        selectedCrop={selectedCropForGrowthTracker}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the crop
              "{cropBeingDeleted?.name || 'selected crop'}" from the calendar for Uganda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCropToDeleteId(null); setIsDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AiChatbotSheet /> 
    </div>
  );
}
    
