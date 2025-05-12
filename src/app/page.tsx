'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, History, ListChecks, ShieldAlertIcon, TrendingUp, Loader2, Globe } from "lucide-react";
import Image from "next/image";
import { ActiveThreatsChart } from "@/components/dashboard/active-threats-chart";
import { SecurityScoreDisplay } from "@/components/dashboard/security-score-display";
import { ComplianceStatusChart } from "@/components/dashboard/compliance-status-chart";
import { generateGlobalThreatMapImage } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const sampleEventTemplates = [
  { title: (target?: string) => `Phishing attempt blocked: ${target || 'user@example.com'}`, source: (ip?: string) => `Source IP: ${ip || '198.51.100.12'}` },
  { title: (user?: string) => `Unusual login activity: ${user || 'admin_user'}`, source: (location?: string) => `Location: ${location || 'Unknown Source'}` },
  { title: (file?: string) => `Malware detected: ${file || 'suspicious_payload.exe'}`, source: (system?: string) => `System: ${system || 'Workstation-05'}` },
  { title: (rule?: string) => `Firewall rule updated: ${rule || '#FW-087'}`, source: (action?: string) => `Action: ${action || 'Blocked port 8080'}` },
  { title: (policy?: string) => `Security policy '${policy || 'MFA Enforcement'}' updated`, source: () => `Status: Applied company-wide` },
  { title: () => `System scan completed on Server-01`, source: () => `Result: No new threats found` },
  { title: (domain?: string) => `Suspicious domain access: ${domain || 'malicious-site.io'}`, source: (user?: string) => `User: ${user || 'guest_user'}` }
];

const getRandomIp = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
const getRandomPastDate = (maxHoursAgo: number = 72) => {
  const hoursAgo = Math.random() * maxHoursAgo;
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
};

const sampleVulnerabilitiesList = [
  { id: 'CVE-2024-0001', severity: 'Critical', description: 'Remote Code Execution in WebCore.js' },
  { id: 'CVE-2024-0002', severity: 'High', description: 'SQL Injection in AuthModule API' },
  { id: 'CVE-2024-0003', severity: 'Medium', description: 'XSS in User Profile Page' },
  { id: 'CVE-2023-9999', severity: 'High', description: 'Outdated Apache Struts version' },
  { id: 'CVE-2023-8888', severity: 'Critical', description: 'Log4Shell variant in reporting service' },
  { id: 'CVE-2024-0004', severity: 'Low', description: 'Information Disclosure in API docs' },
  { id: 'CVE-2024-0005', severity: 'Medium', description: 'Weak password policy on legacy system' },
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
}

export default function DashboardPage() {
  const [activeThreatsCount, setActiveThreatsCount] = useState(0);
  const [threatChange, setThreatChange] = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState<DashboardVulnerability[]>([]);
  const [criticalVulnerabilityCount, setCriticalVulnerabilityCount] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  const [scoreImprovement, setScoreImprovement] = useState(0);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [threatMapImageUrl, setThreatMapImageUrl] = useState<string | null>(null);
  const [isThreatMapLoading, setIsThreatMapLoading] = useState(true);
  const [threatMapError, setThreatMapError] = useState<string | null>(null);

  useEffect(() => {
    setActiveThreatsCount(Math.floor(Math.random() * 20) + 5); // 5-24
    setThreatChange(Math.floor(Math.random() * 7) - 3); // -3 to +3

    const numVulsToShow = Math.floor(Math.random() * 3) + 3; // 3-5
    const shuffledVuls = [...sampleVulnerabilitiesList].sort(() => 0.5 - Math.random());
    const selectedVuls = shuffledVuls.slice(0, numVulsToShow).map(v => ({
        ...v,
        severity: v.severity as DashboardVulnerability['severity']
    }));
    setVulnerabilities(selectedVuls);
    setCriticalVulnerabilityCount(selectedVuls.filter(v => v.severity === 'Critical').length);

    setSecurityScore(Math.floor(Math.random() * 30) + 60); // 60-89
    setScoreImprovement(Math.floor(Math.random() * 8) + 1); // 1-8%

    const generatedEvents: DashboardEvent[] = sampleEventTemplates
      .sort(() => 0.5 - Math.random()) // Shuffle templates for variety
      .slice(0, 4) // Take 4 random templates
      .map((template, i) => {
        const randomArg = [getRandomIp(), `user${Math.floor(Math.random()*100)}`, `file_${Math.random().toString(36).substring(7)}.sh`, `policy${i+1}`][Math.floor(Math.random()*4)];
        const title = typeof template.title === 'function' ? template.title(randomArg) : 'Generic Event Title';
        const source = typeof template.source === 'function' ? template.source(randomArg) : 'Generic Source';
        const timestamp = getRandomPastDate(24 * (i + 1)); // Ensure varying times
        return {
          id: `event-${i}-${Date.now()}`,
          title,
          source,
          timestamp,
          formattedTimestamp: formatDistanceToNow(timestamp, { addSuffix: true }),
        };
      });
    setRecentEvents(generatedEvents.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())); // Sort by most recent

    const fetchThreatMap = async () => {
      setIsThreatMapLoading(true);
      setThreatMapError(null);
      try {
        const result = await generateGlobalThreatMapImage();
        setThreatMapImageUrl(result.imageDataUri);
      } catch (error) {
        console.error("Failed to generate threat map:", error);
        setThreatMapError(error instanceof Error ? error.message : "Could not load threat map.");
      } finally {
        setIsThreatMapLoading(false);
      }
    };
    fetchThreatMap();
  }, []);

  const getSeverityClass = (severity: DashboardVulnerability['severity']) => {
    switch (severity) {
      case 'Critical': return 'text-destructive font-semibold';
      case 'High': return 'text-destructive';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const threatChangeText = threatChange >= 0 ? `+${threatChange}` : threatChange.toString();
  const threatChangeColor = threatChange >=0 ? "text-green-500" : "text-destructive";


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
              <ActiveThreatsChart />
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
             <ul className="mt-4 space-y-1 text-sm max-h-[120px] overflow-y-auto">
              {vulnerabilities.length > 0 ? vulnerabilities.map(vul => (
                <li key={vul.id} className="flex items-center justify-between">
                  <span className="truncate pr-2" title={vul.description}>{vul.id}</span> 
                  <span className={getSeverityClass(vul.severity)}>{vul.severity}</span>
                </li>
              )) : <p className="text-xs text-muted-foreground">No vulnerabilities listed.</p>}
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
          <CardContent className="max-h-[240px] overflow-y-auto">
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
          <CardContent className="h-[240px] flex items-center justify-center">
            <ComplianceStatusChart />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Global Threat Landscape</CardTitle>
          <CardDescription>Visualizing threat origins and targets worldwide.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground relative overflow-hidden" data-ai-hint="cybersecurity global map">
            {isThreatMapLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 z-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-semibold">Generating Threat Map...</p>
                <p className="text-sm text-muted-foreground">This may take a few moments.</p>
              </div>
            )}
            {threatMapError && !isThreatMapLoading && (
               <Alert variant="destructive" className="w-full max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Threat Map</AlertTitle>
                <AlertDescription>{threatMapError}</AlertDescription>
              </Alert>
            )}
            {threatMapImageUrl && !isThreatMapLoading && !threatMapError && (
              <Image 
                src={threatMapImageUrl} 
                alt="Global Threat Map" 
                layout="fill" 
                objectFit="cover" 
                className="rounded-md"
              />
            )}
             {!threatMapImageUrl && !isThreatMapLoading && !threatMapError && (
                <p className="text-center">Threat map could not be displayed. Default visualization.</p>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
