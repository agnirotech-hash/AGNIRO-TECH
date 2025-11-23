
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Bot, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Crop, RegionName } from "@/lib/crop-data";
import { getPlantingAdvice, type PlantingAdviceOutput } from "@/ai/flows/ai-planting-advisor";
import React, { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import jsPDF from 'jspdf';
import { useToast } from "@/hooks/use-toast";

const FormSchema = z.object({
  // countryName removed, will be hardcoded to Uganda
  region: z.string().nullable(),
  crop: z.string(),
  currentDate: z.date({
    required_error: "A date is required.",
  }),
});

interface AiAdvisorFormProps {
  selectedCrop: Crop;
  selectedRegion: RegionName | null;
  // selectedCountryName prop removed
}

export function AiAdvisorForm({ selectedCrop, selectedRegion }: AiAdvisorFormProps) {
  const [isPending, startTransition] = useTransition();
  const [adviceResult, setAdviceResult] = useState<PlantingAdviceOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      // countryName: "Uganda", // No longer in schema, used directly in onSubmit
      region: selectedRegion,
      crop: selectedCrop.name,
      currentDate: new Date(),
    },
  });

  React.useEffect(() => {
    form.reset({
      // countryName: "Uganda",
      region: selectedRegion,
      crop: selectedCrop.name,
      currentDate: new Date(),
    });
    setAdviceResult(null);
    setError(null);
  }, [selectedCrop, selectedRegion, form]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setError(null);
    setAdviceResult(null);
    startTransition(async () => {
      try {
        const advice = await getPlantingAdvice({
          countryName: "Uganda", // Hardcoded country name
          region: data.region || "", 
          crop: data.crop,
          currentDate: format(data.currentDate, "yyyy-MM-dd"),
        });
        setAdviceResult(advice);
      } catch (e) {
        console.error("Error getting AI advice:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    });
  }

  const handleDownloadReportPdf = (advice: PlantingAdviceOutput, cropName: string, regionName: string | null, selectedDate: Date) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const addWrappedText = (text: string | string[], size: number, isBold = false, isItalic = false, currentY: number, isListItem = false) => {
      doc.setFontSize(size);
      doc.setFont(undefined, isBold ? 'bold' : (isItalic ? 'italic' : 'normal'));
      
      const lines = Array.isArray(text) ? text.flatMap(item => doc.splitTextToSize((isListItem ? `- ${item}` : item), maxLineWidth)) : doc.splitTextToSize(text, maxLineWidth);
      
      for (const line of lines) {
        if (currentY + (size / 2.83465) > pageHeight - margin) { // Approximate line height
          doc.addPage();
          currentY = margin;
        }
        doc.text(line, margin + (isListItem && Array.isArray(text) ? 5 : 0), currentY);
        currentY += (size / 2.83465) * 1.2; // Line height factor
      }
      return currentY;
    };

    y = addWrappedText(`AI Planting Advisor Report`, 18, true, false, y);
    y += 5;
    y = addWrappedText(`Crop: ${cropName}`, 12, false, false, y);
    y = addWrappedText(`Country: Uganda`, 12, false, false, y);
    if (regionName) {
      y = addWrappedText(`Region: ${regionName}`, 12, false, false, y);
    }
    y = addWrappedText(`Date: ${format(selectedDate, "PPP")}`, 12, false, false, y);
    y += 10;

    const sections: { title: string; content: string | string[]; isList?: boolean }[] = [
      { title: "Introduction", content: advice.introduction },
      { title: "Soil Preparation", content: advice.soilPreparation, isList: true },
      { title: "Planting Process", content: advice.plantingProcess, isList: true },
      { title: "Water Management", content: advice.waterManagement },
      { title: "Weeding Schedule", content: advice.weedingSchedule },
      { title: "Pest and Disease Control", content: advice.pestAndDiseaseControl, isList: true },
      { title: "Fertilization", content: advice.fertilization },
      { title: "Harvesting Tips", content: advice.harvestingTips, isList: true },
      { title: "Post-Harvest Handling", content: advice.postHarvestHandling, isList: true },
      { title: "Special Considerations", content: advice.specialConsiderations },
    ];

    sections.forEach(section => {
      if (section.content && ( (typeof section.content === 'string' && section.content.trim() !== "" && section.content.toLowerCase() !== "information not provided by ai for this section." && section.content.toLowerCase() !== "not typically required") || (Array.isArray(section.content) && section.content.length > 0) ) ) {
        if (y + 20 > pageHeight - margin) { // Check if new section title needs new page
             doc.addPage(); y = margin;
        }
        y = addWrappedText(section.title, 14, true, false, y);
        y = addWrappedText(section.content, 12, false, false, y, section.isList);
        y += 7;
      }
    });
    
    const safeCropName = cropName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`AI_Planting_Report_${safeCropName}_${format(selectedDate, "yyyyMMdd")}.pdf`);
    toast({ title: "PDF Downloading", description: `AI Planting Advisor Report for ${cropName} should start downloading.` });
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* CountryName field removed from form */}
        {selectedRegion !== null && form.getValues("region") !== null && (
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} readOnly className="bg-muted/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="crop"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop</FormLabel>
              <FormControl>
                <Input {...field} readOnly className="bg-muted/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Current Date</FormLabel>
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
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select the current date for tailored advice.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Advice...
            </>
          ) : (
            "Get Detailed Planting Advice"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {adviceResult && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <h3 className="text-primary font-semibold text-xl">AI Planting Advisor Report</h3>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReportPdf(adviceResult, form.getValues("crop"), form.getValues("region"), form.getValues("currentDate"))}
                className="hover:bg-primary/10 hover:border-primary"
            >
                <Download className="mr-2 h-4 w-4" />
                Download PDF Report
            </Button>
          </div>
          <ScrollArea className="h-[400px] rounded-md border p-4 bg-card shadow-inner">
            <div className="space-y-5 text-sm">
              {adviceResult.introduction && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Introduction</h4>
                  <p className="text-muted-foreground">{adviceResult.introduction}</p>
                </div>
              )}

              {adviceResult.soilPreparation && adviceResult.soilPreparation.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Soil Preparation</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                    {adviceResult.soilPreparation.map((step, index) => <li key={`soil-${index}`}>{step}</li>)}
                  </ul>
                </div>
              )}

              {adviceResult.plantingProcess && adviceResult.plantingProcess.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Planting Process</h4>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 pl-4">
                    {adviceResult.plantingProcess.map((step, index) => <li key={`planting-${index}`}>{step}</li>)}
                  </ol>
                </div>
              )}

              {adviceResult.waterManagement && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Water Management</h4>
                  <p className="text-muted-foreground">{adviceResult.waterManagement}</p>
                </div>
              )}
              
              {adviceResult.weedingSchedule && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Weeding Schedule</h4>
                  <p className="text-muted-foreground">{adviceResult.weedingSchedule}</p>
                </div>
              )}

              {adviceResult.pestAndDiseaseControl && adviceResult.pestAndDiseaseControl.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Pest and Disease Control</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                    {adviceResult.pestAndDiseaseControl.map((tip, index) => <li key={`pest-${index}`}>{tip}</li>)}
                  </ul>
                </div>
              )}
              
              {adviceResult.fertilization && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Fertilization</h4>
                  <p className="text-muted-foreground">{adviceResult.fertilization}</p>
                </div>
              )}

              {adviceResult.harvestingTips && adviceResult.harvestingTips.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Harvesting Tips</h4>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 pl-4">
                    {adviceResult.harvestingTips.map((tip, index) => <li key={`harvest-${index}`}>{tip}</li>)}
                  </ol>
                </div>
              )}

              {adviceResult.postHarvestHandling && adviceResult.postHarvestHandling.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Post-Harvest Handling</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                    {adviceResult.postHarvestHandling.map((tip, index) => <li key={`postharvest-${index}`}>{tip}</li>)}
                  </ul>
                </div>
              )}
              
              {adviceResult.specialConsiderations && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-md">Special Considerations</h4>
                  <p className="text-muted-foreground">{adviceResult.specialConsiderations}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </Form>
  );
}

