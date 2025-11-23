
'use server';
/**
 * @fileOverview AI-powered general farming chatbot flow.
 *
 * - generalFarmingChat - A function that handles a user's chat query.
 * - GeneralFarmingChatInput - The input type.
 * - GeneralFarmingChatOutput - The return type.
 * - Message - The type for chat history messages.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});
export type Message = z.infer<typeof MessageSchema>;

const GeneralFarmingChatInputSchema = z.object({
  userQuery: z.string().describe("The user's current question or message to the chatbot."),
  chatHistory: z.array(MessageSchema).optional().describe("The history of the conversation so far, excluding the current userQuery."),
});
export type GeneralFarmingChatInput = z.infer<typeof GeneralFarmingChatInputSchema>;

const GeneralFarmingChatOutputSchema = z.object({
  aiResponse: z.string().describe("The chatbot's response to the user's query."),
});
export type GeneralFarmingChatOutput = z.infer<typeof GeneralFarmingChatOutputSchema>;

export async function generalFarmingChat(input: GeneralFarmingChatInput): Promise<GeneralFarmingChatOutput> {
  return generalFarmingChatFlow(input);
}

const SYSTEM_INSTRUCTION = `You are an expert AI Farming Advisor for Uganda.
Be helpful, friendly, and provide concise, accurate information related to farming, crops, livestock, soil health, pest control, irrigation, and market information relevant to Uganda.
If the user asks a question outside of farming topics, politely decline to answer and steer the conversation back to agriculture.
Keep your answers relatively brief unless the user asks for more detail.
You can use markdown for light formatting like lists or bolding if it enhances clarity.`;

const generalFarmingChatFlow = ai.defineFlow(
  {
    name: 'generalFarmingChatFlow',
    inputSchema: GeneralFarmingChatInputSchema,
    outputSchema: GeneralFarmingChatOutputSchema,
  },
  async ({ userQuery, chatHistory }) => {
    let effectiveHistory: Message[] = [];

    // Check if system prompt needs to be added
    const originalHistory = chatHistory || [];
    const needsSystemPrompt = originalHistory.length === 0 || 
                              !(originalHistory[0]?.role === 'user' && 
                                originalHistory[0]?.parts[0]?.text === SYSTEM_INSTRUCTION &&
                                originalHistory[1]?.role === 'model');

    if (needsSystemPrompt) {
      effectiveHistory = [
        { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] },
        { role: 'model', parts: [{ text: "Okay, I understand. I'm ready to help with farming queries related to Uganda." }] },
        ...originalHistory
      ];
    } else {
      effectiveHistory = [...originalHistory];
    }
    
    const result = await ai.generate({
      prompt: userQuery, // The latest user message
      history: effectiveHistory, 
      config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }
    });

    return { aiResponse: result.text }; // Changed from result.text() to result.text
  }
);

