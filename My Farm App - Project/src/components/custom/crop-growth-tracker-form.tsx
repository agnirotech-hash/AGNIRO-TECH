
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Bot, Leaf, ImageUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import type { Crop } from "@/lib/crop-data";
import { diagnosePlantHealth, type DiagnosePlantHealthInput, type DiagnosePlantHealthOutput } from "@/ai/flows/diagnose-plant-health-flow";
import React, { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FormSchema = z.object({
  plantingDate: z.date({
    required_error: "Planting date is required.",
  }),
  cropPhoto: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please upload a photo of your crop.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

interface CropGrowthTrackerFormProps {
  selectedCrop: Crop;
}

export function CropGrowthTrackerForm({ selectedCrop }: CropGrowthTrackerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<DiagnosePlantHealthOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      plantingDate: selectedCrop.datePlanted ? new Date(selectedCrop.datePlanted) : new Date(),
      cropPhoto: undefined,
    },
  });
  
  React.useEffect(() => {
    form.reset({
      plantingDate: selectedCrop.datePlanted ? new Date(selectedCrop.datePlanted) : new Date(),
      cropPhoto: undefined,
    });
    setAnalysisResult(null);
    setError(null);
    setUploadedImagePreview(null);
  }, [selectedCrop, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError("cropPhoto", { type: "manual", message: "Max file size is 5MB."});
        setUploadedImagePreview(null);
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        form.setError("cropPhoto", { type: "manual", message: "Only .jpg, .jpeg, .png and .webp formats are supported."});
        setUploadedImagePreview(null);
        return;
      }
      form.clearErrors("cropPhoto");
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setUploadedImagePreview(null);
    }
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setError(null);
    setAnalysisResult(null);
    if (!uploadedImagePreview) {
        setError("Please ensure an image is uploaded and previewed.");
        return;
    }

    startTransition(async () => {
      try {
        const inputForAI: DiagnosePlantHealthInput = {
            cropName: selectedCrop.name,
            plantingDate: format(data.plantingDate, "yyyy-MM-dd"),
            currentDate: format(new Date(), "yyyy-MM-dd"),
            photoDataUri: uploadedImagePreview,
            region: selectedCrop.region,
        };
        const result = await diagnosePlantHealth(inputForAI);
        setAnalysisResult(result);
        toast({ title: "Analysis Complete", description: `AI has analyzed ${selectedCrop.name}.`});
      } catch (e) {
        console.error("Error getting AI analysis:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during AI analysis.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "AI Analysis Failed", description: errorMessage });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="plantingDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Planting Date</FormLabel>
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
                        disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormDescription>
                    When was this {selectedCrop.name} planted?
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <Controller
                control={form.control}
                name="cropPhoto"
                render={({ fieldState }) => (
                    <FormItem>
                        <FormLabel>Upload Crop Photo</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                onChange={(e) => {
                                    form.setValue("cropPhoto", e.target.files, { shouldValidate: true });
                                    handleImageChange(e);
                                }} 
                                className="h-10"
                            />
                        </FormControl>
                        <FormDescription>Upload an image of the crop (leaf, plant) for analysis (max 5MB).</FormDescription>
                        {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                    </FormItem>
                )}
            />
        </div>
        
        {uploadedImagePreview && (
          <div className="mt-4 text-center">
            <Image src={uploadedImagePreview} alt="Uploaded crop preview" width={200} height={200} className="rounded-md mx-auto border shadow-md object-contain max-h-[200px]" />
          </div>
        )}

        <Button type="submit" disabled={isPending || !uploadedImagePreview || !form.formState.isValid} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base py-3">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Leaf className="mr-2 h-5 w-5" /> Analyze Crop Health & Growth
            </>
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <Bot className="h-7 w-7 text-primary" />
                    <h3 className="text-primary font-semibold text-2xl">AI Analysis Report</h3>
                </div>
            </div>
            <ScrollArea className="h-[400px] rounded-md border p-4 bg-background shadow-inner">
                <div className="space-y-5 text-sm">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Plant Identification</CardTitle></CardHeader>
                        <CardContent>
                            <p><strong>Is it {selectedCrop.name}?</strong> {analysisResult.identification.isExpectedPlant ? "Yes" : `No, AI identified it as: ${analysisResult.identification.identifiedPlantName || "Unknown"}`}</p>
                            {!analysisResult.identification.isExpectedPlant && analysisResult.identification.confidence && (
                                <p><strong>Confidence:</strong> {analysisResult.identification.confidence}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">Health Assessment (from Image)</CardTitle></CardHeader>
                        <CardContent>
                             <p><strong>Overall Health:</strong> {analysisResult.healthAssessment.overallHealth}</p>
                            {analysisResult.healthAssessment.potentialIssues && analysisResult.healthAssessment.potentialIssues.length > 0 && (
                                <>
                                    <p className="mt-2"><strong>Potential Issues Detected:</strong></p>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                                        {analysisResult.healthAssessment.potentialIssues.map((issue, index) => <li key={`issue-${index}`}>{issue}</li>)}
                                    </ul>
                                </>
                            )}
                            {(!analysisResult.healthAssessment.potentialIssues || analysisResult.healthAssessment.potentialIssues.length === 0) && (
                                <p className="text-muted-foreground italic mt-1">No specific issues detected from the image, or details not provided by AI.</p>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Simulated Growth Stage & Advice</CardTitle></CardHeader>
                        <CardContent>
                            <p><strong>Days Since Planting:</strong> {differenceInDays(new Date(), form.getValues("plantingDate"))} days</p>
                            <p className="mt-2"><strong>Expected Growth Stage:</strong></p>
                            <p className="text-muted-foreground whitespace-pre-line">{analysisResult.growthStageAdvice.stageDescription || "Information not provided."}</p>
                             {analysisResult.growthStageAdvice.careTips && analysisResult.growthStageAdvice.careTips.length > 0 && (
                                <>
                                    <p className="mt-3"><strong>Care Tips for this Stage:</strong></p>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                                        {analysisResult.growthStageAdvice.careTips.map((tip, index) => <li key={`tip-growth-${index}`}>{tip}</li>)}
                                    </ul>
                                </>
                             )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">General Care Recommendations</CardTitle></CardHeader>
                        <CardContent>
                            {analysisResult.careRecommendations && analysisResult.careRecommendations.length > 0 ? (
                                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                                    {analysisResult.careRecommendations.map((rec, index) => <li key={`rec-${index}`}>{rec}</li>)}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground italic">No specific general recommendations provided by AI for this image.</p>
                            )}
                        </CardContent>
                    </Card>
                    
                     {analysisResult.additionalNotes && (
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Additional AI Notes</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-line">{analysisResult.additionalNotes}</p>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </ScrollArea>
        </div>
      )}
    </Form>
  );
}

    
