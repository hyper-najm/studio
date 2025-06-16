
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Attempt to retrieve the API key from environment variables
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn(
    'GOOGLE_API_KEY is not set in environment variables. Genkit AI features may not work or may result in errors. Ensure this variable is set in your environment with a valid Google AI API key for your project. You can get a key from https://aistudio.google.com/.'
  );
  // Depending on strictness, you might throw an error here if the key is absolutely essential for the app to start
  // throw new Error('CRITICAL: GOOGLE_API_KEY is not set. AI features will fail.');
}

export const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : undefined), // Pass apiKey if available
  ],
  model: 'googleai/gemini-2.0-flash',
});

