
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-security-awareness-tip.ts';
import '@/ai/flows/query-cybersecurity-knowledge-base.ts';
import '@/ai/flows/analyze-phishing-attempt.ts';
import '@/ai/flows/summarize-cybersecurity-report.ts';
import '@/ai/flows/analyze-malware.ts';
import '@/ai/flows/analyze-system-configuration.ts';
import '@/ai/flows/generate-global-threat-map-image.ts';
import '@/ai/flows/check-originality-report.ts'; // Added new flow
