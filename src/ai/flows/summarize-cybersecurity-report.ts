'use server';

/**
 * @fileOverview Summarizes lengthy cybersecurity reports into concise summaries.
 *
 * - summarizeCybersecurityReport - A function that summarizes cybersecurity reports.
 * - SummarizeCybersecurityReportInput - The input type for the summarizeCybersecurityReport function.
 * - SummarizeCybersecurityReportOutput - The return type for the summarizeCybersecurityReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCybersecurityReportInputSchema = z.object({
  report: z
    .string()
    .describe('The cybersecurity report to summarize.'),
});
export type SummarizeCybersecurityReportInput = z.infer<typeof SummarizeCybersecurityReportInputSchema>;

const SummarizeCybersecurityReportOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the cybersecurity report.'),
  keyFindings: z.string().describe('Key findings from the report, including their potential impact or implications.'),
  riskScore: z.string().describe('The overall risk score from the report and what it signifies.'),
  recommendedActions: z.string().describe('Recommended actions to address the findings.'),
});
export type SummarizeCybersecurityReportOutput = z.infer<typeof SummarizeCybersecurityReportOutputSchema>;

export async function summarizeCybersecurityReport(input: SummarizeCybersecurityReportInput): Promise<SummarizeCybersecurityReportOutput> {
  return summarizeCybersecurityReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCybersecurityReportPrompt',
  input: {schema: SummarizeCybersecurityReportInputSchema},
  output: {schema: SummarizeCybersecurityReportOutputSchema},
  prompt: `You are an expert cybersecurity analyst. Your task is to summarize a cybersecurity report and provide key findings (explaining their potential impact or implications), risk score (and what it signifies), and recommended actions.

  Report:
  {{report}}
  \n
  Provide a concise summary, highlight key findings with their implications, provide the risk score with its significance, and suggest recommended actions based on the report.
  Follow these instructions closely:
  - The summary should be no more than 3 sentences.
  - Key findings should be a bulleted list of the most important points, briefly explaining the impact of each. For example: "- Finding: Outdated software version. Impact: Exposes system to known vulnerabilities."
  - The risk score should be a single number or a short phrase indicating the severity of the risk (e.g., "High - Immediate attention required", "7/10 - Signifies significant exposure").
  - Recommended actions should be a list of actionable steps to mitigate the identified risks.
  \n  Format the output as a JSON object with the following keys: summary, keyFindings, riskScore, recommendedActions.
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
    return output!;
  }
);
