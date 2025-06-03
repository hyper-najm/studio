
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
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
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

VERY IMPORTANT: Your entire response MUST be a single, valid JSON object that strictly adheres to the defined output schema. Do not include any text, formatting, or markdown before or after the JSON object.
`,
});

const analyzePhishingAttemptFlow = ai.defineFlow(
  {
    name: 'analyzePhishingAttemptFlow',
    inputSchema: AnalyzePhishingAttemptInputSchema,
    outputSchema: AnalyzePhishingAttemptOutputSchema,
  },
  async (input) => {
    try {
      // This is the core Genkit call to the prompt.
      // It internally handles sending the prompt to the model and parsing the response against outputSchema.
      const result = await prompt(input);
      const output = result.output; // The parsed output adhering to AnalyzePhishingAttemptOutputSchema

      // If 'output' is null or undefined, it means the model's response might have been empty
      // or couldn't be successfully parsed into the schema by Genkit, even if no hard error was thrown.
      if (!output) {
        console.error(
          'analyzePhishingAttemptFlow: AI model returned null or undefined output after parsing. Input:',
          JSON.stringify(input), // Log input for debugging
          'This could be due to content filters or the model providing an empty/invalid structured response.'
        );
        throw new Error(
          'AI model returned no valid structured data. Check server logs.'
        );
      }
      return output;
    } catch (e: any) {
      // This catch block will handle errors during the execution of `prompt(input)`
      // (e.g., network issues, API errors from the model provider, or if Genkit fails to parse
      // a malformed non-JSON response from the model before even attempting Zod validation).
      console.error(
        `analyzePhishingAttemptFlow: Error during prompt execution or response parsing. Input: ${JSON.stringify(input)} Error: ${e.message}`, // Log input and error message
        e.stack // Log the stack trace for more details
      );
      // Re-throw a new error that will be caught by the calling action in src/lib/actions.ts
      // which will then show the generic "Failed to analyze phishing attempt..." message to the user.
      throw new Error(
        `AI analysis failed during prompt execution or response parsing: ${e.message || 'Unknown error during AI processing.'}`
      );
    }
  }
);

