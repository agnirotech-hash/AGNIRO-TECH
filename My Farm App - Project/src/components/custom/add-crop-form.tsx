
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { parseMonthString, type RegionName, type CropType, ALL_MONTHS } from "@/lib/crop-data"; 
import { useCropData } from "@/context/crop-data-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Sparkles, Loader2, ArrowLeft, CalendarIcon } from "lucide-react";
import React, { useState, useTransition, useEffect } from "react";
import { autofillCropInfo } from "@/ai/flows/crop-autofill-flow";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


const addCropFormSchema = z.object({
  name: z.string().min(2, { message: "Crop name must be at least 2 characters." }),
  region: z.string({ required_error: "Please select a valid region." }) 
            .min(1, { message: "Please select a valid region." }),
  plantingMonthsStr: z.string().min(3, { message: "Enter planting months (e.g., Mar-May)." }),
  weedingInfo: z.string().min(3, { message: "Weeding info is required." }),
  harvestMonthsStr: z.string().min(3, { message: "Enter harvest months (e.g., Jul-Aug)." }),
  type: z.enum(["Traditional", "Modern"] as [CropType, ...CropType[]], {
    errorMap: () => ({ message: "Please select a crop type." }),
  }),
  notes: z.string().min(10, { message: "Notes must be at least 10 characters." }),
  iconHint: z.string().optional(),
  datePlanted: z.date().optional(),
});

export type AddCropFormValues = z.infer<typeof addCropFormSchema>;

interface AddCropFormProps {
  initialRegion?: RegionName;
}

export function AddCropForm({ initialRegion }: AddCropFormProps) {
  const { addCrop, regions, defaultRegionName } = useCropData(); 
  const router = useRouter();
  const { toast } = useToast();
  const [isAutofilling, startAutofillTransition] = useTransition();
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  useEffect(() => {
    setCurrentMonth(ALL_MONTHS[new Date().getMonth()]);
  }, []);

  const form = useForm<AddCropFormValues>({
    resolver: zodResolver(addCropFormSchema),
    defaultValues: {
      name: "",
      region: initialRegion && regions.find(r => r.name === initialRegion) 
              ? initialRegion 
              : (defaultRegionName && regions.find(r => r.name === defaultRegionName) 
                  ? defaultRegionName 
                  : (regions.length > 0 ? regions[0].name : "")),
      plantingMonthsStr: "",
      weedingInfo: "",
      harvestMonthsStr: "",
      type: "Traditional",
      notes: "",
      iconHint: "",
      datePlanted: undefined,
    },
  });
  
  useEffect(() => {
    // This effect primarily ensures the region is valid if it somehow becomes invalid
    // or if initialRegion was not valid initially but now a default can be set.
    const currentFormRegion = form.getValues("region");
    const isCurrentFormRegionValid = regions.some(r => r.name === currentFormRegion);

    if (initialRegion && regions.some(r => r.name === initialRegion)) {
      if (currentFormRegion !== initialRegion) {
        form.setValue("region", initialRegion, { shouldValidate: true });
      }
    } else if (!isCurrentFormRegionValid) {
      const newDefaultRegion = defaultRegionName && regions.some(r => r.name === defaultRegionName)
        ? defaultRegionName
        : regions.length > 0 ? regions[0].name : "";
      if (newDefaultRegion) {
        form.setValue("region", newDefaultRegion, { shouldValidate: true });
      }
    }
  }, [initialRegion, regions, defaultRegionName, form]);


  const handleAutofill = async () => {
    setAutofillError(null);
    const cropName = form.getValues("name");
    const regionName = form.getValues("region");

    if (!cropName || cropName.length < 2) {
      form.setError("name", { type: "manual", message: "Crop name must be at least 2 characters for autofill." });
      return;
    }
    if (!regionName && regions.length > 0) { 
      form.setError("region", { type: "manual", message: "Region must be selected for autofill." });
      return;
    }
    if (!currentMonth) {
        setAutofillError("Current month could not be determined. Autofill unavailable.");
        return;
    }

    startAutofillTransition(async () => {
      try {
        const result = await autofillCropInfo({
          countryName: "Uganda", 
          cropName,
          region: regionName,
          currentMonth,
        });
        form.setValue("plantingMonthsStr", result.plantingMonthsStr, { shouldValidate: true });
        form.setValue("harvestMonthsStr", result.harvestMonthsStr, { shouldValidate: true });
        form.setValue("weedingInfo", result.weedingInfo, { shouldValidate: true });
        form.setValue("notes", result.notes, { shouldValidate: true });
        form.setValue("iconHint", result.iconHint, { shouldValidate: true });
        form.setValue("type", result.cropType, { shouldValidate: true });
        toast({
          title: "AI Autofill Successful",
          description: `Crop details for Uganda have been suggested by AI.`,
        });
      } catch (e) {
        console.error("AI Autofill error:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during AI autofill.";
        setAutofillError(errorMessage);
        toast({
          variant: "destructive",
          title: "AI Autofill Failed",
          description: errorMessage,
        });
      }
    });
  };


  function onSubmit(data: AddCropFormValues) {
    const newCropPayload = {
      name: data.name,
      region: data.region as RegionName,
      plantingMonths: parseMonthString(data.plantingMonthsStr),
      weedingInfo: data.weedingInfo,
      harvestMonths: parseMonthString(data.harvestMonthsStr),
      type: data.type,
      notes: data.notes,
      iconHint: data.iconHint,
      datePlanted: data.datePlanted ? data.datePlanted.toISOString() : undefined,
      // uploadedImageDataUri is not handled by this form; it's handled by CropDataContext or CropCard
    };
    addCrop(newCropPayload);
    toast({
      title: "Crop Added",
      description: `${data.name} has been successfully added to the Uganda calendar.`,
    });
    router.push("/");
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <PlusCircle className="h-6 w-6 text-primary" />
                <CardTitle>Add New Crop to Uganda</CardTitle>
            </div>
            <Button variant="outline" asChild size="sm">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Link>
            </Button>
        </div>
        <CardDescription>Fill in the details below or use AI to help autofill some fields for Uganda.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hybrid Maize" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <Button 
                  type="button" 
                  onClick={handleAutofill} 
                  disabled={isAutofilling || !form.getValues("name") || (regions.length > 0 && !form.getValues("region"))}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isAutofilling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  AI Autofill Details
                </Button>
              </div>
            </div>
             {autofillError && (
                <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{autofillError}</AlertDescription>
                </Alert>
            )}

            {regions.length > 0 && (
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region in Uganda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select a region in Uganda`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.name} value={region.name}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="datePlanted"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Planted (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2000-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the date this crop was planted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="plantingMonthsStr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planting Months</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mar-Apr, Sep (or use AI Autofill)" {...field} />
                  </FormControl>
                  <FormDescription>Enter month names or ranges, comma-separated (e.g., Jan, Feb-Apr, Oct).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weedingInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weeding Information</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2-3 weeks after planting (or use AI Autofill)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="harvestMonthsStr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harvest Months</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jul-Aug, Dec (or use AI Autofill)" {...field} />
                  </FormControl>
                  <FormDescription>Enter month names or ranges, comma-separated (e.g., Jun, Aug-Oct, Dec).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Crop Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value} 
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Traditional" />
                        </FormControl>
                        <FormLabel className="font-normal">Traditional</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Modern" />
                        </FormControl>
                        <FormLabel className="font-normal">Modern / Improved Variety</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>Select if the crop is generally a traditional variety or a modern/improved one (AI can suggest this).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide additional notes (or use AI Autofill)."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iconHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon Hint (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., wheat grain, fruit tree (or use AI Autofill)" {...field} />
                  </FormControl>
                  <FormDescription>A short description to help choose an icon (max 2 words).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Crop to Uganda Calendar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
