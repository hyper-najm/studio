// src/ai/flows/query-cybersecurity-knowledge-base.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for querying a cybersecurity knowledge base.
 *
 * The flow allows users to query a knowledge base using natural language to find information about specific threats,
 * vulnerabilities, or best practices, with an emphasis on education.
 *
 * @param queryCybersecurityKnowledgeBase - A function that handles the querying process.
 * @param QueryCybersecurityKnowledgeBaseInput - The input type for the queryCybersecurityKnowledgeBase function.
 * @param QueryCybersecurityKnowledgeBaseOutput - The return type for the queryCybersecurityKnowledgeBase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QueryCybersecurityKnowledgeBaseInputSchema = z.object({
  query: z.string().describe('The natural language query to search the cybersecurity knowledge base.'),
});
export type QueryCybersecurityKnowledgeBaseInput = z.infer<typeof QueryCybersecurityKnowledgeBaseInputSchema>;

const QueryCybersecurityKnowledgeBaseOutputSchema = z.object({
  answer: z.string().describe('The answer from the cybersecurity knowledge base in response to the query, presented in an educational and easy-to-understand manner.'),
  sources: z.array(z.string()).describe('A list of sources used to generate the answer.'),
  furtherLearning: z.array(z.string()).optional().describe('Keywords or concepts for further learning related to the query.'),
});
export type QueryCybersecurityKnowledgeBaseOutput = z.infer<typeof QueryCybersecurityKnowledgeBaseOutputSchema>;

export async function queryCybersecurityKnowledgeBase(input: QueryCybersecurityKnowledgeBaseInput): Promise<QueryCybersecurityKnowledgeBaseOutput> {
  return queryCybersecurityKnowledgeBaseFlow(input);
}

const queryCybersecurityKnowledgeBasePrompt = ai.definePrompt({
  name: 'queryCybersecurityKnowledgeBasePrompt',
  input: {schema: QueryCybersecurityKnowledgeBaseInputSchema},
  output: {schema: QueryCybersecurityKnowledgeBaseOutputSchema},
  prompt: `You are an intelligent cybersecurity advisor and educator bot. Use your knowledge of common security threats, vulnerabilities, and security best practices to answer the following query.

Query: {{{query}}}

Answer in a comprehensive, educational, and easy-to-understand manner.
- Break down complex topics into digestible parts.
- Explain technical terms clearly.
- Provide actionable advice or solutions where appropriate.
- If possible, suggest 1-2 keywords or concepts for further learning related to the query (for the 'furtherLearning' field).
- Include the specific sources you used to answer the question (for the 'sources' field).

Your primary goal is to educate the user while answering their question accurately.
`,
});

const queryCybersecurityKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'queryCybersecurityKnowledgeBaseFlow',
    inputSchema: QueryCybersecurityKnowledgeBaseInputSchema,
    outputSchema: QueryCybersecurityKnowledgeBaseOutputSchema,
  },
  async input => {
    const {output} = await queryCybersecurityKnowledgeBasePrompt(input);
    return output!;
  }
);
