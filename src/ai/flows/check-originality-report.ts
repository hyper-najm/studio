
'use server';
/**
 * @fileOverview AI-powered originality checking and report generation.
 *
 * - checkOriginalityReport - Analyzes text content for originality, potential plagiarism, and generates a structured report.
 * - CheckOriginalityReportInput - The input type for the checkOriginalityReport function.
 * - CheckOriginalityReportOutput - The return type for the checkOriginalityReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckOriginalityReportInputSchema = z.object({
  textContent: z.string().min(50, { message: "Text content must be at least 50 characters long." }).max(30000, { message: "Text content is too long (max 30000 characters)." }).describe('The text content to be analyzed for originality and plagiarism.'),
  fileName: z.string().optional().describe('Optional: The name of the file from which the text content was extracted.'),
});
export type CheckOriginalityReportInput = z.infer<typeof CheckOriginalityReportInputSchema>;

const SimilarityFindingSchema = z.object({
  segment: z.string().describe('The specific segment from the input text that shows similarity.'),
  explanation: z.string().describe('A brief explanation of the nature of the similarity or why it was flagged (e.g., "Common phrasing", "Matches publicly known information", "Structurally similar to standard templates").'),
  potentialSourceType: z.string().optional().describe('A general category of potential source if identifiable (e.g., "Common knowledge", "Widely published article snippet", "Standard legal clause"). This will not be a specific URL.'),
});

const CheckOriginalityReportOutputSchema = z.object({
  originalityScore: z.number().min(0).max(100).describe('A score from 0 to 100 indicating the perceived originality of the text. 100 means highly original, 0 means very low originality.'),
  plagiarismAssessment: z.enum(["Low", "Medium", "High", "Very High"]).describe('An overall assessment of the likelihood that the text contains non-original content.'),
  assessmentSummary: z.string().describe('A brief summary of the overall findings regarding originality and potential plagiarism.'),
  similarSegments: z.array(SimilarityFindingSchema).describe('A list of segments from the text that show similarities to known patterns, common phrases, or widely available information. This is based on general knowledge and semantic similarity, not a live database check.'),
  overallSummary: z.string().describe('A concise summary of the input text content itself.'),
  keyThemes: z.array(z.string()).describe('A list of key themes or topics identified in the input text.'),
  confidence: z.enum(["Low", "Medium", "High"]).describe("The AI's confidence in this overall originality assessment (Low, Medium, High)."),
});
export type CheckOriginalityReportOutput = z.infer<typeof CheckOriginalityReportOutputSchema>;

export async function checkOriginalityReport(input: CheckOriginalityReportInput): Promise<CheckOriginalityReportOutput> {
  return checkOriginalityReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkOriginalityReportPrompt',
  input: {schema: CheckOriginalityReportInputSchema},
  output: {schema: CheckOriginalityReportOutputSchema},
  config: {
    safetySettings: [ // Less restrictive safety settings for general text analysis
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an AI assistant specialized in analyzing text for originality and potential similarities to existing content. You are NOT a traditional plagiarism checker with a database of sources to compare against. Your analysis will be based on semantic understanding, common knowledge, and pattern recognition.

Analyze the following text content:
{{#if fileName}}
(From file: {{{fileName}}})
{{/if}}
--- TEXT START ---
{{{textContent}}}
--- TEXT END ---

Based on your analysis, provide a structured report with the following fields:
1.  "originalityScore": An estimated score from 0 (very low originality) to 100 (highly original).
2.  "plagiarismAssessment": Categorize the risk of non-original content as "Low", "Medium", "High", or "Very High".
3.  "assessmentSummary": A brief (1-2 sentences) overall summary of your findings regarding originality and similarity.
4.  "similarSegments": Identify specific segments from the input text that show notable similarity to common phrases, widely known information, or generic structures. For each segment:
    *   "segment": Quote the exact text segment.
    *   "explanation": Briefly explain why this segment was flagged (e.g., "Commonly used idiom," "Standard definition of a known concept," "Resembles typical boilerplate language").
    *   "potentialSourceType" (optional): If possible, suggest a general category of where such phrasing might originate (e.g., "General knowledge," "Common academic writing pattern," "Standard business communication"). Do NOT invent specific URLs or book titles.
    If no significant similarities are found, provide an empty array for "similarSegments" or a single entry stating such.
5.  "overallSummary": A concise summary of what the provided text is about.
6.  "keyThemes": List the main themes or topics discussed in the text.
7.  "confidence": State your confidence (Low, Medium, High) in this entire assessment.

IMPORTANT:
- Your "similarSegments" analysis should focus on semantic and structural similarities recognizable from general knowledge. Do not claim to have checked against any specific database.
- Be objective and factual in your report.

Output your response strictly as a single, valid JSON object adhering to the defined output schema.
`,
});

const checkOriginalityReportFlow = ai.defineFlow(
  {
    name: 'checkOriginalityReportFlow',
    inputSchema: CheckOriginalityReportInputSchema,
    outputSchema: CheckOriginalityReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI model did not return a valid originality report. This might be due to content filters or an internal error.');
    }
    return output;
  }
);
