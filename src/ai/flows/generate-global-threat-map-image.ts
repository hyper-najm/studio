
'use server';
/**
 * @fileOverview Generates an image of a global threat map.
 *
 * - generateGlobalThreatMapImage - A function that generates the image.
 * - GenerateGlobalThreatMapImageOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGlobalThreatMapImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image of the global threat map as a data URI.'),
});
export type GenerateGlobalThreatMapImageOutput = z.infer<typeof GenerateGlobalThreatMapImageOutputSchema>;

// Wrapper function
export async function generateGlobalThreatMapImage(): Promise<GenerateGlobalThreatMapImageOutput> {
  return generateGlobalThreatMapImageFlow(undefined);
}

// Genkit Flow definition
const generateGlobalThreatMapImageFlow = ai.defineFlow(
  {
    name: 'generateGlobalThreatMapImageFlow',
    outputSchema: GenerateGlobalThreatMapImageOutputSchema,
  },
  async () => { 
    const generationResult = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation', // IMPORTANT: This is the correct model for image generation.
      prompt: `Generate a dark-themed, futuristic, high-resolution world map visualizing global cyber threats. The map should have glowing lines connecting various continents, representing data flows and potential attack vectors. Use a color palette with deep blues, electric cyan, and hints of red to indicate hotspots. This image is for a cybersecurity dashboard and should look professional and high-tech.`,
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
