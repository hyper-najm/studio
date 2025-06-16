
'use server';

/**
 * @fileOverview Summarizes lengthy cybersecurity reports and analyzes them for originality and AI generation.
 *
 * - summarizeCybersecurityReport - A function that summarizes reports and checks originality.
 * - SummarizeCybersecurityReportInput - The input type for the function.
 * - SummarizeCybersecurityReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCybersecurityReportInputSchema = z.object({
  report: z
    .string()
    .min(100, { message: 'Report content must be at least 100 characters long.' })
    .max(50000, { message: 'Report content is too long (max 50000 characters).' })
    .describe('The cybersecurity report text content to summarize and analyze for originality.'),
  reportFileName: z.string().optional().describe('The original file name of the report, if applicable. This provides context to the AI about the source.'),
});
export type SummarizeCybersecurityReportInput = z.infer<typeof SummarizeCybersecurityReportInputSchema>;

const SimilarityFindingSchema = z.object({
  segment: z.string().describe('The specific segment from the input text that shows similarity.'),
  explanation: z.string().describe('A brief explanation of the nature of the similarity or why it was flagged (e.g., "Common phrasing", "Matches publicly known information", "Structurally similar to standard templates").'),
  potentialSourceType: z.string().optional().describe('A general category of potential source if identifiable (e.g., "Common knowledge", "Widely published article snippet", "Standard legal clause"). This will not be a specific URL.'),
});

const SummarizeCybersecurityReportOutputSchema = z.object({
  // Summarization fields
  summary: z.string().describe('A concise summary of the cybersecurity report (max 3 sentences).'),
  keyFindings: z.string().describe('Key findings from the report, including their potential impact or implications (bulleted list).'),
  riskScore: z.string().describe('The overall risk score from the report and what it signifies (e.g., "High - Immediate attention required", "7/10 - Signifies significant exposure"). If no explicit score, assess and provide one.'),
  recommendedActions: z.string().describe('Recommended actions to address the findings (list of actionable steps).'),

  // Originality and AI Detection fields
  originalityScore: z.number().min(0).max(100).describe('A score from 0 (very low originality) to 100 (highly original), dynamically calculated based on the input text. This score MUST reflect a genuine analysis of the text\'s uniqueness and not be a fixed or default value.'),
  plagiarismAssessment: z.enum(["Low", "Medium", "High", "Very High"]).describe('An overall assessment of the likelihood that the text contains non-original content based on general knowledge.'),
  originalityAssessmentSummary: z.string().describe('A brief summary of the overall findings regarding originality and potential plagiarism (distinct from the main report summary).'),
  similarSegments: z.array(SimilarityFindingSchema).describe('A list of segments from the text that show similarities to known patterns, common phrases, or widely available information. This is based on general knowledge and semantic similarity, not a live database check.'),
  summarizedInputText: z.string().describe('A concise summary of what the provided input text itself is about (distinct from the main report summary).'),
  keyThemesInInput: z.array(z.string()).describe('A list of key themes or topics identified in the input text (distinct from key findings of the report).'),
  originalityAnalysisConfidence: z.enum(["Low", "Medium", "High"]).describe("The AI's confidence in its originality and plagiarism assessment (Low, Medium, High)."),
  aiGenerationAssessment: z.object({
    isLikelyAi: z.boolean().describe('True if the text is assessed as likely AI-generated, False if likely human-written.'),
    confidenceScore: z.number().min(0).max(100).describe("Confidence (0-100%) in the 'isLikelyAi' assessment. If isLikelyAi is true, this is confidence it IS AI. If false, confidence it is HUMAN."),
    assessmentExplanation: z.string().optional().describe('Brief explanation for the AI generation assessment, highlighting specific textual indicators or observed patterns that led to the conclusion (e.g., tone, repetition, phrasing style).'),
  }).describe('Assessment of whether the content appears to be AI-generated, including specific indicators if possible.'),
});
export type SummarizeCybersecurityReportOutput = z.infer<typeof SummarizeCybersecurityReportOutputSchema>;

export async function summarizeCybersecurityReport(input: SummarizeCybersecurityReportInput): Promise<SummarizeCybersecurityReportOutput> {
  return summarizeCybersecurityReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAndAnalyzeReportPrompt',
  input: {schema: SummarizeCybersecurityReportInputSchema},
  output: {schema: SummarizeCybersecurityReportOutputSchema},
  config: { 
    safetySettings: [ // Relaxed safety settings
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an expert cybersecurity analyst AND an AI content analysis specialist.
Your task is to thoroughly analyze the provided report content.
{{#if reportFileName}}
The report was provided from a file named: "{{reportFileName}}". This context might be relevant for understanding the report's nature.
{{else}}
The report was provided as pasted text.
{{/if}}

Report Content:
{{{report}}}

You must perform TWO main sets of tasks and provide a single JSON output adhering to the schema.

PART 1: CYBERSECURITY REPORT SUMMARIZATION
1.  "summary": Provide a concise summary of the cybersecurity report (max 3 sentences).
2.  "keyFindings": Extract key findings from the report. Format as a bulleted list, including their potential impact or implications. For example: "- Finding: Outdated software version. Impact: Exposes system to known vulnerabilities."
3.  "riskScore": Identify and state the overall risk score from the report and explain what it signifies (e.g., "High - Immediate attention required", "7/10 - Signifies significant exposure"). If no explicit score is present in the report, assess the content and provide an estimated risk score along with its justification.
4.  "recommendedActions": List recommended actions to address the findings. Format as a list of actionable steps.

PART 2: ORIGINALITY AND AI CONTENT DETECTION (Analyze the *same* "Report Content" provided above)
5.  "originalityScore": CRITICAL INSTRUCTION: This score MUST be a DYNAMIC ASSESSMENT from 0 (very low originality, e.g., largely copied or generic content) to 100 (highly original, e.g., unique insights and novel expression). DO NOT default to a common value like 65. Analyze the text's specific vocabulary, sentence structure, novelty of ideas, and resemblance to common knowledge or widely available information. A very generic or boilerplate text should receive a LOW score. A text with unique analysis and expression should receive a HIGH score. Your calculation must be sensitive to these variations. Internally, consider why you are assigning the score.
6.  "plagiarismAssessment": Categorize the risk of non-original content as "Low", "Medium", "High", or "Very High". This is based on semantic understanding and common knowledge, not a live database check.
7.  "originalityAssessmentSummary": Provide a brief (1-2 sentences) overall summary of your findings regarding originality and similarity. This is separate from the main report summary.
8.  "similarSegments": Identify specific segments from the input text that show notable similarity to common phrases, widely known information, or generic structures. For each segment:
    *   "segment": Quote the exact text segment.
    *   "explanation": Briefly explain why this segment was flagged (e.g., "Commonly used idiom," "Standard definition of a known concept," "Resembles typical boilerplate language").
    *   "potentialSourceType" (optional): If possible, suggest a general category of where such phrasing might originate (e.g., "General knowledge," "Common academic writing pattern"). Do NOT invent specific URLs or book titles.
    If no significant similarities are found, provide an empty array for "similarSegments".
9.  "summarizedInputText": Provide a concise summary of what the provided report text is about (distinct from the cybersecurity summary in Part 1).
10. "keyThemesInInput": List the main themes or topics discussed in the input text (distinct from key findings in Part 1).
11. "originalityAnalysisConfidence": State your confidence (Low, Medium, High) in this originality and plagiarism assessment (items 5-8).
12. "aiGenerationAssessment": Analyze the text for characteristics of AI-generated content. 
    *   "isLikelyAi": Set to true if the text is assessed as likely AI-generated, false if likely human-written.
    *   "confidenceScore": Your confidence (0-100%) in this 'isLikelyAi' assessment. This score should reflect the strength of the indicators found.
    *   "assessmentExplanation" (IMPORTANT): Provide a brief explanation for your 'isLikelyAi' assessment. Cite specific textual indicators or observed patterns that led to your assessment (e.g., "The text exhibits highly uniform sentence length and a lack of idiomatic expressions, common indicators of AI generation." or "The text uses varied sentence structures and complex, nuanced arguments more typical of human writing."). This explanation is crucial.

IMPORTANT:
- Your "similarSegments" analysis should focus on semantic and structural similarities recognizable from general knowledge. Do not claim to have checked against any specific database.
- Be objective and factual in your report.
- Your entire response MUST be a single, valid JSON object that strictly adheres to the defined output schema. Do not include any text, formatting, or markdown before or after the JSON object.
Ensure all fields from both summarization (Part 1) and originality/AI detection (Part 2) are present in your output.
`,
});

const summarizeCybersecurityReportFlow = ai.defineFlow(
  {
    name: 'summarizeCybersecurityReportFlow',
    inputSchema: SummarizeCybersecurityReportInputSchema,
    outputSchema: SummarizeCybersecurityReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // Attempt to get more detailed error information if available from the result
      // This depends on the structure of the error response from the AI provider
      // For now, throwing a generic error.
      console.error('AI model did not return a valid combined summary and originality report. Input:', JSON.stringify(input));
      throw new Error('AI model did not return a valid combined summary and originality report. This might be due to content filters, an internal error, or an issue with the prompt and output schema alignment. Check server logs for more details.');
    }
    return output;
  }
);
    

    