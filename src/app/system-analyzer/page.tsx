
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerCog, ShieldCheck, UploadCloud, Link2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SystemAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnectSystem = () => {
    setIsLoading(true);
    toast({
      title: "Feature Not Implemented",
      description: "Connecting to live systems for analysis is under development.",
    });
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleUploadLogs = () => {
     setIsLoading(true);
    toast({
      title: "Feature Not Implemented",
      description: "Log file uploading and analysis is under development.",
    });
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ServerCog />AI-Powered System & Data Analyzer</CardTitle>
          <CardDescription>
            CyberGuardian Pro's advanced AI engine is designed to autonomously analyze your systems, configurations, data streams, and logs. It proactively identifies vulnerabilities, anomalies, misconfigurations, and potential threats, providing comprehensive educational feedback, actionable solutions, and insights to bolster your security posture.
            <br />
            <strong className="text-primary mt-2 block">This core AI analysis feature is currently under active development and will be available soon.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          <ShieldCheck className="h-24 w-24 text-primary mb-6" />
          <p className="text-lg text-muted-foreground max-w-lg mb-8">
            Our engineers are building a powerful, autonomous AI that will act as your dedicated cybersecurity analyst. It will learn, adapt, and provide continuous insights to protect your digital assets and educate your team.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-8">
            <Button variant="outline" size="lg" onClick={handleConnectSystem} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Link2 className="mr-2 h-5 w-5" />}
              Connect System (Soon)
            </Button>
            <Button variant="outline" size="lg" onClick={handleUploadLogs} disabled={isLoading}>
             {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
              Upload Logs (Soon)
            </Button>
          </div>

          <div className="mt-8 w-full max-w-2xl aspect-video bg-muted rounded-lg shadow-md" data-ai-hint="data analysis dashboard">
            <Image src="https://picsum.photos/700/394" alt="System Analysis Dashboard Mockup" width={700} height={394} className="rounded-lg object-cover" />
          </div>
           <p className="text-sm text-muted-foreground mt-4">
            Imagine an AI that not only detects issues but explains them clearly, suggests remediations, and helps you understand complex cybersecurity concepts. That's the future we're building.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
