// Use server directive.
'use server';

/**
 * @fileOverview AI-powered system configuration and log analysis flow.
 *
 * - analyzeSystemConfiguration - Analyzes textual descriptions of system configurations, logs, and overall system purpose.
 * - AnalyzeSystemConfigurationInput - The input type for the analyzeSystemConfiguration function.
 * - AnalyzeSystemConfigurationOutput - The return type for the analyzeSystemConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSystemConfigurationInputSchema = z.object({
  systemName: z.string().optional().describe('The name or identifier of the system being analyzed (e.g., "WebServer-Prod", "Database-Dev").'),
  systemDescription: z.string().min(20, {message: "System description must be at least 20 characters."}).describe('A detailed description of the system, including its purpose, operating system, key software, and network role.'),
  configurationSnippets: z.string().optional().describe('Relevant configuration file excerpts or settings (e.g., firewall rules, web server config, sshd_config).'),
  logExcerpts: z.string().optional().describe('Snippets of log files that might indicate issues or anomalies (e.g., error messages, suspicious access attempts).'),
});

export type AnalyzeSystemConfigurationInput = z.infer<typeof AnalyzeSystemConfigurationInputSchema>;

const AnalyzeSystemConfigurationOutputSchema = z.object({
  overallAssessment: z.string().describe('A high-level summary of the system security posture based on the provided information.'),
  identifiedVulnerabilities: z.array(z.object({
    vulnerability: z.string().describe('Description of the identified vulnerability or misconfiguration.'),
    severity: z.enum(["Critical", "High", "Medium", "Low", "Informational"]).describe('The assessed severity of the vulnerability.'),
    context: z.string().optional().describe('Specific context from the input that led to this finding (e.g., a specific log line or config snippet).'),
  })).describe('A list of potential vulnerabilities, misconfigurations, or anomalies detected.'),
  recommendations: z.array(z.object({
    action: z.string().describe('A specific, actionable recommendation to address an identified issue or improve security.'),
    priority: z.enum(["High", "Medium", "Low"]).describe('The priority for implementing this recommendation.'),
    justification: z.string().optional().describe('Brief explanation of why this action is recommended.'),
  })).describe('A list of actionable steps to improve system security.'),
  educationalInsights: z.array(z.string()).describe('Educational notes explaining relevant security concepts, why certain findings are problematic, or best practices related to the analysis.'),
});
export type AnalyzeSystemConfigurationOutput = z.infer<typeof AnalyzeSystemConfigurationOutputSchema>;

export async function analyzeSystemConfiguration(input: AnalyzeSystemConfigurationInput): Promise<AnalyzeSystemConfigurationOutput> {
  return analyzeSystemConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSystemConfigurationPrompt',
  input: {schema: AnalyzeSystemConfigurationInputSchema},
  output: {schema: AnalyzeSystemConfigurationOutputSchema},
  prompt: `You are an expert cybersecurity analyst and system administrator. Your task is to analyze the provided system information (name, description, configuration snippets, and log excerpts) to identify security vulnerabilities, misconfigurations, anomalies, and provide actionable recommendations and educational insights.

Provided System Information:
System Name: {{#if systemName}}"{{{systemName}}}"{{else}}Not provided{{/if}}

System Description:
{{{systemDescription}}}

{{#if configurationSnippets}}
Configuration Snippets:
{{{configurationSnippets}}}
{{/if}}

{{#if logExcerpts}}
Log Excerpts:
{{{logExcerpts}}}
{{/if}}

Based on ALL available information, please:
1.  Provide an "overallAssessment" of the system's security posture based on the input.
2.  Identify potential "identifiedVulnerabilities". For each vulnerability:
    - Clearly describe the "vulnerability".
    - Assign a "severity" (Critical, High, Medium, Low, Informational).
    - Optionally, provide "context" from the input that points to this vulnerability.
3.  Suggest "recommendations". For each recommendation:
    - Detail the "action" to be taken.
    - Assign a "priority" (High, Medium, Low).
    - Optionally, provide "justification" for the action.
4.  Offer "educationalInsights" related to the findings, explaining relevant security concepts or best practices.

Prioritize findings that indicate immediate risks or significant security gaps. Be thorough and specific. If information is insufficient for a definitive conclusion on a particular aspect, state that clearly in the assessment or insights.

Respond strictly in the following JSON format. Ensure all fields in the output schema are addressed. If no specific vulnerabilities are found, the identifiedVulnerabilities array can be empty, but still provide an overall assessment and potentially general recommendations or educational insights.
`,
});

const analyzeSystemConfigurationFlow = ai.defineFlow(
  {
    name: 'analyzeSystemConfigurationFlow',
    inputSchema: AnalyzeSystemConfigurationInputSchema,
    outputSchema: AnalyzeSystemConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
