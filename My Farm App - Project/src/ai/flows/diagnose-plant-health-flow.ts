
'use server';
/**
 * @fileOverview An AI flow to diagnose plant health from an image and provide growth advice.
 *
 * - diagnosePlantHealth - A function that handles the plant diagnosis and growth advice process.
 * - DiagnosePlantHealthInput - The input type.
 * - DiagnosePlantHealthOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { RegionName } from '@/lib/crop-data';

const DiagnosePlantHealthInputSchema = z.object({
  cropName: z.string().describe("The expected name of the crop being analyzed."),
  plantingDate: z.string().describe("The date the crop was planted, in YYYY-MM-DD format."),
  currentDate: z.string().describe("The current date, in YYYY-MM-DD format."),
  photoDataUri: z
    .string()
    .describe(
      "A photo of the plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  region: z.string().describe("The agricultural region where the crop is grown (e.g., Northern, Central for Uganda). This helps contextualize advice."),
});
export type DiagnosePlantHealthInput = z.infer<typeof DiagnosePlantHealthInputSchema>;

const DiagnosePlantHealthOutputSchema = z.object({
  identification: z.object({
    isExpectedPlant: z.boolean().describe("True if the AI confirms the plant in the photo is very likely the expected 'cropName', false otherwise. Be critical in this assessment."),
    identifiedPlantName: z.string().optional().describe("If 'isExpectedPlant' is false, state what the plant in the photo appears to be. If 'isExpectedPlant' is true, this can be the same as 'cropName' or a more specific variety if identifiable."),
    confidence: z.string().optional().describe("AI's confidence level in its identification (e.g., High, Medium, Low), especially if it differs from 'cropName'.")
  }),
  healthAssessment: z.object({
    overallHealth: z.string().describe("A brief summary of the plant's overall health as observed from the image (e.g., 'Appears healthy', 'Showing signs of nutrient deficiency', 'Possible pest damage visible')."),
    leafAnalysis: z.object({
        color: z.string().optional().describe("Observed leaf color (e.g., healthy green, yellowing, browning, purplish). Note any variegation or patterns."),
        texture: z.string().optional().describe("Observed leaf texture (e.g., smooth, crinkled, wilting, spots)."),
        abnormalities: z.array(z.string()).optional().describe("List any specific leaf abnormalities (e.g., 'Leaf curl observed', 'Brown spots with yellow halos', 'Powdery white substance on leaves').")
    }).optional().describe("Detailed analysis of leaf condition."),
    pestIndicators: z.object({
        pestsVisible: z.array(z.string()).optional().describe("List any visible pests (e.g., 'Aphids on stem', 'Caterpillar on leaf')."),
        signsOfPests: z.array(z.string()).optional().describe("List any signs of pest damage (e.g., 'Chewed leaf edges', 'Honeydew presence', 'Webbing').")
    }).optional().describe("Indicators of pest presence or damage."),
    diseaseIndicators: z.object({
        symptoms: z.array(z.string()).optional().describe("List observed disease symptoms (e.g., 'Powdery mildew on leaves', 'Rust spots', 'Blight on stems', 'Wilting despite moist soil')."),
        potentialDiseases: z.array(z.string()).optional().describe("Suggest potential diseases based on symptoms for this crop in this region.")
    }).optional().describe("Indicators of plant diseases."),
    fruitFlowerAnalysis: z.string().optional().describe("If fruits or flowers are visible and relevant, briefly describe their appearance, any abnormalities, or an estimated ripeness/stage (e.g., 'Green tomatoes visible, appear unripe', 'Flowers are abundant and healthy', 'Some berries show signs of bird damage')."),
    overallStatusNotes: z.string().optional().describe("Any other direct visual observations about the plant's status not covered above.")
  }).describe("Detailed visual health assessment from the image."),
  growthStageAdvice: z.object({
    daysSincePlanting: z.number().int().nonnegative().describe("Calculated number of days since planting."),
    expectedStage: z.string().describe("A description of the typical growth stage for the 'cropName' given the 'daysSincePlanting' in the specified 'region' of Uganda."),
    stageSpecificCareTips: z.array(z.string()).optional().describe("Specific care tips relevant to this calculated growth stage for this crop in Uganda (e.g., 'Ensure consistent watering during flowering', 'Begin staking if not already done').")
  }).describe("Advice related to the plant's growth stage based on planting date."),
  recommendations: z.object({
    nutrientDeficiencyHints: z.string().optional().describe("Based on visual cues, suggest potential nutrient deficiencies (e.g., 'Yellowing leaves might indicate nitrogen deficiency'). Be cautious and suggest confirmation."),
    wateringStressHints: z.string().optional().describe("Based on visual cues, suggest if the plant appears over or under-watered (e.g., 'Wilting leaves despite recent rain might indicate overwatering or root issues', 'Dry, curling leaves suggest underwatering')."),
    suggestedActions: z.array(z.string()).optional().describe("A list of 2-4 actionable next steps or recommendations for the farmer based on the overall analysis (e.g., 'Monitor for pest progression', 'Consider applying a balanced fertilizer', 'Improve air circulation if powdery mildew is suspected', 'Verify soil moisture before next watering').")
  }).describe("Actionable recommendations based on the analysis."),
  additionalNotes: z.string().optional().describe("Any other relevant observations, advice, or limitations of the analysis (e.g., 'Image quality is low, making detailed pest identification difficult')."),
});
export type DiagnosePlantHealthOutput = z.infer<typeof DiagnosePlantHealthOutputSchema>;

export async function diagnosePlantHealth(input: DiagnosePlantHealthInput): Promise<DiagnosePlantHealthOutput> {
  return diagnosePlantHealthFlow(input);
}

const diagnosePlantPrompt = ai.definePrompt({
  name: 'diagnosePlantHealthPrompt',
  input: {schema: DiagnosePlantHealthInputSchema},
  output: {schema: DiagnosePlantHealthOutputSchema},
  prompt: `You are an expert agronomist and plant pathologist for Uganda, specializing in visual crop assessment and growth tracking.
  The user has provided a photo of a crop, its name, planting date, and the current date for the '{{region}}' region of Uganda.

  Photo of the crop: {{media url=photoDataUri}}
  User-Provided Expected Crop Name: {{{cropName}}}
  Planting Date: {{{plantingDate}}}
  Current Date: {{{currentDate}}}
  Region: {{{region}}}, Uganda

  Based on this information, please provide a detailed analysis. Calculate 'daysSincePlanting' based on plantingDate and currentDate.

  Structure your response strictly according to the JSON schema provided for 'DiagnosePlantHealthOutputSchema'.

  Key tasks:

  1.  **Identification**:
      *   CRITICALLY EXAMINE THE PHOTO. Compare it carefully to the 'User-Provided Expected Crop Name' ({{{cropName}}}).
      *   Set 'isExpectedPlant' to true ONLY IF you are reasonably confident the plant in the photo IS '{{{cropName}}}'. If it looks different, set to false.
      *   If 'isExpectedPlant' is false, clearly state what the plant in the photo ACTUALLY appears to be in 'identifiedPlantName'.
      *   If 'isExpectedPlant' is true, 'identifiedPlantName' can be '{{{cropName}}}' or a more specific variety if you can identify it.
      *   Provide a 'confidence' level (High, Medium, Low) for your overall identification in the 'confidence' field, especially if your identification differs from the user's expected crop.

  2.  **Health Assessment (from Image)**:
      *   'overallHealth': A brief summary of the plant's health as seen in the photo.
      *   'leafAnalysis': Describe leaf 'color', 'texture', and list any 'abnormalities' (e.g., spots, curls).
      *   'pestIndicators': List 'pestsVisible' and 'signsOfPests' (e.g., chewed leaves, webbing).
      *   'diseaseIndicators': List 'symptoms' observed and suggest 'potentialDiseases' for '{{{cropName}}}' in '{{{region}}}'.
      *   'fruitFlowerAnalysis': If fruits/flowers are clearly visible, describe their status.
      *   'overallStatusNotes': Other direct visual observations.

  3.  **Growth Stage Advice (Simulated)**:
      *   Calculate 'daysSincePlanting' (currentDate - plantingDate).
      *   'expectedStage': Describe the typical growth stage for '{{{cropName}}}' at this many days since planting, in the '{{{region}}}' of Uganda.
      *   'stageSpecificCareTips': Offer 2-4 actionable care tips for this specific stage and crop in Uganda.

  4.  **Recommendations**:
      *   'nutrientDeficiencyHints': Based on visual cues (e.g., leaf color), suggest possible nutrient issues. Phrase as possibilities.
      *   'wateringStressHints': Indicate if the plant seems over or under-watered from its appearance.
      *   'suggestedActions': Provide 2-4 clear, actionable steps for the farmer.

  5.  **Additional Notes**:
      *   Include any other relevant observations or advice. If image quality limits analysis, state it here.

  Be thorough, practical, and specific to Ugandan farming conditions for the '{{{region}}}' region.
  If you cannot determine something from the image, state that explicitly in the relevant field (e.g., "Pests not visible in image" or "Cannot assess fruit stage from this image").
  Ensure ALL fields in the output schema are populated, even if it's with a statement like "Not determinable from image" or an empty array where appropriate. Do not omit any top-level keys from the output.
  `,
});

const diagnosePlantHealthFlow = ai.defineFlow(
  {
    name: 'diagnosePlantHealthFlow',
    inputSchema: DiagnosePlantHealthInputSchema,
    outputSchema: DiagnosePlantHealthOutputSchema,
  },
  async (input) => {
    // Calculate daysSincePlanting
    const plantingDate = new Date(input.plantingDate);
    const currentDate = new Date(input.currentDate);
    const daysSincePlanting = Math.max(0, Math.floor((currentDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)));

    const {output} = await diagnosePlantPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate plant health analysis. Output was null.");
    }
    
    // Ensure daysSincePlanting is correctly injected into the output, as AI might not calculate it.
    // Also, ensure nested objects exist if the AI somehow misses them.
    output.growthStageAdvice = output.growthStageAdvice || { daysSincePlanting: 0, expectedStage: "N/A", stageSpecificCareTips: [] };
    output.growthStageAdvice.daysSincePlanting = daysSincePlanting;

    output.identification = output.identification || { isExpectedPlant: false };
    output.healthAssessment = output.healthAssessment || { overallHealth: "Assessment not provided by AI." };
    output.healthAssessment.leafAnalysis = output.healthAssessment.leafAnalysis || {};
    output.healthAssessment.pestIndicators = output.healthAssessment.pestIndicators || {};
    output.healthAssessment.diseaseIndicators = output.healthAssessment.diseaseIndicators || {};

    output.recommendations = output.recommendations || {};
    output.recommendations.suggestedActions = output.recommendations.suggestedActions || [];
    
    return output;
  }
);
