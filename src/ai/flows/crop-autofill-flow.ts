
'use server';
/**
 * @fileOverview AI-powered crop information autofill flow.
 *
 * - autofillCropInfo - A function that provides suggestions for planting months, harvest months, weeding info, notes, icon hint, and crop type for a crop in a specific country and region.
 * - CropAutofillInput - The input type for the autofillCropInfo function.
 * - CropAutofillOutput - The return type for the autofillCropInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ALL_MONTHS, type CropType } from '@/lib/crop-data'; // RegionName is now just string

const CropAutofillInputSchema = z.object({
  countryName: z.string().describe('The country for which information is needed (e.g., Uganda, United States, India).'),
  cropName: z.string().min(2, { message: "Crop name must be at least 2 characters." })
    .describe('The name of the crop for which information is needed.'),
  region: z.string().describe('The agricultural region within the specified country. Can be an empty string if not applicable or if the country has no defined regions in the system.'),
  currentMonth: z.enum(ALL_MONTHS as [string, ...string[]])
    .describe('The current month, which helps contextualize planting/harvesting suggestions (e.g., "Jan", "Feb", ..., "Dec").'),
});
export type CropAutofillInput = z.infer<typeof CropAutofillInputSchema>;

const CropAutofillOutputSchema = z.object({
  plantingMonthsStr: z.string().describe("Suggested planting months as a concise string, e.g., 'Mar-Apr, Sep'. This string should be parsable by standard month range parsers (like 'Jan, Feb-Apr, Oct'). Consider the current month for relevance, suggesting typical planting seasons or next suitable window. Be specific to the agriculture of the given country and region (if provided)."),
  harvestMonthsStr: z.string().describe("Suggested harvest months as a concise string, e.g., 'Jul-Aug, Dec'. This should correspond to the suggested planting months and typical crop duration in the specified country and region. Ensure format is parsable."),
  weedingInfo: z.string().describe("Suggested weeding information or typical schedule for the crop in the specified country and region. E.g., '2-3 weeks after planting, then as needed' or 'Maintain a weed-free bed for the first 6 weeks'. Be specific to the local context."),
  notes: z.string().describe("A brief, informative note about the crop (max 150 characters). Include key characteristics, common uses, or specific farming tips relevant to the country, region (if provided) and typical agricultural cycle given the current month. Focus on local context."),
  iconHint: z.string().max(30).describe("A 1-2 word hint for a visual icon representing the crop (e.g., 'corn stalk', 'bean pod', 'leafy green', 'root tuber', 'fruit tree'). Focus on visually distinct features. If unsure, suggest a generic term like 'plant leaf' or 'grain head'."),
  cropType: z.enum(["Traditional", "Modern"] as [CropType, ...CropType[]]).describe("Determine if the crop, in the context of the specified country's agriculture and region (if provided), is generally considered a 'Traditional' staple/local variety or a 'Modern' improved/hybrid/commercial variety. Base this on common farming practices, seed availability, and typical agricultural development levels for this crop in that location."),
});

export type CropAutofillOutput = z.infer<typeof CropAutofillOutputSchema>;

export async function autofillCropInfo(
  input: CropAutofillInput
): Promise<CropAutofillOutput> {
  return cropAutofillFlow(input);
}

const cropAutofillPrompt = ai.definePrompt({
  name: 'cropAutofillPrompt',
  input: {schema: CropAutofillInputSchema},
  output: {schema: CropAutofillOutputSchema},
  prompt: `You are an agricultural expert specializing in crops and farming practices for various countries.
  Based on the provided country, crop name, region (if applicable), and the current month, generate concise and practical suggestions for the following fields.
  Your advice should be tailored to the specified location. The current month is provided to help you suggest timely or upcoming activities.

  Country: {{{countryName}}}
  Crop Name: {{{cropName}}}
  {{#if region}}
  Region: {{{region}}}
  {{else}}
  Region: Not specified (provide general advice for the country)
  {{/if}}
  Current Month: {{{currentMonth}}}

  Crucially, the planting and harvest calendars, weeding info, and notes must be specifically adapted to the '{{{region}}}' (if provided) and the implications of the '{{{currentMonth}}}', and not simply be generic data for '{{{cropName}}}'.

  Please provide output strictly in the following JSON format, adhering to the descriptions for each field:
  - plantingMonthsStr: (String) Suggested planting months (e.g., "Mar-Apr, Sep"). Consider the typical planting seasons in '{{{countryName}}}'{{#if region}} (specifically the '{{{region}}}' region){{/if}}, especially how the '{{{currentMonth}}}' fits into the cycle. Should be parsable (e.g., 'Jan, Feb-Apr, Oct').
  - harvestMonthsStr: (String) Suggested harvest months (e.g., "Jul-Aug, Dec"). Base this on the planting months and typical crop duration for '{{{cropName}}}' in '{{{countryName}}}'{{#if region}} ({{{region}}} region){{/if}}. Must be parsable.
  - weedingInfo: (String) Suggested weeding information (e.g., "Weed 2-3 weeks after planting and again before flowering"). Be specific to the local context of '{{{countryName}}}'{{#if region}} ({{{region}}} region){{/if}}.
  - notes: (String) A brief note (max 150 chars) about '{{{cropName}}}' in '{{{countryName}}}'{{#if region}} ({{{region}}} region){{/if}}. Highlight key characteristics, uses, or tips, considering the '{{{currentMonth}}}'.
  - iconHint: (String) A 1-2 word icon hint for '{{{cropName}}}' (e.g., "maize cob", "coffee bean", "cassava leaf").
  - cropType: (String Enum: "Traditional" or "Modern") Determine if '{{{cropName}}}' in '{{{countryName}}}'{{#if region}} ({{{region}}} region){{/if}} is typically a 'Traditional' (local, staple) or 'Modern' (improved, commercial) variety based on common farming practices in that location.

  Example (illustrative, content will vary by location):
  {
    "plantingMonthsStr": "Mar-May, Sep-Oct",
    "harvestMonthsStr": "Jul-Aug, Dec-Jan",
    "weedingInfo": "First weeding 2-3 weeks after emergence. Second weeding before tasseling if needed.",
    "notes": "Staple cereal crop. April is prime planting time for the first season in this area. Ensure good soil moisture.",
    "iconHint": "corn cob",
    "cropType": "Modern"
  }

  If the crop is highly unusual for the location or information is scarce, provide the best possible estimate based on general agricultural principles for similar crops, and note any assumptions in the 'notes' field if necessary.
  The month strings must be easily parsable (e.g., "Jan, Feb-Apr, Oct" or "Mar-May").
  `,
});

const cropAutofillFlow = ai.defineFlow(
  {
    name: 'cropAutofillFlow',
    inputSchema: CropAutofillInputSchema,
    outputSchema: CropAutofillOutputSchema,
  },
  async input => {
    const {output} = await cropAutofillPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate crop autofill data. Output was null.");
    }
    // Ensure all keys are present, even if AI returns empty strings/defaults for some
    const validatedOutput: CropAutofillOutput = {
        plantingMonthsStr: output.plantingMonthsStr || "",
        harvestMonthsStr: output.harvestMonthsStr || "",
        weedingInfo: output.weedingInfo || "General weeding as needed.",
        notes: output.notes || "No specific notes provided by AI.",
        iconHint: output.iconHint || "plant",
        cropType: output.cropType || "Traditional", 
    };
    return validatedOutput;
  }
);

    