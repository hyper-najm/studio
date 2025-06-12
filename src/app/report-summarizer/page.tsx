
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { summarizeCybersecurityReport } from '@/lib/actions';
import type { SummarizeCybersecurityReportOutput, SummarizeCybersecurityReportInput } from '@/ai/flows/summarize-cybersecurity-report';
import { 
    Loader2, ScrollText, AlertTriangle, Info, ListChecks, BarChart3, ShieldCheck, Mic, Upload, FileText,
    ClipboardCheck, SearchCheck, Activity, Percent, FileQuestion, Bot, UserCheck, BrainCircuit
} from 'lucide-react';
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
  path: ["reportText"],
});

type FormData = z.infer<typeof formSchema>;

export default function ReportSummarizerPage() {
  const [analysisResult, setAnalysisResult] = useState<SummarizeCybersecurityReportOutput | null>(null);
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
      toast({ title: "File Selected", description: `${file.name} has been selected.` });
    } else {
      setValue('reportFile', undefined, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setErrorState(null);
    setAnalysisResult(null);
    clearFormErrors();

    let reportContentForAI = '';
    let fileNameForAI: string | undefined = undefined;

    if (data.reportFile) {
      try {
        reportContentForAI = await data.reportFile.text();
        fileNameForAI = data.reportFile.name;
        if (data.reportText && data.reportText.trim().length > 0) {
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
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Analysis Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getAssessmentBadgeVariant = (assessment: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (assessment?.toLowerCase()) {
      case "very high": return "destructive";
      case "high": return "destructive";
      case "medium": return "default"; 
      default: return "secondary"; 
    }
  };
  
  const getConfidenceBadgeVariant = (confidence: string | undefined): "default" | "secondary" | "outline" => {
    switch (confidence?.toLowerCase()) {
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline"; 
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BrainCircuit />Comprehensive Report Analyzer</CardTitle>
          <CardDescription>
            Paste report content or upload a text file (.txt, .md). Get a summary, key findings, risk assessment, recommended actions, PLUS an originality check and AI-generated content detection.
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
                    Analyzing Report...
                  </>
                ) : (
                  'Generate Comprehensive Analysis'
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

      {analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info />Comprehensive Analysis Report</CardTitle>
            <CardDescription>For file: {form.getValues('reportFile')?.name || 'Pasted Content'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8"> {/* Increased spacing between sections */}
            {/* Summarization Section */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><ScrollText className="h-6 w-6 text-primary"/>Content Summary & Insights</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Concise Summary:</h3>
                  <div className="p-3 rounded-md border bg-muted/30 text-sm">
                    <p className="whitespace-pre-wrap">{analysisResult.summary}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><BarChart3 className="h-5 w-5"/>Key Findings & Impact:</h3>
                  <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{analysisResult.keyFindings}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ShieldCheck className="h-5 w-5"/>Risk Score & Significance:</h3>
                  <div className="p-3 rounded-md border bg-muted/30 text-sm">
                    <p className="whitespace-pre-wrap">{analysisResult.riskScore}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5"/>Recommended Actions:</h3>
                  <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{analysisResult.recommendedActions}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Separator */}
            <hr className="my-6 border-border" />

            {/* Originality & AI Detection Section */}
            <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><ClipboardCheck className="h-6 w-6 text-primary"/>Originality & AI Detection</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4">
                            <CardTitle className="text-lg mb-2 flex items-center gap-2"><Percent className="h-5 w-5"/>Originality Score</CardTitle>
                            <div className="text-4xl font-bold">{analysisResult.originalityScore}%</div>
                            <Progress value={analysisResult.originalityScore} className="mt-2 h-3" />
                        </Card>
                        <Card className="p-4">
                            <CardTitle className="text-lg mb-2 flex items-center gap-2"><FileQuestion className="h-5 w-5"/>Plagiarism Assessment</CardTitle>
                            <Badge variant={getAssessmentBadgeVariant(analysisResult.plagiarismAssessment)} className="text-xl px-3 py-1">{analysisResult.plagiarismAssessment} Risk</Badge>
                        </Card>
                    </div>
                    
                    <Card className="p-4">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        {analysisResult.aiGenerationAssessment.isLikelyAi ? <Bot className="h-5 w-5 text-destructive" /> : <UserCheck className="h-5 w-5 text-green-500" />}
                        AI-Generated Content Detection
                        </CardTitle>
                        <div className="mb-2">
                        {analysisResult.aiGenerationAssessment.isLikelyAi ? (
                            <p className="text-destructive font-semibold">Likely AI-Generated</p>
                        ) : (
                            <p className="text-green-500 font-semibold">Likely Human-Written</p>
                        )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                            {analysisResult.aiGenerationAssessment.isLikelyAi ? "AI Generation Likelihood:" : "Human Authorship Likelihood:"}
                        </span>
                        <span className="text-lg font-bold">{analysisResult.aiGenerationAssessment.confidenceScore}%</span>
                        </div>
                        <Progress 
                            value={analysisResult.aiGenerationAssessment.confidenceScore} 
                            className={`h-2 ${analysisResult.aiGenerationAssessment.isLikelyAi ? "[&>div]:bg-destructive" : "[&>div]:bg-green-500"}`} 
                        />
                        {analysisResult.aiGenerationAssessment.assessmentExplanation && (
                        <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                            <strong className="font-medium">AI Explanation:</strong> {analysisResult.aiGenerationAssessment.assessmentExplanation}
                        </p>
                        )}
                    </Card>

                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Activity className="h-5 w-5"/>Originality Assessment Summary:</h3>
                        <Alert variant="default" className="bg-muted/30 border-muted-foreground/20">
                            <AlertDescription className="whitespace-pre-wrap">{analysisResult.originalityAssessmentSummary}</AlertDescription>
                        </Alert>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><SearchCheck className="h-5 w-5"/>Potential Similar Segments:</h3>
                        {analysisResult.similarSegments && analysisResult.similarSegments.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {analysisResult.similarSegments.map((item, index) => (
                            <AccordionItem value={`segment-${index}`} key={`segment-${index}`}>
                                <AccordionTrigger className="hover:no-underline text-left">
                                <span className="truncate pr-2 flex-1">{item.segment}</span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-2 bg-muted/20 p-4 rounded-md">
                                <p className="text-sm"><strong className="font-medium">Explanation:</strong> {item.explanation}</p>
                                {item.potentialSourceType && (
                                    <p className="text-xs text-muted-foreground"><strong className="font-medium">Potential Source Type:</strong> {item.potentialSourceType}</p>
                                )}
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                        ) : (
                        <p className="text-sm text-muted-foreground p-3 rounded-md border bg-muted/30">No significant similar segments identified.</p>
                        )}
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Summary of Input Text:</h3>
                        <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-60 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{analysisResult.summarizedInputText}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">Key Themes in Input:</h3>
                        {analysisResult.keyThemesInInput && analysisResult.keyThemesInInput.length > 0 ? (
                        <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-muted/30">
                            {analysisResult.keyThemesInInput.map((theme, index) => (
                            <Badge key={index} variant="secondary">{theme}</Badge>
                            ))}
                        </div>
                        ) : (
                            <p className="text-sm text-muted-foreground p-3 rounded-md border bg-muted/30">No specific key themes identified in the input.</p>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Originality Analysis Confidence:</h3>
                        <Badge variant={getConfidenceBadgeVariant(analysisResult.originalityAnalysisConfidence)} className="text-md px-3 py-1">{analysisResult.originalityAnalysisConfidence}</Badge>
                    </div>
                </div>
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

