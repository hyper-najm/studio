
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Zap, Bot, Info } from "lucide-react"; // Added Info
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components

export default function AutonomousResponderPage() {
  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-primary bg-primary/5">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Advanced Feature Under Development</AlertTitle>
        <AlertDescription>
          The core Autonomous AI Responder & Guardian system, capable of independent incident management and adaptive response workflows, is currently under intensive development. 
          The information below outlines our vision for this feature. We appreciate your patience!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot />Autonomous AI Responder & Guardian</CardTitle>
          <CardDescription>
            CyberGuardian Pro's Autonomous Responder is an AI-driven system designed to operate independently to manage and neutralize security incidents. It intelligently analyzes threats, executes pre-defined and adaptive response workflows (like isolating systems or blocking malicious IPs), alerts personnel with detailed educational reports, and learns from each event to improve future responses. This system aims to "do all the work" in routine incident handling, allowing your team to focus on strategic security.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          <Zap className="h-24 w-24 text-primary mb-6" />
          <p className="text-lg text-muted-foreground max-w-md">
            We are developing an AI that not only responds to threats but also anticipates them, providing a truly proactive defense layer that educates as it protects. Stay tuned for a smarter, autonomous security future!
          </p>
          <div className="mt-8 w-full max-w-lg aspect-video bg-muted rounded-lg shadow-md" data-ai-hint="futuristic security operations center">
            <Image src="https://placehold.co/600x338.png" alt="Autonomous Response System Concept Art" width={600} height={338} className="rounded-lg object-cover" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    