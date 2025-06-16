
// src/lib/actions.ts
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
import {
  analyzeMalware as _analyzeMalware,
  type AnalyzeMalwareInput,
  type AnalyzeMalwareOutput,
} from '@/ai/flows/analyze-malware';
import {
  analyzeSystemConfiguration as _analyzeSystemConfiguration,
  type AnalyzeSystemConfigurationInput,
  type AnalyzeSystemConfigurationOutput,
} from '@/ai/flows/analyze-system-configuration';
import {
  generateGlobalThreatMapImage as _generateGlobalThreatMapImage,
  type GenerateGlobalThreatMapImageOutput,
} from '@/ai/flows/generate-global-threat-map-image';
import {
  checkOriginalityReport as _checkOriginalityReport,
  type CheckOriginalityReportInput,
  type CheckOriginalityReportOutput,
} from '@/ai/flows/check-originality-report';


export async function analyzePhishingAttempt(input: AnalyzePhishingAttemptInput): Promise<AnalyzePhishingAttemptOutput> {
  try {
    return await _analyzePhishingAttempt(input);
  } catch (error) {
    // console.error("Error in analyzePhishingAttempt action:", error); // Logging handled by flow
    if (error instanceof Error) {
      throw new Error(error.message); // Propagate specific error message
    }
    throw new Error("Failed to analyze phishing attempt. Please try again."); // Generic fallback
  }
}

export async function generateSecurityAwarenessTip(input: GenerateSecurityAwarenessTipInput): Promise<GenerateSecurityAwarenessTipOutput> {
  try {
    return await _generateSecurityAwarenessTip(input);
  } catch (error) {
    // console.error("Error in generateSecurityAwarenessTip action:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to generate security tip. Please try again.");
  }
}

export async function queryCybersecurityKnowledgeBase(input: QueryCybersecurityKnowledgeBaseInput): Promise<QueryCybersecurityKnowledgeBaseOutput> {
  try {
    return await _queryCybersecurityKnowledgeBase(input);
  } catch (error) {
    // console.error("Error in queryCybersecurityKnowledgeBase action:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to query knowledge base. Please try again.");
  }
}

export async function summarizeCybersecurityReport(input: SummarizeCybersecurityReportInput): Promise<SummarizeCybersecurityReportOutput> {
  try {
    return await _summarizeCybersecurityReport(input);
  } catch (error) {
    // console.error("Error in summarizeCybersecurityReport action:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to summarize report. Please try again.");
  }
}

export async function analyzeMalware(input: AnalyzeMalwareInput): Promise<AnalyzeMalwareOutput> {
  try {
    return await _analyzeMalware(input);
  } catch (error) {
    // console.error("Error in analyzeMalware action:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('Failed to analyze for malware. Please check the input and try again.');
  }
}

export async function analyzeSystemConfiguration(input: AnalyzeSystemConfigurationInput): Promise<AnalyzeSystemConfigurationOutput> {
  try {
    return await _analyzeSystemConfiguration(input);
  } catch (error) {
    // console.error("Error in analyzeSystemConfiguration action:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to analyze system configuration. Please check the input and try again.');
  }
}

export async function generateGlobalThreatMapImage(): Promise<GenerateGlobalThreatMapImageOutput> {
  try {
    return await _generateGlobalThreatMapImage();
  } catch (error) {
    // console.error("Error in generateGlobalThreatMapImage action:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to generate global threat map image. Please try again later.');
  }
}

export async function checkOriginalityReport(input: CheckOriginalityReportInput): Promise<CheckOriginalityReportOutput> {
  try {
    return await _checkOriginalityReport(input);
  } catch (error)
{
    // console.error("Error in checkOriginalityReport action:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to check originality. Please try again.');
  }
}

    