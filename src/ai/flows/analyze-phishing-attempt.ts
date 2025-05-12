// Use server directive.
'use server';

/**
 * @fileOverview AI-powered phishing detection flow.
 *
 * - analyzePhishingAttempt - Analyzes URLs, text snippets, email content, or images for phishing threats.
 * - AnalyzePhishingAttemptInput - The input type for the analyzePhishingAttempt function.
 * - AnalyzePhishingAttemptOutput - The return type for the analyzePhishingAttempt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePhishingAttemptInputSchema = z.object({
  content: z.string().min(10, { message: 'Content must be at least 10 characters long if provided.' }).optional().describe('The URL, text snippet, or email content to analyze for phishing threats.'),
  imageDataUri: z.string().optional().describe("An image data URI (e.g., a screenshot of a suspicious email or website) that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.")
}).refine(data => data.content || data.imageDataUri, {
  message: "Either text content or an image must be provided for analysis.",
});

export type AnalyzePhishingAttemptInput = z.infer<typeof AnalyzePhishingAttemptInputSchema>;

const AnalyzePhishingAttemptOutputSchema = z.object({
  riskScore: z.number().describe('A numerical score indicating the risk level of the input content (0-100).'),
  threatsIdentified: z.array(z.string()).describe('A list of specific phishing threats identified in the content.'),
  explanation: z.string().describe('A detailed explanation of the identified threats, the reasoning behind the risk score, educational insights into the phishing techniques used, and guidance on user actions.'),
});
export type AnalyzePhishingAttemptOutput = z.infer<typeof AnalyzePhishingAttemptOutputSchema>;

export async function analyzePhishingAttempt(input: AnalyzePhishingAttemptInput): Promise<AnalyzePhishingAttemptOutput> {
  return analyzePhishingAttemptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhishingAttemptPrompt',
  input: {schema: AnalyzePhishingAttemptInputSchema},
  output: {schema: AnalyzePhishingAttemptOutputSchema},
  prompt: `You are an AI cybersecurity expert and educator specializing in phishing detection. Analyze the provided content and/or image for potential phishing threats.

{{#if content}}
Content to Analyze: {{{content}}}
{{/if}}
{{#if imageDataUri}}
Image to Analyze: {{media url=imageDataUri}}
Instruction for image: If an image is provided (e.g., a screenshot), analyze its visual elements for phishing indicators such as suspicious branding, urgent calls to action, unusual URLs in text, or generic greetings.
{{/if}}

Provide a response in JSON format with:
1.  "riskScore": A numerical score (0-100) indicating the phishing risk.
2.  "threatsIdentified": A list of specific phishing techniques or indicators observed (e.g., "Suspicious URL structure", "Urgent call to action", "Generic greeting", "Request for sensitive information", "Sender impersonation").
3.  "explanation": A detailed explanation covering:
    - The reasoning behind the risk score.
    - An educational breakdown of each identified threat: what it is, why it's a red flag for phishing.
    - Clear guidance for the user:
        - What to do if they encounter such an attempt (e.g., "Do not click any links.", "Do not download attachments.", "Do not provide any personal information.").
        - How to report the attempt (if applicable, e.g., "Report to your IT department or email provider.").
        - How to independently verify the legitimacy of such communications (e.g., "Navigate to the official website directly, do not use links from the suspicious message.").
    - If no significant threats are found, explain why the content is considered safe or low-risk, and perhaps offer a general security reminder.

Example of a good explanation for an identified threat:
"Threat: Urgent Call to Action - The email creates a false sense of urgency by claiming your account will be suspended. Why it's a red flag: Attackers use this tactic to pressure you into acting quickly without thinking. Guidance: Always be wary of messages demanding immediate action. Independently verify such claims by contacting the service provider through official channels."

Respond strictly in the following JSON format:
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

```