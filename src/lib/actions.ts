'use server';

import { 
  analyzePhishingAttempt as _analyzePhishingAttempt, 
  type AnalyzePhishingAttemptInput, 
  type AnalyzePhishingAttemptOutput 
} from '@/ai/flows/analyze-phishing-attempt';
import { 
  generateSecurityAwarenessTip as _generateSecurityAwarenessTip, 
  type GenerateSecurityAwarenessTipInput, 
  type GenerateSecurityAwarenessTipOutput 
} from '@/ai/flows/generate-security-awareness-tip';
import { 
  queryCybersecurityKnowledgeBase as _queryCybersecurityKnowledgeBase, 
  type QueryCybersecurityKnowledgeBaseInput, 
  type QueryCybersecurityKnowledgeBaseOutput 
} from '@/ai/flows/query-cybersecurity-knowledge-base';
import { 
  summarizeCybersecurityReport as _summarizeCybersecurityReport, 
  type SummarizeCybersecurityReportInput, 
  type SummarizeCybersecurityReportOutput 
} from '@/ai/flows/summarize-cybersecurity-report';

export async function analyzePhishingAttempt(input: AnalyzePhishingAttemptInput): Promise<AnalyzePhishingAttemptOutput> {
  try {
    return await _analyzePhishingAttempt(input);
  } catch (error) {
    console.error("Error in analyzePhishingAttempt:", error);
    throw new Error("Failed to analyze phishing attempt. Please try again.");
  }
}

export async function generateSecurityAwarenessTip(input: GenerateSecurityAwarenessTipInput): Promise<GenerateSecurityAwarenessTipOutput> {
  try {
    return await _generateSecurityAwarenessTip(input);
  } catch (error) {
    console.error("Error in generateSecurityAwarenessTip:", error);
    throw new Error("Failed to generate security tip. Please try again.");
  }
}

export async function queryCybersecurityKnowledgeBase(input: QueryCybersecurityKnowledgeBaseInput): Promise<QueryCybersecurityKnowledgeBaseOutput> {
  try {
    return await _queryCybersecurityKnowledgeBase(input);
  } catch (error) {
    console.error("Error in queryCybersecurityKnowledgeBase:", error);
    throw new Error("Failed to query knowledge base. Please try again.");
  }
}

export async function summarizeCybersecurityReport(input: SummarizeCybersecurityReportInput): Promise<SummarizeCybersecurityReportOutput> {
  try {
    return await _summarizeCybersecurityReport(input);
  } catch (error) {
    console.error("Error in summarizeCybersecurityReport:", error);
    throw new Error("Failed to summarize report. Please try again.");
  }
}
