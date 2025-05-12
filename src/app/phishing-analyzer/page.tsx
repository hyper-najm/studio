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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzePhishingAttempt } from '@/lib/actions';
import type { AnalyzePhishingAttemptOutput } from '@/ai/flows/analyze-phishing-attempt';
import { Loader2, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  content: z.string().min(10, { message: 'Content must be at least 10 characters long.' }),
});

type FormData = z.infer<typeof formSchema>;

export default function PhishingAnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzePhishingAttemptOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzePhishingAttempt({ content: data.content });
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Input Analyzer</CardTitle>
          <CardDescription>
            Submit URLs, text snippets, or email content for in-depth phishing analysis and threat assessment.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="content-input">Content to Analyze</FormLabel>
                    <FormControl>
                      <Textarea
                        id="content-input"
                        placeholder="Paste URL, email body, or text snippet here..."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
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
                    Analyzing...
                  </>
                ) : (
                  'Analyze Content'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {analysisResult.riskScore > 70 ? <ShieldAlert className="text-destructive" /> : analysisResult.riskScore > 40 ? <ShieldAlert className="text-yellow-500" /> : <ShieldCheck className="text-green-500" />}
              Comprehensive Analysis Report
            </CardTitle>
            <CardDescription>Detailed results of the phishing analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Risk Score: {analysisResult.riskScore}/100</h3>
              <Progress value={analysisResult.riskScore} className={
                analysisResult.riskScore > 70 ? "h-3 [&>div]:bg-destructive" :
                analysisResult.riskScore > 40 ? "h-3 [&>div]:bg-yellow-500" :
                "h-3 [&>div]:bg-green-500"
              } />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Threats Identified:</h3>
              {analysisResult.threatsIdentified.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 rounded-md border p-3 bg-muted/30">
                  {analysisResult.threatsIdentified.map((threat, index) => (
                    <li key={index} className="text-sm">{threat}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific threats identified.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Explanation & Recommendations:</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm">
                <p className="whitespace-pre-wrap">{analysisResult.explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
