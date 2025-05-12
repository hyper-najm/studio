// Use server directive.
'use server';

/**
 * @fileOverview AI-powered phishing detection flow.
 *
 * - analyzePhishingAttempt - Analyzes URLs, text snippets, or email content for phishing threats.
 * - AnalyzePhishingAttemptInput - The input type for the analyzePhishingAttempt function.
 * - AnalyzePhishingAttemptOutput - The return type for the analyzePhishingAttempt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePhishingAttemptInputSchema = z.object({
  content: z.string().describe('The URL, text snippet, or email content to analyze for phishing threats.'),
});
export type AnalyzePhishingAttemptInput = z.infer<typeof AnalyzePhishingAttemptInputSchema>;

const AnalyzePhishingAttemptOutputSchema = z.object({
  riskScore: z.number().describe('A numerical score indicating the risk level of the input content (0-100).'),
  threatsIdentified: z.array(z.string()).describe('A list of specific phishing threats identified in the content.'),
  explanation: z.string().describe('A detailed explanation of the identified threats and the reasoning behind the risk score.'),
});
export type AnalyzePhishingAttemptOutput = z.infer<typeof AnalyzePhishingAttemptOutputSchema>;

export async function analyzePhishingAttempt(input: AnalyzePhishingAttemptInput): Promise<AnalyzePhishingAttemptOutput> {
  return analyzePhishingAttemptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhishingAttemptPrompt',
  input: {schema: AnalyzePhishingAttemptInputSchema},
  output: {schema: AnalyzePhishingAttemptOutputSchema},
  prompt: `You are an AI cybersecurity expert specializing in phishing detection. Analyze the provided content for potential phishing threats, providing a risk score (0-100), a list of identified threats, and a detailed explanation.

Content to Analyze: {{{content}}}

Respond in a JSON format:
{
  "riskScore": number,
  "threatsIdentified": string[],
  "explanation": string
}`,
});

const analyzePhishingAttemptFlow = ai.defineFlow(
  {
    name: 'analyzePhishingAttemptFlow',
    inputSchema: AnalyzePhishingAttemptInputSchema,
    outputSchema: AnalyzePhishingAttemptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
