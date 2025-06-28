
'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, History, ListChecks, ShieldAlertIcon, TrendingUp, Globe, Lightbulb, Loader2, ServerCrash } from "lucide-react";
import Image from "next/image";
import { ActiveThreatsChart } from "@/components/dashboard/active-threats-chart";
import { SecurityScoreDisplay } from "@/components/dashboard/security-score-display";
import { ComplianceStatusChart } from "@/components/dashboard/compliance-status-chart";
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription as UiAlertDescription } from "@/components/ui/alert";
import { generateGlobalThreatMapImage } from "@/lib/actions";

const sampleEventTemplates = [
  { title: (target?: string) => `Phishing attempt blocked: ${target || 'user@example.com'}`, source: (ip?: string) => `Source IP: ${ip || '198.51.100.12'}` },
  { title: (user?: string) => `Unusual login activity: ${user || 'admin_user'}`, source: (location?: string) => `Location: ${location || 'Unknown Source (IP: ' + getRandomIp() + ')'}` },
  { title: (file?: string) => `Malware detected: ${file || 'suspicious_payload.exe'}`, source: (system?: string) => `System: ${system || 'Workstation-05'}` },
  { title: (rule?: string) => `Firewall rule updated: ${rule || '#FW-087'}`, source: (action?: string) => `Action: ${action || 'Blocked port 8080'}` },
  { title: (policy?: string) => `Security policy '${policy || 'MFA Enforcement'}' updated`, source: () => `Status: Applied company-wide` },
  { title: () => `System scan completed on Server-01`, source: () => `Result: No new threats found` },
  { title: (domain?: string) => `Suspicious domain access: ${domain || 'malicious-site.io'}`, source: (user?: string) => `User: ${user || 'guest_user'}` },
  { title: (target?: string) => `Brute-force attempt detected on ${target || 'SSH server'}`, source: (ip?: string) => `Attempts from IP: ${ip || '103.22.45.190'}` },
  { title: (db?: string) => `Data exfiltration alert on ${db || 'CustomerDB-Prod'}`, source: (rule?: string) => `Rule ID: ${rule || 'DLP-007'}` },
  { title: (user?: string) => `MFA bypass attempt for user: ${user || 's.jones'}`, source: (method?: string) => `Method: ${method || 'SIM Swap suspected'}` },
  { title: () => `Security awareness training module completed`, source: (dept?: string) => `Department: ${dept || 'Finance'} - 85% completion` },
  { title: (vuln?: string) => `New critical vulnerability published: ${vuln || 'CVE-2024-CRITICAL'}`, source: () => `Action: Emergency scan initiated`},
];

const getRandomIp = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
const getRandomPastDate = (maxHoursAgo: number = 72) => {
  const hoursAgo = Math.random() * maxHoursAgo;
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
};

const sampleVulnerabilitiesList = [
  { id: 'CVE-2024-1001', severity: 'Critical', description: 'Remote Code Execution in CoreService.exe', systemsAffected: 5, patchAvailable: false, note: 'Mitigation in place, vendor patch awaited.' },
  { id: 'CVE-2024-1002', severity: 'High', description: 'SQL Injection in UserAPI v1.2', systemsAffected: 12, patchAvailable: true, note: 'Patch deployed in staging.' },
  { id: 'CVE-2024-1003', severity: 'Medium', description: 'Cross-Site Scripting (XSS) in WebPortal', systemsAffected: 30, patchAvailable: true, note: 'Scheduled for next maintenance window.' },
  { id: 'CVE-2023-9876', severity: 'High', description: 'Outdated Apache Struts (v2.3.x)', systemsAffected: 8, patchAvailable: true, note: 'Upgrade to latest LTS version.' },
  { id: 'CVE-2023-5432', severity: 'Critical', description: 'Log4Shell Variant in Reporting Module', systemsAffected: 3, patchAvailable: false, note: 'Temporary workaround applied.' },
  { id: 'CVE-2024-1004', severity: 'Low', description: 'Information Disclosure in /api/debug endpoint', systemsAffected: 1, patchAvailable: true, note: 'Endpoint disabled in production.' },
  { id: 'CVE-2024-1005', severity: 'Medium', description: 'Weak Password Policy on Legacy CRM', systemsAffected: 50, patchAvailable: false, note: 'MFA enforcement scheduled for Q3.' },
  { id: 'CVE-2024-1006', severity: 'High', description: 'Unpatched OpenSSL Vulnerability (similar to Heartbleed)', systemsAffected: 7, patchAvailable: true, note: 'Patch testing in progress.' },
  { id: 'CVE-2024-1007', severity: 'Critical', description: 'Zero-day in MailTransferAgent (MTA)', systemsAffected: 2, patchAvailable: false, note: 'Under active investigation with vendor.' },
  { id: 'CVE-2024-1008', severity: 'Medium', description: 'Default Credentials on Networked IoT Devices', systemsAffected: 15, patchAvailable: false, note: 'Network segmentation and credential rotation planned.' },
  { id: 'CVE-2024-1009', severity: 'Low', description: 'Verbose Error Messages Disclosing Path Info', systemsAffected: 25, patchAvailable: true, note: 'Configuration updated.' },
  { id: 'CVE-2024-1010', severity: 'Critical', description: 'Authentication Bypass in Admin Console', systemsAffected: 1, patchAvailable: false, note: 'Console access restricted to VPN.' },
];


interface DashboardEvent {
  id: string;
  title: string;
  source: string;
  timestamp: Date;
  formattedTimestamp?: string;
}

interface DashboardVulnerability {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  note?: string;
}

interface MapImage {
  src: string;
  alt: string;
  'data-ai-hint': string;
}

interface AiMapDetails {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: MapImage;
  errorMessage: string | null;
}

const initialAiMapPlaceholder: MapImage = {
  src: 'https://placehold.co/800x450.png',
  alt: 'Global threat map placeholder - initializing',
  'data-ai-hint': 'map placeholder initializing',
};

const loadingAiMapPlaceholder: MapImage = { 
  src: 'https://placehold.co/800x450.png', 
  alt: 'Loading dynamic global threat map...',
  'data-ai-hint': 'loading map',
};

const errorAiMapPlaceholder: MapImage = {
  src: `https://placehold.co/800x450.png`,
  alt: `AI Map Unavailable. Showing placeholder.`,
  'data-ai-hint': 'error map generation',
};

const allPossibleInsights = [
  "Did you know? Phishing remains the most common initial attack vector for cyber breaches globally.",
  "Geopolitical tensions often correlate with spikes in state-sponsored cyber activity targeting critical infrastructure in specific regions.",
  "IoT devices are increasingly targeted due to often weak default security settings. Always change default credentials and update firmware!",
  "Ransomware attacks are evolving, with attackers now frequently exfiltrating data before encryption (double extortion) and targeting backups.",
  "The average time to identify and contain a data breach is over 200 days according to recent reports. Rapid detection and response are crucial.",
  "Regularly updating software and operating systems patches known vulnerabilities, significantly reducing your attack surface.",
  "Multi-Factor Authentication (MFA) adds a critical layer of security, making it much harder for attackers to compromise accounts even with stolen credentials.",
  "Cybercriminals often exploit human psychology through social engineering. Always be skeptical of unsolicited communications asking for sensitive information or urging immediate action.",
  "A robust data backup strategy, including offsite and offline copies, is essential for recovery from ransomware or other data loss events. Test your backups regularly!",
  "Understanding common attack vectors like DDoS, SQL injection, and Cross-Site Scripting (XSS) can help in building more resilient systems and applications.",
  "Zero Trust Architecture, which assumes no implicit trust regardless of location, is becoming a foundational security model for modern enterprises.",
  "Threat intelligence feeds provide valuable, up-to-date information about emerging threats, vulnerabilities, and attacker tactics, techniques, and procedures (TTPs)."
];

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const NUMBER_OF_INSIGHTS_TO_DISPLAY = 3;
const INSIGHTS_INTERVAL_MS = 15000;
const DATA_REFRESH_INTERVAL_MS = 30000;

export default function DashboardPage() {
  const [activeThreatsCount, setActiveThreatsCount] = useState(0);
  const [threatChange, setThreatChange] = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState<DashboardVulnerability[]>([]);
  const [criticalVulnerabilityCount, setCriticalVulnerabilityCount] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  const [scoreImprovement, setScoreImprovement] = useState(0);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [globalThreatInsights, setGlobalThreatInsights] = useState<string[]>([]);

  const [aiMapDetails, setAiMapDetails] = useState<AiMapDetails>({
    status: 'idle',
    data: initialAiMapPlaceholder,
    errorMessage: null,
  });

  const fetchMap = useCallback(async () => {
    setAiMapDetails(prev => ({
      ...prev,
      status: 'loading',
      data: loadingAiMapPlaceholder, 
      errorMessage: null,
    }));

    try {
      const result = await generateGlobalThreatMapImage();
      if (result && result.imageDataUri && result.imageDataUri.length > 100 && result.imageDataUri.startsWith('data:image')) {
        setAiMapDetails({
          status: 'success',
          data: {
            src: result.imageDataUri,
            alt: 'Dynamically generated global cyber threat map by AI.',
            'data-ai-hint': 'threat map global ai',
          },
          errorMessage: null,
        });
      } else {
        const errorMsg = "AI map generation returned invalid or empty image data. Displaying placeholder.";
        setAiMapDetails({
          status: 'error',
          data: errorAiMapPlaceholder,
          errorMessage: errorMsg,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Could not load dynamic map due to an unknown server error.";
      setAiMapDetails({
        status: 'error',
        data: errorAiMapPlaceholder,
        errorMessage: errorMsg,
      });
    }
  }, []);

  const generateRandomData = useCallback(() => {
    setActiveThreatsCount(Math.floor(Math.random() * 25) + 8);
    setThreatChange(Math.floor(Math.random() * 11) - 5);

    const numVulsToShow = Math.floor(Math.random() * 4) + 4;
    const shuffledVuls = [...sampleVulnerabilitiesList].sort(() => 0.5 - Math.random());
    const selectedVuls = shuffledVuls.slice(0, numVulsToShow).map(v => ({
        id: v.id,
        severity: v.severity as DashboardVulnerability['severity'],
        description: v.description,
        note: v.note
    }));
    setVulnerabilities(selectedVuls);
    setCriticalVulnerabilityCount(selectedVuls.filter(v => v.severity === 'Critical').length);

    setSecurityScore(Math.floor(Math.random() * 36) + 60);
    setScoreImprovement(Math.floor(Math.random() * 7) + 1);

    const generatedEvents: DashboardEvent[] = sampleEventTemplates
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 4)
      .map((template, i) => {
        const randomArg = [getRandomIp(), `user${Math.floor(Math.random()*100)}`, `file_${Math.random().toString(36).substring(7)}.sh`, `policy${i+1}`, `CVE-2024-${Math.floor(Math.random()*1000)+2000}`][Math.floor(Math.random()*5)];
        const title = typeof template.title === 'function' ? template.title(randomArg) : 'Generic Event Title';
        const source = typeof template.source === 'function' ? template.source(randomArg) : 'Generic Source';
        const timestamp = getRandomPastDate(24 * (i + 1) * 0.5 );
        return {
          id: `event-${i}-${Date.now()}`,
          title,
          source,
          timestamp,
          formattedTimestamp: formatDistanceToNow(timestamp, { addSuffix: true }),
        };
      });
    setRecentEvents(generatedEvents.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));

    setGlobalThreatInsights(shuffleArray(allPossibleInsights).slice(0, NUMBER_OF_INSIGHTS_TO_DISPLAY));
  }, []);

  useEffect(() => {
    fetchMap();
    generateRandomData();
  }, [fetchMap, generateRandomData]);

  useEffect(() => {
    const insightsIntervalId = setInterval(() => {
       setGlobalThreatInsights(shuffleArray(allPossibleInsights).slice(0, NUMBER_OF_INSIGHTS_TO_DISPLAY));
    }, INSIGHTS_INTERVAL_MS);

    const dataRefreshIntervalId = setInterval(() => {
      generateRandomData();
    }, DATA_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(insightsIntervalId);
      clearInterval(dataRefreshIntervalId);
    };
  }, [generateRandomData]);


  const getSeverityClass = (severity: DashboardVulnerability['severity']) => {
    switch (severity) {
      case 'Critical': return 'text-destructive font-semibold';
      case 'High': return 'text-destructive/90 font-medium';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const threatChangeText = threatChange >= 0 ? `+${threatChange}` : threatChange.toString();
  const threatChangeColor = threatChange > 0 ? "text-green-500" : threatChange < 0 ? "text-destructive" : "text-muted-foreground";
  
  const currentImageToDisplay = aiMapDetails.data || initialAiMapPlaceholder;
  
  const isDialogDisabled = () => {
    return aiMapDetails.status === 'loading' || aiMapDetails.status === 'error' || !currentImageToDisplay.src.startsWith('data:image');
  };


  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeThreatsCount}</div>
            <p className={`text-xs ${threatChangeColor}`}>
              {threatChangeText} from last hour
            </p>
            <div className="mt-4 h-[120px]">
              <ActiveThreatsChart currentThreats={activeThreatsCount} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Vulnerabilities</CardTitle>
            <ShieldAlertIcon className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{criticalVulnerabilityCount} Critical</div>
            <p className="text-xs text-muted-foreground">
              {vulnerabilities.length} total identified
            </p>
             <ul className="mt-4 space-y-1 text-sm max-h-[120px] overflow-y-auto pr-1">
              {vulnerabilities.length > 0 ? vulnerabilities.map(vul => (
                <li key={vul.id} className="flex items-start justify-between group">
                  <span className="truncate pr-2 cursor-default" title={`${vul.description}${vul.note ? ` (${vul.note})` : ''}`}>{vul.id}</span>
                  <span className={getSeverityClass(vul.severity)}>{vul.severity}</span>
                </li>
              )) : <p className="text-xs text-muted-foreground">No new vulnerabilities listed.</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <SecurityScoreDisplay score={securityScore} />
            <p className="text-xs text-muted-foreground text-center">
              Improved by {scoreImprovement}% this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/>Recent Security Events</CardTitle>
            <CardDescription>Overview of the latest security-related activities.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[280px] overflow-y-auto pr-1">
            <ul className="space-y-3">
              {recentEvents.length > 0 ? recentEvents.map(event => (
                <li key={event.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.source}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap pl-2">{event.formattedTimestamp}</span>
                </li>
              )) : <p className="text-sm text-muted-foreground">No recent events to display.</p>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5"/>Compliance Status</CardTitle>
            <CardDescription>Adherence to key security standards.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <ComplianceStatusChart />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> AI-Generated Global Threat Map</CardTitle>
          <CardDescription>
            This section attempts to display a dynamically AI-generated Global Threat Map. Click the image to enlarge if successfully generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative group">
            <Dialog>
              <DialogTrigger asChild disabled={isDialogDisabled()}>
                <div
                  className="aspect-video w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  role="button"
                  aria-label="View larger AI-generated threat map"
                  tabIndex={isDialogDisabled() ? -1 : 0}
                >
                  {currentImageToDisplay && currentImageToDisplay.src && (
                     <Image
                        key={currentImageToDisplay.src} 
                        src={currentImageToDisplay.src}
                        alt={currentImageToDisplay.alt}
                        fill
                        priority={aiMapDetails.status === 'success'}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="rounded-md object-cover"
                        data-ai-hint={currentImageToDisplay['data-ai-hint']}
                        onError={(e) => {
                          if (aiMapDetails.status !== 'error') { 
                            setAiMapDetails({ 
                                status: 'error',
                                data: errorAiMapPlaceholder,
                                errorMessage: `Image source failed to load. Displaying placeholder.`
                            });
                          }
                        }}
                      />
                  )}

                  {aiMapDetails.status === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-foreground backdrop-blur-sm rounded-md z-10">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                      <p>Generating AI Threat Map...</p>
                    </div>
                  )}

                  {aiMapDetails.status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/80 text-destructive-foreground backdrop-blur-sm p-4 text-center rounded-md z-10">
                      <ServerCrash className="h-10 w-10 mb-2" />
                      <p className="font-semibold">AI Map Unavailable</p>
                      <p className="text-xs">{aiMapDetails.errorMessage || "The AI-generated map could not be loaded. Displaying placeholder."}</p>
                    </div>
                  )}
                  
                  {aiMapDetails.status === 'success' && !isDialogDisabled() && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">View Larger</span>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-5xl w-[90vw] h-[85vh] p-4 flex flex-col">
                <DialogHeader className="pb-2 pt-0 px-0">
                  <DialogTitle>
                    {(currentImageToDisplay?.alt || "Image") + " - Enlarged View"}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 relative">
                  {currentImageToDisplay?.src && (
                      <Image
                        src={currentImageToDisplay.src}
                        alt={(currentImageToDisplay.alt || "Enlarged image") + " - Enlarged View"}
                        fill
                        sizes="(max-width: 1200px) 80vw, 45vw"
                        className="rounded-md object-contain"
                        data-ai-hint={currentImageToDisplay['data-ai-hint']}
                      />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {aiMapDetails.status === 'error' && (
             <Alert variant="destructive" className="mt-4">
                <ServerCrash className="h-4 w-4" />
                 <AlertTitle>AI Map Generation Issue</AlertTitle>
                <UiAlertDescription>
                  The AI Global Threat Map could not be generated successfully. A placeholder is being shown.
                  {aiMapDetails.errorMessage && ` (Details: ${aiMapDetails.errorMessage})`}
                </UiAlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      {globalThreatInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" />Cybersecurity Insights</CardTitle>
            <CardDescription>Important considerations and facts about the current threat landscape.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {globalThreatInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <p>{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
