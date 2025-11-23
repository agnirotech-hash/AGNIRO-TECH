
import { config } from 'dotenv';
config();

// Dynamically import flows to avoid build errors if a flow is temporarily removed or renamed
// during development. In a production build, these would be static.
async function importFlows() {
  try {
    await import('@/ai/flows/ai-planting-advisor.ts');
    await import('@/ai/flows/crop-autofill-flow.ts');
    await import('@/ai/flows/generate-farming-article-flow.ts');
    await import('@/ai/flows/general-farming-chat-flow.ts'); 
    await import('@/ai/flows/diagnose-plant-health-flow.ts'); // Added new flow
    console.log('AI flows loaded.');
  } catch (error) {
    console.error('Error loading AI flows:', error);
  }
}

importFlows();

    