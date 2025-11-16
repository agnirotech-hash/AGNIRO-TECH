
'use server';
/**
 * @fileOverview A flow to generate full, structured farming articles.
 *
 * - generateFarmingArticle - A function that generates a fictional farming article.
 * - FarmingArticleInput - The input type for the generateFarmingArticle function.
 * - FarmingArticleOutput - The return type for the generateFarmingArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FarmingArticleInputSchema = z.object({
  countryName: z.string().default("Uganda").describe("The country for which the article should be relevant."),
  region: z.string().optional().describe('An optional specific agricultural region within the country (e.g., "Northern", "Central").'),
  topic: z.string().optional().describe('An optional topic for the article, e.g., "maize innovation", "water conservation", "soil health".'),
});
export type FarmingArticleInput = z.infer<typeof FarmingArticleInputSchema>;

const FarmingArticleOutputSchema = z.object({
  title: z.string().describe("A catchy and relevant fictional article title (max 15 words)."),
  introduction: z.string().describe("The full introduction paragraph as per the detailed structure provided: Hook, relevance, topic statement, purpose/value, and optional roadmap."),
  bodySectionHints: z.array(z.string()).describe("An array of 2-4 short strings, each suggesting a key theme or subheading for a major section of the article's body. These should guide the main content points."),
  fullArticleText: z.string().describe("The complete body of the article, providing detailed information, explanations, practical advice, examples, and solutions, structured around the bodySectionHints. It should be a substantial article of approximately 1500 words or more, including statistics and step-by-step guides where relevant."),
  conclusion: z.string().describe("The full conclusion paragraph as per the detailed structure provided: Summary of key takeaways, restatement of main point, broader significance, optional call to action, and concluding thought."),
  source: z.string().default("AgriAdvisor AI Digest").describe("A fictional source for the article."),
  date: z.string().describe("The current date in a readable format (e.g., 'May 23, 2024')."),
  imageHint: z.string().max(30).describe("A 1-2 word hint for a placeholder image (e.g., 'healthy crops', 'farmer meeting', 'irrigation system')."),
  imagePromptSuggestion: z.string().describe("A suggestion for a more detailed image generation prompt for a tool like DALL-E or Midjourney, based on the article's content.")
});
export type FarmingArticleOutput = z.infer<typeof FarmingArticleOutputSchema>;

export async function generateFarmingArticle(
  input: FarmingArticleInput
): Promise<FarmingArticleOutput> {
  return farmingArticleFlow(input);
}

const articlePrompt = ai.definePrompt({
  name: 'farmingArticlePrompt',
  input: {schema: FarmingArticleInputSchema},
  output: {schema: FarmingArticleOutputSchema},
  prompt: `You are an AI expert tasked with writing a comprehensive, engaging, and practical farming article of approximately 1500 words or more.
  The article must be relevant to {{{countryName}}}{{#if region}}, specifically the {{{region}}} region{{/if}}.
  {{#if topic}}The main topic is: {{{topic}}}{{else}}The topic should be a general farming improvement or innovation relevant to the context.{{/if}}

  Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

  Adhere strictly to the following structure and guidelines for the article content:

  **ARTICLE STRUCTURE GUIDELINES:**

  **1. Title:**
     - Create a catchy, relevant title (max 15 words).

  **2. Introduction (Generate as a single, coherent paragraph for the 'introduction' field):**
     - **Strong Hook:** Start with a relatable problem, intriguing statistic, short anecdote, or thought-provoking question relevant to farmers in {{{countryName}}}{{#if region}}/{{{region}}}{{/if}}.
     - **Establish Relevance:** Clearly state why the topic matters to them (impact on yields, income, community, food security, market price, sustainability).
     - **Introduce the Topic Clearly:** State what the article is about in simple terms.
     - **State Purpose/Value Proposition:** What will the reader gain? (e.g., practical tips, discover methods).
     - **Brief Roadmap (Optional):** Briefly mention key areas the article will explore.

  **3. Body Section Hints (Generate 2-4 short phrases for the 'bodySectionHints' array):**
     - These should be concise themes or potential subheadings that will guide the main content of the 'fullArticleText'.
     - Example hints: "Understanding Soil Degradation", "Practical Composting Techniques", "Benefits of Mulching", "Accessing Better Seed Varieties".

  **4. Full Article Text (Generate the complete body content for the 'fullArticleText' field - aim for approx. 1500 words or more):**
     - This is the core of your article and must be structured like a detailed report.
     - **Structure (Report-like):** The \`fullArticleText\` must be structured like a detailed report. Use each phrase from \`bodySectionHints\` as a clear thematic heading for a distinct section within the \`fullArticleText\`. Under each of these sections (derived from \`bodySectionHints\`), provide comprehensive details, explanations, practical step-by-step guides (if applicable), and statistics (if relevant). Ensure each section is well-developed and contributes to the overall report. Use clear paragraphs for readability within these sections. The writing style should be informative and authoritative, yet engaging and punchy where appropriate.
     - **Clear and Simple Language:** Avoid jargon or explain it. Use terms familiar in a Ugandan farming context.
     - **Practicality:** Focus on "how-to" information.
     - **Step-by-Step Instructions:** When providing practical advice that involves a sequence of actions (e.g., how to prepare a seedbed, how to apply a specific treatment), present these clearly as numbered or bulleted lists within the relevant section.
     - **Specific Details:** Instead of general advice, give concrete examples (e.g., specific crop varieties if relevant to the topic, measurements, common pest names).
     - **Include Statistics:** Where appropriate, back up claims or illustrate points with relevant (even if fictional but plausible and clearly stated as such if not real) statistics. For example, "Studies in similar regions show a yield increase of X%..." or "Proper storage can reduce post-harvest losses by up to Y%."
     - **Challenges AND Solutions:** Acknowledge difficulties (cost, labor) and suggest solutions or mitigations.
     - **Examples/Case Studies (Fictional but Plausible):** Invent brief examples like "Farmer Okello in Gulu found that..." to make information relatable.
     - **Regional Relevance:** Tailor information to {{{countryName}}}{{#if region}}, and the {{{region}}} region specifically if provided{{/if}}. Consider local climate, common crops, and farming systems.
     - **Logical Flow:** Ensure smooth transitions between paragraphs and sections for a well-organized feel.

  **5. Conclusion (Generate as a single, coherent paragraph for the 'conclusion' field):**
     - **Summarize Key Takeaways:** Briefly remind the reader of 1-3 most important points from the body.
     - **Restate Main Point (in different words):** Re-emphasize why the topic is important for success.
     - **Broader Significance (Optional):** Connect to livelihood, community, or food security.
     - **Call to Action (Optional but good):** Encourage trying a practice, seeking info, etc.
     - **Concluding Thought:** End with a memorable, encouraging sentence.

  **ADDITIONAL KEY FEATURES FOR THE ARTICLE CONTENT:**
  - **Audience:** Assume smallholder to medium-scale farmers in {{{countryName}}}.
  - **Accuracy:** Information should be plausible and align with good agricultural practices.
  - **Engagement:** Use varied sentence structure. Employ a direct and impactful tone where appropriate. Make it 'punchy'.
  - **Positive Tone:** Be supportive and empowering.
  - **Explain "Why":** Don't just say what to do, briefly explain the benefit or reason.

  **Output Fields to Generate:**
  - title: (String)
  - introduction: (String) The full introduction paragraph.
  - bodySectionHints: (Array of strings) 2-4 short hint phrases.
  - fullArticleText: (String) The complete main body of the article (approx. 1500 words or more, with statistics and step-by-step guides where applicable, structured as a report based on bodySectionHints).
  - conclusion: (String) The full conclusion paragraph.
  - source: (String) Default to "AgriAdvisor AI Digest" or similar if nothing more specific.
  - date: (String) Use today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
  - imageHint: (String) 1-2 word hint for a placeholder image.
  - imagePromptSuggestion: (String) A detailed prompt for an image generation model related to the article.

  Ensure the output is strictly in JSON format matching the schema.
  Ensure the article is well-organized, using clear headings (implied by bodySectionHints that structure the fullArticleText) and paragraphs to create a well-spaced and readable layout.
  `,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const farmingArticleFlow = ai.defineFlow(
  {
    name: 'farmingArticleFlow',
    inputSchema: FarmingArticleInputSchema,
    outputSchema: FarmingArticleOutputSchema,
  },
  async input => {
    const {output} = await articlePrompt(input);
    if (!output) {
      throw new Error("AI failed to generate the article. Output was null.");
    }
    // Ensure date is always set to current date, in case AI hallucinates a different one
    output.date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    // Basic validation for key fields
    if (!output.title || !output.introduction || !output.fullArticleText || !output.conclusion) {
        console.warn("AI output was missing one or more core article text fields. Defaulting them.");
        output.title = output.title || (input.topic ? `Article on ${input.topic}` : "Farming Insights");
        output.introduction = output.introduction || "Introduction not generated.";
        output.fullArticleText = output.fullArticleText || "Main article content not generated.";
        output.conclusion = output.conclusion || "Conclusion not generated.";
        output.bodySectionHints = output.bodySectionHints || [];
    }
    output.source = output.source || "AgriAdvisor AI Digest";
    output.imageHint = output.imageHint || "farming article";
    output.imagePromptSuggestion = output.imagePromptSuggestion || `An illustration for an article titled "${output.title}"`;
    return output;
  }
);

