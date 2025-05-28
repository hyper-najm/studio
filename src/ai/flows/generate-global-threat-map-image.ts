
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
      prompt: `Generate a visually appealing, dark-themed, high-resolution world map for a cybersecurity dashboard. This map should clearly and intuitively display global cyber threat activity.
Key requirements:
1.  **Clarity and Legibility**: The map must be easily understandable, even when viewed at typical dashboard sizes, and should be suitable for enlargement to show more detail. Prioritize legibility of any text or icons.
2.  **Educational Value**: Highlight major cybersecurity hubs and regions known for specific, prevalent threat types (e.g., regions with high phishing activity, common origins of ransomware, major botnet command and control (C&C) server locations, areas with significant DDoS attacks).
3.  **Symbolism & Color-Coding**: Use distinct, simple, and universally understandable symbolic icons (e.g., a stylized fish for phishing, a skull for malware/botnets, a shield for defense hubs, a broken lock for ransomware, an explosion/impact icon for DDoS). Alternatively, use a clear, high-contrast color-coding scheme to represent different threat categories or risk levels. Ensure colors are distinct and accessible.
4.  **Visual Style**: Adopt a futuristic and professional aesthetic. Avoid excessive clutter. Key information must be prominent.
5.  **Data Representation**: If possible, use subtle visual cues like flow lines or arrows to suggest attack vectors or threat propagation patterns, but only if it doesn't compromise overall clarity. Annotate key regions with brief, informative labels about the prevalent threats (e.g., "East Asia - Advanced Persistent Threats", "Eastern Europe - Ransomware & Botnets").
6.  **Overall Impression**: The map should be engaging, informative, and convey a sense of the dynamic nature of global cyber threats. It should serve as both a quick overview and an educational tool. Ensure the image is generated at a resolution suitable for viewing on a dashboard and for closer inspection when enlarged.
Example focus areas for educational content: Common malware distribution networks, regions known for specific types of financial cybercrime, areas with high concentrations of vulnerable IoT devices.
`,
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
        ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed or returned no media URL.');
    }

    return { imageDataUri: media.url };
  }
);
