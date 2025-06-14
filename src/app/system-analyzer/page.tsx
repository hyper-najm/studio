
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { analyzeSystemConfiguration } from '@/lib/actions';
import type { AnalyzeSystemConfigurationInput, AnalyzeSystemConfigurationOutput } from '@/ai/flows/analyze-system-configuration';
import { Loader2, ServerCog, AlertTriangle, ShieldCheck, Info, FileText, Terminal, Mic, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  systemName: z.string().max(100, "System name too long.").optional(),
  systemDescription: z.string().min(20, { message: 'System description must be at least 20 characters long.' }).max(5000, "System description too long."),
  configurationSnippets: z.string().max(10000, "Configuration snippets too long.").optional(),
  logExcerpts: z.string().max(10000, "Log excerpts too long.").optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function SystemAnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSystemConfigurationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemName: '',
      systemDescription: '',
      configurationSnippets: '',
      logExcerpts: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setErrorState(null);
    setAnalysisResult(null);
    form.clearErrors();

    try {
      const result = await analyzeSystemConfiguration(data);
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Analysis Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSeverityBadgeVariant = (severity: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high":
        return "destructive";
      case "medium":
        return "default"; 
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  const getPriorityBadgeVariant = (priority: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
     switch (priority?.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ServerCog />AI-Powered System & Data Analyzer</CardTitle>
          <CardDescription>
            Provide details about your system, including its purpose, configuration snippets, and relevant log excerpts. Our AI will analyze this information to identify potential vulnerabilities, misconfigurations, and offer educational insights and actionable recommendations.
            <br/>
            <strong className="text-primary mt-2 block">Note: Direct system connection and full log file uploads are under development. Please use textual descriptions for now.</strong>
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="systemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="systemName-input">System Name (Optional)</FormLabel>
                    <FormControl>
                      <Input id="systemName-input" placeholder="e.g., WebServer-Prod, CustomerDB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="systemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="systemDescription-input">System Description</FormLabel>
                     <div className="relative">
                        <FormControl>
                          <Textarea
                            id="systemDescription-input"
                            placeholder="Describe the system's purpose, OS, key software, network role, and any other relevant details."
                            className="min-h-[100px] resize-y pr-10"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toast({ title: "Voice Input", description: "Voice input for System Description coming soon!" })}
                          aria-label="Use voice input for system description"
                          className="absolute right-1 top-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="configurationSnippets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="configurationSnippets-input">Configuration Snippets (Optional)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          id="configurationSnippets-input"
                          placeholder="Paste relevant parts of configuration files (e.g., firewall rules, web server config, sshd_config)."
                          className="min-h-[150px] resize-y font-mono text-sm pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toast({ title: "Voice Input", description: "Voice input for Configuration Snippets coming soon!" })}
                        aria-label="Use voice input for configuration snippets"
                        className="absolute right-1 top-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logExcerpts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="logExcerpts-input">Log Excerpts (Optional)</FormLabel>
                     <div className="relative">
                        <FormControl>
                          <Textarea
                            id="logExcerpts-input"
                            placeholder="Paste snippets of logs that seem suspicious or indicative of issues (e.g., error messages, unusual access patterns)."
                            className="min-h-[150px] resize-y font-mono text-sm pr-10"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toast({ title: "Voice Input", description: "Voice input for Log Excerpts coming soon!" })}
                          aria-label="Use voice input for log excerpts"
                          className="absolute right-1 top-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing System Data...
                  </>
                ) : (
                  'Analyze System Configuration'
                )}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Feature Coming Soon", description: "Direct system connection for automated analysis is under development."})} disabled>
                  <Network className="mr-2 h-4 w-4" /> Connect Live System (Soon)
                </Button>
                 <Button variant="outline" size="sm" onClick={() => toast({ title: "Feature Coming Soon", description: "Full log file upload and parsing is under development."})} disabled>
                  <FileText className="mr-2 h-4 w-4" /> Upload Full Logs (Soon)
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {errorState && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{errorState}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck />System Analysis Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Overall Assessment:</h3>
              <Alert variant="default" className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertTitle>Summary</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">{analysisResult.overallAssessment}</AlertDescription>
              </Alert>
            </div>

            {analysisResult.identifiedVulnerabilities && analysisResult.identifiedVulnerabilities.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Identified Vulnerabilities / Anomalies:</h3>
                <Accordion type="single" collapsible className="w-full">
                  {analysisResult.identifiedVulnerabilities.map((item, index) => (
                    <AccordionItem value={`vuln-${index}`} key={`vuln-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-left flex-1">{item.vulnerability}</span>
                          <Badge variant={getSeverityBadgeVariant(item.severity)} className="ml-2">{item.severity}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 bg-muted/20 p-4 rounded-md">
                        {item.context && (
                           <p className="text-sm"><strong className="font-medium">Context:</strong> <code className="text-xs bg-muted p-1 rounded">{item.context}</code></p>
                        )}
                         <p className="text-sm whitespace-pre-wrap">{item.vulnerability}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
             {analysisResult.identifiedVulnerabilities && analysisResult.identifiedVulnerabilities.length === 0 && (
                 <p className="text-sm text-muted-foreground p-3 rounded-md border bg-muted/30">No specific vulnerabilities or major anomalies identified based on the provided information.</p>
            )}


            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Recommendations:</h3>
                 <Accordion type="single" collapsible className="w-full">
                  {analysisResult.recommendations.map((item, index) => (
                    <AccordionItem value={`rec-${index}`} key={`rec-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                         <div className="flex items-center justify-between w-full">
                           <span className="text-left flex-1">{item.action}</span>
                           <Badge variant={getPriorityBadgeVariant(item.priority)} className="ml-2">{item.priority}</Badge>
                         </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 bg-muted/20 p-4 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{item.action}</p>
                        {item.justification && (
                           <p className="text-xs text-muted-foreground"><strong className="font-medium">Justification:</strong> {item.justification}</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {analysisResult.educationalInsights && analysisResult.educationalInsights.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Educational Insights:</h3>
                <div className="space-y-2">
                  {analysisResult.educationalInsights.map((insight, index) => (
                    <Alert variant="default" key={`insight-${index}`} className="border-primary bg-primary/5">
                      <Terminal className="h-4 w-4 text-primary" />
                      <AlertDescription className="whitespace-pre-wrap text-sm">{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    