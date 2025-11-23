
'use server';

/**
 * @fileOverview AI-powered planting advisor flow.
 *
 * - getPlantingAdvice - A function that provides planting advice based on country, region, crop, and date.
 * - PlantingAdviceInput - The input type for the getPlantingAdvice function.
 * - PlantingAdviceOutput - The return type for the getPlantingAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlantingAdviceInputSchema = z.object({
  countryName: z.string().describe('The country for which advice is needed.'),
  region: z
    .string()
    .describe(
      'The agricultural region within the specified country (e.g., Northern, Central for Uganda; Midwest for USA). This can be an empty string if the country has no defined regions in the system.'
    ),
  crop: z.string().describe('The crop for which advice is needed.'),
  currentDate: z
    .string()
    .describe('The current date in ISO format (YYYY-MM-DD).'),
});

export type PlantingAdviceInput = z.infer<typeof PlantingAdviceInputSchema>;

const PlantingAdviceOutputSchema = z.object({
  introduction: z.string().describe("A brief introduction to growing the crop in the specified country, region (if provided), and context, considering the current date."),
  soilPreparation: z.array(z.string()).describe("Step-by-step guide for soil preparation, including tilling, amendments, and ideal soil conditions relevant to the country and region."),
  plantingProcess: z.array(z.string()).describe("Detailed steps for planting the seeds or seedlings, including spacing, depth, and timing relative to rains or current date, specific to the location."),
  waterManagement: z.string().describe("Advice on irrigation and water needs throughout the crop cycle, especially considering the current date and typical regional rainfall patterns for the country/region."),
  weedingSchedule: z.string().describe("Guidance on when and how to weed effectively, including frequency and methods relevant to the country/region."),
  pestAndDiseaseControl: z.array(z.string()).describe("Common pests and diseases for the crop in the country/region, and step-by-step integrated pest management (IPM) strategies, including preventative measures and organic/chemical control options if applicable."),
  fertilization: z.string().describe("Recommendations for fertilization, including types of fertilizers (organic/inorganic), application timing, and methods suitable for the crop and country/region."),
  harvestingTips: z.array(z.string()).describe("Step-by-step instructions for determining ripeness and harvesting at the optimal time for maximum yield and quality."),
  postHarvestHandling: z.array(z.string()).describe("Tips for handling the crop after harvest to maintain quality, reduce losses, and prepare for storage or market."),
  specialConsiderations: z.string().describe("Any other specific advice, advanced techniques, or considerations for this crop in this country/region, given the current date (e.g., climate change adaptation strategies, intercropping opportunities, market linkage notes)."),
});


export type PlantingAdviceOutput = z.infer<typeof PlantingAdviceOutputSchema>;

export async function getPlantingAdvice(
  input: PlantingAdviceInput
): Promise<PlantingAdviceOutput> {
  return plantingAdviceFlow(input);
}

const plantingAdvicePrompt = ai.definePrompt({
  name: 'plantingAdvicePrompt',
  input: {schema: PlantingAdviceInputSchema},
  output: {schema: PlantingAdviceOutputSchema},
  prompt: `You are an expert agricultural advisor specializing in providing deep, research-based, and actionable guidance for farming in {{{countryName}}}.
  {{#if region}}
  You are focusing on the {{{region}}} region within {{{countryName}}}.
  {{else}}
  You are providing general advice for {{{countryName}}}.
  {{/if}}

  Based on the provided country, region (if applicable), crop, and current date, generate a comprehensive, step-by-step planting, management, and harvesting plan.
  The advice must be highly detailed, practical, and cover the entire crop lifecycle from soil preparation to post-harvest handling.
  Incorporate considerations for the specific current date in your advice where relevant (e.g., if it's mid-season).

  Country: {{{countryName}}}
  {{#if region}}
  Region: {{{region}}}
  {{/if}}
  Crop: {{{crop}}}
  Current Date: {{{currentDate}}}

  Please structure your response strictly according to the following schema. Provide detailed, numbered or bulleted steps where appropriate within each section:
  - introduction: (String) A brief introduction to growing the crop in the specified country, region (if provided), and context, considering the current date.
  - soilPreparation: (Array of strings) Step-by-step guide for soil preparation, including tilling, amendments, and ideal soil conditions relevant to the country and region.
  - plantingProcess: (Array of strings) Detailed steps for planting the seeds or seedlings, including spacing, depth, and timing relative to rains or current date, specific to the location.
  - waterManagement: (String) Advice on irrigation and water needs throughout the crop cycle, especially considering the current date and typical regional rainfall patterns for the country/region.
  - weedingSchedule: (String) Guidance on when and how to weed effectively, including frequency and methods relevant to the country/region.
  - pestAndDiseaseControl: (Array of strings) Common pests and diseases for the crop in the country/region, and step-by-step integrated pest management (IPM) strategies, including preventative measures and organic/chemical control options if applicable.
  - fertilization: (String) Recommendations for fertilization, including types of fertilizers (organic/inorganic), application timing, and methods suitable for the crop and country/region.
  - harvestingTips: (Array of strings) Step-by-step instructions for determining ripeness and harvesting at the optimal time for maximum yield and quality.
  - postHarvestHandling: (Array of strings) Tips for handling the crop after harvest to maintain quality, reduce losses, and prepare for storage or market.
  - specialConsiderations: (String) Any other specific advice, advanced techniques, or considerations for this crop in this country/region, given the current date (e.g., climate change adaptation strategies, intercropping opportunities, market linkage notes).

  Ensure each step is clear, actionable, and easy to follow. Your advice should reflect a deep level of agricultural research and local context for {{{countryName}}}{{#if region}} and specifically the {{{region}}} region{{/if}}.
  If certain information is not applicable (e.g. fertilization for a crop that doesn't need it), state "Not typically required" or similar for that string field, or provide an empty array for array fields. Do not omit fields.`,
});

const plantingAdviceFlow = ai.defineFlow(
  {
    name: 'plantingAdviceFlow',
    inputSchema: PlantingAdviceInputSchema,
    outputSchema: PlantingAdviceOutputSchema,
  },
  async input => {
    const {output} = await plantingAdvicePrompt(input);
    if (!output) {
      throw new Error("AI failed to generate advice. Output was null.");
    }
    // Basic validation to ensure all keys are present, even if some are empty strings/arrays
    const requiredKeys = Object.keys(PlantingAdviceOutputSchema.shape);
    for (const key of requiredKeys) {
      if (!(key in output)) {
        console.warn(`AI output missing key: ${key}. Setting to default based on schema.`);
        const fieldSchema = (PlantingAdviceOutputSchema.shape as any)[key];
        if (fieldSchema instanceof z.ZodArray) {
          (output as any)[key] = [];
        } else if (fieldSchema instanceof z.ZodString) {
          (output as any)[key] = "Information not provided by AI for this section.";
        } else {
           (output as any)[key] = null; // Or some other default
        }
      }
    }
    return output;
  }
);
