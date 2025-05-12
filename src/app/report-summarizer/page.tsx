
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { summarizeCybersecurityReport } from '@/lib/actions';
import type { SummarizeCybersecurityReportOutput } from '@/ai/flows/summarize-cybersecurity-report';
import { Loader2, ScrollText, AlertTriangle, Info, ListChecks, BarChart3, ShieldCheck, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  report: z.string().min(100, { message: 'Report content must be at least 100 characters long.' }).max(50000, { message: 'Report content is too long (max 50000 characters).' }),
});

type FormData = z.infer<typeof formSchema>;

export default function ReportSummarizerPage() {
  const [summaryResult, setSummaryResult] = useState<SummarizeCybersecurityReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      report: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setErrorState(null);
    setSummaryResult(null);
    try {
      const result = await summarizeCybersecurityReport({ report: data.report });
      setSummaryResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Summarization Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScrollText />Cybersecurity Report Summarizer</CardTitle>
          <CardDescription>
            Paste the content of a lengthy cybersecurity report below. The AI will provide a concise summary, key findings, risk assessment, and recommended actions.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="report"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="report-content">Report Content</FormLabel>
                    <div className="relative">
                    <FormControl>
                      <Textarea
                        id="report-content"
                        placeholder="Paste the full text of the cybersecurity report here..."
                        className="min-h-[250px] resize-y pr-10"
                        {...field}
                      />
                    </FormControl>
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toast({ title: "Voice Input", description: "Voice input for report content coming soon!" })}
                        aria-label="Use voice input for report content"
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
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing Report...
                  </>
                ) : (
                  'Generate Summary'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {errorState && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorState}</AlertDescription>
        </Alert>
      )}

      {summaryResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info />Report Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary"/>Concise Summary</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm">
                <p className="whitespace-pre-wrap">{summaryResult.summary}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/>Key Findings & Impact</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-60 overflow-y-auto">
                <p className="whitespace-pre-wrap">{summaryResult.keyFindings}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/>Risk Score & Significance</h3>
               <div className="p-3 rounded-md border bg-muted/30 text-sm">
                <p className="whitespace-pre-wrap">{summaryResult.riskScore}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Recommended Actions</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-60 overflow-y-auto">
                 <p className="whitespace-pre-wrap">{summaryResult.recommendedActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
