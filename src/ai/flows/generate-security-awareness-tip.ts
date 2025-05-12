'use server';
/**
 * @fileOverview A security awareness tip generator AI agent.
 *
 * - generateSecurityAwarenessTip - A function that generates a security awareness tip.
 * - GenerateSecurityAwarenessTipInput - The input type for the generateSecurityAwarenessTip function.
 * - GenerateSecurityAwarenessTipOutput - The return type for the generateSecurityAwarenessTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSecurityAwarenessTipInputSchema = z.object({
  topic: z.string().describe('The specific security topic to generate a tip about.'),
});
export type GenerateSecurityAwarenessTipInput = z.infer<typeof GenerateSecurityAwarenessTipInputSchema>;

const GenerateSecurityAwarenessTipOutputSchema = z.object({
  tip: z.string().describe('A security awareness tip related to the specified topic.'),
});
export type GenerateSecurityAwarenessTipOutput = z.infer<typeof GenerateSecurityAwarenessTipOutputSchema>;

export async function generateSecurityAwarenessTip(input: GenerateSecurityAwarenessTipInput): Promise<GenerateSecurityAwarenessTipOutput> {
  return generateSecurityAwarenessTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSecurityAwarenessTipPrompt',
  input: {schema: GenerateSecurityAwarenessTipInputSchema},
  output: {schema: GenerateSecurityAwarenessTipOutputSchema},
  prompt: `You are a cybersecurity awareness expert. Generate a concise and actionable security awareness tip related to the following topic:\n\nTopic: {{{topic}}}`,
});

const generateSecurityAwarenessTipFlow = ai.defineFlow(
  {
    name: 'generateSecurityAwarenessTipFlow',
    inputSchema: GenerateSecurityAwarenessTipInputSchema,
    outputSchema: GenerateSecurityAwarenessTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
