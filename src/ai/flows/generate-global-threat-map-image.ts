
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
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Use this model for image generation
      prompt: 'Generate a visually appealing, dark-themed, stylized world map indicating global cyber threat activity. Highlight major cybersecurity hubs or regions known for specific threat types (e.g., phishing hotspots, ransomware origins). Use clear, symbolic icons or color-coding to represent different categories of threats (e.g., malware, DDoS, data breaches). The style should be futuristic and suitable for a cybersecurity dashboard, focusing on conveying educational insights through visual representation rather than precise data accuracy. Ensure the map is not overly cluttered but clearly presents key information.',
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed or returned no media URL.');
    }

    return { imageDataUri: media.url };
  }
);

    