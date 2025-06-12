
'use server';
/**
 * @fileOverview Generates an image of a global threat map.
 *
 * - generateGlobalThreatMapImage - A function that generates the image.
 * - GenerateGlobalThreatMapImageOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// No specific input needed for this version, but schema can be added for future customization
// const GenerateGlobalThreatMapImageInputSchema = z.object({});
// export type GenerateGlobalThreatMapImageInput = z.infer<typeof GenerateGlobalThreatMapImageInputSchema>;

const GenerateGlobalThreatMapImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image of the global threat map as a data URI.'),
});
export type GenerateGlobalThreatMapImageOutput = z.infer<typeof GenerateGlobalThreatMapImageOutputSchema>;

// Wrapper function
export async function generateGlobalThreatMapImage(): Promise<GenerateGlobalThreatMapImageOutput> {
  // Pass an empty object if an input schema is defined but not currently used for this specific call
  // For example, if GenerateGlobalThreatMapImageInputSchema were defined:
  // return generateGlobalThreatMapImageFlow({} as GenerateGlobalThreatMapImageInput);
  return generateGlobalThreatMapImageFlow(undefined);
}

// Genkit Flow definition
const generateGlobalThreatMapImageFlow = ai.defineFlow(
  {
    name: 'generateGlobalThreatMapImageFlow',
    // inputSchema: GenerateGlobalThreatMapImageInputSchema, // Uncomment if input schema is used
    outputSchema: GenerateGlobalThreatMapImageOutputSchema,
  },
  async () => { // Input parameter removed as it's not used for this basic version
    const generationResult = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Use this model for image generation
      prompt: `Generate a dark-themed, futuristic, high-resolution world map visualizing global cyber threats. Suitable for a cybersecurity dashboard.`, // Further simplified prompt
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
           {
            category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
            threshold: 'BLOCK_NONE',
          }
        ],
      },
    });

    const media = generationResult.media;

    if (!media || !media.url) {
      console.error(
        'generateGlobalThreatMapImageFlow: Image generation failed or returned no media URL. Full AI response:',
        JSON.stringify(generationResult, null, 2)
      );
      throw new Error('AI image generation failed or returned no media URL. If this issue persists, please check server logs for more details.');
    }

    return { imageDataUri: media.url };
  }
);

