
'use client';

import { useState, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { summarizeCybersecurityReport } from '@/lib/actions';
import type { SummarizeCybersecurityReportOutput, SummarizeCybersecurityReportInput } from '@/ai/flows/summarize-cybersecurity-report';
import { Loader2, ScrollText, AlertTriangle, Info, ListChecks, BarChart3, ShieldCheck, Mic, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['text/plain', 'text/markdown'];

const formSchema = z.object({
  reportText: z.string().max(50000, { message: 'Pasted report content is too long (max 50000 characters).' }).optional(),
  reportFile: z.custom<File | undefined>((val) => typeof window === 'undefined' || val === undefined || val instanceof File, {
    message: "Invalid file.",
  })
  .refine(file => file ? file.size <= MAX_FILE_SIZE_BYTES : true, `File size should be less than ${MAX_FILE_SIZE_MB}MB.`)
  .refine(file => file ? ACCEPTED_FILE_TYPES.includes(file.type) : true, "Unsupported file type. Please upload a .txt or .md file.")
  .optional(),
}).refine(data => (data.reportText && data.reportText.length >= 100) || data.reportFile, {
  message: 'Either paste report content (min 100 characters) or upload a report file.',
  path: ["reportText"], // Show error under the textarea if neither is sufficient
});

type FormData = z.infer<typeof formSchema>;

export default function ReportSummarizerPage() {
  const [summaryResult, setSummaryResult] = useState<SummarizeCybersecurityReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportText: '',
      reportFile: undefined,
    },
  });
  const { setValue, watch, clearErrors: clearFormErrors, setError: setFormError } = form;
  const selectedFile = watch('reportFile');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
       if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setFormError("reportFile", { type: "type", message: "Unsupported file type. Please upload a .txt or .md file." });
        setValue('reportFile', undefined);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError("reportFile", { type: "size", message: `File size should be less than ${MAX_FILE_SIZE_MB}MB.` });
        setValue('reportFile', undefined);
        return;
      }
      setValue('reportFile', file, { shouldValidate: true });
      clearFormErrors("reportFile");
      // If a file is selected, we might want to clear the textarea or indicate that the file takes precedence.
      // For now, we'll allow both, and onSubmit will decide how to combine them.
      toast({ title: "File Selected", description: `${file.name} has been selected.` });
    } else {
      setValue('reportFile', undefined, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setErrorState(null);
    setSummaryResult(null);
    clearFormErrors();

    let reportContentForAI = '';
    let fileNameForAI: string | undefined = undefined;

    if (data.reportFile) {
      try {
        reportContentForAI = await data.reportFile.text();
        fileNameForAI = data.reportFile.name;
        if (data.reportText && data.reportText.trim().length > 0) {
          // Append textarea content if it exists, clearly marking it.
          reportContentForAI += `\n\n--- Additional Notes From Textarea ---\n${data.reportText}`;
        }
      } catch (fileReadError) {
        console.error("Error reading file:", fileReadError);
        setErrorState("Failed to read the uploaded file. Please ensure it's a valid text file.");
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the uploaded file." });
        setIsLoading(false);
        return;
      }
    } else if (data.reportText) {
      reportContentForAI = data.reportText;
    }

    if (reportContentForAI.length < 100) {
      // This check should ideally be fully covered by Zod, but as a safeguard:
      setFormError("reportText", {type: "manual", message: "Report content (from file or text area) must be at least 100 characters."})
      toast({ variant: "destructive", title: "Input Too Short", description: "Report content must be at least 100 characters." });
      setIsLoading(false);
      return;
    }
    
    const aiInput: SummarizeCybersecurityReportInput = {
      report: reportContentForAI,
      reportFileName: fileNameForAI,
    };

    try {
      const result = await summarizeCybersecurityReport(aiInput);
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
            Paste the content of a lengthy cybersecurity report, or upload a text-based report file (.txt, .md). The AI will provide a concise summary, key findings, risk assessment, and recommended actions.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="reportFile"
                render={() => ( 
                  <FormItem>
                    <FormLabel htmlFor="reportFile-input">Upload Report File (.txt, .md)</FormLabel>
                     <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          id="reportFile-input"
                          type="file"
                          accept={ACCEPTED_FILE_TYPES.join(',')}
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 flex-grow"
                        />
                      </FormControl>
                    </div>
                    {selectedFile && (
                      <div className="mt-2 p-2 border rounded-md bg-muted/50 text-sm flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" /> 
                        <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reportText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="report-content">Or Paste Report Content / Add Notes</FormLabel>
                    <div className="relative">
                    <FormControl>
                      <Textarea
                        id="report-content"
                        placeholder="Paste report text here, or add notes if uploading a file..."
                        className="min-h-[200px] resize-y pr-10"
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
            {summaryResult.riskScore && <CardDescription>For file: {form.getValues('reportFile')?.name || 'Pasted Content'}</CardDescription>}
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
