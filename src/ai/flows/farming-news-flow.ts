
'use server';
/**
 * @fileOverview A flow to generate simulated farming news snippets.
 *
 * - generateFarmingNewsSnippet - A function that generates a fictional news title, summary, source, and image hint.
 * - FarmingNewsInput - The input type for the generateFarmingNewsSnippet function.
 * - FarmingNewsOutput - The return type for the generateFarmingNewsSnippet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FarmingNewsInputSchema = z.object({
  countryName: z.string().default("Uganda").describe("The country for which the news snippet should be relevant."),
  region: z.string().optional().describe('An optional specific agricultural region within the country (e.g., "Northern", "Central").'),
  topic: z.string().optional().describe('An optional topic for the news, e.g., "maize innovation", "water conservation", "market prices".'),
});
export type FarmingNewsInput = z.infer<typeof FarmingNewsInputSchema>;

const FarmingNewsOutputSchema = z.object({
  title: z.string().describe("A catchy and relevant fictional news title (max 15 words)."),
  summary: z.string().describe("A brief fictional news summary (2-3 sentences, max 70 words) related to farming in the specified country/region/topic."),
  source: z.string().default("AgriTech AI Digest").describe("A fictional source for the news snippet."),
  date: z.string().describe("The current date in a readable format (e.g., 'May 23, 2024')."),
  imageHint: z.string().max(30).describe("A 1-2 word hint for a placeholder image (e.g., 'tractor field', 'farmer smiling', 'crop research')."),
  imagePromptSuggestion: z.string().describe("A suggestion for a more detailed image generation prompt for a tool like DALL-E or Midjourney, based on the news title and summary.")
});
export type FarmingNewsOutput = z.infer<typeof FarmingNewsOutputSchema>;

export async function generateFarmingNewsSnippet(
  input: FarmingNewsInput
): Promise<FarmingNewsOutput> {
  return farmingNewsFlow(input);
}

const newsPrompt = ai.definePrompt({
  name: 'farmingNewsPrompt',
  input: {schema: FarmingNewsInputSchema},
  output: {schema: FarmingNewsOutputSchema},
  prompt: `You are an AI assistant that generates plausible, FAKE (but realistic-sounding) news snippets about agriculture for a specified context.
  The news should be positive or informative, focusing on innovation, community efforts, or market trends.
  Generate a news snippet for {{{countryName}}}.
  {{#if region}}
  Focus on the {{{region}}} region.
  {{/if}}
  {{#if topic}}
  The topic is {{{topic}}}.
  {{/if}}

  Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

  Provide the following fields:
  - title: (String) A catchy and relevant fictional news title (max 15 words).
  - summary: (String) A brief fictional news summary (2-3 sentences, max 70 words) related to farming in the specified country/region/topic.
  - source: (String) A fictional source like "AgriTech AI Digest", "Local Farmer's Chronicle", or "Regional Harvest Times".
  - date: (String) Use today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
  - imageHint: (String) A 1-2 word hint for a placeholder image that visually represents the news (e.g., 'happy farmer', 'tech farm', 'market stall').
  - imagePromptSuggestion: (String) Based on the title and summary, suggest a detailed prompt for an image generation model (e.g., "A Ugandan farmer in the Northern region proudly displaying a bountiful harvest of drought-resistant sorghum, sunny day, vibrant colors.").

  Example output structure:
  {
    "title": "Local Farmers Embrace New Composting Techniques",
    "summary": "Farmers in the Central region of Uganda are reporting improved soil health after adopting innovative composting methods introduced by a local cooperative. This initiative aims to boost crop yields sustainably.",
    "source": "Central Farming Today",
    "date": "${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}",
    "imageHint": "compost pile",
    "imagePromptSuggestion": "Close-up shot of rich, dark compost being added to a vegetable garden by a Ugandan farmer, hands covered in soil, lush green plants in the background."
  }
  Ensure the output is strictly in JSON format matching the schema.
  `,
});

const farmingNewsFlow = ai.defineFlow(
  {
    name: 'farmingNewsFlow',
    inputSchema: FarmingNewsInputSchema,
    outputSchema: FarmingNewsOutputSchema,
  },
  async input => {
    const {output} = await newsPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate news snippet. Output was null.");
    }
     // Ensure date is always set to current date, in case AI hallucinates a different one
    output.date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return output;
  }
);
