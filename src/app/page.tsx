
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, History, ListChecks, ShieldAlertIcon, TrendingUp } from "lucide-react";
import Image from "next/image";
import { ActiveThreatsChart } from "@/components/dashboard/active-threats-chart";
import { SecurityScoreDisplay } from "@/components/dashboard/security-score-display";
import { ComplianceStatusChart } from "@/components/dashboard/compliance-status-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last hour
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
            <div className="text-2xl font-bold text-primary">5 Critical</div>
            <p className="text-xs text-muted-foreground">
              Awaiting patches
            </p>
             <ul className="mt-4 space-y-1 text-sm">
              <li className="flex items-center justify-between"><span>CVE-2023-12345</span> <span className="text-destructive font-medium">High</span></li>
              <li className="flex items-center justify-between"><span>CVE-2023-67890</span> <span className="text-destructive font-medium">High</span></li>
              <li className="flex items-center justify-between"><span>CVE-2023-24680</span> <span className="text-yellow-500 font-medium">Medium</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <SecurityScoreDisplay score={85} />
            <p className="text-xs text-muted-foreground text-center">
              Improved by 5% this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2"> {/* Changed to lg:grid-cols-2 for better layout with charts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/>Recent Security Events</CardTitle>
            <CardDescription>Overview of the latest security-related activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Phishing attempt blocked</p>
                  <p className="text-xs text-muted-foreground">Source: email@example.com</p>
                </div>
                <span className="text-xs text-muted-foreground">2 min ago</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Unusual login activity</p>
                  <p className="text-xs text-muted-foreground">User: admin_user, IP: 192.168.1.100</p>
                </div>
                <span className="text-xs text-muted-foreground">15 min ago</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Malware detected</p>
                  <p className="text-xs text-muted-foreground">File: malicious_payload.exe</p>
                </div>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </li>
               <li className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Firewall rule updated</p>
                  <p className="text-xs text-muted-foreground">Rule ID: #FW-087 blocking port 8080</p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5"/>Compliance Status</CardTitle>
            <CardDescription>Adherence to key security standards.</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] flex items-center justify-center"> {/* Adjusted height for chart */}
            <ComplianceStatusChart />
          </CardContent>
        </Card>
      </div>
      <Card data-ai-hint="security world map">
        <CardHeader>
          <CardTitle>Global Threat Landscape</CardTitle>
          <CardDescription>Visualizing threat origins and targets worldwide.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground">
            {/* [Interactive Map Placeholder - Showing global threats] */}
            <Image src="https://picsum.photos/800/450" alt="Placeholder map of global threats" width={800} height={450} className="opacity-30 rounded-md object-cover" />
             <span className="absolute text-center font-semibold">Interactive Global Threat Map (Coming Soon)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
